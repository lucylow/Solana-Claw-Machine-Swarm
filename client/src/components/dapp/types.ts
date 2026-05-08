/**
 * Canonical dApp UI state shape.
 *
 * The dApp surfaces all consume this shape (or derive it via
 * `useDappChainState`) so wallet, cluster, transaction lifecycle, and proof
 * status are explicit instead of ad hoc booleans.
 */
import type { ProofStatus as SharedProofStatus } from "@shared/structuredReceipt";
import type { SolanaCluster } from "@shared/solana/types";

export type TransactionStatus =
  | "idle"
  | "preparing"
  | "signing"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "failed"
  | "expired"
  | "degraded";

export type DappSessionStatus =
  | "none"
  | "pending"
  | "verified"
  | "expired"
  | "rejected"
  | "error";

export type DappProofStatus = SharedProofStatus;

export interface DappChainState {
  /** True when an adapter is connected and a public key is known. */
  connected: boolean;
  /** True when the user is in pure demo mode. */
  demoMode: boolean;
  walletAddress?: string;
  walletName?: string;
  cluster: SolanaCluster;
  rpcUrl: string;
  explorerBaseUrl: string;
  balanceSol?: string;
  balanceLamports?: string;
  /** Set when the cluster from the verified session disagrees with the env cluster. */
  wrongCluster: boolean;
  /** Bearer/session attestation lifecycle. */
  sessionStatus: DappSessionStatus;
  sessionExpiresLabel?: string;
  /** Lifecycle of the most recent or in-flight transaction. */
  txStatus: TransactionStatus;
  txSignature?: string;
  /** Most recent on-chain account (e.g. PDA) tied to the active action. */
  accountAddress?: string;
  pda?: string;
  /** Helpful explorer link — usually mirrors `txSignature` when available. */
  explorerUrl?: string;
  /** Compact proof status reflecting the last known evidence path. */
  proofStatus: DappProofStatus;
  /** True while the wallet adapter is performing a long-running operation. */
  busy: boolean;
  /** Surfaced error from the most recent wallet/session step (string only). */
  error?: string;
  /** Server-probed RPC health for the configured cluster (`null` until first status fetch). */
  rpcReachable?: boolean | null;
  rpcSlot?: string;
  rpcLatencyMs?: number;
  rpcError?: string;
  rpcCheckedAt?: string;
}

export const DAPP_TX_STATUS_LABEL: Record<TransactionStatus, string> = {
  idle: "Idle",
  preparing: "Preparing",
  signing: "Awaiting signature",
  submitted: "Submitted",
  confirming: "Confirming",
  confirmed: "Confirmed",
  failed: "Failed",
  expired: "Expired",
  degraded: "Degraded path",
};

export const DAPP_TX_STATUS_HINT: Record<TransactionStatus, string> = {
  idle: "No transaction in flight.",
  preparing: "Building the instruction set.",
  signing: "Open your wallet to approve the transaction.",
  submitted: "Transaction sent to the cluster.",
  confirming: "Waiting for cluster confirmation.",
  confirmed: "Transaction finalized on Solana.",
  failed: "The cluster rejected this transaction.",
  expired: "The blockhash expired before confirmation.",
  degraded: "Verified via fallback path; live confirmation unavailable.",
};
