import { useMemo } from "react";
import { useSolanaWalletContext } from "@/contexts/SolanaWalletContext";
import { txExplorerUrl } from "@/lib/solana/explorer";
import { formatSessionExpiry } from "@/lib/solana/format";
import type { WalletConnectionStatus } from "@shared/solana/types";
import type {
  DappChainState,
  DappProofStatus,
  TransactionStatus,
} from "./types";

function deriveTxStatus(
  status: WalletConnectionStatus,
  hasSignature: boolean,
  hasError: boolean,
  wrongCluster: boolean
): TransactionStatus {
  if (hasError) return "failed";
  if (wrongCluster) return "degraded";
  switch (status) {
    case "connecting":
      return "preparing";
    case "signing":
      return "signing";
    case "session_verifying":
      return "submitted";
    case "balance_loading":
      return hasSignature ? "confirming" : "preparing";
    case "session_verified":
      return hasSignature ? "confirmed" : "submitted";
    case "ready":
      return hasSignature ? "confirmed" : "idle";
    case "wrong_cluster":
      return "degraded";
    case "error":
      return "failed";
    case "disconnected":
    case "connected":
    default:
      return hasSignature ? "confirmed" : "idle";
  }
}

function deriveProofStatus(args: {
  hasSignature: boolean;
  sessionVerified: boolean;
  busy: boolean;
  hasError: boolean;
  demoMode: boolean;
  rpcReachable: boolean | null;
}): DappProofStatus {
  if (args.hasError) return "degraded";
  if (args.busy) return "pending";
  if (args.rpcReachable === false && args.sessionVerified) return "degraded";
  if (args.hasSignature && args.sessionVerified) return "verified";
  if (args.sessionVerified) return "cached_only";
  if (args.demoMode && !args.sessionVerified) return "demo_only";
  return "unverified";
}

/**
 * Derives a single, explicit dApp state shape from the existing
 * Solana wallet context. Components consume this so transaction,
 * proof, and session lifecycle are visible without ad hoc props.
 */
export function useDappChainState(opts?: { demoMode?: boolean }): DappChainState {
  const ctx = useSolanaWalletContext();
  const snap = ctx.walletState;
  const demoMode = Boolean(opts?.demoMode || snap.diagnostics?.demoMode);

  return useMemo<DappChainState>(() => {
    const hasSignature = Boolean(snap.lastTxSignature || ctx.latestSignature);
    const sessionVerified = snap.isSessionVerified;
    const wrongCluster = Boolean(snap.diagnostics?.wrongCluster);
    const busy =
      snap.isSessionLoading ||
      snap.isBalanceLoading ||
      snap.connectionStatus === "signing" ||
      snap.connectionStatus === "connecting";

    const txStatus = deriveTxStatus(
      snap.connectionStatus,
      hasSignature,
      Boolean(ctx.error),
      wrongCluster
    );

    const proofStatus = deriveProofStatus({
      hasSignature,
      sessionVerified,
      busy,
      hasError: Boolean(ctx.error),
      demoMode,
      rpcReachable: snap.rpcReachable,
    });

    const txSignature = snap.lastTxSignature ?? ctx.latestSignature ?? undefined;

    return {
      connected: snap.connected,
      demoMode,
      walletAddress: snap.publicKey ?? undefined,
      walletName: snap.walletName ?? undefined,
      cluster: snap.cluster,
      rpcUrl: snap.rpcUrl,
      explorerBaseUrl: snap.explorerBaseUrl,
      balanceSol: snap.balanceSol ?? undefined,
      balanceLamports: snap.balanceLamports ?? undefined,
      wrongCluster,
      sessionStatus: snap.sessionStatus,
      sessionExpiresLabel: snap.lastSessionAt
        ? formatSessionExpiry(ctx.sessionProfile?.expiresAt ?? null)
        : undefined,
      txStatus,
      txSignature,
      accountAddress: snap.txHistory?.[0]?.account ?? undefined,
      pda: snap.txHistory?.[0]?.account ?? undefined,
      explorerUrl: txSignature ? txExplorerUrl(txSignature, snap.cluster) : undefined,
      proofStatus,
      busy,
      error: ctx.error ?? undefined,
      rpcReachable: snap.rpcReachable,
      rpcSlot: snap.rpcSlot ?? undefined,
      rpcLatencyMs: snap.rpcLatencyMs ?? undefined,
      rpcError: snap.rpcError ?? undefined,
    };
  }, [
    ctx.error,
    ctx.latestSignature,
    ctx.sessionProfile?.expiresAt,
    demoMode,
    snap.balanceLamports,
    snap.balanceSol,
    snap.cluster,
    snap.connected,
    snap.connectionStatus,
    snap.diagnostics?.wrongCluster,
    snap.explorerBaseUrl,
    snap.isBalanceLoading,
    snap.isSessionLoading,
    snap.isSessionVerified,
    snap.lastSessionAt,
    snap.lastTxSignature,
    snap.publicKey,
    snap.rpcUrl,
    snap.sessionStatus,
    snap.rpcCheckedAt,
    snap.rpcError,
    snap.rpcLatencyMs,
    snap.rpcReachable,
    snap.rpcSlot,
    snap.txHistory,
    snap.walletName,
  ]);
}
