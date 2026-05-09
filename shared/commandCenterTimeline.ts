/**
 * Visual timeline model for the Solana agent command center.
 * Drives the bottom “story spine” and optional vertical traces.
 *
 * Narrative matches the proof-backed agent loop: wallet session → versioned skill →
 * plan → execute → outcome → structured reflection (off-chain body) → memory →
 * 0G storage / DA → compact Solana receipt (hash, refs, identity) → reputation mirror.
 * On-chain fields stay minimal; full narrative lives off-chain (see domain receipts + 0G lanes).
 */

export type CommandTimelineStatus =
  | "complete"
  | "active"
  | "pending"
  | "failed";

export interface CommandTimelineEvent {
  id: string;
  phase:
    | "wallet"
    | "skill"
    | "plan"
    | "execute"
    | "outcome"
    | "reflection"
    | "memory"
    | "zerog_storage"
    | "zerog_da"
    | "receipt"
    | "reputation"
    | "next";
  label: string;
  detail?: string;
  at?: string;
  status: CommandTimelineStatus;
  proofRef?: string;
}

export interface BuildCommandTimelineInput {
  walletConnected: boolean;
  sessionVerified: boolean;
  activeSkillName?: string;
  /** Optional skill provenance for registry copy (version + short content hash). */
  skillVersion?: string;
  skillContentHashPreview?: string;
  goalSummary?: string;
  loopStep: number;
  loopBusy: boolean;
  lastExecutionStatus?: string;
  hasReflection: boolean;
  /** Root cause + corrective advice + next action present (injectable control record). */
  structuredReflection?: boolean;
  hasMemory: boolean;
  /** Plan receipt id when planner output is receipt-linked / auditable. */
  planReceiptId?: string;
  /** Shortened Solana tx id for compact anchor hint in the receipt lane. */
  receiptTxPreview?: string;
  zerogStored: boolean;
  zerogDaCommitted: boolean;
  receiptAnchored: boolean;
  degraded?: boolean;
}

/** Outcome when using {@link buildCommandTimelineSafe}; `error` is set only if the primary build path threw. */
export interface CommandTimelineSafeResult {
  events: CommandTimelineEvent[];
  error?: string;
}

function safeIsoTimestamp(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function clampNonNegativeInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function safeOptionalTrimmedString(value: unknown): string | undefined {
  if (value == null) return undefined;
  try {
    const s = typeof value === "string" ? value : String(value);
    const t = s.trim();
    return t.length > 0 ? t : undefined;
  } catch {
    return undefined;
  }
}

function truncateGoalSummary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "…";
}

/** True when reflection is structured for next-turn injection: root cause + corrective advice + next action. */
export function isStructuredReflectionControl(
  r:
    | { rootCause?: string; correctiveAdvice?: string; nextAction?: string }
    | null
    | undefined,
): boolean {
  if (r == null) return false;
  const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  return (
    nonEmpty(r.rootCause) &&
    nonEmpty(r.correctiveAdvice) &&
    nonEmpty(r.nextAction)
  );
}

function executionSucceeded(status: string | undefined): boolean {
  if (!status) return false;
  return (
    status === "succeeded" ||
    status === "verified" ||
    status === "anchored" ||
    status === "reflected" ||
    status === "stored"
  );
}

/**
 * Coerces partial or malformed runtime input (e.g. from React state) into a stable shape
 * before building the timeline.
 */
export function normalizeBuildCommandTimelineInput(
  input: BuildCommandTimelineInput,
): BuildCommandTimelineInput {
  return {
    walletConnected: Boolean(input?.walletConnected),
    sessionVerified: Boolean(input?.sessionVerified),
    loopStep: clampNonNegativeInt(input?.loopStep, 0),
    loopBusy: Boolean(input?.loopBusy),
    hasReflection: Boolean(input?.hasReflection),
    structuredReflection: Boolean(input?.structuredReflection),
    hasMemory: Boolean(input?.hasMemory),
    zerogStored: Boolean(input?.zerogStored),
    zerogDaCommitted: Boolean(input?.zerogDaCommitted),
    receiptAnchored: Boolean(input?.receiptAnchored),
    degraded: Boolean(input?.degraded),
    activeSkillName: safeOptionalTrimmedString(input?.activeSkillName),
    skillVersion: safeOptionalTrimmedString(input?.skillVersion),
    skillContentHashPreview: safeOptionalTrimmedString(
      input?.skillContentHashPreview,
    ),
    goalSummary: safeOptionalTrimmedString(input?.goalSummary),
    lastExecutionStatus: safeOptionalTrimmedString(input?.lastExecutionStatus),
    planReceiptId: safeOptionalTrimmedString(input?.planReceiptId),
    receiptTxPreview: safeOptionalTrimmedString(input?.receiptTxPreview),
  };
}

function fallbackTimelineEvents(errorDetail: string): CommandTimelineEvent[] {
  const at = safeIsoTimestamp() || undefined;
  const detail =
    errorDetail.length > 160 ? errorDetail.slice(0, 160) + "…" : errorDetail;
  return [
    {
      id: "tl-wallet",
      phase: "wallet",
      label: "Solana wallet",
      detail: "Timeline unavailable — invalid or unexpected input",
      at,
      status: "failed",
    },
    {
      id: "tl-skill",
      phase: "skill",
      label: "Published skill",
      detail: detail,
      status: "pending",
    },
    {
      id: "tl-plan",
      phase: "plan",
      label: "Plan",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-exec",
      phase: "execute",
      label: "Execute",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-outcome",
      phase: "outcome",
      label: "Outcome",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-reflection",
      phase: "reflection",
      label: "Reflection",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-memory",
      phase: "memory",
      label: "Memory",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-zg-storage",
      phase: "zerog_storage",
      label: "0G Storage",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-zg-da",
      phase: "zerog_da",
      label: "0G DA",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-receipt",
      phase: "receipt",
      label: "Solana receipt",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-reputation",
      phase: "reputation",
      label: "Reputation",
      detail: "—",
      status: "pending",
    },
    {
      id: "tl-next",
      phase: "next",
      label: "Verify",
      detail: "Recover and reload",
      status: "failed",
    },
  ];
}

function stepToStatuses(
  index: number,
  activeIndex: number,
  busy: boolean,
): CommandTimelineStatus {
  if (index < activeIndex) return "complete";
  if (index > activeIndex) return "pending";
  return busy ? "active" : "complete";
}

/** Maps StoryLoopRail step index + execution outcome into chronology incl. explicit 0G lanes. */
export function buildCommandTimeline(
  input: BuildCommandTimelineInput,
): CommandTimelineEvent[] {
  const normalized = normalizeBuildCommandTimelineInput(input);
  const now = safeIsoTimestamp();
  const walletOk = normalized.walletConnected;
  const s0 = !walletOk
    ? ("pending" as const)
    : normalized.sessionVerified
      ? ("complete" as const)
      : ("active" as const);

  const hasSkill = Boolean(normalized.activeSkillName);
  const skillStatus =
    !walletOk || !normalized.sessionVerified
      ? ("pending" as const)
      : hasSkill
        ? stepToStatuses(
            1,
            Math.max(normalized.loopStep, 1),
            normalized.loopBusy && normalized.loopStep === 1,
          )
        : normalized.loopStep >= 1
          ? ("active" as const)
          : ("pending" as const);

  const planStatus =
    normalized.loopBusy && normalized.loopStep >= 2
      ? ("active" as const)
      : normalized.loopStep >= 3
        ? ("complete" as const)
        : normalized.loopStep === 2 && !normalized.loopBusy
          ? ("complete" as const)
          : ("pending" as const);

  const execStatus =
    normalized.loopBusy && normalized.loopStep >= 3
      ? ("active" as const)
      : normalized.lastExecutionStatus &&
          normalized.lastExecutionStatus !== "planning"
        ? ("complete" as const)
        : ("pending" as const);

  const outcomeFail = normalized.lastExecutionStatus === "failed";
  const outcomeOk = executionSucceeded(normalized.lastExecutionStatus);
  const outcomeStatus = !normalized.lastExecutionStatus
    ? ("pending" as const)
    : outcomeFail
      ? ("failed" as const)
      : ("complete" as const);

  const reflStatus = normalized.hasReflection
    ? ("complete" as const)
    : outcomeFail
      ? ("pending" as const)
      : outcomeOk
        ? ("complete" as const)
        : ("pending" as const);
  const memStatus = normalized.hasMemory
    ? ("complete" as const)
    : normalized.hasReflection
      ? ("active" as const)
      : ("pending" as const);
  const zgStorageStatus = normalized.zerogStored
    ? ("complete" as const)
    : normalized.hasMemory
      ? ("active" as const)
      : ("pending" as const);
  const zgDaStatus = normalized.zerogDaCommitted
    ? ("complete" as const)
    : normalized.zerogStored
      ? ("active" as const)
      : ("pending" as const);
  const receiptStatus = normalized.receiptAnchored
    ? ("complete" as const)
    : normalized.lastExecutionStatus === "verified" ||
        normalized.lastExecutionStatus === "anchored"
      ? ("complete" as const)
      : normalized.lastExecutionStatus && normalized.loopStep >= 8
        ? ("active" as const)
        : ("pending" as const);

  const repStatus =
    normalized.receiptAnchored || normalized.lastExecutionStatus === "verified"
      ? ("complete" as const)
      : ("pending" as const);
  const nextStatus = normalized.degraded
    ? ("failed" as const)
    : repStatus === "complete" && normalized.loopStep >= 8
      ? ("active" as const)
      : ("pending" as const);

  const goalSummaryDetail = normalized.goalSummary
    ? truncateGoalSummary(normalized.goalSummary, 72)
    : "Planner emits receipt-linked steps";

  const skillDetailLines: string[] = [];
  if (normalized.activeSkillName)
    skillDetailLines.push(`Active · ${normalized.activeSkillName}`);
  if (normalized.skillVersion)
    skillDetailLines.push(`v${normalized.skillVersion.replace(/^v/i, "")}`);
  if (normalized.skillContentHashPreview)
    skillDetailLines.push(
      `Hash · ${truncateGoalSummary(normalized.skillContentHashPreview, 18)}`,
    );
  const skillDetail =
    skillDetailLines.length > 0
      ? skillDetailLines.join(" · ")
      : "Choose a versioned skill from the registry";

  const planDetail = normalized.planReceiptId
    ? `Plan receipt · ${truncateGoalSummary(normalized.planReceiptId, 36)}`
    : goalSummaryDetail;

  const reflDetail = normalized.hasReflection
    ? normalized.structuredReflection
      ? "Structured · RCA + advice + next action"
      : "Reflection captured"
    : outcomeFail
      ? "Awaiting corrective reflection"
      : outcomeOk
        ? "No emit · within confidence"
        : "—";

  const memoryDetail = normalized.hasMemory
    ? "Lesson durable · full body off-chain"
    : "—";

  const receiptDetailAnchored = normalized.receiptTxPreview
    ? `Anchored · tx ${normalized.receiptTxPreview}`
    : "Anchored on Solana · compact receipt";

  return [
    {
      id: "tl-wallet",
      phase: "wallet",
      label: "Solana wallet",
      detail: walletOk
        ? normalized.sessionVerified
          ? "Verified Solana session"
          : "Awaiting Solana session verification"
        : "Connect Phantom",
      at: now || undefined,
      status: s0,
    },
    {
      id: "tl-skill",
      phase: "skill",
      label: "Published skill",
      detail: skillDetail,
      status: skillStatus,
      proofRef: hasSkill ? "skill-registry" : undefined,
    },
    {
      id: "tl-plan",
      phase: "plan",
      label: "Plan",
      detail: planDetail,
      status: planStatus,
      proofRef: normalized.planReceiptId
        ? `plan:${truncateGoalSummary(normalized.planReceiptId, 24)}`
        : undefined,
    },
    {
      id: "tl-exec",
      phase: "execute",
      label: "Execute",
      detail: normalized.loopBusy
        ? "Solana execution timeline live"
        : normalized.lastExecutionStatus
          ? `Status · ${normalized.lastExecutionStatus}`
          : "Idle",
      status: execStatus,
    },
    {
      id: "tl-outcome",
      phase: "outcome",
      label: "Outcome",
      detail: outcomeFail
        ? "Recoverable failure (reflection path)"
        : normalized.lastExecutionStatus
          ? "Turn closed"
          : "—",
      status: outcomeStatus,
    },
    {
      id: "tl-reflection",
      phase: "reflection",
      label: "Reflection",
      detail: reflDetail,
      status: reflStatus,
      proofRef:
        normalized.hasReflection && normalized.structuredReflection
          ? "reflection:control-fields"
          : undefined,
    },
    {
      id: "tl-memory",
      phase: "memory",
      label: "Memory",
      detail: memoryDetail,
      status: memStatus,
      proofRef: normalized.hasMemory ? "memory:offchain" : undefined,
    },
    {
      id: "tl-zg-storage",
      phase: "zerog_storage",
      label: "0G Storage",
      detail: normalized.zerogStored
        ? "Stored in 0G Storage (artifact body)"
        : "Awaiting canonical blob PUT",
      status: zgStorageStatus,
      proofRef: normalized.zerogStored ? "zerog://storage" : undefined,
    },
    {
      id: "tl-zg-da",
      phase: "zerog_da",
      label: "0G DA",
      detail: normalized.zerogDaCommitted
        ? "Committed to 0G DA (batch / lineage)"
        : "DA append pending",
      status: zgDaStatus,
      proofRef: normalized.zerogDaCommitted ? "zerog://da" : undefined,
    },
    {
      id: "tl-receipt",
      phase: "receipt",
      label: "Solana receipt",
      detail: normalized.receiptAnchored
        ? receiptDetailAnchored
        : "Awaiting compact anchor (hash + refs)",
      status: receiptStatus,
      proofRef: normalized.receiptAnchored
        ? normalized.receiptTxPreview
          ? `solana:tx~${normalized.receiptTxPreview}`
          : "solana:receipt"
        : undefined,
    },
    {
      id: "tl-reputation",
      phase: "reputation",
      label: "Reputation",
      detail:
        repStatus === "complete"
          ? "Usage + outcomes mirrored from receipts"
          : "—",
      status: repStatus,
    },
    {
      id: "tl-next",
      phase: "next",
      label: "Verify",
      detail: normalized.degraded
        ? "Recover RPC / Solana session"
        : "Explorer + receipt-first replay / audit",
      status: nextStatus,
    },
  ];
}

/**
 * Same as {@link buildCommandTimeline} but never throws: returns a degraded strip plus `error` if something went wrong.
 * Prefer this at UI boundaries when input may not be fully trusted.
 */
export function buildCommandTimelineSafe(
  input: BuildCommandTimelineInput,
): CommandTimelineSafeResult {
  try {
    const events = buildCommandTimeline(input);
    return { events };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : "Unknown timeline error";
    return { events: fallbackTimelineEvents(message), error: message };
  }
}
