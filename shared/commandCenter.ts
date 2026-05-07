export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta" | string;

export interface SolanaNetworkState {
  cluster: SolanaCluster;
  rpcUrl: string;
  chainId: number;
  healthy: boolean;
  mode: "read-only" | "signing" | "publishing";
}

export interface WalletCommandState {
  connected: boolean;
  walletAddress?: string;
  authorityLabel?: string;
  balanceSol?: number;
  canPublish: boolean;
  canRun: boolean;
  canAnchor: boolean;
  signing: boolean;
  readOnlyReason?: string;
}

export interface TaskExecutionState {
  id: string;
  goal: string;
  skillId?: string;
  skillName?: string;
  phase:
    | "start"
    | "plan"
    | "execute"
    | "observe"
    | "reflect"
    | "store"
    | "receipt"
    | "done";
  progress: number;
  status: "idle" | "running" | "success" | "failure";
  stepLabel?: string;
  toolCallSummary?: string;
  outputSummary?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ReflectionState {
  id: string;
  sourceTurnId: string;
  outcome: "success" | "failure" | "retry" | "correction" | "lesson";
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  storedAsMemory: boolean;
  anchored: boolean;
  injectedNextTurn: boolean;
}

export interface MemoryState {
  id: string;
  memoryType: string;
  source: string;
  summary: string;
  provenance: string;
  timestamp: string;
  storageReference?: string;
  receiptReference?: string;
  verified: boolean;
  changedNextTurn?: string;
}

export interface VerificationState {
  status: "verified" | "pending" | "degraded" | "failed";
  label: string;
}

export interface ExplorerPayload {
  label: string;
  signature?: string;
  address?: string;
  url?: string;
}

export interface DemoStoryStepPayload {
  id: string;
  title: string;
  detail: string;
  status: "pending" | "active" | "completed";
}
