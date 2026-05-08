/**
 * Canonical agent model — shared by frontend, API responses, and orchestration.
 * Serializable, explicit, and aligned with multi-role Solana-native runs.
 */

export type AgentRole =
  | "coordinator"
  | "planner"
  | "researcher"
  | "operator"
  | "critic"
  | "reflector"
  | "memory_writer"
  | "proof_anchor"
  | "reputation_updater"
  | "recovery_manager";

export type AgentRunStatus =
  | "idle"
  | "planning"
  | "delegating"
  | "executing"
  | "reviewing"
  | "reflecting"
  | "writing_memory"
  | "anchoring_proof"
  | "completed"
  | "failed"
  | "degraded";

export type AgentDecisionType =
  | "skill_selection"
  | "plan_selection"
  | "tool_selection"
  | "retry_strategy"
  | "reflection_strategy"
  | "memory_injection"
  | "proof_anchor_strategy"
  | "delegation_strategy";

export type AgentConfidenceLevel = "low" | "medium" | "high" | "critical";

export type AgentAutonomyLevel =
  | "automation_only"
  | "assisted"
  | "guided"
  | "policy_gated"
  | "meaningful_agency"
  | "near_autonomous"
  | "fully_autonomous";

export interface AgentProfile {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  autonomyLevel: AgentAutonomyLevel;
  confidenceBias: number;
  reputationScore: number;
  successRate: number;
  failureRecoveryRate: number;
  totalRuns: number;
  totalSuccesses: number;
  totalFailures: number;
  lastRunAt?: string;
  permissions: {
    canPlan: boolean;
    canDelegate: boolean;
    canCallTools: boolean;
    canWriteMemory: boolean;
    canAnchorProof: boolean;
    canRetry: boolean;
    canEscalate: boolean;
  };
  metadata: Record<string, unknown>;
}

export interface AgentDecisionRecord {
  id: string;
  runId: string;
  agentId: string;
  role: AgentRole;
  decisionType: AgentDecisionType;
  createdAt: string;
  decisionScope: string;
  optionsConsidered: Array<{
    id: string;
    label: string;
    reason?: string;
    score?: number;
  }>;
  selectedOptionId: string;
  rationale: string;
  confidence: AgentConfidenceLevel;
  policyStatus: "not_required" | "approved" | "blocked" | "overridden" | "needs_review";
  humanOverride?: boolean;
  memoryUsed?: string[];
  proofReceiptId?: string;
  metadata: Record<string, unknown>;
}

export interface AgentToolCall {
  id: string;
  runId: string;
  stepId?: string;
  agentId: string;
  toolName: string;
  toolType: "search" | "read" | "write" | "compute" | "transaction" | "rpc" | "memory" | "proof" | "other";
  inputSummary: string;
  outputSummary?: string;
  status: "pending" | "running" | "succeeded" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata: Record<string, unknown>;
}

export interface AgentStep {
  id: string;
  runId: string;
  index: number;
  title: string;
  description: string;
  ownerAgentId: string;
  status: "pending" | "running" | "succeeded" | "failed" | "skipped" | "retrying";
  startedAt?: string;
  completedAt?: string;
  toolCalls: AgentToolCall[];
  dependencies: string[];
  outputs: string[];
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  memoryRefs?: string[];
  proofRefs?: string[];
  metadata: Record<string, unknown>;
}

export interface AgentPlan {
  id: string;
  runId: string;
  goal: string;
  summary: string;
  steps: AgentStep[];
  chosenSkillIds: string[];
  createdAt: string;
  updatedAt: string;
  plannerAgentId: string;
  confidence: AgentConfidenceLevel;
  riskLevel: "low" | "medium" | "high" | "critical";
  policyStatus: "not_required" | "approved" | "blocked" | "overridden" | "needs_review";
  metadata: Record<string, unknown>;
}

export interface AgentReflection {
  id: string;
  runId: string;
  sourceStepId?: string;
  sourceExecutionId?: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  summary: string;
  fullText?: string;
  createdAt: string;
  status: "captured" | "stored" | "anchored" | "linked" | "verified" | "degraded";
  memoryId?: string;
  proofReceiptId?: string;
  storageRef?: string;
  proofHash?: string;
  metadata: Record<string, unknown>;
}

export interface AgentMemoryRecord {
  id: string;
  runId: string;
  sourceStepId?: string;
  sourceExecutionId?: string;
  sourceReflectionId?: string;
  kind: "working" | "session" | "episodic" | "semantic" | "reflection" | "failure" | "plan" | "summary";
  title: string;
  summary: string;
  content?: string;
  tags: string[];
  storageRef?: string;
  checksum?: string;
  proofReceiptId?: string;
  linkedNextRunId?: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface AgentProofRecord {
  id: string;
  runId: string;
  agentId: string;
  proofType: "decision" | "plan" | "execution" | "reflection" | "memory" | "skill" | "reputation" | "recovery";
  walletAddress: string;
  cluster: "devnet" | "testnet" | "mainnet-beta" | "localnet";
  txSignature?: string;
  pda?: string;
  account?: string;
  proofStatus: "unverified" | "pending" | "verified" | "degraded" | "cached_only" | "demo_only";
  summaryHash: string;
  createdAt: string;
  explorerUrl?: string;
  storageRef?: string;
  checksum?: string;
  metadata: Record<string, unknown>;
}

/** Visible handoff between roles (not hidden in logs). */
export interface AgentDelegationHandoff {
  id: string;
  runId: string;
  fromRole: AgentRole;
  toRole: AgentRole;
  scope: string;
  task: string;
  inputSummary: string;
  outputSummary: string;
  confidence: AgentConfidenceLevel;
  at: string;
  proofReceiptId?: string;
}

/** Post-execution critic pass. */
export interface AgentCriticEvaluation {
  id: string;
  runId: string;
  agentId: string;
  score: number;
  critiqueSummary: string;
  missingItems: string[];
  riskFlags: string[];
  recommendedNextStep: string;
  shouldReflect: boolean;
  shouldImprovePlanNextRun: boolean;
  policyCompliance: "pass" | "warn" | "fail";
  proofCompleteness: "full" | "partial" | "missing";
  memoryUsefulness: "high" | "medium" | "low" | "none";
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface AgentRecoveryEvent {
  id: string;
  runId: string;
  stepId?: string;
  kind: "retry" | "fallback_tool" | "degraded_continue" | "escalate_policy" | "abort";
  detail: string;
  at: string;
  metadata: Record<string, unknown>;
}

export interface AgentIntentClassification {
  goalType:
    | "orchestration"
    | "research"
    | "transaction"
    | "reflection"
    | "governance"
    | "unknown";
  constraints: string[];
  assumptions: string[];
  riskSignals: string[];
  policyHints: string[];
  memoryHints: string[];
  proofHints: string[];
}
