/**
 * Command-center execution narrative model: stages, replay, traceable artifacts.
 * Prefer these names over unstructured UI state (`Record<string, unknown>`).
 */

export type ExecutionStage =
  | "idle"
  | "planning"
  | "step_selecting"
  | "running"
  | "retrying"
  | "reflecting"
  | "writing_memory"
  | "anchoring_receipt"
  | "verified"
  | "degraded"
  | "completed"
  | "failed";

/** Filter / chapter for guided demo UX (distinct from presenter “section”). */
export type DemoNarrativeMode =
  | "wallet_connect"
  | "skill_discovery"
  | "plan_building"
  | "execution_success"
  | "execution_failure"
  | "reflection_memory"
  | "receipt_proof"
  | "full_story";

/** Alias for narrative chapter filter (presentation + demo labeling). */
export type DemoMode = DemoNarrativeMode;

export type MemoryVisibility = "private" | "workspace" | "public";

export type MemoryProofStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "cached_only"
  | "demo_only"
  | "degraded";

export type ExecutionStepStatus = "pending" | "running" | "succeeded" | "failed" | "skipped";

export interface ExecutionToolCall {
  id: string;
  toolName: string;
  inputSummary: string;
  outputSummary?: string;
  status: "pending" | "running" | "succeeded" | "failed";
}

export interface ExecutionStep {
  id: string;
  index: number;
  title: string;
  description: string;
  dependsOnIds: string[];
  status: ExecutionStepStatus;
  startedAt?: string;
  completedAt?: string;
  toolCalls?: ExecutionToolCall[];
  agentId?: string;
  agentName?: string;
  memoryRefs?: string[];
  receiptRefs?: string[];
}

export interface ExecutionRun {
  id: string;
  walletAddress: string;
  walletCluster: "devnet" | "testnet" | "mainnet-beta" | "localnet";
  skillId: string;
  skillName: string;
  skillVersion?: string;
  goal: string;
  currentStage: ExecutionStage;
  planSummary: string;
  steps: ExecutionStep[];
  activeStepId?: string;
  activeAgentRole?: string;
  failureReason?: string;
  reflectionId?: string;
  memoryId?: string;
  receiptId?: string;
  proofId?: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export type StoryMemoryKind =
  | "working"
  | "session"
  | "episodic"
  | "semantic"
  | "reflection"
  | "failure"
  | "plan"
  | "summary";

export interface StoryReflectionRecord {
  id: string;
  sourceTurnId: string;
  sourceExecutionId: string;
  sourceSkillId: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  summary: string;
  fullText?: string;
  createdAt: string;
  updatedAt: string;
  memoryId?: string;
  storageRef?: string;
  proofRef?: string;
  status: "captured" | "stored" | "anchored" | "linked" | "verified" | "degraded";
}

export interface TraceableMemoryRecord {
  id: string;
  sourceTurnId: string;
  sourceExecutionId: string;
  sourceReflectionId?: string;
  sourceSkillId: string;
  kind: StoryMemoryKind;
  title: string;
  summary: string;
  content?: string;
  tags: string[];
  visibility: MemoryVisibility;
  storageRef?: string;
  checksum?: string;
  proofReceiptId?: string;
  proofStatus: MemoryProofStatus;
  linkedNextTurnId?: string;
  retrievedCount?: number;
  lastRetrievedAt?: string;
  explorerUrlHint?: string;
  createdAt: string;
  updatedAt: string;
}

/** Proof-oriented receipt for command-center surfaces (narrower than on-chain ReceiptRecord typing). */
export interface CommandReceiptRecord {
  id: string;
  type:
    | "skill"
    | "plan"
    | "execution"
    | "reflection"
    | "memory"
    | "proof"
    | "wallet"
    | "session"
    | "reputation";
  subjectId: string;
  subjectType: string;
  walletAddress: string;
  cluster: "devnet" | "testnet" | "mainnet-beta" | "localnet";
  title: string;
  summary: string;
  status: "draft" | "submitted" | "confirmed" | "verified" | "failed" | "degraded" | "cached" | "pending";
  txSignature?: string;
  accountAddress?: string;
  storageRef?: string;
  proofRef?: string;
  explorerUrl?: string;
  /** When true-ish, anchored state is illustrative only */
  demoLabeled?: boolean;
  createdAt: string;
  updatedAt: string;
  claim: {
    text: string;
    proofState: MemoryProofStatus;
    supportedBy: string[];
  };
}

export interface StoryBeatPresentation {
  title: string;
  detail: string;
  presenterNote: string;
  highlight:
    | "wallet"
    | "skills"
    | "plan"
    | "execution"
    | "reflection"
    | "memory"
    | "receipt"
    | "reputation"
    | "coordination";
}

export interface ExecutionStoryPlaybackPatch {
  walletConnectedDemo: boolean;
  currentStage: ExecutionStage;
  stepStatusOverrides: Partial<Record<string, ExecutionStepStatus>>;
  activeStepId?: string;
  hideReflection: boolean;
  hideMemory: boolean;
  hideProofReceiptIds: boolean;
  /** `null` explicitly clears failure text during retry beats */
  failureReasonOverride?: string | null;
}

export interface UnifiedStoryBeat extends StoryBeatPresentation {
  id: string;
  patch: ExecutionStoryPlaybackPatch;
}
