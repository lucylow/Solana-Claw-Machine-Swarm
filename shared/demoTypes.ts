/** Types for the interactive mock-data demo layer (presentation / sandbox only). */

export type DemoCluster = "devnet" | "testnet" | "mainnet-beta";

export type DemoScenarioId =
  | "wallet-skill-discovery"
  | "publish-skill"
  | "execute-task"
  | "failure-reflection-memory"
  | "receipt-anchor"
  | "reputation-update"
  | "multi-agent"
  | "full-e2e";

export type DemoAgentRole =
  | "planner"
  | "researcher"
  | "operator"
  | "critic"
  | "support"
  | "coordinator";

export type DemoRunOutcome = "success" | "failure" | "recovery";

export type DemoSection =
  | "hub"
  | "wallet"
  | "skills"
  | "execution"
  | "reflection"
  | "memory"
  | "receipts"
  | "reputation"
  | "full-story"
  | "playground";

export interface DemoWalletFixture {
  address: string;
  cluster: DemoCluster;
  balanceSol: number;
  label: string;
}

export interface DemoSkillFixture {
  id: string;
  name: string;
  description: string;
  tags: string[];
  version: string;
  authorWallet: string;
  contentHash: string;
  status: "active" | "deprecated" | "draft";
  usageCount: number;
  successRate: number;
  reputationScore: number;
  lastUsedIso: string;
  agentTypes: string[];
  taskTypes: string[];
  receiptRef?: string;
  explorerSkillAccount?: string;
}

export interface DemoAgentFixture {
  role: DemoAgentRole;
  displayName: string;
  taskAssigned: string;
  status: "idle" | "working" | "merged" | "blocked" | "done";
  inputSummary: string;
  outputSummary: string;
  confidence: number;
  reputation: number;
}

export interface DemoPlanFixture {
  id: string;
  taskType: string;
  goal: string;
  stepCount: number;
  dependencies: string[];
  chosenSkillIds: string[];
  expectedOutcome: string;
  planSummaryHash: string;
  planStatus: "draft" | "approved" | "executing" | "closed";
  executionStatus: "pending" | "running" | "success" | "failed" | "recovered";
  resultSummary: string;
  resultHash: string;
  receiptRef?: string;
}

export interface DemoExecutionStepFixture {
  id: string;
  order: number;
  title: string;
  detail: string;
  status: "pending" | "active" | "done" | "failed";
  skillId?: string;
  durationMs: number;
}

export interface DemoReflectionFixture {
  id: string;
  sourceTurnId: string;
  outcome: "success" | "failure" | "retry" | "correction" | "lesson";
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  confidence: number;
  linkedMemoryId: string;
  linkedReceiptId: string;
  proofStatus: "verified" | "pending" | "failed";
}

export interface DemoMemoryFixture {
  id: string;
  memoryType: string;
  source: string;
  summary: string;
  storageReference: string;
  proofReference: string;
  linkedNextTurnId: string;
  verification: "verified" | "pending";
  timestampIso: string;
}

export interface DemoReceiptFixture {
  id: string;
  kind:
    | "skill_publish"
    | "plan_generate"
    | "execution_complete"
    | "reflection_store"
    | "memory_store"
    | "proof_anchor"
    | "reputation_update";
  subject: string;
  subjectType: string;
  wallet: string;
  chain: "Solana";
  txSignature: string;
  accountOrProofRef: string;
  status: "confirmed" | "pending" | "verified";
  summaryHash: string;
  createdIso: string;
  storageReference?: string;
}

export interface DemoMemoryTimelineStage {
  id: string;
  stage:
    | "captured"
    | "reflected"
    | "stored"
    | "indexed"
    | "retrieved"
    | "used"
    | "verified";
  title: string;
  description: string;
  status: "complete" | "active" | "pending";
  timestampIso: string;
  proofOrStorageRef?: string;
}

export interface DemoScenarioFixture {
  id: DemoScenarioId;
  title: string;
  subtitle: string;
  summary: string;
  whatYouWillSee: string[];
  accent: "green" | "teal" | "cyan";
  defaultSkillId: string;
  preferredOutcome: DemoRunOutcome;
}

export interface DemoGuidedStep {
  id: string;
  title: string;
  presenterNote: string;
  detail: string;
  /** Which UI region should glow in guided mode */
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
