import { buildMemory, buildReflection } from "./demoFixtures";
import type {
  DemoExecutionStepFixture,
  DemoReceiptFixture,
  DemoReflectionFixture,
  DemoSkillFixture,
  DemoWalletFixture,
  DemoPlanFixture,
  DemoRunOutcome,
  DemoMemoryFixture,
} from "./demoTypes";
import type {
  CommandReceiptRecord,
  ExecutionRun,
  ExecutionStage,
  ExecutionStep,
  ExecutionStepStatus,
  StoryReflectionRecord,
  TraceableMemoryRecord,
} from "./executionStory";

export const DEMO_SOLANA_EXPLORER_TX_BASE = "https://explorer.solana.com/tx";

function clusterParam(c: ExecutionRun["walletCluster"]): string {
  return c === "mainnet-beta" ? "mainnet-beta" : c;
}

export function explorerTxUrl(signature: string, cluster: ExecutionRun["walletCluster"]): string {
  return `${DEMO_SOLANA_EXPLORER_TX_BASE}/${encodeURIComponent(signature)}?cluster=${encodeURIComponent(clusterParam(cluster))}`;
}

export function walletCluster(wallet: DemoWalletFixture): ExecutionRun["walletCluster"] {
  switch (wallet.cluster) {
    case "devnet":
    case "testnet":
    case "mainnet-beta":
      return wallet.cluster;
    default:
      return "devnet";
  }
}

function mapOutcomeToFixture(outcome: DemoRunOutcome): "success" | "failure" | "recovery" {
  if (outcome === "recovery") return "recovery";
  if (outcome === "failure") return "failure";
  return "success";
}

function mapFixtureStepStatus(status: DemoExecutionStepFixture["status"]): ExecutionStepStatus {
  if (status === "done") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "active") return "running";
  return "pending";
}

export function fixturesToExecutionSteps(
  fixtures: DemoExecutionStepFixture[],
  reflectionMemoryKey: string | undefined,
  receiptsForSteps: Record<string, string[]>
): ExecutionStep[] {
  return fixtures.map((f, i) => {
    const prevId = fixtures[i - 1]?.id;
    const dependsOnIds = prevId ? [prevId] : [];

    let toolCalls: ExecutionStep["toolCalls"];
    let agentId: string | undefined;
    let agentName: string | undefined;
    let memoryRefs: string[] | undefined;

    if (f.order === 1) {
      agentId = "agent-session";
      agentName = "Session agent";
    } else if (f.order === 2) {
      agentId = "agent-memory-read";
      agentName = "Memory lane";
      memoryRefs = reflectionMemoryKey ? [`read:${reflectionMemoryKey}`] : undefined;
    } else if (f.order === 3) {
      agentId = "agent-operator";
      agentName = "Operator";
      const st = mapFixtureStepStatus(f.status);
      memoryRefs =
        st !== "pending"
          ? [`read:${reflectionMemoryKey ?? "mem:none"} · lane tool-exec v3`]
          : reflectionMemoryKey
            ? [`read:${reflectionMemoryKey}`]
            : undefined;
      toolCalls =
        st === "pending"
          ? undefined
          : [
              {
                id: `tc_kb_${f.id}`,
                toolName: "kb_retrieval",
                inputSummary: "policy corpus + severity templates (budget 18s simulated)",
                outputSummary:
                  st === "failed"
                    ? "Partial JSON · deadline exceeded before closing envelope."
                    : "Structured citations pack passed schema gate preview.",
                status: st === "failed" ? ("failed" as const) : ("succeeded" as const),
              },
              {
                id: `tc_schema_${f.id}`,
                toolName: "schema_gate",
                inputSummary: "operator envelope · rollback ptr",
                outputSummary:
                  st === "failed" ? "Reject: malformed trailing segment." : "Accept · digest pinned to plan hash",
                status: st === "failed" ? ("failed" as const) : ("succeeded" as const),
              },
            ];
    } else if (f.order === 4) {
      agentId = "agent-coordinator";
      agentName = "Coordinator";
    }

    const baseAt = `2026-05-07T09:${10 + i}:00.000Z`;
    const st = mapFixtureStepStatus(f.status);
    return {
      id: f.id,
      index: i,
      title: f.title,
      description: f.detail,
      dependsOnIds,
      status: st,
      startedAt: st === "pending" ? undefined : baseAt,
      completedAt:
        st === "succeeded" || st === "failed" ? `2026-05-07T09:${12 + i}:33.000Z` : undefined,
      toolCalls,
      agentId,
      agentName,
      memoryRefs,
      receiptRefs: receiptsForSteps[f.id],
    };
  });
}

export function demoReflectionToStory(
  refl: DemoReflectionFixture,
  executionId: string,
  skillId: string
): StoryReflectionRecord {
  return {
    id: refl.id,
    sourceTurnId: refl.sourceTurnId,
    sourceExecutionId: executionId,
    sourceSkillId: skillId,
    rootCause: refl.rootCause,
    correctiveAdvice: refl.correctiveAdvice,
    nextAction: refl.nextAction,
    summary:
      refl.outcome === "lesson"
        ? "Lesson minted after retry proves memory injection lifts operator confidence (+53)."
        : "Structured reflection on operator timeout · policy addendum omission.",
    createdAt: "2026-05-07T09:19:05.000Z",
    updatedAt: "2026-05-07T09:19:40.000Z",
    memoryId: refl.linkedMemoryId,
    storageRef: "ipfs://bafyCLAWreflection9182",
    proofRef: refl.linkedReceiptId,
    status: refl.proofStatus === "verified" ? "verified" : refl.proofStatus === "failed" ? "degraded" : "stored",
  };
}

export function demoMemoryToTraceable(
  mem: DemoMemoryFixture,
  execId: string,
  refl: DemoReflectionFixture,
  skillId: string,
  memoryStoreTxSig: string | undefined,
  wc: ExecutionRun["walletCluster"]
): TraceableMemoryRecord {
  return {
    id: mem.id,
    sourceTurnId: refl.sourceTurnId,
    sourceExecutionId: execId,
    sourceReflectionId: refl.id,
    sourceSkillId: skillId,
    kind: "reflection",
    title: `Lesson · ${mem.memoryType}`,
    summary: mem.summary,
    tags: ["policy_digest", "retrieval_budget", skillId],
    visibility: "workspace",
    storageRef: mem.storageReference,
    checksum: undefined,
    proofReceiptId: mem.proofReference,
    proofStatus: mem.verification === "verified" ? "demo_only" : "pending",
    linkedNextTurnId: mem.linkedNextTurnId,
    retrievedCount: 1,
    lastRetrievedAt: "2026-05-07T09:21:05.120Z",
    explorerUrlHint: memoryStoreTxSig ? explorerTxUrl(memoryStoreTxSig, wc) : undefined,
    createdAt: mem.timestampIso,
    updatedAt: mem.timestampIso,
  };
}

export function demoReceiptFixtureToCommand(r: DemoReceiptFixture, wc: ExecutionRun["walletCluster"]): CommandReceiptRecord {
  const typeMap: Partial<Record<DemoReceiptFixture["kind"], CommandReceiptRecord["type"]>> = {
    skill_publish: "skill",
    plan_generate: "plan",
    execution_complete: "execution",
    reflection_store: "reflection",
    memory_store: "memory",
    proof_anchor: "proof",
    reputation_update: "reputation",
  };
  const t = typeMap[r.kind] ?? "proof";
  return {
    id: r.id,
    type: t,
    subjectId: r.subject.slice(0, 120),
    subjectType: r.subjectType,
    walletAddress: r.wallet,
    cluster: wc,
    title: r.subject,
    summary: `${r.kind.replace(/_/g, " ")} · demo label · ${r.status}`,
    status:
      r.status === "verified" ? "verified" : r.status === "pending" ? "pending" : "confirmed",
    txSignature: r.txSignature,
    accountAddress: r.accountOrProofRef,
    storageRef: r.storageReference,
    proofRef: r.accountOrProofRef,
    explorerUrl: explorerTxUrl(r.txSignature, wc),
    demoLabeled: true,
    createdAt: r.createdIso,
    updatedAt: r.createdIso,
    claim: {
      text:
        r.kind === "proof_anchor"
          ? "Anchored compact proof vault · judges open explorer tx and reconcile hashes."
          : `Receipt outlines ${r.subjectType} lineage for verifier replay.`,
      proofState: r.status === "verified" ? "demo_only" : "pending",
      supportedBy: [r.txSignature, r.summaryHash, r.accountOrProofRef],
    },
  };
}

export interface BuildDemoExecutionArtifactsInput {
  wallet: DemoWalletFixture;
  skill: DemoSkillFixture;
  plan: DemoPlanFixture;
  stepFixtures: DemoExecutionStepFixture[];
  receipts: DemoReceiptFixture[];
  outcome: DemoRunOutcome;
}

function terminalStage(outcome: DemoRunOutcome): ExecutionStage {
  if (outcome === "failure") return "failed";
  if (outcome === "success" || outcome === "recovery") return "completed";
  return "completed";
}

export function buildDemoExecutionArtifacts(input: BuildDemoExecutionArtifactsInput): {
  executionRun: ExecutionRun;
  reflection: StoryReflectionRecord | null;
  traceableMemory: TraceableMemoryRecord | null;
  commandReceipts: CommandReceiptRecord[];
} {
  const wc = walletCluster(input.wallet);
  const fixtureOutcome = mapOutcomeToFixture(input.outcome);
  const reflectionFixture = buildReflection(fixtureOutcome);
  const memoryFixture = reflectionFixture ? buildMemory(reflectionFixture) : null;
  const reflectionMemoryKey = memoryFixture?.id ?? undefined;

  const executionId = `exec_${input.plan.id}`;
  const proofReceipt = input.receipts.find(r => r.kind === "proof_anchor");

  const memStore = input.receipts.find(r => r.kind === "memory_store");

  const receiptsForSteps: Record<string, string[]> = {
    "ex-1": [input.receipts.find(r => r.kind === "plan_generate")?.id ?? ""].filter(Boolean),
    "ex-2": [],
    "ex-3": [input.receipts.find(r => r.kind === "execution_complete")?.id ?? ""].filter(Boolean),
    "ex-4": proofReceipt ? [proofReceipt.id] : [],
  };

  const steps = fixturesToExecutionSteps(input.stepFixtures, reflectionMemoryKey, receiptsForSteps);

  const failedStep = input.stepFixtures.find(s => s.status === "failed");
  const failureReason =
    fixtureOutcome !== "success" && failedStep
      ? failedStep.detail
      : fixtureOutcome === "failure"
        ? "Plan step failed before seal."
        : undefined;

  let activeAgentRole: ExecutionRun["activeAgentRole"];
  const flip = [...input.stepFixtures].reverse();
  const lastSpecial = flip.find(s => s.status === "active" || s.status === "failed" || s.status === "done");
  if (lastSpecial?.order === 3) activeAgentRole = "operator · tool lane";
  else if (lastSpecial?.order === 4) activeAgentRole = "coordinator · seal";
  else if (lastSpecial?.order === 2) activeAgentRole = "memory lane";
  else activeAgentRole = planningRoleHint(terminalStage(input.outcome), fixtureOutcome);

  const reflStory = reflectionFixture ? demoReflectionToStory(reflectionFixture, executionId, input.skill.id) : null;

  const traceable =
    memoryFixture && reflectionFixture
      ? demoMemoryToTraceable(memoryFixture, executionId, reflectionFixture, input.skill.id, memStore?.txSignature, wc)
      : null;

  const activeStepPreferred = [...input.stepFixtures].reverse().find(s => s.status === "failed" || s.status === "active");

  const run: ExecutionRun = {
    id: executionId,
    walletAddress: input.wallet.address,
    walletCluster: wc,
    skillId: input.skill.id,
    skillName: input.skill.name,
    skillVersion: input.skill.version,
    goal: input.plan.goal,
    currentStage: terminalStage(input.outcome),
    planSummary: `${input.skill.name} v${input.skill.version} · ${input.plan.dependencies.join(", ")} · hash ${input.plan.planSummaryHash.slice(0, 24)}`,
    steps,
    activeStepId:
      activeStepPreferred?.id ??
      (fixtureOutcome === "success" ? steps[steps.length - 1]?.id : undefined),
    activeAgentRole,
    failureReason,
    reflectionId: reflStory?.id,
    memoryId: traceable?.id,
    receiptId: input.receipts.find(r => r.kind === "execution_complete")?.id,
    proofId: proofReceipt?.id,
    createdAt: "2026-05-07T09:09:58.100Z",
    updatedAt: "2026-05-07T09:23:51.772Z",
    metadata: {
      demoOnly: true,
      demo_only: true,
      mappedOutcome: input.outcome,
      fixtureOutcome,
      autonomyHint:
        fixtureOutcome === "recovery" ? "next_turn_reused_memory" : fixtureOutcome === "success"
          ? "clean_path_no_reflection_memory"
          : undefined,
      unknownFields: [],
    },
  };

  return {
    executionRun: run,
    reflection: reflStory,
    traceableMemory: traceable,
    commandReceipts: input.receipts.map(r => demoReceiptFixtureToCommand(r, wc)),
  };
}

function planningRoleHint(stage: ExecutionStage, fox: "success" | "failure" | "recovery"): string {
  void stage;
  if (fox === "success") return "planner + operator (happy path)";
  return "planner → operator → critic";
}
