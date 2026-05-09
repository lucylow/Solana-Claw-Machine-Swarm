import type { DemoRunOutcome } from "./demoTypes";
import type {
  ExecutionRun,
  ExecutionStep,
  ExecutionStepStatus,
  UnifiedStoryBeat,
} from "./executionStory";

function applyStepForPlayback(
  step: ExecutionStep,
  status: ExecutionStepStatus,
): ExecutionStep {
  if (status === "pending") {
    return {
      ...step,
      status: "pending",
      startedAt: undefined,
      completedAt: undefined,
      toolCalls: undefined,
    };
  }
  if (status === "running") {
    return {
      ...step,
      status: "running",
      completedAt: undefined,
    };
  }
  return { ...step, status };
}

/** Clone run with staged playback patch for demo / replay HUD. */
export function applyStoryPlayback(
  run: ExecutionRun,
  beat: UnifiedStoryBeat,
): ExecutionRun {
  const { patch } = beat;
  const steps = run.steps.map((s) =>
    applyStepForPlayback(s, patch.stepStatusOverrides[s.id] ?? s.status),
  );

  let failureReason = run.failureReason;
  if (
    "failureReasonOverride" in patch &&
    patch.failureReasonOverride === null
  ) {
    failureReason = undefined;
  } else if (
    patch.failureReasonOverride !== undefined &&
    patch.failureReasonOverride !== null
  ) {
    failureReason = patch.failureReasonOverride;
  }

  return {
    ...run,
    currentStage: patch.currentStage,
    steps,
    activeStepId: patch.activeStepId ?? run.activeStepId,
    reflectionId: patch.hideReflection ? undefined : run.reflectionId,
    memoryId: patch.hideMemory ? undefined : run.memoryId,
    receiptId: patch.hideProofReceiptIds ? undefined : run.receiptId,
    proofId: patch.hideProofReceiptIds ? undefined : run.proofId,
    failureReason,
    metadata: {
      ...run.metadata,
      playbackWalletConnectedDemo: patch.walletConnectedDemo,
      playbackBeatId: beat.id,
    },
  };
}

/** Recovery arc: wallet → skill → execute → failure → reflection → memory → retry → anchored. */
export const RECOVERY_BEATS: UnifiedStoryBeat[] = [
  {
    id: "rv-01-disconnected",
    title: "Execution stage · idle",
    detail: "No wallet bound — proofs and receipts cannot be scoped.",
    presenterNote:
      "If something is unknowable offline, chips must read unknown rather than implying verification.",
    highlight: "wallet",
    patch: {
      walletConnectedDemo: false,
      currentStage: "idle",
      stepStatusOverrides: {
        "ex-1": "pending",
        "ex-2": "pending",
        "ex-3": "pending",
        "ex-4": "pending",
      },
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
    },
  },
  {
    id: "rv-02-session",
    title: "Wallet connect · session scope",
    detail: "Signer bound on devnet; policy envelope drafts for planner.",
    presenterNote:
      "Session badge flips verified only after deterministic signature handshake.",
    highlight: "wallet",
    patch: {
      walletConnectedDemo: true,
      currentStage: "planning",
      stepStatusOverrides: {
        "ex-1": "pending",
        "ex-2": "pending",
        "ex-3": "pending",
        "ex-4": "pending",
      },
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
    },
  },
  {
    id: "rv-03-skill-registry",
    title: "Selecting skill · published registry",
    detail:
      "Active skill binds task lane, autonomy band, and receipt subject lineage.",
    presenterNote:
      "Registry surfaces provenance hashes — not SaaS placeholders.",
    highlight: "skills",
    patch: {
      walletConnectedDemo: true,
      currentStage: "planning",
      stepStatusOverrides: {
        "ex-1": "pending",
        "ex-2": "pending",
        "ex-3": "pending",
        "ex-4": "pending",
      },
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
    },
  },
  {
    id: "rv-04-plan-deps",
    title: "Plan building · dependency graph",
    detail:
      "Planner emits plan summary · dependencies pinned before execution rail arms.",
    presenterNote:
      "Hash + receipt kind `plan` should align for verifier replay.",
    highlight: "plan",
    patch: {
      walletConnectedDemo: true,
      currentStage: "step_selecting",
      stepStatusOverrides: {
        "ex-1": "pending",
        "ex-2": "pending",
        "ex-3": "pending",
        "ex-4": "pending",
      },
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
    },
  },
  {
    id: "rv-05-step1",
    title: "Plan step · authorize session",
    detail:
      "Step 1 sealed · signer policy + scope committed for downstream tool lane.",
    presenterNote:
      "Show receipt refs stitched to lane — lineage is observable.",
    highlight: "execution",
    patch: {
      walletConnectedDemo: true,
      currentStage: "running",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "running",
        "ex-3": "pending",
        "ex-4": "pending",
      },
      activeStepId: "ex-2",
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
    },
  },
  {
    id: "rv-06-step2",
    title: "Plan step · memory read",
    detail:
      "Memory lane hits episodic corpus before operator budget consumes wall clock.",
    presenterNote:
      "If retrieval fails silently, degrade state — judges must see ambiguity.",
    highlight: "execution",
    patch: {
      walletConnectedDemo: true,
      currentStage: "running",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "running",
        "ex-4": "pending",
      },
      activeStepId: "ex-3",
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
    },
  },
  {
    id: "rv-07-tool-spike",
    title: "Plan step · tool calls in flight",
    detail: "`kb_retrieval` + `schema_gate` observable on operator lane.",
    presenterNote:
      "Each tool row lists input/output summaries — not vague ‘working’ shimmer.",
    highlight: "execution",
    patch: {
      walletConnectedDemo: true,
      currentStage: "running",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "running",
        "ex-4": "pending",
      },
      activeStepId: "ex-3",
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
    },
  },
  {
    id: "rv-08-failed-step",
    title: "Plan step · failure surfaced",
    detail:
      "Operator lane exceeded mocked retrieval budget · incomplete envelope.",
    presenterNote: "Failure reason text matches reflection root cause lineage.",
    highlight: "execution",
    patch: {
      walletConnectedDemo: true,
      currentStage: "failed",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "failed",
        "ex-4": "pending",
      },
      activeStepId: "ex-3",
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
      failureReasonOverride:
        "Tool lane exceeded 12s budget — incomplete JSON returned (simulated deterministic failure).",
    },
  },
  {
    id: "rv-09-reflection",
    title: "Reflection created · critic lane",
    detail:
      "Root cause, corrective advice, next action linked via reflection ids.",
    presenterNote:
      "Reflection is a ledger row — cite storage + receipts explicitly.",
    highlight: "reflection",
    patch: {
      walletConnectedDemo: true,
      currentStage: "reflecting",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "failed",
        "ex-4": "pending",
      },
      activeStepId: "ex-3",
      hideReflection: false,
      hideMemory: true,
      hideProofReceiptIds: true,
      failureReasonOverride:
        "Tool lane exceeded 12s budget — incomplete JSON returned (simulated deterministic failure).",
    },
  },
  {
    id: "rv-10-memory",
    title: "Memory written · lineage",
    detail:
      "Traceable lesson with storage reference, reflection id, next-turn pointer.",
    presenterNote:
      "Show retrievedCount + timestamps when memory is reused later.",
    highlight: "memory",
    patch: {
      walletConnectedDemo: true,
      currentStage: "writing_memory",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "failed",
        "ex-4": "pending",
      },
      activeStepId: "ex-3",
      hideReflection: false,
      hideMemory: false,
      hideProofReceiptIds: true,
      failureReasonOverride:
        "Tool lane exceeded 12s budget — incomplete JSON returned (simulated deterministic failure).",
    },
  },
  {
    id: "rv-11-anchor",
    title: "Receipt anchored · explorer handoff",
    detail: "Compact receipt surfaced with deterministic demo signature.",
    presenterNote:
      "`demo_only` proof state stays visible — avoids fake-mainnet vibes.",
    highlight: "receipt",
    patch: {
      walletConnectedDemo: true,
      currentStage: "anchoring_receipt",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "failed",
        "ex-4": "pending",
      },
      activeStepId: "ex-4",
      hideReflection: false,
      hideMemory: false,
      hideProofReceiptIds: false,
      failureReasonOverride:
        "Tool lane exceeded 12s budget — incomplete JSON returned (simulated deterministic failure).",
    },
  },
  {
    id: "rv-12-retry",
    title: "Next turn improvement · operator replay",
    detail:
      "Injected MEM-CTX-ADD-17 + widened SLA — operator resumes under lineage.",
    presenterNote:
      "This beat is why memory must stay traceable: same ids, clearer outcome.",
    highlight: "coordination",
    patch: {
      walletConnectedDemo: true,
      currentStage: "retrying",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "running",
        "ex-4": "pending",
      },
      activeStepId: "ex-3",
      hideReflection: false,
      hideMemory: false,
      hideProofReceiptIds: false,
      failureReasonOverride: null,
    },
  },
  {
    id: "rv-13-verified",
    title: "Proof checkpoint · verifier rail",
    detail:
      "Explorer-linked receipt reconciled with summarized execution bundle.",
    presenterNote:
      "Contrasts verified vs cached_only — never bury uncertainty.",
    highlight: "receipt",
    patch: {
      walletConnectedDemo: true,
      currentStage: "verified",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "succeeded",
        "ex-4": "succeeded",
      },
      activeStepId: "ex-4",
      hideReflection: false,
      hideMemory: false,
      hideProofReceiptIds: false,
    },
  },
  {
    id: "rv-14-complete",
    title: "Execution stage · completed",
    detail:
      "Run closed · reflection path + replayed lane + anchored proof converge.",
    presenterNote:
      "Use replay controls to shuttle judges between failure ↔ retry beats.",
    highlight: "execution",
    patch: {
      walletConnectedDemo: true,
      currentStage: "completed",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "succeeded",
        "ex-4": "succeeded",
      },
      activeStepId: "ex-4",
      hideReflection: false,
      hideMemory: false,
      hideProofReceiptIds: false,
    },
  },
];

export const FAILURE_BEATS: UnifiedStoryBeat[] = [
  ...RECOVERY_BEATS.slice(0, 10),
  {
    ...RECOVERY_BEATS[10]!,
    id: "fl-11-degraded-terminal",
    title: "Anchoring receipt · pending / degraded",
    detail: "Run halts — explorer tx may remain unconfirmed until RPC heals.",
    presenterNote: "Degraded surfaces are first-class UX, not spinner soup.",
    highlight: "receipt",
    patch: {
      walletConnectedDemo: true,
      currentStage: "degraded",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "failed",
        "ex-4": "pending",
      },
      activeStepId: "ex-3",
      hideReflection: false,
      hideMemory: false,
      hideProofReceiptIds: false,
      failureReasonOverride:
        "Run halted · operator lane failed twice (simulated degraded branch — anchoring degraded).",
    },
  },
];

export const SUCCESS_BEATS: UnifiedStoryBeat[] = [
  RECOVERY_BEATS[0]!,
  RECOVERY_BEATS[1]!,
  RECOVERY_BEATS[2]!,
  RECOVERY_BEATS[3]!,
  RECOVERY_BEATS[4]!,
  RECOVERY_BEATS[5]!,
  {
    id: "ok-07-operator-clear",
    title: "Plan step · operator lane clears",
    detail:
      "KB retrieval respects SLA envelope · schema_gate accepts operator output.",
    presenterNote:
      "No reflection lane firing — criticize missing proof state explicitly if RPC silent.",
    highlight: "execution",
    patch: {
      walletConnectedDemo: true,
      currentStage: "running",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "succeeded",
        "ex-4": "running",
      },
      activeStepId: "ex-4",
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: true,
    },
  },
  {
    id: "ok-08-anchor-clean",
    title: "Anchoring receipt · success rail",
    detail:
      "Execution summary settles as compact memo / PDA refs (still demo labeled).",
    presenterNote: "Even clean paths advertise demo vs verified truthfully.",
    highlight: "receipt",
    patch: {
      walletConnectedDemo: true,
      currentStage: "anchoring_receipt",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "succeeded",
        "ex-4": "succeeded",
      },
      activeStepId: "ex-4",
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: false,
    },
  },
  {
    id: "ok-09-complete",
    title: "Execution stage · completed",
    detail:
      "Critic pass closes loop without episodic escalation to lesson memory.",
    presenterNote:
      "Contrasts sharply with rv-09…rv-13 — lineage widgets intentionally empty.",
    highlight: "execution",
    patch: {
      walletConnectedDemo: true,
      currentStage: "completed",
      stepStatusOverrides: {
        "ex-1": "succeeded",
        "ex-2": "succeeded",
        "ex-3": "succeeded",
        "ex-4": "succeeded",
      },
      activeStepId: "ex-4",
      hideReflection: true,
      hideMemory: true,
      hideProofReceiptIds: false,
    },
  },
];

export function getUnifiedStoryBeats(
  outcome: DemoRunOutcome,
): UnifiedStoryBeat[] {
  if (outcome === "recovery") return RECOVERY_BEATS;
  if (outcome === "failure") return FAILURE_BEATS;
  return SUCCESS_BEATS;
}
