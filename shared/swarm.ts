import type { AutonomyLevel, PolicyGateStatus, RiskLevel } from "./autonomy";
import type { SolanaZeroGLink, ZeroGBridgeState } from "./zerog";

export type SwarmSectionId =
  | "overview"
  | "live-runs"
  | "skills"
  | "memory"
  | "reflections"
  | "zerog"
  | "proof-graph"
  | "bridge"
  | "proof-explorer"
  | "agents"
  | "policies"
  | "receipts"
  | "governance"
  | "settings";

export type SwarmExecutionPhase =
  | "wallet"
  | "goal"
  | "skill-selection"
  | "planning"
  | "policy-check"
  | "orchestration"
  | "execution"
  | "failure"
  | "reflection"
  | "memory-write"
  | "proof-anchor"
  | "completed";

export interface SwarmSkill {
  id: string;
  name: string;
  category: string;
  description: string;
  authorWallet: string;
  version: string;
  reputation: number;
  usageCount: number;
  successRate: number;
  autonomyLevel: AutonomyLevel;
  policyStatus: PolicyGateStatus;
  proofCount: number;
  tags: string[];
}

export interface SwarmPlanStep {
  id: string;
  title: string;
  detail: string;
  ownerAgentId: string;
  requiredSkillIds: string[];
  status: "pending" | "running" | "success" | "failed";
  confidence: number;
}

export interface SwarmPlan {
  id: string;
  goal: string;
  rationale: string;
  confidence: number;
  generatedAt: string;
  steps: SwarmPlanStep[];
}

export interface SwarmPolicyGate {
  id: string;
  label: string;
  status: PolicyGateStatus;
  riskLevel: RiskLevel;
  reason: string;
  requiredAction: "none" | "confirm" | "sign" | "review" | "adjust_plan";
}

export interface SwarmExecutionEvent {
  id: string;
  phase: SwarmExecutionPhase;
  title: string;
  detail: string;
  status: "pending" | "running" | "success" | "failed";
  timestamp: string;
  agentId?: string;
  skillId?: string;
  confidence?: number;
  policyGateId?: string;
  proofReceiptId?: string;
  trace: string[];
}

export interface SwarmReflection {
  id: string;
  runId: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  createdAt: string;
  confidenceDelta: number;
  reusable: boolean;
  receiptId: string;
}

export interface SwarmMemoryRecord {
  id: string;
  runId: string;
  sourceFailure: string;
  reflectionId: string;
  correctiveAdvice: string;
  memoryInfluence: number;
  confidenceBefore: number;
  confidenceAfter: number;
  reusedInRunIds: string[];
  proofReceiptId: string;
  createdAt: string;
}

export interface SwarmReceipt {
  id: string;
  kind: "decision" | "execution" | "reflection" | "memory" | "proof" | "plan";
  runId: string;
  label: string;
  txSignature: string;
  receiptHash: string;
  account: string;
  linkedReceiptIds: string[];
  createdAt: string;
  explorerUrl: string;
  zeroGStorageRef?: string;
  zeroGComputeRef?: string;
  zeroGAvailabilityRef?: string;
}

export interface SwarmAgentNode {
  id: string;
  name: string;
  role: "planner" | "researcher" | "operator" | "critic" | "coordinator";
  wallet: string;
  reputation: number;
  memoryCount: number;
  proofCount: number;
  autonomyLevel: AutonomyLevel;
  status: "idle" | "running" | "learning";
}

export interface SwarmMissionRun {
  id: string;
  goal: string;
  createdAt: string;
  endedAt?: string;
  status: "running" | "failed" | "success";
  autonomyScoreBefore: number;
  autonomyScoreAfter: number;
  selectedSkillIds: string[];
  plan: SwarmPlan;
  policy: SwarmPolicyGate[];
  events: SwarmExecutionEvent[];
  reflection?: SwarmReflection;
  memoryWrite?: SwarmMemoryRecord;
  proofReceiptIds: string[];
  zeroGLinkId?: string;
}

export interface SwarmZeroGStatus {
  enabled: boolean;
  mode: "live" | "demo" | "degraded";
  storageStatus: "healthy" | "degraded" | "offline";
  computeStatus: "healthy" | "degraded" | "offline";
  daStatus: "healthy" | "degraded" | "offline";
  bridgeStatus: ZeroGBridgeState["status"];
  storageUrl: string;
  computeUrl: string;
  daUrl: string;
  explorerUrl: string;
}

export interface SwarmProofGraphNode {
  id: string;
  label: string;
  type:
    | "wallet"
    | "skill"
    | "plan"
    | "execution"
    | "reflection"
    | "memory"
    | "storage"
    | "compute"
    | "da"
    | "receipt"
    | "explorer";
  status: "ready" | "running" | "verified" | "degraded";
  ref?: string;
}

export interface SwarmProofGraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface SwarmRuntimeState {
  walletAddress?: string;
  cluster: string;
  autonomyLevel: AutonomyLevel;
  autonomyScore: number;
  proofCompletionRate: number;
  memoryGrowth: number;
  activeAgents: number;
  plansCompleted: number;
  successfulExecutions: number;
  reflectionsGenerated: number;
  policyApprovals: number;
  skills: SwarmSkill[];
  agents: SwarmAgentNode[];
  runs: SwarmMissionRun[];
  memories: SwarmMemoryRecord[];
  reflections: SwarmReflection[];
  receipts: SwarmReceipt[];
  zeroGLinks: SolanaZeroGLink[];
  zeroGBridge: ZeroGBridgeState;
  zeroGStatus: SwarmZeroGStatus;
  proofGraph: {
    nodes: SwarmProofGraphNode[];
    edges: SwarmProofGraphEdge[];
  };
  policyEvents: SwarmPolicyGate[];
}
