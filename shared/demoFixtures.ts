import type {
  DemoAgentFixture,
  DemoExecutionStepFixture,
  DemoGuidedStep,
  DemoMemoryFixture,
  DemoMemoryTimelineStage,
  DemoPlanFixture,
  DemoReceiptFixture,
  DemoReflectionFixture,
  DemoScenarioFixture,
  DemoSkillFixture,
  DemoWalletFixture,
} from "./demoTypes";

/** Stable demo authority — reads like a funded devnet operator wallet. */
export const DEMO_AUTHORITY_WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

export const DEMO_PUBLISHER_WALLET = "GJBQWrRod8m8W2BftQBW3M9E15E9U7xzfnMmqf1kMDsC";

/** Deterministic pseudo–tx id for demo UI (not a real signature). */
const SIG = (seed: string) => {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let out = "";
  let x = 0;
  for (let i = 0; i < 88; i++) {
    x = (x + seed.charCodeAt(i % seed.length) * (i + 17)) % alphabet.length;
    out += alphabet[x]!;
  }
  return out;
};

const HASH = (label: string) => {
  let h = 2166136261;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const p = (h >>> 0).toString(16).padStart(8, "0");
  const q = ((h ^ 0x9e3779b9) >>> 0).toString(16).padStart(8, "0");
  return `sha256:${p}${q}…${label.slice(0, 6)}`;
};

export const DEMO_WALLET: DemoWalletFixture = {
  address: DEMO_AUTHORITY_WALLET,
  cluster: "devnet",
  balanceSol: 18.4291,
  label: "Primary demo signer",
};

export const DEMO_SKILLS: DemoSkillFixture[] = [
  {
    id: "skill-support-triage",
    name: "Support Triage",
    description: "Classify inbound tickets, route severity, and draft first-response with policy citations.",
    tags: ["support", "triage", "policy"],
    version: "2.4.1",
    authorWallet: DEMO_PUBLISHER_WALLET,
    contentHash: HASH("support-triage-v241"),
    status: "active",
    usageCount: 18420,
    successRate: 94,
    reputationScore: 91,
    lastUsedIso: "2026-05-07T09:12:00.000Z",
    agentTypes: ["operator", "support"],
    taskTypes: ["support", "routing"],
    receiptRef: "rcpt_skill_support_v241",
    explorerSkillAccount: "SkillPDA8demoSupportTriage111111111111111111",
  },
  {
    id: "skill-research-summary",
    name: "Research Summary",
    description: "Multi-source synthesis with citations, confidence bands, and contradiction detection.",
    tags: ["research", "synthesis", "citations"],
    version: "1.9.0",
    authorWallet: DEMO_PUBLISHER_WALLET,
    contentHash: HASH("research-summary-v190"),
    status: "active",
    usageCount: 12880,
    successRate: 89,
    reputationScore: 86,
    lastUsedIso: "2026-05-07T08:44:22.000Z",
    agentTypes: ["researcher", "critic"],
    taskTypes: ["research", "analysis"],
    receiptRef: "rcpt_skill_research_v190",
  },
  {
    id: "skill-tool-exec",
    name: "Tool Execution",
    description: "Sandboxed tool calls with argument validation, timeouts, and structured stderr capture.",
    tags: ["tools", "execution", "sandbox"],
    version: "3.1.2",
    authorWallet: DEMO_AUTHORITY_WALLET,
    contentHash: HASH("tool-exec-v312"),
    status: "active",
    usageCount: 24610,
    successRate: 91,
    reputationScore: 88,
    lastUsedIso: "2026-05-06T22:01:00.000Z",
    agentTypes: ["operator"],
    taskTypes: ["automation"],
    receiptRef: "rcpt_tool_exec_v312",
  },
  {
    id: "skill-reflection-writer",
    name: "Reflection Writer",
    description: "Turn failures into structured reflections with root cause, corrective advice, and next actions.",
    tags: ["reflection", "learning", "quality"],
    version: "1.2.0",
    authorWallet: DEMO_PUBLISHER_WALLET,
    contentHash: HASH("reflection-writer-v120"),
    status: "active",
    usageCount: 9320,
    successRate: 96,
    reputationScore: 93,
    lastUsedIso: "2026-05-07T09:18:33.000Z",
    agentTypes: ["critic"],
    taskTypes: ["quality", "postmortem"],
  },
  {
    id: "skill-memory-consolidator",
    name: "Memory Consolidator",
    description: "Merge episodic traces into durable memory records with lineage and retrieval hooks.",
    tags: ["memory", "consolidation", "lineage"],
    version: "4.0.3",
    authorWallet: DEMO_AUTHORITY_WALLET,
    contentHash: HASH("memory-consolidator-v403"),
    status: "active",
    usageCount: 15340,
    successRate: 92,
    reputationScore: 90,
    lastUsedIso: "2026-05-07T07:55:11.000Z",
    agentTypes: ["coordinator"],
    taskTypes: ["memory"],
    receiptRef: "rcpt_memory_consol_v403",
  },
  {
    id: "skill-receipt-anchor",
    name: "Receipt Anchor",
    description: "Anchor compact summaries on Solana: subject hash, wallet scope, and verification pointers.",
    tags: ["solana", "receipt", "anchor"],
    version: "2.0.0",
    authorWallet: DEMO_PUBLISHER_WALLET,
    contentHash: HASH("receipt-anchor-v200"),
    status: "active",
    usageCount: 20102,
    successRate: 99,
    reputationScore: 97,
    lastUsedIso: "2026-05-07T09:20:01.000Z",
    agentTypes: ["coordinator", "operator"],
    taskTypes: ["proof", "publish"],
    receiptRef: "rcpt_anchor_skill_v200",
  },
  {
    id: "skill-multi-coordinator",
    name: "Multi-Agent Coordinator",
    description: "Decompose goals, assign lanes, merge outputs, and resolve conflicts with explicit rationale.",
    tags: ["orchestration", "coordination", "swarm"],
    version: "5.3.0",
    authorWallet: DEMO_AUTHORITY_WALLET,
    contentHash: HASH("multi-coordinator-v530"),
    status: "active",
    usageCount: 8844,
    successRate: 87,
    reputationScore: 89,
    lastUsedIso: "2026-05-07T06:12:44.000Z",
    agentTypes: ["coordinator", "planner"],
    taskTypes: ["orchestration"],
  },
  {
    id: "skill-reputation-monitor",
    name: "Reputation Monitor",
    description: "Track usage-weighted success, drift, and trust badges for skills and agent lanes.",
    tags: ["reputation", "economy", "monitoring"],
    version: "1.1.4",
    authorWallet: DEMO_PUBLISHER_WALLET,
    contentHash: HASH("reputation-monitor-v114"),
    status: "active",
    usageCount: 5120,
    successRate: 95,
    reputationScore: 92,
    lastUsedIso: "2026-05-05T14:30:00.000Z",
    agentTypes: ["support", "critic"],
    taskTypes: ["analytics"],
  },
  {
    id: "skill-proof-publisher",
    name: "On-Chain Proof Publisher",
    description: "Package execution artifacts for Solana verification: hashes, PDAs, and explorer-ready links.",
    tags: ["proof", "solana", "publish"],
    version: "1.0.8",
    authorWallet: DEMO_AUTHORITY_WALLET,
    contentHash: HASH("proof-publisher-v108"),
    status: "deprecated",
    usageCount: 3200,
    successRate: 78,
    reputationScore: 71,
    lastUsedIso: "2026-04-12T11:00:00.000Z",
    agentTypes: ["operator"],
    taskTypes: ["proof"],
  },
];

export const DEMO_SCENARIOS: DemoScenarioFixture[] = [
  {
    id: "wallet-skill-discovery",
    title: "Solana wallet + skill discovery",
    subtitle: "Solana identity first, then a ranked skill registry.",
    summary: "Walk from disconnected Solana wallet to a reputation-sorted skill surface.",
    whatYouWillSee: ["Mock connect flow", "Registry search + sort", "Trust-weighted ranking"],
    accent: "green",
    defaultSkillId: "skill-support-triage",
    preferredOutcome: "success",
  },
  {
    id: "publish-skill",
    title: "Publish skill asset",
    subtitle: "A capability becomes a versioned, addressable asset.",
    summary: "Simulate publishing a skill with content hash and Solana receipt.",
    whatYouWillSee: ["Author wallet", "Content hash", "Publication receipt on Solana"],
    accent: "teal",
    defaultSkillId: "skill-receipt-anchor",
    preferredOutcome: "success",
  },
  {
    id: "execute-task",
    title: "Execute a task",
    subtitle: "Planner output becomes an execution timeline.",
    summary: "Run a multi-step execution with live progress and completion hash.",
    whatYouWillSee: ["Plan artifact", "Step rail", "Result hash + receipt ref"],
    accent: "cyan",
    defaultSkillId: "skill-tool-exec",
    preferredOutcome: "success",
  },
  {
    id: "failure-reflection-memory",
    title: "Failure → reflection → memory",
    subtitle: "The emotional core: one miss becomes durable learning.",
    summary: "Operator timeout, critic reflection, memory write, then a better retry.",
    whatYouWillSee: ["Failed step", "Structured reflection", "Memory + lesson injection"],
    accent: "green",
    defaultSkillId: "skill-support-triage",
    preferredOutcome: "recovery",
  },
  {
    id: "receipt-anchor",
    title: "Solana receipt anchoring",
    subtitle: "Proof surface anyone can verify on Solana.",
    summary: "Show how execution summaries settle as compact on-chain receipts.",
    whatYouWillSee: ["Tx signature", "Explorer handoff", "Verified badge"],
    accent: "teal",
    defaultSkillId: "skill-receipt-anchor",
    preferredOutcome: "success",
  },
  {
    id: "reputation-update",
    title: "Reputation update",
    subtitle: "SWARM economy: trust moves after every anchored turn.",
    summary: "Usage and success signals shift ranking for the next discovery pass.",
    whatYouWillSee: ["Before / after counters", "Trust badge", "Rank motion"],
    accent: "cyan",
    defaultSkillId: "skill-research-summary",
    preferredOutcome: "success",
  },
  {
    id: "multi-agent",
    title: "Multi-agent coordination",
    subtitle: "Planner, fleet, coordinator — one merged decision.",
    summary: "Lanes with inputs, outputs, merge rationale, and coordinator verdict.",
    whatYouWillSee: ["Role cards", "Delegation rail", "Merged output"],
    accent: "green",
    defaultSkillId: "skill-multi-coordinator",
    preferredOutcome: "recovery",
  },
  {
    id: "full-e2e",
    title: "Full end-to-end story",
    subtitle: "The complete CLAW loop in one guided pass.",
    summary: "Solana wallet → discovery → execution → reflection → memory → Solana receipt → reputation.",
    whatYouWillSee: ["All panels", "Stepper + presenter notes", "Replay controls"],
    accent: "teal",
    defaultSkillId: "skill-support-triage",
    preferredOutcome: "recovery",
  },
  {
    id: "proof-degraded",
    title: "Proof degraded / pending",
    subtitle: "Receipt exists while verification lags — honest UX.",
    summary: "Execution exhausts retries; anchoring stays pending or degraded until RPC/indexer recover.",
    whatYouWillSee: ["Degraded stage", "Pending verification labels", "Demo-only explorer handoff"],
    accent: "cyan",
    defaultSkillId: "skill-proof-publisher",
    preferredOutcome: "failure",
  },
  {
    id: "openclaw-bridge",
    title: "OpenClaw bridge",
    subtitle: "Import / export skills with provenance and bridge receipts.",
    summary: "Skill crosses OpenClaw ↔ CLAW with compatibility markers and mirrored manifests.",
    whatYouWillSee: ["Import lane", "Sync", "Export lane", "0G storage mock"],
    accent: "teal",
    defaultSkillId: "skill-receipt-anchor",
    preferredOutcome: "success",
  },
];

export function getSkillById(id: string): DemoSkillFixture | undefined {
  return DEMO_SKILLS.find(s => s.id === id);
}

export function buildAgentsForScenario(scenarioId: string, outcome: "success" | "failure" | "recovery"): DemoAgentFixture[] {
  void scenarioId;
  const operatorStatus = outcome === "success" ? "done" : outcome === "failure" ? "blocked" : "done";
  return [
    {
      role: "planner",
      displayName: "Planner",
      taskAssigned: "Decompose goal · choose skills · emit dependency graph",
      status: "done",
      inputSummary: "User goal + policy envelope + wallet scope",
      outputSummary: "4-step plan · risk: stale context on step 3",
      confidence: outcome === "failure" ? 62 : 88,
      reputation: 84,
    },
    {
      role: "researcher",
      displayName: "Researcher",
      taskAssigned: "Retrieve KB slices + external corpus hooks",
      status: "merged",
      inputSummary: "Plan slice R1 + memory pointers (2)",
      outputSummary: "Ranked evidence pack · 6 citations · 2 conflicts flagged",
      confidence: 81,
      reputation: 79,
    },
    {
      role: "operator",
      displayName: "Operator",
      taskAssigned: "Execute tool lane + validation gates",
      status: operatorStatus,
      inputSummary: "Tool manifest v3.1 + signed arg bundle",
      outputSummary:
        outcome === "failure"
          ? "Step 3: retrieval timed out (12s) — partial JSON"
          : outcome === "recovery"
            ? "Retry with injected memory — validation passed"
            : "All steps complete · artifact bundle sealed",
      confidence: outcome === "failure" ? 38 : outcome === "recovery" ? 91 : 93,
      reputation: outcome === "failure" ? 72 : 86,
    },
    {
      role: "critic",
      displayName: "Critic",
      taskAssigned: "Evaluate confidence · emit reflection if below bar",
      status: outcome === "failure" || outcome === "recovery" ? "done" : "idle",
      inputSummary: "Operator trace + stderr + policy thresholds",
      outputSummary:
        outcome === "success"
          ? "No reflection required — within confidence band"
          : "Reflection CLAW-RFX-9182 emitted · next action: widen context window",
      confidence: outcome === "success" ? 90 : 86,
      reputation: 88,
    },
    {
      role: "support",
      displayName: "Support",
      taskAssigned: "Customer-safe phrasing + disclosure templates",
      status: "done",
      inputSummary: "Merged draft + tone policy",
      outputSummary: "Final user-facing summary + escalation footer",
      confidence: 84,
      reputation: 80,
    },
    {
      role: "coordinator",
      displayName: "Coordinator",
      taskAssigned: "Merge lanes · resolve conflicts · choose ship / retry",
      status: "done",
      inputSummary: "Researcher pack + operator artifact + critic note",
      outputSummary:
        outcome === "recovery"
          ? "Ship retry bundle with memory-injected args; anchor receipt after success"
          : outcome === "failure"
            ? "Hold ship · route to reflection + memory write · schedule retry"
            : "Ship approved · queue receipt anchor",
      confidence: 89,
      reputation: 90,
    },
  ];
}

export function buildPlan(skill: DemoSkillFixture, outcome: "success" | "failure" | "recovery"): DemoPlanFixture {
  const base: DemoPlanFixture = {
    id: `plan_${skill.id}_20260507`,
    taskType: skill.taskTypes[0] ?? "general",
    goal: `Resolve: "${skill.name}" workload with verifiable receipts on Solana.`,
    stepCount: 4,
    dependencies: ["policy_ok", "wallet_scope", "memory_read"],
    chosenSkillIds: [skill.id, "skill-memory-consolidator"],
    expectedOutcome: "User-visible resolution + anchored receipt",
    planSummaryHash: HASH(`plan-summary-${skill.id}`),
    planStatus: "approved",
    executionStatus: outcome === "success" ? "success" : outcome === "failure" ? "failed" : "recovered",
    resultSummary:
      outcome === "success"
        ? "Execution closed cleanly; proof anchor queued."
        : outcome === "failure"
          ? "Execution halted at step 3; reflection and memory written."
          : "First attempt failed; retry succeeded after memory injection (+53 confidence).",
    resultHash: HASH(`result-${skill.id}-${outcome}`),
    receiptRef: "rcpt_plan_close_9182",
  };
  return base;
}

export function buildExecutionSteps(outcome: "success" | "failure" | "recovery"): DemoExecutionStepFixture[] {
  const failed = outcome !== "success";
  return [
    {
      id: "ex-1",
      order: 1,
      title: "Authorize session",
      detail: "Wallet scope + signer policy bound to devnet session.",
      status: "done",
      durationMs: 420,
    },
    {
      id: "ex-2",
      order: 2,
      title: "Retrieve context",
      detail: "Memory read: 2 hits · indexer latency 118ms.",
      status: "done",
      durationMs: 1180,
    },
    {
      id: "ex-3",
      order: 3,
      title: "Execute primary tool",
      detail: failed
        ? outcome === "failure"
          ? "Tool lane exceeded 12s budget — incomplete JSON returned."
          : "First attempt: timeout. Retry: widened context + warm cache hit."
        : "Tool lane completed · validation checksum OK.",
      status: outcome === "failure" ? "failed" : "done",
      skillId: "skill-tool-exec",
      durationMs: failed ? 12040 : 6400,
    },
    {
      id: "ex-4",
      order: 4,
      title: "Seal + handoff",
      detail: "Package outputs for critic/coordinator + receipt builder.",
      status: outcome === "failure" ? "pending" : "done",
      durationMs: 890,
    },
  ];
}

export function buildReflection(outcome: "success" | "failure" | "recovery"): DemoReflectionFixture | null {
  if (outcome === "success") return null;
  return {
    id: "refl_CLAW_RFX_9182",
    sourceTurnId: "turn_4412_step_3",
    outcome: outcome === "recovery" ? "lesson" : "failure",
    rootCause:
      outcome === "failure"
        ? "Primary retrieval timed out; context window excluded the latest policy addendum."
        : "Same timeout class; retry succeeded after memory injected addendum hash.",
    correctiveAdvice: "Pin policy version in args; extend retrieval timeout to 18s for this lane.",
    nextAction: "Re-run operator with memory key MEM-CTX-ADD-17 injected into bootstrap.",
    confidence: outcome === "failure" ? 74 : 91,
    linkedMemoryId: "mem_CLAW_4412_ctx",
    linkedReceiptId: "rcpt_reflection_store_9182",
    proofStatus: "verified",
  };
}

export function buildMemory(refl: DemoReflectionFixture | null): DemoMemoryFixture | null {
  if (!refl) return null;
  return {
    id: refl.linkedMemoryId,
    memoryType: "lesson / policy pin",
    source: `Reflection ${refl.id}`,
    summary:
      "Always bind policy digest in tool args; widen retrieval timeout for support-lane tools when KB > 400 chunks.",
    storageReference: "ipfs://bafyCLAWdemo4412memoryctxaddendum",
    proofReference: refl.linkedReceiptId,
    linkedNextTurnId: "turn_4413_retry",
    verification: "verified",
    timestampIso: "2026-05-07T09:21:44.000Z",
  };
}

export function buildReceipts(skill: DemoSkillFixture, outcome: "success" | "failure" | "recovery"): DemoReceiptFixture[] {
  const wallet = DEMO_AUTHORITY_WALLET;
  const baseTime = "2026-05-07T09:22:01.000Z";
  const list: DemoReceiptFixture[] = [
    {
      id: "rcpt_skill_publish",
      kind: "skill_publish",
      subject: `${skill.name} v${skill.version}`,
      subjectType: "skill_asset",
      wallet,
      chain: "Solana",
      txSignature: SIG("4vANMG"),
      accountOrProofRef: skill.explorerSkillAccount ?? `SkillPDA${skill.id.slice(0, 8)}…`,
      status: "verified",
      summaryHash: HASH(`skill-publish-${skill.id}`),
      createdIso: "2026-05-01T16:00:00.000Z",
      storageReference: "arweave://claw-demo-skill-bundle",
    },
    {
      id: "rcpt_plan_gen",
      kind: "plan_generate",
      subject: `Plan ${buildPlan(skill, outcome).id}`,
      subjectType: "plan",
      wallet,
      chain: "Solana",
      txSignature: SIG("5pPLAN"),
      accountOrProofRef: "PlanReceiptPDA9182",
      status: "confirmed",
      summaryHash: HASH("plan-gen"),
      createdIso: "2026-05-07T09:10:02.000Z",
    },
    {
      id: "rcpt_exec_complete",
      kind: "execution_complete",
      subject: "Execution bundle CLAW-EX-4412",
      subjectType: "execution",
      wallet,
      chain: "Solana",
      txSignature: SIG("3uEXEC"),
      accountOrProofRef: "ExecReceiptPDA4412",
      status: outcome === "failure" ? "pending" : "verified",
      summaryHash: HASH(`exec-${outcome}`),
      createdIso: "2026-05-07T09:14:33.000Z",
    },
  ];
  if (outcome !== "success") {
    list.push(
      {
        id: "rcpt_reflection_store_9182",
        kind: "reflection_store",
        subject: "Reflection CLAW-RFX-9182",
        subjectType: "reflection",
        wallet,
        chain: "Solana",
        txSignature: SIG("2rREFL"),
        accountOrProofRef: "ReflectionAccountRFX9182",
        status: "verified",
        summaryHash: HASH("reflection-store"),
        createdIso: "2026-05-07T09:19:02.000Z",
        storageReference: "ipfs://bafyCLAWreflection9182",
      },
      {
        id: "rcpt_memory_store",
        kind: "memory_store",
        subject: "Memory MEM-CTX-ADD-17",
        subjectType: "memory",
        wallet,
        chain: "Solana",
        txSignature: SIG("1mMEMO"),
        accountOrProofRef: "MemoryPointerPDA4412",
        status: "verified",
        summaryHash: HASH("memory-store"),
        createdIso: "2026-05-07T09:20:18.000Z",
        storageReference: "ipfs://bafyCLAWdemo4412memoryctxaddendum",
      }
    );
  }
  list.push({
    id: "rcpt_proof_anchor_final",
    kind: "proof_anchor",
    subject: "Anchored proof bundle · CLAW turn 4413",
    subjectType: "proof",
    wallet,
    chain: "Solana",
    txSignature: SIG("9kPROOF"),
    accountOrProofRef: "ProofVaultPDAturn4413",
    status: "verified",
    summaryHash: HASH("proof-anchor-final"),
    createdIso: baseTime,
  });
  if (outcome === "recovery" || outcome === "success") {
    list.push({
      id: "rcpt_reputation_bump",
      kind: "reputation_update",
      subject: `Skill ${skill.name} reputation delta`,
      subjectType: "reputation",
      wallet,
      chain: "Solana",
      txSignature: SIG("8jREPUT"),
      accountOrProofRef: "RepRegistryPDA",
      status: "confirmed",
      summaryHash: HASH("reputation-bump"),
      createdIso: "2026-05-07T09:23:40.000Z",
    });
  }
  return list;
}

export function buildMemoryTimeline(hasFailure: boolean): DemoMemoryTimelineStage[] {
  const stages: DemoMemoryTimelineStage[] = [
    {
      id: "mt-1",
      stage: "captured",
      title: "Captured",
      description: "Turn artifacts serialized with step hashes.",
      status: "complete",
      timestampIso: "2026-05-07T09:13:00.000Z",
      proofOrStorageRef: "blob:turn4412/raw",
    },
    {
      id: "mt-2",
      stage: "reflected",
      title: "Reflected",
      description: hasFailure ? "Critic emitted structured reflection CLAW-RFX-9182." : "Critic pass — no reflection required.",
      status: "complete",
      timestampIso: "2026-05-07T09:15:10.000Z",
      proofOrStorageRef: hasFailure ? "rcpt_reflection_store_9182" : undefined,
    },
    {
      id: "mt-3",
      stage: "stored",
      title: "Stored",
      description: hasFailure
        ? "Durable memory written with storage pointer and Solana receipt."
        : "Episodic trace retained; no lesson memory.",
      status: "complete",
      timestampIso: "2026-05-07T09:20:18.000Z",
      proofOrStorageRef: hasFailure ? "ipfs://bafyCLAWdemo4412memoryctxaddendum" : "blob:turn4412/episodic",
    },
    {
      id: "mt-4",
      stage: "indexed",
      title: "Indexed",
      description: "Vector + keyword indexes updated for retrieval.",
      status: "complete",
      timestampIso: "2026-05-07T09:20:45.000Z",
    },
    {
      id: "mt-5",
      stage: "retrieved",
      title: "Retrieved",
      description: hasFailure ? "Next turn bootstrap pulled MEM-CTX-ADD-17." : "No retrieval on success-only path.",
      status: hasFailure ? "complete" : "pending",
      timestampIso: hasFailure ? "2026-05-07T09:21:02.000Z" : "2026-05-07T09:21:02.000Z",
    },
    {
      id: "mt-6",
      stage: "used",
      title: "Used",
      description: hasFailure ? "Operator retry consumed injected lesson context." : "—",
      status: hasFailure ? "complete" : "pending",
      timestampIso: "2026-05-07T09:21:30.000Z",
    },
    {
      id: "mt-7",
      stage: "verified",
      title: "Verified",
      description: "Anyone can verify the Solana receipt against published hashes.",
      status: "complete",
      timestampIso: "2026-05-07T09:22:01.000Z",
      proofOrStorageRef: "9kPROOF… (demo tx)",
    },
  ];
  return stages;
}

export const DEMO_GUIDED_STEPS: DemoGuidedStep[] = [
  {
    id: "g1",
    title: "Solana wallet connect",
    presenterNote: "Emphasize Solana as default identity and signing surface.",
    detail: "Demo Solana wallet connects on devnet; scopes for publish, run, and Solana receipt anchor are granted.",
    highlight: "wallet",
  },
  {
    id: "g2",
    title: "Skill discovery",
    presenterNote: "Discovery = search + reputation ranking, not a static list.",
    detail: "Registry sorts by reputation and usage; filters show agent and task lanes.",
    highlight: "skills",
  },
  {
    id: "g3",
    title: "Skill selection",
    presenterNote: "Click a skill card — preview updates everywhere.",
    detail: "Chosen skill drives plan hash, execution lane, and receipt subject lines.",
    highlight: "skills",
  },
  {
    id: "g4",
    title: "Agent planning",
    presenterNote: "Planner is a first-class artifact, not a chat bubble.",
    detail: "Plan id, dependencies, chosen skills, and summary hash appear as durable metadata.",
    highlight: "plan",
  },
  {
    id: "g5",
    title: "Task execution",
    presenterNote: "Show the active step and where time was spent.",
    detail: "Steps animate completion; failures pin to step 3 for the story.",
    highlight: "execution",
  },
  {
    id: "g6",
    title: "Failure or success",
    presenterNote: "Toggle outcome in playground to rehearse both arcs.",
    detail: "Failure path is realistic: tool timeout and incomplete JSON.",
    highlight: "execution",
  },
  {
    id: "g7",
    title: "Reflection created",
    presenterNote: "This is the product heart — structured, not prose sludge.",
    detail: "Root cause, corrective advice, next action, and links to memory + receipt.",
    highlight: "reflection",
  },
  {
    id: "g8",
    title: "Memory written",
    presenterNote: "Memory is durable, addressable, and tied to proofs.",
    detail: "Storage ref + proof ref + link to next turn id.",
    highlight: "memory",
  },
  {
    id: "g9",
    title: "Receipt anchored on Solana",
    presenterNote: "Open explorer — judges should touch the proof surface once.",
    detail: "Confirmed tx, compact hash, verification language.",
    highlight: "receipt",
  },
  {
    id: "g10",
    title: "Reputation updated",
    presenterNote: "SWARM economy: the next discovery pass sees new trust signals.",
    detail: "Usage-weighted success and trust badge shift after anchored turn.",
    highlight: "reputation",
  },
  {
    id: "g11",
    title: "Next turn uses the lesson",
    presenterNote: "Close the loop: same lane, higher confidence after memory injection.",
    detail: "Coordinator merges retry; operator confidence jumps after MEM-CTX-ADD-17.",
    highlight: "coordination",
  },
];
