/**
 * Visual timeline model for the Solana agent command center.
 * Drives the bottom “story spine” and optional vertical traces.
 */

export type CommandTimelineStatus = "complete" | "active" | "pending" | "failed";

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
  goalSummary?: string;
  loopStep: number;
  loopBusy: boolean;
  lastExecutionStatus?: string;
  hasReflection: boolean;
  hasMemory: boolean;
  receiptAnchored: boolean;
  degraded?: boolean;
}

function stepToStatuses(
  index: number,
  activeIndex: number,
  busy: boolean
): CommandTimelineStatus {
  if (index < activeIndex) return "complete";
  if (index > activeIndex) return "pending";
  return busy ? "active" : "complete";
}

/** Maps StoryLoopRail step index (0–5) + execution outcome into a 10-stage chronology. */
export function buildCommandTimeline(input: BuildCommandTimelineInput): CommandTimelineEvent[] {
  const now = new Date().toISOString();
  const walletOk = input.walletConnected;
  const s0 = !walletOk ? ("pending" as const) : input.sessionVerified ? ("complete" as const) : ("active" as const);

  const hasSkill = Boolean(input.activeSkillName);
  const skillStatus =
    !walletOk || !input.sessionVerified
      ? ("pending" as const)
      : hasSkill
        ? stepToStatuses(1, Math.max(input.loopStep, 1), input.loopBusy && input.loopStep === 1)
        : input.loopStep >= 1
          ? ("active" as const)
          : ("pending" as const);

  const planStatus =
    input.loopBusy && input.loopStep >= 2
      ? ("active" as const)
      : input.loopStep >= 3
        ? ("complete" as const)
        : input.loopStep === 2 && !input.loopBusy
          ? ("complete" as const)
          : ("pending" as const);

  const execStatus =
    input.loopBusy && input.loopStep >= 3
      ? ("active" as const)
      : input.lastExecutionStatus && input.lastExecutionStatus !== "planning"
        ? ("complete" as const)
        : ("pending" as const);

  const outcomeFail = input.lastExecutionStatus === "failed";
  const outcomeStatus = !input.lastExecutionStatus
    ? ("pending" as const)
    : outcomeFail
      ? ("failed" as const)
      : ("complete" as const);

  const reflStatus = input.hasReflection ? ("complete" as const) : outcomeFail ? ("pending" as const) : ("pending" as const);
  const memStatus = input.hasMemory ? ("complete" as const) : input.hasReflection ? ("active" as const) : ("pending" as const);
  const receiptStatus = input.receiptAnchored
    ? ("complete" as const)
    : input.lastExecutionStatus === "verified" || input.lastExecutionStatus === "anchored"
      ? ("complete" as const)
      : input.lastExecutionStatus
        ? ("active" as const)
        : ("pending" as const);

  const repStatus = input.receiptAnchored || input.lastExecutionStatus === "verified" ? ("complete" as const) : ("pending" as const);
  const nextStatus = input.degraded ? ("failed" as const) : repStatus === "complete" ? ("active" as const) : ("pending" as const);

  return [
    {
      id: "tl-wallet",
      phase: "wallet",
      label: "Solana wallet",
      detail: walletOk
        ? input.sessionVerified
          ? "Verified Solana session"
          : "Awaiting Solana session verification"
        : "Connect Solana wallet",
      at: now,
      status: s0,
    },
    {
      id: "tl-skill",
      phase: "skill",
      label: "Published skill",
      detail: input.activeSkillName ? `Active skill · ${input.activeSkillName}` : "Choose published skill asset",
      status: skillStatus,
      proofRef: hasSkill ? "registry" : undefined,
    },
    {
      id: "tl-plan",
      phase: "plan",
      label: "Plan",
      detail: input.goalSummary ? input.goalSummary.slice(0, 72) + (input.goalSummary.length > 72 ? "…" : "") : "Planner builds Solana-linked steps",
      status: planStatus,
    },
    {
      id: "tl-exec",
      phase: "execute",
      label: "Execute",
      detail: input.loopBusy ? "Solana execution timeline live" : input.lastExecutionStatus ? `Status · ${input.lastExecutionStatus}` : "Idle",
      status: execStatus,
    },
    {
      id: "tl-outcome",
      phase: "outcome",
      label: "Outcome",
      detail: outcomeFail ? "Recoverable failure (reflection path)" : input.lastExecutionStatus ? "Turn closed" : "—",
      status: outcomeStatus,
    },
    {
      id: "tl-reflection",
      phase: "reflection",
      label: "Reflection",
      detail: input.hasReflection ? "Reflection created" : outcomeFail ? "Reflection pending" : "—",
      status: reflStatus,
    },
    {
      id: "tl-memory",
      phase: "memory",
      label: "Memory",
      detail: input.hasMemory ? "Memory written (offchain); proof refs on Solana" : "—",
      status: memStatus,
    },
    {
      id: "tl-receipt",
      phase: "receipt",
      label: "Solana receipt",
      detail: input.receiptAnchored ? "Anchored on Solana" : "Awaiting Solana anchor / signature",
      status: receiptStatus,
    },
    {
      id: "tl-reputation",
      phase: "reputation",
      label: "Trust",
      detail: repStatus === "complete" ? "Solana-verified reputation signal" : "—",
      status: repStatus,
    },
    {
      id: "tl-next",
      phase: "next",
      label: "Next",
      detail: input.degraded ? "Recover RPC / Solana session" : "Suggested follow-up run",
      status: nextStatus,
    },
  ];
}
