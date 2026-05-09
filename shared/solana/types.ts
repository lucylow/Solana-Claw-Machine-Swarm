/**
 * Canonical Solana + command-center types shared across client, server, and tooling.
 * Reflection/memory domains live in `@shared/domainModel`; this module avoids duplicating them.
 */

import type {
  MemoryRecord,
  ReflectionRecord,
  SkillIdentity,
} from "../domainModel";

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet" | "localnet";

/** Wallet ↔ session lifecycle states surfaced in the command center */
export type WalletConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "signing"
  | "session_verifying"
  | "session_verified"
  | "wrong_cluster"
  | "balance_loading"
  | "ready"
  | "error";

/** @deprecated Use WalletConnectionStatus */
export type SolanaConnectionStatus = WalletConnectionStatus;

/** @deprecated Use WalletConnectionStatus */
export type SolanaWalletMachineState = WalletConnectionStatus;

/** Receipt row mirrored between orchestrator + explorer surfaces */
export interface SolanaReceiptRecord {
  id: string;
  type:
    | "session"
    | "skill"
    | "plan"
    | "execution"
    | "reflection"
    | "memory"
    | "proof"
    | "openclaw_import"
    | "openclaw_export"
    | "zerog_upload"
    | "zerog_da_batch";
  subjectId: string;
  wallet: string;
  cluster: SolanaCluster;
  txSignature?: string;
  account?: string;
  summaryHash: string;
  status:
    | "draft"
    | "submitted"
    | "confirmed"
    | "verified"
    | "failed"
    | "degraded"
    | "cached";
  createdAt: string;
  explorerUrl?: string;
  storageRef?: string;
  proofRef?: string;
  daRoot?: string;
}

/** Alias for backwards compatibility with older imports */
export type SolanaTxRecord = SolanaReceiptRecord;

/** Last probe of the cluster RPC the app is configured to use (server-authoritative when fetched via `/api/solana/status`). */
export interface SolanaRpcProbe {
  ok: boolean;
  slot?: number;
  latencyMs?: number;
  error?: string;
}

/** `/api/solana/status` payload — orchestration + cluster + RPC reachability */
export interface SolanaBackendStatus {
  cluster: SolanaCluster;
  rpcUrl: string;
  explorerBaseUrl: string;
  product: string;
  activeSessions: number;
  outstandingNonces: number;
  rpc: SolanaRpcProbe;
}

/** Aggregate wallet snapshot rendered across panels */
export interface SolanaWalletState {
  connected: boolean;
  connectionStatus: WalletConnectionStatus;
  /** Public key always comes from the wallet adapter — never from session storage alone */
  publicKey: string | null;
  walletName: string | null;
  cluster: SolanaCluster;
  rpcUrl: string;
  explorerBaseUrl: string;
  balanceLamports: string | null;
  balanceSol: string | null;
  isBalanceLoading: boolean;
  isSessionLoading: boolean;
  isSessionVerified: boolean;
  sessionStatus:
    | "none"
    | "pending"
    | "verified"
    | "expired"
    | "rejected"
    | "error";
  sessionToken?: string;
  sessionNonce?: string;
  lastTxSignature?: string;
  lastSignatureAt?: string;
  lastSessionAt?: string;
  /** Result of the last RPC health check against the app cluster */
  rpcReachable: boolean | null;
  rpcSlot: string | null;
  rpcLatencyMs: number | null;
  rpcError: string | null;
  rpcCheckedAt: string | null;
  permissions: {
    canPublishSkill: boolean;
    canExecuteTask: boolean;
    canAnchorReceipt: boolean;
    canSignSession: boolean;
    canViewChainData: boolean;
  };
  txHistory: SolanaTxRecord[];
  diagnostics: Record<string, unknown>;
}

export interface SolanaSessionPermissions {
  canPublishSkill: boolean;
  canExecuteTask: boolean;
  canAnchorReceipt: boolean;
  canSignSession: boolean;
  canViewChainData: boolean;
}

export interface SolanaSessionProfile {
  walletAddress: string;
  cluster: SolanaCluster;
  displayName: string;
  verifiedAt: number;
  expiresAt: number;
  nonceId: string;
  sessionId: string;
  permissions: SolanaSessionPermissions;
}

export interface SessionNonceResponse {
  nonceId: string;
  /** Same id as nonceId — stable session correlation handle for clients */
  sessionId: string;
  nonce: string;
  message: string;
  expiresAt: number;
  cluster: SolanaCluster;
}

export interface SessionVerifyRequest {
  walletAddress: string;
  nonceId: string;
  signature: string;
  cluster: SolanaCluster;
  message: string;
}

export interface SessionVerifyResponse {
  token: string;
  profile: SolanaSessionProfile;
}

/** Published skill row for registry / discovery views (distinct from `SkillAsset` in `./skills`). */
export interface SolanaRegistrySkillAsset extends SkillIdentity {
  openClawCompatible?: boolean;
  openClawSource?: string;
  openClawExportTarget?: string;
}

/** Command-center orchestration plan (distinct from `@shared/planReceipts`) */
export interface AgentOrchestrationPlanReceipt {
  id: string;
  planId: string;
  taskType: string;
  goal: string;
  summary: string;
  stepCount: number;
  dependencies: Array<{
    id: string;
    type: "skill" | "memory" | "artifact" | "tool" | "queue" | "contract";
    ref: string;
    label?: string;
    required: boolean;
  }>;
  chosenSkills: Array<{
    id: string;
    name: string;
    version?: string;
    hash?: string;
    active?: boolean;
  }>;
  summaryHash: string;
  planHash: string;
  status:
    | "draft"
    | "generated"
    | "stored"
    | "anchored"
    | "executing"
    | "completed"
    | "failed"
    | "degraded";
  createdAt: string;
  updatedAt: string;
  agentId: string;
  wallet: string;
  storage?: {
    ref?: string;
    checksum?: string;
    namespace?: string;
  };
  solana?: {
    chainId?: number;
    txSignature?: string;
    account?: string;
    programId?: string;
    anchorHash?: string;
    verified?: boolean;
  };
  reflection?: {
    reflectionId?: string;
    linked?: boolean;
  };
  memory?: {
    memoryId?: string;
    linked?: boolean;
  };
  metadata: Record<string, unknown>;
}

export type { MemoryRecord, ReflectionRecord };

/** Structured receipt row used across dashboard / explorer — compact proof metadata only */
export interface ReceiptArtifact {
  id: string;
  subjectType: string;
  subjectId: string;
  wallet: string;
  cluster: SolanaCluster;
  txSignature?: string;
  accountAddress?: string;
  summaryHash: string;
  storageRef?: string;
  proofRef?: string;
  status:
    | "draft"
    | "submitted"
    | "confirmed"
    | "verified"
    | "failed"
    | "degraded";
  createdAt: string;
  explorerUrl?: string;
}

/** Reflection narrative stays off-chain; this record carries lineage + pointers */
export interface ReflectionArtifact {
  id: string;
  sourceTurnId: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  summary: string;
  fullText?: string;
  offchainStorageRef?: string;
  onchainReceiptId?: string;
  status:
    | "captured"
    | "stored"
    | "anchored"
    | "linked"
    | "verified"
    | "failed"
    | "degraded";
}

/** Memory record with provenance — long content via storageRef, proof via receipt id */
export interface MemoryArtifact {
  id: string;
  sourceTurnId: string;
  title: string;
  summary: string;
  kind:
    | "working"
    | "session"
    | "episodic"
    | "semantic"
    | "reflection"
    | "failure"
    | "plan"
    | "summary";
  storageRef?: string;
  proofReceiptId?: string;
  linkedNextTurnId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Legacy mirrored receipts kept for older readers — prefer ReceiptRecord in domain swarm types */
export interface ReceiptRecordBase {
  id: string;
  wallet: string;
  subject: string;
  hash: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  txSignature?: string;
  accountAddress?: string;
  explorerUrl?: string;
  verificationState: "verified" | "pending" | "failed" | "degraded";
}

export interface LegacyMirroredPlanReceipt extends ReceiptRecordBase {
  planId: string;
  selectedSkillIds: string[];
  expectedOutcome: string;
}

export interface LegacyMirroredExecutionReceipt extends ReceiptRecordBase {
  executionId: string;
  stepCount: number;
  completedSteps: number;
  failedSteps: number;
}

export interface LegacyMirroredProofReceipt extends ReceiptRecordBase {
  proofId: string;
  linkedPlanId?: string;
  linkedExecutionId?: string;
  linkedReflectionId?: string;
  linkedMemoryId?: string;
}
