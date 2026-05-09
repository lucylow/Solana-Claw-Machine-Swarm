import {
  AUTONOMY_MODE_PRESETS,
  AUTONOMY_PROFILES,
  AUTONOMY_SPECTRUM,
  type AgentDecisionRecord,
  type AutonomyLevel,
  type DecisionNarrative,
  type MemoryUsageRecord,
  type PolicyGateResult,
  type ReflectionRecord,
  type RiskLevel,
} from "@shared/autonomy";
import { nanoid } from "nanoid";

type PolicyEvaluationInput = {
  autonomyLevel: AutonomyLevel;
  confidence: number;
  riskLevel: RiskLevel;
  valueAtRisk?: number;
  userPreference?: {
    forceManualReview?: boolean;
    requireSignatureAboveValue?: number;
  };
};

function policyActionFromRisk(
  riskLevel: RiskLevel,
): PolicyGateResult["requiredAction"] {
  switch (riskLevel) {
    case "critical":
      return "review";
    case "high":
      return "confirm";
    case "medium":
      return "adjust_plan";
    case "low":
    default:
      return "none";
  }
}

export function evaluatePolicyGate(
  input: PolicyEvaluationInput,
): PolicyGateResult {
  const profile = AUTONOMY_PROFILES[input.autonomyLevel];
  const requireSignature =
    typeof input.userPreference?.requireSignatureAboveValue === "number" &&
    (input.valueAtRisk ?? 0) >= input.userPreference.requireSignatureAboveValue;

  if (input.userPreference?.forceManualReview) {
    return {
      allowed: false,
      status: "review_required",
      reason: "Workspace preference requires manual review.",
      policyId: "workspace.manual_review",
      policyName: "Workspace Manual Review",
      riskLevel: input.riskLevel,
      requiredAction: "review",
      metadata: { forcedByUserPreference: true },
    };
  }

  if (requireSignature || profile.requiresWalletSignature) {
    return {
      allowed: false,
      status: "signature_required",
      reason: "Action requires a wallet signature before execution.",
      policyId: "wallet.signature.required",
      policyName: "Signature Gate",
      riskLevel: input.riskLevel,
      requiredAction: "sign",
      metadata: { valueAtRisk: input.valueAtRisk ?? 0 },
    };
  }

  if (input.riskLevel === "critical" && input.confidence < 80) {
    return {
      allowed: false,
      status: "blocked",
      reason: "Critical-risk action blocked due to low confidence.",
      policyId: "risk.critical.confidence",
      policyName: "Critical Confidence Gate",
      riskLevel: "critical",
      requiredAction: "review",
      metadata: { confidence: input.confidence },
    };
  }

  if (profile.requiresHumanApproval && input.riskLevel !== "low") {
    return {
      allowed: false,
      status: "review_required",
      reason: "Human approval is required for this autonomy level.",
      policyId: "autonomy.human_approval",
      policyName: "Autonomy Human Gate",
      riskLevel: input.riskLevel,
      requiredAction: policyActionFromRisk(input.riskLevel),
      metadata: { autonomyLevel: input.autonomyLevel },
    };
  }

  if (profile.requiresPolicyCheck) {
    return {
      allowed: true,
      status: input.riskLevel === "low" ? "auto_allowed" : "approved",
      reason: "Policy check passed.",
      policyId: "policy.default",
      policyName: "Default Runtime Policy",
      riskLevel: input.riskLevel,
      requiredAction: "none",
      metadata: { confidence: input.confidence },
    };
  }

  return {
    allowed: true,
    status: "auto_allowed",
    reason: "Execution is fully autonomous.",
    policyId: "autonomy.full",
    policyName: "Full Autonomy",
    riskLevel: input.riskLevel,
    requiredAction: "none",
    metadata: { confidence: input.confidence },
  };
}

type ScoreInputs = {
  independentDecisionRate: number;
  manualInterventionRate: number;
  memoryUseRate: number;
  reflectionReuseRate: number;
  policyPassRate: number;
  proofCompleteness: number;
  successRate: number;
  confidenceCalibration: number;
};

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateAutonomyScore(inputs: ScoreInputs) {
  const score = clamp100(
    inputs.independentDecisionRate * 0.2 +
      (100 - inputs.manualInterventionRate) * 0.16 +
      inputs.memoryUseRate * 0.12 +
      inputs.reflectionReuseRate * 0.12 +
      inputs.policyPassRate * 0.1 +
      inputs.proofCompleteness * 0.1 +
      inputs.successRate * 0.1 +
      inputs.confidenceCalibration * 0.1,
  );

  const label =
    score < 35
      ? "automation"
      : score < 55
        ? "assisted"
        : score < 80
          ? "agency"
          : "autonomous";

  return {
    score,
    label,
    trend: "stable" as const,
    explanation:
      label === "autonomous"
        ? "The runtime is operating with minimal intervention and complete proof trails."
        : label === "agency"
          ? "The runtime makes meaningful choices while staying policy-governed."
          : label === "assisted"
            ? "The runtime contributes planning decisions but still needs regular supervision."
            : "The runtime mostly automates user-selected steps.",
  };
}

export function resolveAutonomyLevelForMode(
  mode: "automation" | "meaningful_agency" | "full_autonomy",
): AutonomyLevel {
  return (
    AUTONOMY_MODE_PRESETS.find((preset) => preset.mode === mode)
      ?.defaultLevel ?? "meaningful_agency"
  );
}

export function nextAutonomyLevel(level: AutonomyLevel): AutonomyLevel {
  const index = AUTONOMY_SPECTRUM.indexOf(level);
  if (index < 0 || index === AUTONOMY_SPECTRUM.length - 1) return level;
  return AUTONOMY_SPECTRUM[index + 1]!;
}

export function createDecisionDraft(input: {
  agentId: string;
  decisionType: AgentDecisionRecord["decisionType"];
  autonomyLevel: AutonomyLevel;
  decisionScope: string;
  options: AgentDecisionRecord["optionsConsidered"];
  selectedOptionId: string;
  rationale: string;
  confidence: number;
  policyStatus: AgentDecisionRecord["policyStatus"];
  humanOverride?: boolean;
  memoryUsed?: string[];
  metadata?: Record<string, unknown>;
}): Omit<AgentDecisionRecord, "createdAt"> {
  return {
    id: nanoid(16),
    agentId: input.agentId,
    decisionType: input.decisionType,
    autonomyLevel: input.autonomyLevel,
    decisionScope: input.decisionScope,
    optionsConsidered: input.options,
    selectedOptionId: input.selectedOptionId,
    rationale: input.rationale,
    confidence: clamp100(input.confidence),
    policyStatus: input.policyStatus,
    humanOverride: input.humanOverride,
    memoryUsed: input.memoryUsed ?? [],
    metadata: input.metadata ?? {},
  };
}

export function createDecisionNarrative(
  decisionId: string,
  rationale: string,
  options: AgentDecisionRecord["optionsConsidered"],
  confidenceNotes: string,
  policyNotes: string,
  memoryNotes: string,
): Omit<DecisionNarrative, "createdAt"> {
  return {
    id: nanoid(16),
    decisionId,
    fullText: rationale,
    summary: rationale.slice(0, 180),
    optionsConsidered: options.map((option) => ({
      id: option.id,
      label: option.label,
      pros: option.reason ? [option.reason] : [],
      cons: [],
    })),
    confidenceNotes,
    policyNotes,
    memoryNotes,
    checksum: `chk_${nanoid(24)}`,
  };
}

export function createMemoryUsageDraft(input: {
  agentId: string;
  turnId: string;
  memoryIds: string[];
  usedFor: MemoryUsageRecord["usedFor"];
  influence: number;
  result: MemoryUsageRecord["result"];
  runId?: string;
}): Omit<MemoryUsageRecord, "createdAt"> {
  return {
    id: nanoid(16),
    agentId: input.agentId,
    turnId: input.turnId,
    memoryIds: input.memoryIds,
    usedFor: input.usedFor,
    influence: clamp100(input.influence),
    result: input.result,
    metadata: {
      runId: input.runId,
      source: "runtime",
    },
  };
}

export function createReflectionDraft(input: {
  agentId: string;
  runId: string;
  autonomyLevel: AutonomyLevel;
  rootCause: string;
  correctiveAction: string;
  nextAction: string;
  neededHumanInput: boolean;
  blockedByPolicy: boolean;
  improvedLaterRuns?: boolean;
}): Omit<ReflectionRecord, "createdAt"> {
  return {
    id: nanoid(16),
    agentId: input.agentId,
    runId: input.runId,
    autonomyLevel: input.autonomyLevel,
    rootCause: input.rootCause,
    correctiveAction: input.correctiveAction,
    nextAction: input.nextAction,
    neededHumanInput: input.neededHumanInput,
    blockedByPolicy: input.blockedByPolicy,
    improvedLaterRuns: input.improvedLaterRuns,
    metadata: { source: "reflection_engine" },
  };
}
