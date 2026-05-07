import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import bs58 from "bs58";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SOLANA_CLUSTER } from "@/lib/solana/config";
import type { SolanaSessionProfile, SolanaWalletMachineState } from "@/lib/solana/types";
import {
  fetchSolanaSession,
  loadStoredSessionToken,
  logoutSolanaSession,
  refreshSolanaSession,
  requestSolanaSessionNonce,
  storeSessionToken,
  verifySolanaSession,
} from "@/lib/solana/session";
import { loadWalletBalance, toWalletAddress } from "@/lib/solana/wallet";

type SolanaWalletContextValue = {
  state: SolanaWalletMachineState;
  walletAddress: string | null;
  walletName: string | null;
  balanceSol: number | null;
  sessionToken: string | null;
  sessionProfile: SolanaSessionProfile | null;
  latestSignature: string | null;
  cluster: string;
  error: string | null;
  connectAndVerify: () => Promise<void>;
  refreshSession: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
};

const SolanaWalletContext = createContext<SolanaWalletContextValue | null>(null);

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [state, setState] = useState<SolanaWalletMachineState>("disconnected");
  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionProfile, setSessionProfile] = useState<SolanaSessionProfile | null>(null);
  const [latestSignature, setLatestSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = toWalletAddress(wallet.publicKey);
  const walletName = wallet.wallet?.adapter.name || null;

  const refreshBalance = useCallback(async () => {
    if (!wallet.publicKey) {
      setBalanceSol(null);
      return;
    }
    setState(prev => (prev === "session_verified" ? "balance_loading" : prev));
    try {
      const balance = await loadWalletBalance(connection, wallet.publicKey);
      setBalanceSol(balance);
      setState(prev => (prev === "balance_loading" ? "ready" : prev));
    } catch {
      setBalanceSol(null);
      setState(prev => (prev === "balance_loading" ? "session_verified" : prev));
    }
  }, [connection, wallet.publicKey]);

  const refreshSessionInternal = useCallback(
    async (token: string) => {
      const session = await fetchSolanaSession(token);
      if (!session.profile) throw new Error("session_not_found");
      if (walletAddress && session.profile.walletAddress !== walletAddress) {
        throw new Error("session_wallet_mismatch");
      }
      setSessionToken(token);
      setSessionProfile(session.profile);
      setState("session_verified");
      setError(null);
      await refreshBalance();
    },
    [refreshBalance, walletAddress]
  );

  useEffect(() => {
    if (!wallet.connected || !walletAddress) {
      setState("disconnected");
      setSessionProfile(null);
      setSessionToken(null);
      setBalanceSol(null);
      return;
    }
    setState("connected");
  }, [wallet.connected, walletAddress]);

  useEffect(() => {
    const token = loadStoredSessionToken();
    if (!token) return;
    if (!walletAddress) return;
    refreshSessionInternal(token).catch(() => {
      setSessionToken(null);
      setSessionProfile(null);
      storeSessionToken(null);
    });
  }, [refreshSessionInternal, walletAddress]);

  const connectAndVerify = useCallback(async () => {
    setError(null);
    if (!wallet.connected) {
      setState("connecting");
      await wallet.connect();
    }
    if (!wallet.publicKey) throw new Error("wallet_not_connected");
    if (!wallet.signMessage) throw new Error("wallet_sign_message_unsupported");

    setState("signing");
    const nonce = await requestSolanaSessionNonce(wallet.publicKey.toBase58());
    const signatureBytes = await wallet.signMessage(new TextEncoder().encode(nonce.message));
    const signature = bs58.encode(signatureBytes);
    setLatestSignature(signature);

    setState("session_verifying");
    const verified = await verifySolanaSession({
      walletAddress: wallet.publicKey.toBase58(),
      nonceId: nonce.nonceId,
      signature,
    });
    const token = verified.token;
    if (!token || !verified.profile) throw new Error("session_verify_failed");

    setSessionToken(token);
    setSessionProfile(verified.profile as SolanaSessionProfile);
    storeSessionToken(token);
    setState("session_verified");
    await refreshBalance();
  }, [refreshBalance, wallet]);

  const refreshSession = useCallback(async () => {
    if (!sessionToken) throw new Error("session_token_missing");
    setError(null);
    const refreshed = await refreshSolanaSession(sessionToken);
    if (!refreshed.profile) throw new Error("session_refresh_failed");
    setSessionProfile(refreshed.profile as SolanaSessionProfile);
    setState("session_verified");
    await refreshBalance();
  }, [refreshBalance, sessionToken]);

  const disconnectWallet = useCallback(async () => {
    if (sessionToken) {
      await logoutSolanaSession(sessionToken).catch(() => undefined);
    }
    storeSessionToken(null);
    setSessionToken(null);
    setSessionProfile(null);
    setLatestSignature(null);
    setBalanceSol(null);
    setState("disconnected");
    await wallet.disconnect();
  }, [sessionToken, wallet]);

  const value = useMemo<SolanaWalletContextValue>(
    () => ({
      state,
      walletAddress,
      walletName,
      balanceSol,
      sessionToken,
      sessionProfile,
      latestSignature,
      cluster: SOLANA_CLUSTER,
      error,
      connectAndVerify: async () => {
        try {
          await connectAndVerify();
        } catch (err: unknown) {
          setState("error");
          setError(err instanceof Error ? err.message : "wallet_connect_failed");
          throw err;
        }
      },
      refreshSession: async () => {
        try {
          await refreshSession();
        } catch (err: unknown) {
          setState("error");
          setError(err instanceof Error ? err.message : "session_refresh_failed");
          throw err;
        }
      },
      disconnectWallet,
    }),
    [
      balanceSol,
      connectAndVerify,
      disconnectWallet,
      error,
      latestSignature,
      refreshSession,
      sessionProfile,
      sessionToken,
      state,
      walletAddress,
      walletName,
    ]
  );

  return <SolanaWalletContext.Provider value={value}>{children}</SolanaWalletContext.Provider>;
}

export function useSolanaWalletContext() {
  const value = useContext(SolanaWalletContext);
  if (!value) throw new Error("useSolanaWalletContext must be used within SolanaWalletProvider");
  return value;
}
