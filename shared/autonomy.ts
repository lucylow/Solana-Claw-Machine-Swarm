export type AutonomyLevel =
  | "automation_only"
  | "assisted"
  | "guided"
  | "policy_gated"
  | "meaningful_agency"
  | "near_autonomous"
  | "fully_autonomous";

export type PolicyStatus =
  | "not_required"
  | "approved"
  | "blocked"
  | "overridden"
  | "needs_review";

export type PolicyGateStatus =
  | "approved"
  | "blocked"
  | "review_required"
  | "signature_required"
  | "auto_allowed";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface AutonomyProfile {
  level: AutonomyLevel;
  score: number;
  canDecideSkill: boolean;
  canDecidePlan: boolean;
  canChooseTools: boolean;
  canRetryOnFailure: boolean;
  canWriteMemory: boolean;
  canAnchorProof: boolean;
  requiresHumanApproval: boolean;
  requiresPolicyCheck: boolean;
  requiresWalletSignature: boolean;
  decisionScope: string;
  explanation: string;
  badgeVariant: "outline" | "secondary" | "default";
  backendEnforcement: "manual" | "guarded" | "autonomous";
}

export interface AgentDecisionOption {
  id: string;
  label: string;
  reason?: string;
}

export interface AgentDecisionRecord {
  id: string;
  agentId: string;
  skillId?: string;
  planId?: string;
  turnId?: string;
  createdAt: string;
  decisionType:
    | "skill_selection"
    | "plan_selection"
    | "tool_selection"
    | "retry_strategy"
    | "reflection_strategy"
    | "memory_injection"
    | "proof_anchor_strategy";
  autonomyLevel: AutonomyLevel;
  decisionScope: string;
  optionsConsidered: AgentDecisionOption[];
  selectedOptionId: string;
  rationale: string;
  confidence: number;
  policyStatus: PolicyStatus;
  humanOverride?: boolean;
  memoryUsed?: string[];
  proofReceiptId?: string;
  metadata: Record<string, unknown>;
}

export interface PolicyGateResult {
  allowed: boolean;
  status: PolicyGateStatus;
  reason: string;
  policyId?: string;
  policyName?: string;
  riskLevel: RiskLevel;
  requiredAction?: "none" | "confirm" | "sign" | "review" | "adjust_plan";
  metadata: Record<string, unknown>;
}

export interface DecisionNarrative {
  id: string;
  decisionId: string;
  fullText: string;
  summary: string;
  optionsConsidered: Array<{
    id: string;
    label: string;
    pros: string[];
    cons: string[];
  }>;
  confidenceNotes: string;
  policyNotes: string;
  memoryNotes: string;
  createdAt: string;
  storageRef?: string;
  checksum?: string;
}

export interface MemoryUsageRecord {
  id: string;
  agentId: string;
  turnId: string;
  memoryIds: string[];
  usedFor:
    | "skill_selection"
    | "plan_selection"
    | "retry_strategy"
    | "reflection"
    | "tool_choice"
    | "proof_strategy";
  influence: number;
  result: "ignored" | "used" | "critical";
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface ReflectionRecord {
  id: string;
  agentId: string;
  runId: string;
  rootCause: string;
  correctiveAction: string;
  nextAction: string;
  autonomyLevel: AutonomyLevel;
  neededHumanInput: boolean;
  blockedByPolicy: boolean;
  improvedLaterRuns?: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface AutonomyScoreDetails {
  score: number;
  label: "automation" | "assisted" | "agency" | "autonomous";
  trend: "rising" | "stable" | "falling";
  explanation: string;
  breakdown: {
    independentDecisions: number;
    manualInterventions: number;
    memoryUse: number;
    reflectionReuse: number;
    policyPassRate: number;
    proofCompleteness: number;
    successRate: number;
    confidenceCalibration: number;
  };
}

export interface AutonomyModePreset {
  mode: "automation" | "meaningful_agency" | "full_autonomy";
  label: string;
  defaultLevel: AutonomyLevel;
  description: string;
}

export const AUTONOMY_MODE_PRESETS: AutonomyModePreset[] = [
  {
    mode: "automation",
    label: "Automation only",
    defaultLevel: "automation_only",
    description:
      "Predictable workflows with explicit human approvals for most actions.",
  },
  {
    mode: "meaningful_agency",
    label: "Meaningful agency",
    defaultLevel: "meaningful_agency",
    description:
      "Agent selects skills and plans while policy gates and risk thresholds remain active.",
  },
  {
    mode: "full_autonomy",
    label: "Full autonomy",
    defaultLevel: "fully_autonomous",
    description:
      "Agent manages end-to-end execution and requests approvals only for high-risk steps.",
  },
];

export const AUTONOMY_PROFILES: Record<AutonomyLevel, AutonomyProfile> = {
  automation_only: {
    level: "automation_only",
    score: 10,
    canDecideSkill: false,
    canDecidePlan: false,
    canChooseTools: false,
    canRetryOnFailure: false,
    canWriteMemory: false,
    canAnchorProof: true,
    requiresHumanApproval: true,
    requiresPolicyCheck: true,
    requiresWalletSignature: true,
    decisionScope: "Execution-only automation of user-selected actions",
    explanation:
      "Agent executes deterministic steps and waits for manual steering.",
    badgeVariant: "outline",
    backendEnforcement: "manual",
  },
  assisted: {
    level: "assisted",
    score: 25,
    canDecideSkill: false,
    canDecidePlan: true,
    canChooseTools: false,
    canRetryOnFailure: false,
    canWriteMemory: false,
    canAnchorProof: true,
    requiresHumanApproval: true,
    requiresPolicyCheck: true,
    requiresWalletSignature: true,
    decisionScope: "Plan suggestions with mandatory user confirmation",
    explanation: "Agent assists with planning but does not act independently.",
    badgeVariant: "outline",
    backendEnforcement: "manual",
  },
  guided: {
    level: "guided",
    score: 40,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: false,
    canRetryOnFailure: false,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: true,
    requiresPolicyCheck: true,
    requiresWalletSignature: false,
    decisionScope: "Skill and plan decisions under user supervision",
    explanation:
      "Agent proposes and revises decisions while user remains in loop.",
    badgeVariant: "secondary",
    backendEnforcement: "guarded",
  },
  policy_gated: {
    level: "policy_gated",
    score: 55,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: true,
    canRetryOnFailure: true,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: false,
    requiresPolicyCheck: true,
    requiresWalletSignature: false,
    decisionScope: "Autonomous decisions constrained by policy outcomes",
    explanation: "Agent can act independently when policy permits the step.",
    badgeVariant: "secondary",
    backendEnforcement: "guarded",
  },
  meaningful_agency: {
    level: "meaningful_agency",
    score: 70,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: true,
    canRetryOnFailure: true,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: false,
    requiresPolicyCheck: true,
    requiresWalletSignature: false,
    decisionScope:
      "Independent planning and execution with selective approvals",
    explanation:
      "Agent self-directs most work and escalates risk-sensitive actions.",
    badgeVariant: "default",
    backendEnforcement: "guarded",
  },
  near_autonomous: {
    level: "near_autonomous",
    score: 85,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: true,
    canRetryOnFailure: true,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: false,
    requiresPolicyCheck: true,
    requiresWalletSignature: false,
    decisionScope: "End-to-end operation with rare review checkpoints",
    explanation:
      "Agent handles almost all decisions and self-heals through reflection.",
    badgeVariant: "default",
    backendEnforcement: "autonomous",
  },
  fully_autonomous: {
    level: "fully_autonomous",
    score: 100,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: true,
    canRetryOnFailure: true,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: false,
    requiresPolicyCheck: false,
    requiresWalletSignature: false,
    decisionScope: "Agent-owned orchestration with continuous proof output",
    explanation:
      "Agent manages the complete workflow and emits auditable receipts.",
    badgeVariant: "default",
    backendEnforcement: "autonomous",
  },
};

export const AUTONOMY_SPECTRUM: AutonomyLevel[] = [
  "automation_only",
  "assisted",
  "guided",
  "policy_gated",
  "meaningful_agency",
  "near_autonomous",
  "fully_autonomous",
];

export function autonomyLabel(level: AutonomyLevel): string {
  return level.replace(/_/g, " ");
}
