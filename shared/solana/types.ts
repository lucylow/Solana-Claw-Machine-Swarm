export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet" | "localnet";

/** Wallet ↔ RPC session machine states (canonical). */
export type SolanaConnectionStatus =
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

/** @deprecated Use SolanaConnectionStatus — preserved for incremental migration */
export type SolanaWalletMachineState = SolanaConnectionStatus;

export interface SolanaTxRecord {
  signature: string;
  slot?: number;
  status: "pending" | "confirmed" | "failed";
  cluster: SolanaCluster;
  explorerUrl?: string;
  createdAt: number;
}

/** Wallet-derived snapshot for UI + RPC alignment (canonical). */
export interface SolanaWalletState {
  connected: boolean;
  connectionStatus: SolanaConnectionStatus;
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
  sessionStatus: "none" | "pending" | "verified" | "expired" | "rejected" | "error";
  sessionToken?: string;
  sessionNonce?: string;
  lastTxSignature?: string;
  lastSignatureAt?: string;
  lastSessionAt?: string;
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
  canPublishSkills: boolean;
  canRunTasks: boolean;
  canWriteMemory: boolean;
  canAnchorProofs: boolean;
  canBridgeOpenClaw: boolean;
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
  nonce: string;
  message: string;
  expiresAt: number;
  cluster: SolanaCluster;
}

export interface SessionVerifyRequest {
  walletAddress: string;
  nonceId: string;
  signature: string;
}

export interface SessionVerifyResponse {
  token: string;
  profile: SolanaSessionProfile;
}

/** Canonical mirrored receipt row shown across explorer surfaces */
export interface SolanaReceiptRecord {
  id: string;
  type:
    | "skill"
    | "plan"
    | "execution"
    | "reflection"
    | "memory"
    | "proof"
    | "zerog_upload"
    | "zerog_da_batch";
  subjectId: string;
  wallet: string;
  cluster: SolanaCluster;
  txSignature?: string;
  account?: string;
  summaryHash: string;
  status: "draft" | "submitted" | "confirmed" | "verified" | "failed" | "degraded";
  createdAt: string;
  explorerUrl?: string;
  storageRef?: string;
  proofRef?: string;
  daRoot?: string;
}

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

export interface PlanReceipt extends ReceiptRecordBase {
  planId: string;
  selectedSkillIds: string[];
  expectedOutcome: string;
}

export interface ExecutionReceipt extends ReceiptRecordBase {
  executionId: string;
  stepCount: number;
  completedSteps: number;
  failedSteps: number;
}

export interface ReflectionRecord {
  id: string;
  executionId: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  confidence: number;
  sourceTurn: string;
  linkedMemoryId?: string;
  linkedProofReceiptId?: string;
}

export interface MemoryRecord {
  id: string;
  title: string;
  summary: string;
  type: string;
  source: string;
  storageRef: string;
  checksum: string;
  proofRef?: string;
  linkedNextTurn?: string;
  verificationState: "verified" | "pending" | "failed";
}

export interface ProofReceipt extends ReceiptRecordBase {
  proofId: string;
  linkedPlanId?: string;
  linkedExecutionId?: string;
  linkedReflectionId?: string;
  linkedMemoryId?: string;
}
