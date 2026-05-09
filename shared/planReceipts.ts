export type PlanReceiptStatus =
  | "draft"
  | "generated"
  | "stored"
  | "anchored"
  | "executing"
  | "completed"
  | "failed"
  | "partially_completed"
  | "reflected"
  | "linked_to_memory"
  | "verified"
  | "degraded";

export type PlanTaskType =
  | "support"
  | "research"
  | "coding"
  | "deployment"
  | "governance"
  | "analysis"
  | "planning"
  | "execution"
  | "retrieval"
  | "multimodal"
  | "queue_processing"
  | "proof_generation"
  | "skill_usage";

export type PlanOutcomeStatus =
  | "pending"
  | "success"
  | "partial"
  | "failed"
  | "degraded";
export type PlanExecutionStatus =
  | "pending"
  | "running"
  | "success"
  | "partial"
  | "failed"
  | "degraded";

export interface PlanStepReceipt {
  id: string;
  index: number;
  title: string;
  description: string;
  dependencies: string[];
  chosenSkills: string[];
  expectedResult?: string;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  resultSummary?: string;
  resultHash?: string;
}

export interface PlanDependency {
  id: string;
  type: "skill" | "memory" | "artifact" | "queue" | "contract" | "tool";
  ref: string;
  label?: string;
  required: boolean;
}

export interface PlanSkillRef {
  id: string;
  name: string;
  version?: string;
  hash?: string;
  active?: boolean;
}

export interface PlanStorageRef {
  ref?: string;
  checksum?: string;
  namespace?: string;
}

export interface PlanSolanaRef {
  chainId?: number;
  txSignature?: string;
  account?: string;
  programId?: string;
  anchorHash?: string;
  verified?: boolean;
  verifiedAt?: string;
}

export interface PlanReflectionLink {
  reflectionId?: string;
  reflectionReceiptId?: string;
  linked?: boolean;
}

export interface PlanMemoryLink {
  memoryId?: string;
  linked?: boolean;
}

export interface PlanReceipt {
  id: string;
  version: number;
  planId: string;
  taskType: PlanTaskType;
  title: string;
  summary: string;
  goal: string;
  stepCount: number;
  steps: PlanStepReceipt[];
  dependencies: PlanDependency[];
  chosenSkills: PlanSkillRef[];
  expectedOutcome: string;
  actualOutcome?: string;
  outcomeStatus: PlanOutcomeStatus;
  summaryHash: string;
  planHash: string;
  createdAt: string;
  updatedAt: string;
  agentId: string;
  conversationId?: string;
  turnId?: string;
  sessionId?: string;
  wallet?: string;
  status: PlanReceiptStatus;
  storage?: PlanStorageRef;
  solana?: PlanSolanaRef;
  reflection?: PlanReflectionLink;
  memory?: PlanMemoryLink;
  metadata: Record<string, unknown>;
  tags: string[];
}

export interface PlanExecutionReceipt {
  id: string;
  planReceiptId: string;
  planId: string;
  status: PlanExecutionStatus;
  startTime: string;
  endTime?: string;
  worker: string;
  toolCalls: Array<{
    id: string;
    tool: string;
    status: "success" | "failed";
    summary?: string;
  }>;
  stepProgress: Array<{
    stepId: string;
    status: "pending" | "running" | "done" | "failed" | "skipped";
  }>;
  failedSteps: string[];
  finalResult?: string;
  outputHash?: string;
  memoryWrite?: {
    memoryId?: string;
    linked?: boolean;
  };
  reflectionWrite?: {
    reflectionId?: string;
    linked?: boolean;
  };
  solana?: PlanSolanaRef;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PlanResultReceipt {
  id: string;
  planReceiptId: string;
  planId: string;
  actualOutcome: string;
  status: PlanOutcomeStatus;
  resultSummary: string;
  resultHash: string;
  sourceExecutionReceiptId?: string;
  reflection?: PlanReflectionLink;
  memory?: PlanMemoryLink;
  storage?: PlanStorageRef;
  solana?: PlanSolanaRef;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface PlanVerificationResult {
  planId: string;
  planReceiptId: string;
  verified: boolean;
  status:
    | "verified"
    | "partially_verified"
    | "stored_only"
    | "anchored_only"
    | "failed"
    | "degraded";
  checks: {
    canonicalPlanHashMatch: boolean;
    canonicalSummaryHashMatch: boolean;
    resultHashMatch: boolean;
    anchorPresent: boolean;
    reflectionLinked: boolean;
    memoryLinked: boolean;
  };
  issues: string[];
  verifiedAt: string;
}

export interface PlanTimelineEvent {
  id: string;
  planId: string;
  planReceiptId?: string;
  executionReceiptId?: string;
  resultReceiptId?: string;
  stage:
    | "goal"
    | "breakdown"
    | "execution"
    | "result"
    | "memory"
    | "reflection"
    | "proof"
    | "verification";
  status: PlanReceiptStatus | PlanExecutionStatus | PlanOutcomeStatus;
  title: string;
  summary: string;
  timestamp: string;
  refs?: {
    storage?: string;
    txSignature?: string;
    reflectionId?: string;
    memoryId?: string;
    hash?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface PlanFilter {
  taskType?: PlanTaskType;
  status?: PlanReceiptStatus;
  outcomeStatus?: PlanOutcomeStatus;
  agentId?: string;
  wallet?: string;
  conversationId?: string;
  verified?: boolean;
  limit?: number;
  offset?: number;
}

export interface PlanQuery extends PlanFilter {
  planId?: string;
}
