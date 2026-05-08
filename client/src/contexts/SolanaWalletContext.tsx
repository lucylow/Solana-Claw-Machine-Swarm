import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import bs58 from "bs58";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type {
  SolanaTxRecord,
  SolanaWalletState,
  WalletConnectionStatus,
} from "@shared/solana/types";
import { fetchSolanaBackendStatus } from "@/lib/solana/chainStatus";
import {
  DEMO_MODE,
  SOLANA_CLUSTER,
  SOLANA_EXPLORER_BASE,
  SOLANA_RPC_URL,
  SOLANA_SESSION_STORAGE_KEY,
} from "@/lib/solana/config";
import type { SolanaCluster, SolanaSessionProfile } from "@/lib/solana/types";
import {
  fetchSolanaSession,
  loadStoredSessionToken,
  logoutSolanaSession,
  refreshSolanaSession,
  requestSolanaSessionNonce,
  storeSessionToken,
  verifySolanaSession,
} from "@/lib/solana/session";
import { loadWalletBalanceLamports, toWalletAddress } from "@/lib/solana/wallet";

type SolanaWalletContextValue = {
  /** Full command-center aggregate */
  walletState: SolanaWalletState;
  /** Adapter lifecycle (legacy / concise) */
  state: WalletConnectionStatus;
  walletAddress: string | null;
  walletName: string | null;
  balanceSol: number | null;
  balanceLamports: string | null;
  sessionToken: string | null;
  sessionProfile: SolanaSessionProfile | null;
  latestSignature: string | null;
  cluster: SolanaCluster;
  rpcUrl: string;
  explorerBaseUrl: string;
  error: string | null;
  txHistory: SolanaTxRecord[];
  connectAndVerify: () => Promise<void>;
  /** Same as connectAndVerify when wallet already connected — signs backend nonce again */
  signSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  /** Clears Bearer session cache + server logout; keeps wallet adapter connected */
  clearSession: () => Promise<void>;
  verifySession: () => Promise<void>;
};

const SolanaWalletContext = createContext<SolanaWalletContextValue | null>(null);

function defaultPermissions(): SolanaWalletState["permissions"] {
  return {
    canPublishSkill: false,
    canExecuteTask: false,
    canAnchorReceipt: false,
    canSignSession: false,
    canViewChainData: false,
  };
}

function connectionStatusFromMachine(
  machine: WalletConnectionStatus,
  opts: { wrongCluster: boolean }
): WalletConnectionStatus {
  if (opts.wrongCluster && machine !== "disconnected" && machine !== "connecting") return "wrong_cluster";
  return machine;
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [machineState, setMachineState] = useState<WalletConnectionStatus>("disconnected");
  const [balanceSol, setBalanceSol] = useState<number | null>(null);
  const [balanceLamports, setBalanceLamports] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionProfile, setSessionProfile] = useState<SolanaSessionProfile | null>(null);
  const [latestSignature, setLatestSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHistory, setTxHistory] = useState<SolanaTxRecord[]>([]);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [rpcReachable, setRpcReachable] = useState<boolean | null>(null);
  const [rpcSlot, setRpcSlot] = useState<string | null>(null);
  const [rpcLatencyMs, setRpcLatencyMs] = useState<number | null>(null);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [rpcCheckedAt, setRpcCheckedAt] = useState<string | null>(null);

  const walletAddress = toWalletAddress(wallet.publicKey);
  const walletName = wallet.wallet?.adapter.name || null;

  const wrongCluster = Boolean(
    sessionProfile?.cluster && sessionProfile.cluster !== (SOLANA_CLUSTER as SolanaCluster)
  );

  const appendTxRecord = useCallback((record: SolanaTxRecord) => {
    setTxHistory(prev => [record, ...prev].slice(0, 40));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet.publicKey || !walletAddress) {
      setBalanceSol(null);
      setBalanceLamports(null);
      return;
    }
    setIsBalanceLoading(true);
    setMachineState((prev: WalletConnectionStatus) =>
      prev === "session_verified" || prev === "ready" ? "balance_loading" : prev
    );
    try {
      const lamports = await loadWalletBalanceLamports(connection, wallet.publicKey);
      setBalanceLamports(lamports.toString());
      setBalanceSol(Number(lamports) / 1e9);
      setMachineState((prev: WalletConnectionStatus) =>
        prev === "balance_loading" ? "ready" : prev === "session_verified" ? "ready" : prev
      );
    } catch {
      setBalanceSol(null);
      setBalanceLamports(null);
      setMachineState((prev: WalletConnectionStatus) => (prev === "balance_loading" ? "session_verified" : prev));
    } finally {
      setIsBalanceLoading(false);
    }
  }, [connection, wallet.publicKey, walletAddress]);

  const refreshSessionInternal = useCallback(
    async (token: string) => {
      const session = await fetchSolanaSession(token);
      if (!session.profile) throw new Error("session_not_found");
      if (walletAddress && session.profile.walletAddress !== walletAddress) {
        throw new Error("session_wallet_mismatch");
      }
      setSessionToken(token);
      setSessionProfile(session.profile);
      setMachineState("session_verified");
      setError(null);
      await refreshBalance();
    },
    [refreshBalance, walletAddress]
  );

  useEffect(() => {
    if (!wallet.connected || !walletAddress) {
      setMachineState("disconnected");
      setSessionProfile(null);
      setSessionToken(null);
      setBalanceSol(null);
      setBalanceLamports(null);
      return;
    }
    setMachineState((prev: WalletConnectionStatus) => (prev === "disconnected" ? "connected" : prev));
  }, [wallet.connected, walletAddress]);

  useEffect(() => {
    const token = loadStoredSessionToken();
    if (!token) return;
    if (!wallet.connected || !walletAddress) return;
    refreshSessionInternal(token).catch(() => {
      setSessionToken(null);
      setSessionProfile(null);
      storeSessionToken(null);
    });
  }, [refreshSessionInternal, wallet.connected, walletAddress]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const status = await fetchSolanaBackendStatus();
      if (cancelled || !status) return;
      setRpcReachable(status.rpc.ok);
      setRpcSlot(status.rpc.slot != null ? String(status.rpc.slot) : null);
      setRpcLatencyMs(status.rpc.latencyMs ?? null);
      setRpcError(status.rpc.ok ? null : status.rpc.error ?? "rpc_unreachable");
      setRpcCheckedAt(new Date().toISOString());
    };
    void poll();
    const id = window.setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const connectAndVerify = useCallback(async () => {
    setError(null);
    if (!wallet.connected) {
      setMachineState("connecting");
      await wallet.connect();
    }
    if (!wallet.publicKey) throw new Error("wallet_not_connected");
    if (!wallet.signMessage) throw new Error("wallet_sign_message_unsupported");

    setMachineState("signing");
    const nonce = await requestSolanaSessionNonce(wallet.publicKey.toBase58(), SOLANA_CLUSTER as SolanaCluster);

    const signatureBytes = await wallet.signMessage(new TextEncoder().encode(nonce.message));
    const signature = bs58.encode(signatureBytes);
    setLatestSignature(signature);

    setMachineState("session_verifying");
    const verified = await verifySolanaSession({
      walletAddress: wallet.publicKey.toBase58(),
      nonceId: nonce.nonceId,
      signature,
      cluster: SOLANA_CLUSTER as SolanaCluster,
      message: nonce.message,
    });
    const token = verified.token;
    if (!token || !verified.profile) throw new Error("session_verify_failed");

    setSessionToken(token);
    setSessionProfile(verified.profile as SolanaSessionProfile);
    storeSessionToken(token);
    setMachineState("session_verified");

    appendTxRecord({
      id: `sess_${Date.now()}`,
      type: "session",
      subjectId: verified.profile.sessionId,
      wallet: wallet.publicKey.toBase58(),
      cluster: SOLANA_CLUSTER as SolanaCluster,
      summaryHash: signature.slice(0, 32),
      status: "verified",
      createdAt: new Date().toISOString(),
      proofRef: signature,
    });

    await refreshBalance();
  }, [appendTxRecord, refreshBalance, wallet]);

  const refreshSession = useCallback(async () => {
    if (!sessionToken) throw new Error("session_token_missing");
    setError(null);
    const refreshed = await refreshSolanaSession(sessionToken);
    if (!refreshed.profile) throw new Error("session_refresh_failed");
    setSessionProfile(refreshed.profile as SolanaSessionProfile);
    setMachineState("session_verified");
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
    setBalanceLamports(null);
    setMachineState("disconnected");
    setTxHistory([]);
    await wallet.disconnect();
  }, [sessionToken, wallet]);

  const clearVerifiedSession = useCallback(async () => {
    setError(null);
    if (sessionToken) {
      await logoutSolanaSession(sessionToken).catch(() => undefined);
    }
    storeSessionToken(null);
    setSessionToken(null);
    setSessionProfile(null);
    setLatestSignature(null);
    setMachineState(wallet.connected && walletAddress ? "connected" : "disconnected");
  }, [sessionToken, wallet.connected, walletAddress]);

  const resolvedStatus = connectionStatusFromMachine(machineState, { wrongCluster });

  const walletState = useMemo<SolanaWalletState>(() => {
    const permissions = sessionProfile?.permissions ?? defaultPermissions();
    const sessionStatus =
      resolvedStatus === "error"
        ? "error"
        : sessionProfile && sessionToken
          ? "verified"
          : wallet.connected
            ? "pending"
            : "none";

    return {
      connected: Boolean(wallet.connected && walletAddress),
      connectionStatus: resolvedStatus,
      publicKey: walletAddress,
      walletName,
      cluster: SOLANA_CLUSTER as SolanaCluster,
      rpcUrl: SOLANA_RPC_URL,
      explorerBaseUrl: SOLANA_EXPLORER_BASE,
      balanceLamports,
      balanceSol: balanceSol != null ? balanceSol.toFixed(9) : null,
      isBalanceLoading,
      isSessionLoading: resolvedStatus === "session_verifying",
      isSessionVerified: Boolean(sessionProfile && sessionToken && sessionStatus === "verified"),
      sessionStatus,
      sessionToken: sessionToken ?? undefined,
      sessionNonce: undefined,
      lastTxSignature: latestSignature ?? undefined,
      lastSignatureAt: latestSignature ? new Date().toISOString() : undefined,
      lastSessionAt:
        sessionProfile?.verifiedAt != null ? new Date(sessionProfile.verifiedAt).toISOString() : undefined,
      rpcReachable,
      rpcSlot,
      rpcLatencyMs,
      rpcError,
      rpcCheckedAt,
      permissions,
      txHistory,
      diagnostics: {
        demoMode: DEMO_MODE,
        wrongCluster,
        walletReady: wallet.connected,
        identityLayer: "solana_wallet_adapter",
        sessionVerification: "backend_bearer",
        adapter: wallet.wallet?.adapter.name,
        sessionStorageKey: SOLANA_SESSION_STORAGE_KEY,
        sessionTokenCacheNote:
          "Bearer token in localStorage is cache only — identity is the connected adapter; verification is the server session.",
        rpcReachable,
        rpcSlot,
        rpcError,
      },
    };
  }, [
    balanceLamports,
    balanceSol,
    isBalanceLoading,
    latestSignature,
    resolvedStatus,
    sessionProfile,
    sessionToken,
    txHistory,
    wallet.connected,
    wallet.wallet?.adapter.name,
    walletAddress,
    walletName,
    wrongCluster,
    rpcReachable,
    rpcSlot,
    rpcLatencyMs,
    rpcError,
    rpcCheckedAt,
  ]);

  const value = useMemo<SolanaWalletContextValue>(
    () => ({
      walletState,
      state: resolvedStatus,
      walletAddress,
      walletName,
      balanceSol,
      balanceLamports,
      sessionToken,
      sessionProfile,
      latestSignature,
      cluster: SOLANA_CLUSTER as SolanaCluster,
      rpcUrl: SOLANA_RPC_URL,
      explorerBaseUrl: SOLANA_EXPLORER_BASE,
      error,
      txHistory,
      refreshBalance,
      signSession: async () => {
        try {
          await connectAndVerify();
        } catch (err: unknown) {
          setMachineState("error");
          setError(err instanceof Error ? err.message : "wallet_connect_failed");
          throw err;
        }
      },
      verifySession: async () => {
        try {
          await connectAndVerify();
        } catch (err: unknown) {
          setMachineState("error");
          setError(err instanceof Error ? err.message : "wallet_connect_failed");
          throw err;
        }
      },
      clearSession: async () => {
        try {
          await clearVerifiedSession();
        } catch (err: unknown) {
          setMachineState("error");
          setError(err instanceof Error ? err.message : "session_clear_failed");
          throw err;
        }
      },
      connectAndVerify: async () => {
        try {
          await connectAndVerify();
        } catch (err: unknown) {
          setMachineState("error");
          setError(err instanceof Error ? err.message : "wallet_connect_failed");
          throw err;
        }
      },
      refreshSession: async () => {
        try {
          await refreshSession();
        } catch (err: unknown) {
          setMachineState("error");
          setError(err instanceof Error ? err.message : "session_refresh_failed");
          throw err;
        }
      },
      disconnectWallet,
    }),
    [
      balanceLamports,
      balanceSol,
      clearVerifiedSession,
      connectAndVerify,
      disconnectWallet,
      error,
      latestSignature,
      refreshBalance,
      refreshSession,
      resolvedStatus,
      sessionProfile,
      sessionToken,
      txHistory,
      walletAddress,
      walletName,
      walletState,
    ]
  );

  return <SolanaWalletContext.Provider value={value}>{children}</SolanaWalletContext.Provider>;
}

export function useSolanaWalletContext() {
  const value = useContext(SolanaWalletContext);
  if (!value) throw new Error("useSolanaWalletContext must be used within SolanaWalletProvider");
  return value;
}
