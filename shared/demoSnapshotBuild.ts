import {
  buildCommandTimelineSafe,
  normalizeBuildCommandTimelineInput,
  type BuildCommandTimelineInput,
} from "./commandCenterTimeline";
import { commandEventsToUXTimeline } from "./storyUXTimeline";
import {
  buildDemoExecutionArtifacts,
  explorerTxUrl,
  walletCluster,
} from "./buildDemoExecutionRun";
import { applyStoryPlayback, getUnifiedStoryBeats } from "./demoUnifiedStoryPlayback";
import type { DemoPlaybackFrame } from "./demoEngineTypes";
import type { DemoSnapshot, DemoStoryStage, DemoEvent, DemoStoryStepView } from "./demoEngineTypes";
import type { DemoRunOutcome, DemoScenarioId, DemoSkillFixture, DemoWalletFixture } from "./demoTypes";
import type { MemoryRecord, ReflectionRecord, SkillIdentity } from "./domainModel";
import type { SolanaWalletState, SolanaCluster } from "./solana/types";
import type { StructuredReceipt, ProofStatus } from "./structuredReceipt";
import type { OpenClawBridgeStatus } from "./openclaw/types";
import type { ZeroGIntegrationStatus } from "./zerog";
import type { ExecutionRun, StoryReflectionRecord, TraceableMemoryRecord, UnifiedStoryBeat } from "./executionStory";
import { buildExecutionSteps, buildPlan, buildReceipts, DEMO_WALLET, getSkillById } from "./demoFixtures";
import { isStructuredReflectionControl } from "./commandCenterTimeline";

const DEMO_EXPLORER_BASE: Record<SolanaCluster, string> = {
  devnet: "https://explorer.solana.com",
  testnet: "https://explorer.solana.com",
  "mainnet-beta": "https://explorer.solana.com",
  localnet: "https://explorer.solana.com",
};

export function demoSkillFixtureToSkillIdentity(s: DemoSkillFixture): SkillIdentity {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    tags: s.tags,
    version: s.version,
    authorWallet: s.authorWallet,
    contentHash: s.contentHash,
    status: s.status,
    usageCount: s.usageCount,
    reputationScore: s.reputationScore,
    successRate: s.successRate,
    lastUsedAt: s.lastUsedIso,
    explorerUrl: s.explorerSkillAccount
      ? `${DEMO_EXPLORER_BASE.devnet}/address/${encodeURIComponent(s.explorerSkillAccount)}?cluster=devnet`
      : undefined,
    storageRef: s.receiptRef,
  };
}

function receiptKindToStructuredType(
  kind: import("./demoTypes").DemoReceiptFixture["kind"]
): StructuredReceipt["receiptType"] {
  const m: Record<typeof kind, StructuredReceipt["receiptType"]> = {
    skill_publish: "skill_publish",
    plan_generate: "plan",
    execution_complete: "execution",
    reflection_store: "reflection",
    memory_store: "memory",
    proof_anchor: "proof",
    reputation_update: "reputation_update",
  };
  return m[kind];
}

function fixtureProofStatus(status: import("./demoTypes").DemoReceiptFixture["status"]): ProofStatus {
  if (status === "verified") return "demo_only";
  if (status === "pending") return "pending";
  return "cached_only";
}

/** Deterministic StructuredReceipt from demo fixture — same semantics as live receipts, explicitly demo-labeled in metadata. */
export function demoReceiptFixtureToStructured(
  r: import("./demoTypes").DemoReceiptFixture,
  cluster: StructuredReceipt["cluster"]
): StructuredReceipt {
  const proofStatus = fixtureProofStatus(r.status);
  const rt = receiptKindToStructuredType(r.kind);
  const explorer = explorerTxUrl(r.txSignature, cluster);
  return {
    id: r.id,
    receiptType: rt,
    subjectId: r.id,
    subjectType: r.subjectType,
    walletAddress: r.wallet,
    cluster,
    title: r.subject.slice(0, 200),
    summary: `${r.kind.replace(/_/g, " ")} · preview receipt · ${r.status} · demo mode`,
    status: r.status === "verified" ? "verified" : r.status === "pending" ? "submitted" : "confirmed",
    proofStatus,
    createdAt: r.createdIso,
    updatedAt: r.createdIso,
    evidence: {
      txSignature: r.txSignature,
      accountAddress: r.accountOrProofRef,
      storageRef: r.storageReference,
      explorerUrl: explorer,
    },
    references: [
      {
        kind: "solana_tx",
        id: r.txSignature,
        label: "Solana transaction (demo)",
        url: explorer,
        verified: false,
      },
    ],
    links: {
      explorer,
      storage: r.storageReference,
    },
    provenance: {
      sourceSkillId: r.subjectType === "skill_asset" ? r.subject : undefined,
    },
    claim: {
      text:
        rt === "proof"
          ? "Anchored compact proof — open explorer to reconcile hashes (demo fixture)."
          : `Receipt outlines ${r.subjectType} lineage for verifier replay.`,
      supportedBy: [r.txSignature, r.summaryHash, r.accountOrProofRef],
      unsupported: proofStatus === "pending" ? ["Live RPC confirmation not asserted in demo"] : undefined,
    },
    metadata: {
      demoMode: true,
      demoOnlyLabel: "Demo fixture — not asserted as live mainnet verification",
      fixtureKind: r.kind,
    },
  };
}

export function storyReflectionToDomainReflection(r: StoryReflectionRecord): ReflectionRecord {
  const st = r.status;
  const status: ReflectionRecord["status"] =
    st === "verified" ? "verified" : st === "degraded" ? "degraded" : "stored";
  return {
    id: r.id,
    agentId: "agent-critic-demo",
    skillId: r.sourceSkillId,
    sourceTurnId: r.sourceTurnId,
    sourceExecutionId: r.sourceExecutionId,
    rootCause: r.rootCause,
    correctiveAdvice: r.correctiveAdvice,
    nextAction: r.nextAction,
    summary: r.summary,
    fullText: r.fullText,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    memoryId: r.memoryId,
    offchainStorageRef: r.storageRef,
    onchainReceiptId: r.proofRef,
    proofHash: r.proofRef,
    status,
  };
}

export function traceableMemoryToDomainMemory(t: TraceableMemoryRecord): MemoryRecord {
  return {
    id: t.id,
    agentId: "agent-memory-demo",
    sourceTurnId: t.sourceTurnId,
    sourceExecutionId: t.sourceExecutionId,
    sourceReflectionId: t.sourceReflectionId,
    sourceSkillId: t.sourceSkillId,
    kind: t.kind,
    title: t.title,
    summary: t.summary,
    content: t.content,
    tags: t.tags,
    storageRef: t.storageRef,
    checksum: t.checksum,
    proofReceiptId: t.proofReceiptId,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    linkedNextTurnId: t.linkedNextTurnId,
  };
}

function sessionVerifiedForBeat(beat: UnifiedStoryBeat | undefined): boolean {
  if (!beat) return false;
  if (!beat.patch.walletConnectedDemo) return false;
  return beat.id !== "rv-01-disconnected" && beat.patch.currentStage !== "idle";
}

export function buildDemoSolanaWalletState(
  wallet: DemoWalletFixture,
  beat: UnifiedStoryBeat | undefined,
  lastTxSignature?: string
): SolanaWalletState {
  const wc = walletCluster(wallet) as SolanaCluster;
  const connected = Boolean(beat?.patch.walletConnectedDemo);
  const explorerBase = DEMO_EXPLORER_BASE[wc] ?? DEMO_EXPLORER_BASE.devnet;
  const sessionVerified = sessionVerifiedForBeat(beat);
  let connectionStatus: SolanaWalletState["connectionStatus"] = "disconnected";
  if (connected) {
    if (!sessionVerified) connectionStatus = "session_verifying";
    else connectionStatus = "ready";
  }
  return {
    connected,
    connectionStatus,
    publicKey: connected ? wallet.address : null,
    walletName: connected ? wallet.label : null,
    cluster: wc,
    rpcUrl: `https://api.${wc}.solana.com`,
    explorerBaseUrl: explorerBase,
    balanceLamports: connected ? String(Math.floor(wallet.balanceSol * 1e9)) : null,
    balanceSol: connected ? wallet.balanceSol.toFixed(4) : null,
    isBalanceLoading: false,
    isSessionLoading: connected && !sessionVerified,
    isSessionVerified: sessionVerified,
    sessionStatus: connected ? (sessionVerified ? "verified" : "pending") : "none",
    sessionNonce: connected ? "nonce_demo_9f3c2a1b8e7d6c5a" : undefined,
    sessionToken: sessionVerified ? "sess_preview_cached_only" : undefined,
    lastTxSignature: connected ? lastTxSignature : undefined,
    lastSignatureAt: connected && lastTxSignature ? "2026-05-07T09:22:01.000Z" : undefined,
    lastSessionAt: sessionVerified ? "2026-05-07T09:10:04.000Z" : undefined,
    rpcReachable: true,
    rpcSlot: connected ? "342891772" : null,
    rpcLatencyMs: connected ? 42 : null,
    rpcError: null,
    rpcCheckedAt: connected ? "2026-05-07T09:09:55.000Z" : null,
    permissions: {
      canPublishSkill: sessionVerified,
      canExecuteTask: sessionVerified,
      canAnchorReceipt: sessionVerified,
      canSignSession: connected,
      canViewChainData: sessionVerified,
    },
    txHistory: [],
    diagnostics: {
      demoMode: true,
      dataPosture: "demo_only",
    },
  };
}

function mergeZeroG(
  base: ZeroGIntegrationStatus,
  patch?: Partial<ZeroGIntegrationStatus>
): ZeroGIntegrationStatus {
  if (!patch) return base;
  return {
    storage: { ...base.storage, ...patch.storage },
    da: { ...base.da, ...patch.da },
    mode: patch.mode ?? base.mode,
  };
}

function mergeOpenClaw(
  base: OpenClawBridgeStatus,
  patch?: Partial<OpenClawBridgeStatus>
): OpenClawBridgeStatus {
  return patch ? { ...base, ...patch } : base;
}

function defaultZeroG(): ZeroGIntegrationStatus {
  return {
    storage: {
      available: true,
      connected: true,
      lastUploadAt: "2026-05-07T09:20:18.000Z",
      lastDownloadAt: "2026-05-07T09:21:02.000Z",
    },
    da: {
      available: true,
      connected: true,
      lastBatchAt: "2026-05-07T09:20:46.000Z",
      lastRootHash: "da_batch_root_CLAW_demo_4412_9c71",
    },
    mode: "mock",
  };
}

function defaultOpenClaw(): OpenClawBridgeStatus {
  return {
    connected: false,
    mode: "idle",
    importedCount: 0,
    exportedCount: 0,
  };
}

function mapHighlightToStage(h: UnifiedStoryBeat["highlight"]): DemoStoryStage {
  const m: Record<UnifiedStoryBeat["highlight"], DemoStoryStage> = {
    wallet: "wallet",
    skills: "skills",
    plan: "plan",
    execution: "execution",
    reflection: "reflection",
    memory: "memory",
    receipt: "receipt",
    reputation: "reputation",
    coordination: "execution",
  };
  return m[h] ?? "execution";
}

function deriveDataPosture(
  run: ExecutionRun,
  proof: StructuredReceipt | undefined,
  beat: UnifiedStoryBeat | undefined
): DemoSnapshot["derived"]["dataPosture"] {
  if (run.currentStage === "degraded" || run.currentStage === "failed") return "degraded";
  if (proof?.proofStatus === "pending") return "pending";
  if (proof?.proofStatus === "demo_only") return "demo_only";
  if (proof?.proofStatus === "cached_only") return "cached_only";
  if (beat?.patch.hideProofReceiptIds) return "pending";
  return "demo_only";
}

function buildTimelineInput(
  run: ExecutionRun,
  wallet: SolanaWalletState,
  skill: SkillIdentity | undefined,
  reflection: ReflectionRecord | undefined,
  memory: MemoryRecord | undefined,
  receiptTx: string | undefined,
  receiptAnchored: boolean
): BuildCommandTimelineInput {
  const activeIdx = run.steps.findIndex(s => s.id === run.activeStepId);
  const loopStep = activeIdx >= 0 ? activeIdx : 0;
  const hasRefl = Boolean(reflection && isStructuredReflectionControl(reflection));
  const hasMem = Boolean(memory);
  return normalizeBuildCommandTimelineInput({
    walletConnected: wallet.connected,
    sessionVerified: wallet.isSessionVerified,
    activeSkillName: skill?.name,
    skillVersion: skill?.version,
    skillContentHashPreview: skill?.contentHash?.slice(0, 18),
    goalSummary: run.goal,
    loopStep,
    loopBusy: run.currentStage === "running" || run.currentStage === "retrying",
    lastExecutionStatus: run.currentStage,
    hasReflection: Boolean(reflection),
    structuredReflection: hasRefl,
    hasMemory: hasMem,
    planReceiptId: run.metadata && typeof run.metadata.planReceiptId === "string" ? run.metadata.planReceiptId : undefined,
    receiptTxPreview: receiptTx?.slice(0, 10),
    zerogStored: hasMem,
    zerogDaCommitted: run.currentStage === "verified" || run.currentStage === "completed",
    receiptAnchored: receiptAnchored && Boolean(run.proofId || run.receiptId),
    degraded: run.currentStage === "degraded" || run.currentStage === "failed",
  });
}

function buildStoryStepViews(
  frames: DemoPlaybackFrame[],
  beats: UnifiedStoryBeat[],
  currentIndex: number,
  playbackStatus: import("./demoEngineTypes").DemoPlaybackStatus
): DemoStoryStepView[] {
  return frames.map((f, i) => {
    const beat = beats[f.beatIndex] ?? beats[0];
    const stage = mapHighlightToStage(beat?.highlight ?? "execution");
    let status: DemoStoryStepView["status"] = "pending";
    if (i < currentIndex) status = "completed";
    else if (i === currentIndex) {
      status =
        playbackStatus === "playing" || playbackStatus === "jumping"
          ? "active"
          : playbackStatus === "completed" && i === frames.length - 1
            ? "completed"
            : "active";
    }
    if (beat?.patch.currentStage === "failed") status = i === currentIndex ? "failed" : status;
    return {
      id: `demo-step-${i}-${f.beatIndex}`,
      index: i,
      title: f.annotation ?? beat?.title ?? `Step ${i + 1}`,
      description: beat?.detail ?? "",
      stage,
      status,
      delayMs: f.delayMs,
      canJumpTo: true,
      beatId: beat?.id,
    };
  });
}

function buildEventLog(params: {
  scenarioId: DemoScenarioId;
  frames: DemoPlaybackFrame[];
  beats: UnifiedStoryBeat[];
  currentIndex: number;
  run: ExecutionRun;
  wallet: SolanaWalletState;
  skill?: SkillIdentity;
  proof?: StructuredReceipt;
}): DemoEvent[] {
  const { scenarioId, frames, beats, currentIndex, run, wallet, skill, proof } = params;
  const events: DemoEvent[] = [];
  const base = Date.parse("2026-05-07T09:08:00.000Z");
  for (let i = 0; i <= Math.min(currentIndex, frames.length - 1); i++) {
    const f = frames[i]!;
    const beat = beats[f.beatIndex] ?? beats[0]!;
    const stage = mapHighlightToStage(beat.highlight);
    let status: DemoEvent["status"] = "info";
    if (beat.patch.currentStage === "failed" || beat.patch.currentStage === "degraded") status = "warning";
    if (beat.patch.currentStage === "verified" || beat.patch.currentStage === "completed") status = "success";
    if (i === currentIndex && status === "info") status = "live";
    events.push({
      id: `evt-${scenarioId}-${i}`,
      timestamp: new Date(base + i * 17000).toISOString(),
      stage,
      label: f.annotation ?? beat.title,
      description: beat.detail,
      status,
      relatedIds: {
        walletId: wallet.publicKey ?? undefined,
        skillId: skill?.id,
        planId: typeof run.metadata.planId === "string" ? run.metadata.planId : undefined,
        executionId: run.id,
        reflectionId: run.reflectionId,
        memoryId: run.memoryId,
        receiptId: run.receiptId,
        proofId: run.proofId ?? proof?.id,
      },
      proofStatus: proof?.proofStatus,
      linkUrl: proof?.links.explorer,
      notes: "Deterministic demo stream — labels show demo-only posture.",
    });
  }
  return events;
}

export interface BuildDemoSnapshotParams {
  scenarioId: DemoScenarioId;
  playbackOutcome: DemoRunOutcome;
  forceError: boolean;
  selectedSkillId: string;
  playbackStepIndex: number;
  playbackStatus: import("./demoEngineTypes").DemoPlaybackStatus;
  frames: DemoPlaybackFrame[];
}

export function buildDemoSnapshot(params: BuildDemoSnapshotParams): DemoSnapshot {
  const { scenarioId, playbackOutcome, forceError, selectedSkillId, playbackStepIndex, playbackStatus, frames } =
    params;

  const effectiveOutcome: DemoRunOutcome = forceError ? "failure" : playbackOutcome;
  const skillFx = getSkillById(selectedSkillId) ?? getSkillById("skill-support-triage")!;
  const plan = buildPlan(skillFx, effectiveOutcome === "failure" ? "failure" : effectiveOutcome);
  const stepsFx = buildExecutionSteps(effectiveOutcome === "failure" ? "failure" : effectiveOutcome);
  const receiptsFx = buildReceipts(skillFx, effectiveOutcome === "failure" ? "failure" : effectiveOutcome);
  const artifact = buildDemoExecutionArtifacts({
    wallet: DEMO_WALLET,
    skill: skillFx,
    plan,
    stepFixtures: stepsFx,
    receipts: receiptsFx,
    outcome: effectiveOutcome,
  });

  const beats = getUnifiedStoryBeats(effectiveOutcome);
  const stepCount = frames.length;
  const idx = Math.max(0, Math.min(playbackStepIndex, Math.max(stepCount - 1, 0)));
  const frame = frames[idx] ?? { beatIndex: 0, delayMs: 800 };
  const beat = beats[frame.beatIndex] ?? beats[0]!;

  const displayedRun = applyStoryPlayback(artifact.executionRun, beat);
  const skill = demoSkillFixtureToSkillIdentity(skillFx);

  const anchorFixture = receiptsFx.find(r => r.kind === "proof_anchor");
  const cluster = walletCluster(DEMO_WALLET) as StructuredReceipt["cluster"];
  let primaryReceipt = anchorFixture ? demoReceiptFixtureToStructured(anchorFixture, cluster) : undefined;
  if (primaryReceipt && frame.primaryReceiptProofPatch) {
    primaryReceipt = {
      ...primaryReceipt,
      ...frame.primaryReceiptProofPatch,
      claim: frame.primaryReceiptProofPatch.claim
        ? { ...primaryReceipt.claim, ...frame.primaryReceiptProofPatch.claim }
        : primaryReceipt.claim,
    };
  }

  const lastTx = receiptsFx[receiptsFx.length - 1]?.txSignature;
  const wallet = buildDemoSolanaWalletState(DEMO_WALLET, beat, lastTx);

  const reflectionDomain = artifact.reflection ? storyReflectionToDomainReflection(artifact.reflection) : undefined;
  const memoryDomain = artifact.traceableMemory ? traceableMemoryToDomainMemory(artifact.traceableMemory) : undefined;

  const reflection = displayedRun.reflectionId ? reflectionDomain : undefined;
  const memory = displayedRun.memoryId ? memoryDomain : undefined;

  let zerog = defaultZeroG();
  zerog = mergeZeroG(zerog, frame.zerog);

  let openclaw = defaultOpenClaw();
  if (sessionVerifiedForBeat(beat)) {
    openclaw = mergeOpenClaw(
      {
        connected: true,
        mode: "sync",
        lastSyncAt: "2026-05-07T09:15:00.000Z",
        importedCount: 6,
        exportedCount: 2,
      },
      frame.openclaw
    );
  } else {
    openclaw = mergeOpenClaw(openclaw, frame.openclaw);
  }

  const receiptAnchored = !beat.patch.hideProofReceiptIds;
  const timelineInput = buildTimelineInput(
    displayedRun,
    wallet,
    skill,
    reflection,
    memory,
    primaryReceipt?.evidence.txSignature,
    receiptAnchored
  );
  const tl = buildCommandTimelineSafe(timelineInput);
  const timeline = commandEventsToUXTimeline(tl.events);

  const proof = primaryReceipt;
  const receipt = primaryReceipt;

  const repDelta =
    effectiveOutcome === "recovery"
      ? { score: skill.reputationScore + 1, label: "Recovery anchored — trust signal up (demo)" }
      : effectiveOutcome === "failure"
        ? { score: Math.max(0, skill.reputationScore - 2), label: "Degraded run — reputation held pending (demo)" }
        : { score: skill.reputationScore, label: "Clean run — usage-weighted rank stable (demo)" };

  const autonomy =
    effectiveOutcome === "recovery"
      ? { score: 78, label: "Meaningful agency · retry authorized after reflection (demo)" }
      : effectiveOutcome === "failure"
        ? { score: 52, label: "Policy gated — human review suggested (demo)" }
        : { score: 71, label: "Assisted autonomy · planner + operator with receipts (demo)" };

  const derived: DemoSnapshot["derived"] = {
    isWalletVerified: wallet.isSessionVerified,
    isProofVerified: proof?.proofStatus === "verified",
    isMemoryLinked: Boolean(memory?.sourceReflectionId),
    hasFailure: displayedRun.currentStage === "failed" || Boolean(displayedRun.failureReason),
    hasRecovery: effectiveOutcome === "recovery",
    autonomyLabel: autonomy.label,
    reputationLabel: repDelta.label,
    dataPosture: deriveDataPosture(displayedRun, proof, beat),
  };

  const storySteps = buildStoryStepViews(frames, beats, idx, playbackStatus);
  const eventLog = buildEventLog({
    scenarioId,
    frames,
    beats,
    currentIndex: idx,
    run: displayedRun,
    wallet,
    skill,
    proof,
  });

  const progressPercent = stepCount <= 1 ? 100 : Math.round((idx / (stepCount - 1)) * 100);

  return {
    scenarioId,
    stepId: storySteps[idx]?.id ?? "demo-step-0",
    stepIndex: idx,
    stepCount,
    playbackStatus,
    progressPercent,
    wallet,
    skill,
    execution: displayedRun,
    reflection,
    memory,
    receipt,
    proof,
    zerog,
    openclaw,
    timeline,
    eventLog,
    derived,
    storySteps,
    activeStoryAnnotation: frame.annotation,
    reputation: repDelta,
    autonomy,
  };
}
