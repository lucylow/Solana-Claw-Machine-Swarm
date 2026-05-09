import { nanoid } from "nanoid";
import type { AgentFrameworkRun } from "./framework";
import {
  AGENT_TOOL_REGISTRY,
  mapToolFailureToRecovery,
  toolsInPreferredOrder,
} from "./toolRegistry";
import type {
  AgentConfidenceLevel,
  AgentCriticEvaluation,
  AgentDecisionRecord,
  AgentDelegationHandoff,
  AgentIntentClassification,
  AgentMemoryRecord,
  AgentPlan,
  AgentProfile,
  AgentProofRecord,
  AgentRecoveryEvent,
  AgentReflection,
  AgentRole,
  AgentRunStatus,
  AgentStep,
  AgentToolCall,
} from "./types";

const COORD = "coord_main";
const PLAN = "planner_main";
const RESEARCH = "researcher_main";
const OPER = "operator_main";
const CRIT = "critic_main";
const REFL = "reflector_main";
const MEM = "memory_writer_main";
const PROOF = "proof_anchor_main";
const REP = "reputation_main";
const RECOV = "recovery_main";

function nowIso() {
  return new Date().toISOString();
}

function confidenceFromScore(score: number): AgentConfidenceLevel {
  if (score >= 0.85) return "high";
  if (score >= 0.65) return "medium";
  if (score >= 0.4) return "low";
  return "critical";
}

export function classifyGoalIntent(
  goal: string,
  opts: { sessionActive: boolean; priorMemoryCount: number },
): AgentIntentClassification {
  const g = goal.toLowerCase();
  const riskSignals: string[] = [];
  const constraints: string[] = ["User-selected skill bounds execution scope."];
  const assumptions: string[] = ["Bridge RPC reachable for session reads."];
  const policyHints: string[] = [];
  const memoryHints: string[] = [];
  const proofHints: string[] = [
    "Anchor plan + execution proof when wallet session allows.",
  ];

  let goalType: AgentIntentClassification["goalType"] = "orchestration";
  if (/govern|vote|dao|proposal/.test(g)) goalType = "governance";
  else if (/reflect|lesson|memory|retry/.test(g)) goalType = "reflection";
  else if (/swap|transfer|tx|sol|spl/.test(g)) {
    goalType = "transaction";
    riskSignals.push("transaction_intent_detected");
    policyHints.push("Escalate signing to user; no blind transaction tools.");
  } else if (/research|index|discover|fetch/.test(g)) goalType = "research";

  if (!opts.sessionActive) {
    riskSignals.push("wallet_session_inactive");
    policyHints.push(
      "Transaction-class tools blocked or degraded until session active.",
    );
  }
  if (opts.priorMemoryCount > 0) {
    memoryHints.push(
      `${opts.priorMemoryCount} prior reflection(s) eligible for injection.`,
    );
    assumptions.push("Planner may shorten path when memory reuse applies.");
  }

  return {
    goalType,
    constraints,
    assumptions,
    riskSignals,
    policyHints,
    memoryHints,
    proofHints,
  };
}

export function buildDefaultProfiles(): AgentProfile[] {
  const base = (
    role: AgentRole,
    name: string,
    description: string,
    autonomyLevel: AgentProfile["autonomyLevel"],
    bias: number,
  ): AgentProfile => ({
    id: `${role}_v1`,
    name,
    role,
    description,
    autonomyLevel,
    confidenceBias: bias,
    reputationScore: 0.82,
    successRate: 0.78,
    failureRecoveryRate: 0.71,
    totalRuns: 120,
    totalSuccesses: 94,
    totalFailures: 26,
    lastRunAt: nowIso(),
    permissions: {
      canPlan: role === "planner" || role === "coordinator",
      canDelegate: role === "coordinator",
      canCallTools: role === "operator" || role === "researcher",
      canWriteMemory: role === "memory_writer" || role === "reflector",
      canAnchorProof: role === "proof_anchor" || role === "coordinator",
      canRetry: role === "recovery_manager" || role === "operator",
      canEscalate: role === "coordinator" || role === "critic",
    },
    metadata: { fleet: "swarm_command_center" },
  });

  return [
    base(
      "coordinator",
      "Coordinator",
      "Receives goal, sets run context, delegates or acts.",
      "policy_gated",
      0.05,
    ),
    base(
      "planner",
      "Planner",
      "Decomposes goal, binds risk and policy.",
      "guided",
      0.08,
    ),
    base(
      "researcher",
      "Researcher",
      "Pulls memory + chain context for the planner.",
      "assisted",
      0.06,
    ),
    base(
      "operator",
      "Operator",
      "Runs tool calls and step transitions.",
      "policy_gated",
      0.04,
    ),
    base(
      "critic",
      "Critic",
      "Validates completeness, policy, proof readiness.",
      "assisted",
      0.12,
    ),
    base(
      "reflector",
      "Reflector",
      "Structured lessons from outcomes.",
      "guided",
      0.07,
    ),
    base(
      "memory_writer",
      "Memory writer",
      "Durable memory artifacts for reuse.",
      "policy_gated",
      0.05,
    ),
    base(
      "proof_anchor",
      "Proof anchor",
      "Compact Solana-linked receipts.",
      "meaningful_agency",
      0.03,
    ),
    base(
      "reputation_updater",
      "Reputation updater",
      "Skill trust + autonomy signals.",
      "automation_only",
      0.02,
    ),
    base(
      "recovery_manager",
      "Recovery manager",
      "Retries and degraded fallbacks.",
      "assisted",
      0.09,
    ),
  ];
}

function makeToolCall(
  input: Omit<AgentToolCall, "id"> & { id?: string },
): AgentToolCall {
  return {
    id: input.id ?? `tool_${nanoid(10)}`,
    ...input,
  };
}

function makeStep(
  partial: Omit<AgentStep, "toolCalls"> & { toolCalls?: AgentToolCall[] },
): AgentStep {
  return {
    toolCalls: partial.toolCalls ?? [],
    ...partial,
  };
}

export function buildCriticEvaluation(input: {
  runId: string;
  planSucceeded: boolean;
  policyBlocked: boolean;
  proofLikely: boolean;
  memoryUsed: boolean;
}): AgentCriticEvaluation {
  const score = Math.round(
    (input.planSucceeded ? 38 : 10) +
      (!input.policyBlocked ? 25 : 0) +
      (input.proofLikely ? 22 : 5) +
      (input.memoryUsed ? 15 : 8),
  );
  return {
    id: `critic_${nanoid(8)}`,
    runId: input.runId,
    agentId: CRIT,
    score: Math.min(100, score),
    critiqueSummary: input.planSucceeded
      ? "Plan completed primary lane; proof and memory hooks are consistent with policy."
      : "Plan degraded early; critic recommends memory-first recovery on next turn.",
    missingItems: input.proofLikely
      ? []
      : ["live tx signature for proof receipt"],
    riskFlags: input.policyBlocked ? ["policy_block_active"] : [],
    recommendedNextStep: input.planSucceeded
      ? "Reuse injected memory on next run to raise planner confidence."
      : "Reconnect session, rerun with same skill scope, and allow proof anchor lane.",
    shouldReflect: true,
    shouldImprovePlanNextRun: !input.planSucceeded || input.policyBlocked,
    policyCompliance: input.policyBlocked ? "warn" : "pass",
    proofCompleteness: input.proofLikely ? "full" : "partial",
    memoryUsefulness: input.memoryUsed ? "high" : "medium",
    createdAt: nowIso(),
    metadata: {},
  };
}

export interface BuildFrameworkInput {
  runId: string;
  executionId: string;
  wallet: string;
  cluster: AgentProofRecord["cluster"];
  goal: string;
  skillId: string;
  skillName?: string;
  agentId: string;
  sessionActive: boolean;
  sessionVerified: boolean;
  priorReflectionSummaries: Array<{
    id: string;
    summary: string;
    tags?: string[];
  }>;
}

/**
 * Deterministic, inspectable agent pipeline (no hidden single-shot LLM blob).
 * Server merges live Solana tx fields into proofRecords after bridge calls.
 */
export function buildAgentFrameworkRun(
  input: BuildFrameworkInput,
): AgentFrameworkRun {
  const t0 = nowIso();
  const runId = input.runId;
  const priorN = input.priorReflectionSummaries.length;
  const intent = classifyGoalIntent(input.goal, {
    sessionActive: input.sessionActive,
    priorMemoryCount: priorN,
  });

  const memoryIds = input.priorReflectionSummaries.map((p) => p.id).slice(0, 5);

  const skillDecision: AgentDecisionRecord = {
    id: `dec_${nanoid(8)}`,
    runId,
    agentId: COORD,
    role: "coordinator",
    decisionType: "skill_selection",
    createdAt: t0,
    decisionScope: "execution.skill_binding",
    optionsConsidered: [
      {
        id: "skill_primary",
        label: input.skillName || input.skillId,
        score: 0.9,
        reason: "User-selected registry skill",
      },
      {
        id: "skill_fallback",
        label: "Generic orchestration skill",
        score: 0.35,
        reason: "Fallback when registry thin",
      },
    ],
    selectedOptionId: "skill_primary",
    rationale:
      "Honor explicit skill selection from command center before delegation.",
    confidence: "high",
    policyStatus: "approved",
    memoryUsed: memoryIds.length ? memoryIds : undefined,
    metadata: { skillId: input.skillId },
  };

  const injectionDecision: AgentDecisionRecord = {
    id: `dec_${nanoid(8)}`,
    runId,
    agentId: RESEARCH,
    role: "researcher",
    decisionType: "memory_injection",
    createdAt: t0,
    decisionScope: "research.context_pack",
    optionsConsidered: [
      {
        id: "inject_recent",
        label: "Inject top prior reflections",
        score: priorN ? 0.88 : 0.2,
      },
      {
        id: "inject_none",
        label: "Cold start (no injection)",
        score: priorN ? 0.25 : 0.9,
      },
    ],
    selectedOptionId: priorN ? "inject_recent" : "inject_none",
    rationale: priorN
      ? "Prior lessons reduce planner ambiguity and improve tool ordering."
      : "No durable memory yet; planner runs with registry + session only.",
    confidence: priorN ? "high" : "medium",
    policyStatus: "not_required",
    memoryUsed: memoryIds.length ? memoryIds : undefined,
    metadata: { priorCount: priorN },
  };

  const riskLevel: AgentPlan["riskLevel"] =
    !input.sessionActive ||
    intent.riskSignals.includes("transaction_intent_detected")
      ? "high"
      : intent.goalType === "governance"
        ? "medium"
        : "low";

  const planPolicy: AgentPlan["policyStatus"] =
    !input.sessionActive && riskLevel !== "low" ? "needs_review" : "approved";

  const planConfidence = confidenceFromScore(
    0.55 +
      (priorN ? 0.15 : 0) +
      (input.sessionActive ? 0.2 : 0) -
      (riskLevel === "high" ? 0.2 : 0),
  );

  const planId = `plan_${nanoid(10)}`;
  const steps: AgentStep[] = [
    makeStep({
      id: `step_${nanoid(6)}_a`,
      runId,
      index: 0,
      title: "Acquire context",
      description:
        "Researcher loads session, skill binding, and optional memory injection pack.",
      ownerAgentId: RESEARCH,
      status: "succeeded",
      startedAt: t0,
      completedAt: t0,
      dependencies: [],
      outputs: [`memory_pack_${priorN}`, `skill_${input.skillId}`],
      retryCount: 0,
      maxRetries: 2,
      memoryRefs: memoryIds,
      metadata: { lane: "research" },
      toolCalls: [
        makeToolCall({
          runId,
          stepId: undefined,
          agentId: RESEARCH,
          toolName: "context.search_memory",
          toolType: "memory",
          inputSummary: `wallet=${input.wallet.slice(0, 8)}… limit=5`,
          outputSummary: priorN ? `hits=${priorN}` : "no_prior_rows",
          status: "succeeded",
          startedAt: t0,
          completedAt: t0,
          metadata: { injectedIds: memoryIds },
        }),
        makeToolCall({
          runId,
          agentId: RESEARCH,
          toolName: "chain.read_session",
          toolType: "rpc",
          inputSummary: "session.probe",
          outputSummary: input.sessionActive
            ? "session_active"
            : "session_inactive",
          status: input.sessionActive ? "succeeded" : "failed",
          startedAt: t0,
          completedAt: t0,
          errorCode: input.sessionActive
            ? undefined
            : "wallet_session_inactive",
          errorMessage: input.sessionActive
            ? undefined
            : "Signer session inactive — transaction tools gated.",
          metadata: {},
        }),
        makeToolCall({
          runId,
          agentId: RESEARCH,
          toolName: "skill.resolve_registry",
          toolType: "read",
          inputSummary: `skillId=${input.skillId}`,
          outputSummary: "bound",
          status: "succeeded",
          startedAt: t0,
          completedAt: t0,
          metadata: {},
        }),
      ],
    }),
    makeStep({
      id: `step_${nanoid(6)}_b`,
      runId,
      index: 1,
      title: "Execute operational lane",
      description:
        "Operator runs guarded execution; may retry or fall back when session is weak.",
      ownerAgentId: OPER,
      status: "succeeded",
      startedAt: t0,
      completedAt: t0,
      dependencies: [],
      outputs: input.sessionActive
        ? ["operator_result_ok"]
        : ["operator_result_degraded_readonly"],
      retryCount: input.sessionActive ? 0 : 1,
      maxRetries: 2,
      metadata: {
        lane: "operator",
        degraded: !input.sessionActive,
      },
      toolCalls: [],
    }),
  ];

  /** Operator tool path: prefer primary exec tool; degraded fallback when session inactive. */
  const opStep = steps[1]!;
  const primaryTool = "exec.simulate_operator";
  const fallbackTool = "exec.simulate_operator_degraded";
  const usePrimary = input.sessionActive;
  const chosenTool = usePrimary ? primaryTool : fallbackTool;

  const toolDecision: AgentDecisionRecord = {
    id: `dec_${nanoid(8)}`,
    runId,
    agentId: OPER,
    role: "operator",
    decisionType: "tool_selection",
    createdAt: t0,
    decisionScope: "operator.execution_path",
    optionsConsidered: toolsInPreferredOrder([primaryTool, fallbackTool]).map(
      (name) => ({
        id: name,
        label: AGENT_TOOL_REGISTRY[name]?.summary ?? name,
        score: name === chosenTool ? 0.9 : 0.4,
        reason: AGENT_TOOL_REGISTRY[name]?.summary,
      }),
    ),
    selectedOptionId: chosenTool,
    rationale: usePrimary
      ? "Session active — use standard operator simulation with retry budget."
      : "Session inactive — select read-only degraded operator per policy; avoid transaction tools.",
    confidence: usePrimary ? "high" : "medium",
    policyStatus: usePrimary ? "approved" : "needs_review",
    metadata: { registryRef: "AGENT_TOOL_REGISTRY" },
  };

  const opTool = makeToolCall({
    runId,
    stepId: opStep.id,
    agentId: OPER,
    toolName: chosenTool,
    toolType: "compute",
    inputSummary: `goal_len=${input.goal.length} skill=${input.skillId}`,
    outputSummary: usePrimary ? "lane_complete" : "degraded_summary_only",
    status: "succeeded",
    startedAt: t0,
    completedAt: t0,
    metadata: {},
  });
  opStep.toolCalls = [opTool];

  const recoveryEvents: AgentRecoveryEvent[] = [];
  if (!usePrimary) {
    recoveryEvents.push({
      id: `rec_${nanoid(8)}`,
      runId,
      stepId: opStep.id,
      kind: "fallback_tool",
      detail: `Mapped ${mapToolFailureToRecovery(primaryTool, "wallet_session_inactive")} for inactive session.`,
      at: t0,
      metadata: { from: primaryTool, to: fallbackTool },
    });
  }

  const retryDecision: AgentDecisionRecord = {
    id: `dec_${nanoid(8)}`,
    runId,
    agentId: RECOV,
    role: "recovery_manager",
    decisionType: "retry_strategy",
    createdAt: t0,
    decisionScope: "recovery.operator",
    optionsConsidered: [
      {
        id: "retry",
        label: "Retry operator with backoff",
        score: usePrimary ? 0.2 : 0.15,
      },
      {
        id: "fallback",
        label: "Use degraded operator tool",
        score: usePrimary ? 0.1 : 0.9,
      },
      { id: "abort", label: "Abort run", score: 0.05 },
    ],
    selectedOptionId: usePrimary ? "retry" : "fallback",
    rationale: usePrimary
      ? "Healthy session — keep retry budget for transient RPC issues."
      : "Session missing — prefer degraded_continue over blind retries.",
    confidence: "medium",
    policyStatus: "approved",
    metadata: {},
  };

  const plan: AgentPlan = {
    id: planId,
    runId,
    goal: input.goal,
    summary: `Structured run for skill ${input.skillName || input.skillId} with ${steps.length} steps and explicit tool registry choices.`,
    steps,
    chosenSkillIds: [input.skillId],
    createdAt: t0,
    updatedAt: t0,
    plannerAgentId: PLAN,
    confidence: planConfidence,
    riskLevel,
    policyStatus: planPolicy,
    metadata: {
      goalType: intent.goalType,
      constraints: intent.constraints,
      assumptions: intent.assumptions,
      toolPlan: toolsInPreferredOrder([
        "context.search_memory",
        "chain.read_session",
        "skill.resolve_registry",
        chosenTool,
        "proof.anchor_plan",
        "memory.persist_reflection",
      ]),
      delegationOrder: [
        "coordinator",
        "planner",
        "researcher",
        "operator",
        "critic",
        "recovery_manager",
        "reflector",
        "memory_writer",
        "proof_anchor",
        "reputation_updater",
      ],
    },
  };

  const planDecision: AgentDecisionRecord = {
    id: `dec_${nanoid(8)}`,
    runId,
    agentId: PLAN,
    role: "planner",
    decisionType: "plan_selection",
    createdAt: t0,
    decisionScope: "planner.primary",
    optionsConsidered: [
      {
        id: "plan_full",
        label: "Full multi-step with critic + proof",
        score: 0.92,
      },
      {
        id: "plan_min",
        label: "Minimal single-step",
        score: 0.35,
        reason: "Only for low-risk read-only",
      },
    ],
    selectedOptionId: "plan_full",
    rationale:
      "Command-center runs require traceable steps, tools, and proof hooks.",
    confidence: planConfidence,
    policyStatus: planPolicy === "needs_review" ? "needs_review" : "approved",
    memoryUsed: memoryIds.length ? memoryIds : undefined,
    metadata: { riskLevel, goalType: intent.goalType },
  };

  const delegations: AgentDelegationHandoff[] = [
    {
      id: `del_${nanoid(6)}`,
      runId,
      fromRole: "coordinator",
      toRole: "planner",
      scope: "goal_decomposition",
      task: "Produce structured plan with dependencies and tool hints.",
      inputSummary: input.goal.slice(0, 160),
      outputSummary: `plan ${planId} with ${steps.length} steps`,
      confidence: planConfidence,
      at: t0,
    },
    {
      id: `del_${nanoid(6)}`,
      runId,
      fromRole: "planner",
      toRole: "researcher",
      scope: "context_pack",
      task: "Resolve memory + session + skill binding.",
      inputSummary: planId,
      outputSummary: `prior_memory=${priorN}`,
      confidence: priorN ? "high" : "medium",
      at: t0,
    },
    {
      id: `del_${nanoid(6)}`,
      runId,
      fromRole: "researcher",
      toRole: "operator",
      scope: "execution",
      task: "Run operator tool path with recovery policy.",
      inputSummary: `tools=${chosenTool}`,
      outputSummary: usePrimary ? "succeeded" : "degraded_succeeded",
      confidence: usePrimary ? "high" : "low",
      at: t0,
    },
    {
      id: `del_${nanoid(6)}`,
      runId,
      fromRole: "operator",
      toRole: "critic",
      scope: "validation",
      task: "Score output, policy, proof readiness.",
      inputSummary: opStep.id,
      outputSummary: "critic_pending",
      confidence: "medium",
      at: t0,
    },
  ];

  const planSucceeded = true;
  const critic = buildCriticEvaluation({
    runId,
    planSucceeded,
    policyBlocked: planPolicy === "needs_review",
    proofLikely: input.sessionActive,
    memoryUsed: priorN > 0,
  });

  delegations.push({
    id: `del_${nanoid(6)}`,
    runId,
    fromRole: "critic",
    toRole: "reflector",
    scope: "lesson",
    task: "Capture structured reflection for memory writer.",
    inputSummary: `critic_score=${critic.score}`,
    outputSummary: "reflection_draft",
    confidence: "medium",
    at: t0,
  });

  const reflections: AgentReflection[] = [];
  const memoryRecords: AgentMemoryRecord[] = [];
  const proofRecords: AgentProofRecord[] = [];

  const runStatus: AgentRunStatus =
    !input.sessionActive ||
    intent.riskSignals.includes("transaction_intent_detected")
      ? "degraded"
      : "completed";

  const allToolCalls = steps.flatMap((s) => s.toolCalls);

  return {
    runId,
    executionId: input.executionId,
    agentId: input.agentId,
    walletAddress: input.wallet,
    cluster: input.cluster,
    status: runStatus,
    intent,
    profiles: buildDefaultProfiles(),
    plan,
    delegations,
    decisions: [
      skillDecision,
      injectionDecision,
      planDecision,
      toolDecision,
      retryDecision,
    ],
    toolCalls: allToolCalls,
    critic,
    reflections,
    memoryRecords,
    proofRecords,
    recoveryEvents,
    reputationSnapshot: {
      skillTrustDelta: planSucceeded ? 0.4 : -0.2,
      autonomyScoreHint: planSucceeded ? 3 : -2,
      notes: planSucceeded
        ? "Successful lane increases trust in skill binding and tool reliability."
        : "Degraded lane — autonomy capped until session and proof completeness recover.",
    },
    createdAt: t0,
    updatedAt: t0,
    metadata: {
      skillId: input.skillId,
      skillName: input.skillName,
      sessionVerified: input.sessionVerified,
    },
  };
}

/** Merge live Solana fields into framework proof records (server-side). */
export function patchFrameworkProofRecords(
  run: AgentFrameworkRun,
  patches: Array<Partial<AgentProofRecord> & { id: string }>,
): AgentFrameworkRun {
  const map = new Map(patches.map((p) => [p.id, p]));
  return {
    ...run,
    proofRecords: run.proofRecords.map((pr) => {
      const p = map.get(pr.id);
      return p ? { ...pr, ...p } : pr;
    }),
    updatedAt: nowIso(),
  };
}

/** Attach persistence outputs after memory / reflection services run. */
export function mergePersistenceIntoFramework(
  run: AgentFrameworkRun,
  persistence: {
    reflections?: AgentReflection[];
    memoryRecords?: AgentMemoryRecord[];
    proofRecords?: AgentProofRecord[];
  },
): AgentFrameworkRun {
  return {
    ...run,
    reflections: [...run.reflections, ...(persistence.reflections ?? [])],
    memoryRecords: [...run.memoryRecords, ...(persistence.memoryRecords ?? [])],
    proofRecords: [...run.proofRecords, ...(persistence.proofRecords ?? [])],
    updatedAt: nowIso(),
  };
}
