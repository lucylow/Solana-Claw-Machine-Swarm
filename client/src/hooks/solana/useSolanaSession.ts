import { useMemo } from "react";
import { formatSessionExpiry } from "@/lib/solana/format";
import { useSolanaWallet } from "./useSolanaWallet";

export function useSolanaSession() {
  const wallet = useSolanaWallet();
  return useMemo(
    () => ({
      sessionProfile: wallet.sessionProfile,
      sessionToken: wallet.sessionToken,
      hasSession: Boolean(wallet.sessionProfile && wallet.sessionToken),
      sessionExpiresLabel: formatSessionExpiry(wallet.sessionProfile?.expiresAt),
      permissions: wallet.sessionProfile?.permissions,
      isVerified:
        wallet.walletState.isSessionVerified ||
        wallet.state === "session_verified" ||
        wallet.state === "ready",
    }),
    [wallet.sessionProfile, wallet.sessionToken, wallet.state, wallet.walletState.isSessionVerified]
  );
}
