import type { AutonomyLevel } from "@shared/autonomy";
import {
  CLAW_MACHINE_CLUSTER,
  CLAW_MACHINE_ECOSYSTEM,
  CLAW_SKILL_SEEDS,
} from "@shared/clawMachineMock";
import type {
  SwarmAgentNode,
  SwarmExecutionEvent,
  SwarmProofGraphEdge,
  SwarmProofGraphNode,
  SwarmMemoryRecord,
  SwarmMissionRun,
  SwarmPolicyGate,
  SwarmReceipt,
  SwarmReflection,
  SwarmRuntimeState,
  SwarmSkill,
} from "@shared/swarm";
import type { SolanaZeroGLink } from "@shared/zerog";

const SKILL_RESEARCH = "skill_0x9a44f2";
const SKILL_ORCHESTRATION = "skill_multi_planner";
const SKILL_REFLECTION = "skill_reflection_gen";

const CATEGORY_AUTONOMY: Record<string, AutonomyLevel> = {
  research: "meaningful_agency",
  safety: "policy_gated",
  orchestration: "near_autonomous",
  finance: "policy_gated",
  memory: "meaningful_agency",
  business: "guided",
  devtools: "policy_gated",
  reasoning: "guided",
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function fakeSignature() {
  const token = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from(
    { length: 88 },
    () => token[Math.floor(Math.random() * token.length)],
  ).join("");
}

function fakeHash(label: string) {
  return `${label}_${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
}

function fakeRef(namespace: string) {
  return `zg://${namespace}/${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
}

function shortWallet(seed: string) {
  return `${seed.slice(0, 4)}...${seed.slice(-4)}`;
}

function createBaseSkills(): SwarmSkill[] {
  return CLAW_SKILL_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    category: seed.category,
    description: seed.description,
    authorWallet: seed.authorWallet,
    version: seed.version,
    reputation: seed.reputation,
    usageCount: seed.usageCount,
    successRate: seed.successRate,
    autonomyLevel: CATEGORY_AUTONOMY[seed.category] ?? "policy_gated",
    policyStatus: "approved" as const,
    proofCount: seed.proofCount,
    tags: seed.tags,
  }));
}

function createAgents(): SwarmAgentNode[] {
  const specs: Array<{
    id: string;
    name: string;
    role: SwarmAgentNode["role"];
    reputation: number;
    memoryCount: number;
    proofCount: number;
    level: AutonomyLevel;
  }> = [
    {
      id: "planner",
      name: "Planner-01",
      role: "planner",
      reputation: 79,
      memoryCount: 41,
      proofCount: 227,
      level: "policy_gated",
    },
    {
      id: "researcher",
      name: "Researcher-02",
      role: "researcher",
      reputation: 76,
      memoryCount: 37,
      proofCount: 201,
      level: "guided",
    },
    {
      id: "operator",
      name: "Operator-03",
      role: "operator",
      reputation: 88,
      memoryCount: 54,
      proofCount: 298,
      level: "meaningful_agency",
    },
    {
      id: "critic",
      name: "Critic-04",
      role: "critic",
      reputation: 82,
      memoryCount: 62,
      proofCount: 265,
      level: "policy_gated",
    },
    {
      id: "coordinator",
      name: "Coordinator-05",
      role: "coordinator",
      reputation: 85,
      memoryCount: 47,
      proofCount: 304,
      level: "near_autonomous",
    },
  ];

  return specs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    role: spec.role,
    wallet: shortWallet(fakeSignature()),
    reputation: spec.reputation,
    memoryCount: spec.memoryCount,
    proofCount: spec.proofCount,
    autonomyLevel: spec.level,
    status: "idle",
  }));
}

export function createInitialRuntime(
  walletAddress?: string,
): SwarmRuntimeState {
  return {
    walletAddress,
    cluster: CLAW_MACHINE_CLUSTER,
    ecosystem: CLAW_MACHINE_ECOSYSTEM,
    autonomyLevel: "policy_gated",
    autonomyScore: 62,
    proofCompletionRate: 71,
    memoryGrowth: 0,
    activeAgents: 5,
    plansCompleted: 3,
    successfulExecutions: 2,
    reflectionsGenerated: 0,
    policyApprovals: 7,
    skills: createBaseSkills(),
    agents: createAgents(),
    runs: [],
    memories: [],
    reflections: [],
    receipts: [],
    zeroGLinks: [],
    zeroGBridge: {
      enabled: true,
      sourceChain: "Solana",
      destinationChain: "0G",
      tokenSymbol: "0G",
      status: "idle",
      provider: "XSwap (per official 0G docs)",
      mode: "mock",
      notes:
        "Bridge-aware stub toward 0G Chain (chainId 16661). No live bridge API unless mode is live. Do not trust exchange token labels as canonical.",
      version: "bridge-v1",
      lastUpdatedAt: new Date().toISOString(),
    },
    zeroGStatus: {
      enabled: true,
      mode: "demo",
      storageStatus: "healthy",
      computeStatus: "healthy",
      daStatus: "healthy",
      bridgeStatus: "idle",
      storageUrl: "https://storage.demo.0g.ai/v1",
      computeUrl: "https://compute.demo.0g.ai/v1",
      daUrl: "https://da.demo.0g.ai/v1",
      explorerUrl: "https://explorer.demo.0g.ai",
    },
    proofGraph: {
      nodes: [],
      edges: [],
    },
    policyEvents: [],
  };
}

function createPolicyPack(needsReview: boolean): SwarmPolicyGate[] {
  return [
    {
      id: uid("policy_scope"),
      label: "Scope policy gate",
      status: "approved",
      riskLevel: "medium",
      reason: "Goal stays inside approved domain and wallet authority.",
      requiredAction: "none",
    },
    {
      id: uid("policy_conf"),
      label: "Confidence threshold gate",
      status: needsReview ? "review_required" : "approved",
      riskLevel: needsReview ? "high" : "low",
      reason: needsReview
        ? "Initial confidence under 70 triggers reflective fallback."
        : "Confidence over policy threshold, autonomous execution allowed.",
      requiredAction: needsReview ? "adjust_plan" : "none",
    },
    {
      id: uid("policy_sig"),
      label: "Receipt signature gate",
      status: "signature_required",
      riskLevel: "low",
      reason: "Anchor write requires wallet signature for proof finality.",
      requiredAction: "sign",
    },
  ];
}

export function executeAutonomousCycle(
  prev: SwarmRuntimeState,
  goal: string,
): SwarmRuntimeState {
  const runId = uid("run");
  const now = new Date();
  const reusedMemory = prev.memories.length > 0;
  const selectedSkills = reusedMemory
    ? [SKILL_RESEARCH, SKILL_ORCHESTRATION]
    : [SKILL_RESEARCH, SKILL_ORCHESTRATION, SKILL_REFLECTION];
  const baseConfidence = reusedMemory ? 81 : 61;
  const fails = !reusedMemory;
  const policy = createPolicyPack(fails);

  const plan = {
    id: uid("plan"),
    goal,
    rationale: reusedMemory
      ? "Memory-linked failure patterns suggest direct execution path with one guarded retry."
      : "No prior memory found, planner selects critic fallback and conservative policy gates.",
    confidence: baseConfidence,
    generatedAt: now.toISOString(),
    steps: [
      {
        id: uid("step"),
        title: "Acquire context",
        detail: "Researcher aggregates onchain/offchain signals for planning.",
        ownerAgentId: "researcher",
        requiredSkillIds: [SKILL_RESEARCH],
        status: "success" as const,
        confidence: baseConfidence - 4,
      },
      {
        id: uid("step"),
        title: "Execute operational step",
        detail: "Operator executes action with policy-aware retries.",
        ownerAgentId: "operator",
        requiredSkillIds: [SKILL_ORCHESTRATION],
        status: fails ? ("failed" as const) : ("success" as const),
        confidence: baseConfidence,
      },
      {
        id: uid("step"),
        title: "Anchor receipts",
        detail: "Coordinator anchors proof chain and verifies links.",
        ownerAgentId: "coordinator",
        requiredSkillIds: [SKILL_ORCHESTRATION],
        status: "success" as const,
        confidence: baseConfidence + 6,
      },
    ],
  };

  const storageRef = fakeRef("storage/artifacts");
  const computeRef = fakeRef("compute/jobs");
  const daRef = fakeRef("da/records");

  const receiptDecision: SwarmReceipt = {
    id: uid("receipt"),
    kind: "decision",
    runId,
    label: "Skill and plan decision receipt",
    txSignature: fakeSignature(),
    receiptHash: fakeHash("decision"),
    account: shortWallet(fakeSignature()),
    linkedReceiptIds: [],
    createdAt: now.toISOString(),
    explorerUrl: `https://explorer.solana.com/tx/${fakeSignature()}?cluster=${prev.cluster}`,
    zeroGStorageRef: storageRef,
  };

  const receiptExecution: SwarmReceipt = {
    id: uid("receipt"),
    kind: "execution",
    runId,
    label: fails ? "Execution failure receipt" : "Execution success receipt",
    txSignature: fakeSignature(),
    receiptHash: fakeHash("execution"),
    account: shortWallet(fakeSignature()),
    linkedReceiptIds: [receiptDecision.id],
    createdAt: new Date(now.getTime() + 2_000).toISOString(),
    explorerUrl: `https://explorer.solana.com/tx/${fakeSignature()}?cluster=${prev.cluster}`,
    zeroGComputeRef: computeRef,
  };

  const receiptProof: SwarmReceipt = {
    id: uid("receipt"),
    kind: "proof",
    runId,
    label: "Proof anchor receipt",
    txSignature: fakeSignature(),
    receiptHash: fakeHash("proof"),
    account: shortWallet(fakeSignature()),
    linkedReceiptIds: [receiptDecision.id, receiptExecution.id],
    createdAt: new Date(now.getTime() + 4_000).toISOString(),
    explorerUrl: `https://explorer.solana.com/tx/${fakeSignature()}?cluster=${prev.cluster}`,
    zeroGStorageRef: storageRef,
    zeroGComputeRef: computeRef,
    zeroGAvailabilityRef: daRef,
  };

  const reflection: SwarmReflection | undefined = fails
    ? {
        id: uid("reflection"),
        runId,
        rootCause:
          "Planner used stale market window, causing operator mismatch on execution target.",
        correctiveAdvice:
          "Inject recent-window guard and prioritize low-latency source memory before operator handoff.",
        nextAction:
          "Re-run with memory injection and critic-approved retry strategy.",
        createdAt: new Date(now.getTime() + 3_000).toISOString(),
        confidenceDelta: 16,
        reusable: true,
        receiptId: receiptExecution.id,
      }
    : {
        id: uid("reflection"),
        runId,
        rootCause:
          "No blocking failure. Reflection confirms memory-injected routing improved alignment.",
        correctiveAdvice:
          "Promote successful route as preferred pattern for similar goals.",
        nextAction: "Increase autonomy confidence budget for this task family.",
        createdAt: new Date(now.getTime() + 3_000).toISOString(),
        confidenceDelta: 7,
        reusable: true,
        receiptId: receiptExecution.id,
      };

  const memory: SwarmMemoryRecord = {
    id: uid("memory"),
    runId,
    sourceFailure: fails
      ? "Execution failed after policy-approved first attempt."
      : "Execution succeeded with memory-guided retry suppression.",
    reflectionId: reflection.id,
    correctiveAdvice: reflection.correctiveAdvice,
    memoryInfluence: fails ? 42 : 84,
    confidenceBefore: baseConfidence,
    confidenceAfter: baseConfidence + reflection.confidenceDelta,
    reusedInRunIds: fails ? [] : [runId],
    proofReceiptId: receiptProof.id,
    createdAt: new Date(now.getTime() + 3_500).toISOString(),
  };

  const zeroGLink: SolanaZeroGLink = {
    id: uid("zg_link"),
    subjectType: "reflection",
    subjectId: reflection.id,
    solanaReceiptId: receiptProof.id,
    solanaTxSignature: receiptProof.txSignature,
    solanaAccount: receiptProof.account,
    zeroGStorageRef: storageRef,
    zeroGComputeRef: computeRef,
    zeroGAvailabilityRef: daRef,
    contentHash: fakeHash("content"),
    summaryHash: receiptProof.receiptHash,
    createdAt: new Date(now.getTime() + 4_100).toISOString(),
    status: fails ? "linked" : "verified",
    bridgeState: {
      enabled: true,
      sourceChain: "Solana",
      destinationChain: "0G",
      tokenSymbol: "0G",
      status: fails ? "pending" : "confirmed",
      txHash: `0x${fakeHash("bridge").replaceAll("_", "").slice(0, 64)}`,
      explorerUrl: "https://explorer.demo.0g.ai/bridge/latest",
      provider: "XSwap (per official 0G docs)",
      lastUpdatedAt: new Date(now.getTime() + 3_700).toISOString(),
      notes: fails
        ? "Mock bridge pending — not a claim about real token custody."
        : "Mock bridge confirmed — demo only unless live mode is configured.",
      mode: "mock",
      version: "bridge-v1",
    },
  };

  const events: SwarmExecutionEvent[] = [
    {
      id: uid("evt"),
      phase: "wallet",
      title: "Wallet authority checked",
      detail: "Connected wallet scoped as signer for policy-gated run.",
      status: "success" as const,
      timestamp: now.toISOString(),
      trace: ["wallet.connect", "session.verify", "authority.lock"],
    },
    {
      id: uid("evt"),
      phase: "goal",
      title: "Mission objective accepted",
      detail: goal,
      status: "success" as const,
      timestamp: new Date(now.getTime() + 500).toISOString(),
      trace: ["goal.parse", "goal.score", "goal.accept"],
    },
    {
      id: uid("evt"),
      phase: "skill-selection",
      title: "Skills selected by planner",
      detail: selectedSkills.join(", "),
      status: "success" as const,
      timestamp: new Date(now.getTime() + 900).toISOString(),
      skillId: selectedSkills[0],
      confidence: baseConfidence,
      proofReceiptId: receiptDecision.id,
      trace: ["skills.rank", "skills.compare", "skills.select"],
    },
    {
      id: uid("evt"),
      phase: "planning",
      title: "Execution plan generated",
      detail: plan.rationale,
      status: "success" as const,
      timestamp: new Date(now.getTime() + 1_300).toISOString(),
      confidence: plan.confidence,
      trace: ["plan.generate", "plan.score", "plan.freeze"],
    },
    {
      id: uid("evt"),
      phase: "policy-check",
      title: "Policy checks completed",
      detail: policy.map((item) => `${item.label}: ${item.status}`).join(" | "),
      status: fails ? ("running" as const) : ("success" as const),
      timestamp: new Date(now.getTime() + 1_700).toISOString(),
      policyGateId: policy[1]?.id,
      trace: ["policy.risk", "policy.confidence", "policy.signature"],
    },
    {
      id: uid("evt"),
      phase: "orchestration",
      title: "Multi-agent orchestration engaged",
      detail: "Planner delegated to researcher, operator, and critic lanes.",
      status: "success" as const,
      timestamp: new Date(now.getTime() + 2_000).toISOString(),
      trace: ["orchestrator.assign", "lanes.spawn", "coordination.start"],
    },
    {
      id: uid("evt"),
      phase: "execution",
      title: fails ? "Execution mismatch detected" : "Execution completed",
      detail: fails
        ? "Operator step failed with stale context window."
        : "Operator completed all steps with memory-aware route.",
      status: fails ? ("failed" as const) : ("success" as const),
      timestamp: new Date(now.getTime() + 2_400).toISOString(),
      proofReceiptId: receiptExecution.id,
      trace: ["tool.run", "tool.retry", "tool.result"],
    },
    {
      id: uid("evt"),
      phase: fails ? "failure" : "reflection",
      title: fails ? "Failure escalated to critic" : "Reflection generated",
      detail: reflection.rootCause,
      status: fails ? ("failed" as const) : ("success" as const),
      timestamp: new Date(now.getTime() + 2_800).toISOString(),
      trace: ["critic.root-cause", "critic.advice", "critic.next-action"],
    },
    {
      id: uid("evt"),
      phase: "memory-write",
      title: "Memory promoted",
      detail: "Corrective advice stored as reusable memory for future runs.",
      status: "success" as const,
      timestamp: new Date(now.getTime() + 3_200).toISOString(),
      trace: ["memory.rank", "memory.persist", "memory.link"],
    },
    {
      id: uid("evt"),
      phase: "proof-anchor",
      title: "Solana proof anchored",
      detail:
        "Decision, execution, reflection, and memory linked in one receipt chain.",
      status: "success" as const,
      timestamp: new Date(now.getTime() + 3_600).toISOString(),
      proofReceiptId: receiptProof.id,
      trace: ["anchor.build", "anchor.submit", "anchor.verify"],
    },
    {
      id: uid("evt"),
      phase: "completed",
      title: fails
        ? "Run completed with learning"
        : "Run completed and improved",
      detail: fails
        ? "System converted failure into reflection + memory + proof."
        : "System reused memory to improve confidence and reduce retries.",
      status: "success" as const,
      timestamp: new Date(now.getTime() + 4_000).toISOString(),
      trace: ["run.finalize", "metrics.update", "autonomy.update"],
    },
  ];

  const run: SwarmMissionRun = {
    id: runId,
    goal,
    createdAt: now.toISOString(),
    endedAt: new Date(now.getTime() + 4_000).toISOString(),
    status: fails ? "failed" : "success",
    autonomyScoreBefore: prev.autonomyScore,
    autonomyScoreAfter: prev.autonomyScore + (fails ? 4 : 8),
    selectedSkillIds: selectedSkills,
    plan,
    policy,
    events,
    reflection,
    memoryWrite: memory,
    proofReceiptIds: [receiptDecision.id, receiptExecution.id, receiptProof.id],
    zeroGLinkId: zeroGLink.id,
  };

  const proofGraphNodes: SwarmProofGraphNode[] = [
    {
      id: "wallet",
      label: "Solana wallet",
      type: "wallet",
      status: "verified",
      ref: prev.walletAddress || "preview",
    },
    {
      id: "skill",
      label: "Skill selection",
      type: "skill",
      status: "verified",
      ref: selectedSkills.join(","),
    },
    {
      id: "plan",
      label: "Plan artifact",
      type: "plan",
      status: "verified",
      ref: plan.id,
    },
    {
      id: "execution",
      label: "Execution trace",
      type: "execution",
      status: fails ? "degraded" : "verified",
      ref: receiptExecution.id,
    },
    {
      id: "reflection",
      label: "Reflection",
      type: "reflection",
      status: "verified",
      ref: reflection.id,
    },
    {
      id: "memory",
      label: "Memory write",
      type: "memory",
      status: "verified",
      ref: memory.id,
    },
    {
      id: "storage",
      label: "0G Storage",
      type: "storage",
      status: "verified",
      ref: storageRef,
    },
    {
      id: "compute",
      label: "0G Compute",
      type: "compute",
      status: fails ? "running" : "verified",
      ref: computeRef,
    },
    { id: "da", label: "0G DA", type: "da", status: "verified", ref: daRef },
    {
      id: "receipt",
      label: "Solana receipt",
      type: "receipt",
      status: "verified",
      ref: receiptProof.txSignature,
    },
    {
      id: "explorer",
      label: "Proof explorer",
      type: "explorer",
      status: "ready",
      ref: receiptProof.explorerUrl,
    },
  ];
  const proofGraphEdges: SwarmProofGraphEdge[] = [
    { id: "e1", from: "wallet", to: "skill", label: "authorizes" },
    { id: "e2", from: "skill", to: "plan", label: "plans" },
    { id: "e3", from: "plan", to: "execution", label: "executes" },
    { id: "e4", from: "execution", to: "reflection", label: "learns" },
    { id: "e5", from: "reflection", to: "memory", label: "promotes" },
    {
      id: "e6",
      from: "reflection",
      to: "storage",
      label: "stores full artifact",
    },
    { id: "e7", from: "storage", to: "compute", label: "processes" },
    { id: "e8", from: "storage", to: "da", label: "publishes availability" },
    { id: "e9", from: "da", to: "receipt", label: "hash anchored" },
    { id: "e10", from: "receipt", to: "explorer", label: "verifiable" },
  ];

  return {
    ...prev,
    autonomyScore: Math.min(100, run.autonomyScoreAfter),
    autonomyLevel:
      run.autonomyScoreAfter > 88
        ? "fully_autonomous"
        : run.autonomyScoreAfter > 80
          ? "near_autonomous"
          : run.autonomyScoreAfter > 68
            ? "meaningful_agency"
            : "policy_gated",
    proofCompletionRate: Math.min(
      100,
      prev.proofCompletionRate + (fails ? 5 : 9),
    ),
    memoryGrowth: prev.memoryGrowth + 1,
    plansCompleted: prev.plansCompleted + 1,
    successfulExecutions: prev.successfulExecutions + (fails ? 0 : 1),
    reflectionsGenerated: prev.reflectionsGenerated + 1,
    policyApprovals:
      prev.policyApprovals +
      policy.filter((item) => item.status === "approved").length,
    runs: [run, ...prev.runs],
    memories: [memory, ...prev.memories],
    reflections: [reflection, ...prev.reflections],
    receipts: [
      receiptProof,
      receiptExecution,
      receiptDecision,
      ...prev.receipts,
    ],
    zeroGLinks: [zeroGLink, ...prev.zeroGLinks].slice(0, 100),
    zeroGBridge: zeroGLink.bridgeState!,
    zeroGStatus: {
      ...prev.zeroGStatus,
      bridgeStatus: zeroGLink.bridgeState!.status,
      mode: "demo",
      storageStatus: "healthy",
      computeStatus: fails ? "degraded" : "healthy",
      daStatus: "healthy",
    },
    proofGraph: {
      nodes: proofGraphNodes,
      edges: proofGraphEdges,
    },
    policyEvents: [...policy, ...prev.policyEvents].slice(0, 30),
    agents: prev.agents.map((agent) => ({
      ...agent,
      status: ["planner", "operator", "coordinator"].includes(agent.id)
        ? "learning"
        : "running",
      memoryCount: agent.memoryCount + (agent.id === "critic" ? 1 : 0),
      proofCount: agent.proofCount + 1,
    })),
  };
}
