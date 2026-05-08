import type { DaoProposal, DaoProposalStatus } from "./types";

/** Participation ratio 0..1 from voter count vs eligible members */
export function participationRatio(voterCount: number, eligibleMembers: number): number {
  if (eligibleMembers <= 0) return 0;
  return Math.min(1, voterCount / eligibleMembers);
}

/** Quorum met when participation (bps) >= quorumRequired (bps) */
export function quorumMetBps(participationBps: number, quorumRequiredBps: number): boolean {
  return participationBps >= quorumRequiredBps;
}

/** Approval: yes / (yes + no) >= thresholdRequired (0..1), abstain excluded */
export function approvalRatio(yesWeight: number, noWeight: number): number {
  const denom = yesWeight + noWeight;
  if (denom <= 0) return 0;
  return yesWeight / denom;
}

export function thresholdMet(approval: number, thresholdRequired: number): boolean {
  return approval >= thresholdRequired;
}

export function participationBpsFromCounts(voterCount: number, eligibleMembers: number): number {
  return Math.floor(participationRatio(voterCount, eligibleMembers) * 10000);
}

/** Map legacy store status + flags to canonical DaoProposalStatus */
export function deriveCanonicalStatus(input: {
  legacyStatus: "draft" | "active" | "succeeded" | "defeated" | "cancelled" | "executed";
  participationBps: number;
  quorumBps: number;
  approval: number;
  threshold: number;
  finalized: boolean;
  executed: boolean;
}): DaoProposalStatus {
  if (input.executed || input.legacyStatus === "executed") return "executed";
  if (input.legacyStatus === "cancelled") return "archived";
  if (input.legacyStatus === "draft") return "draft";
  if (input.legacyStatus === "succeeded") return input.executed ? "executed" : "approved";
  if (input.legacyStatus === "defeated") return "rejected";
  if (!input.finalized && input.legacyStatus === "active") {
    if (quorumMetBps(input.participationBps, input.quorumBps)) return "quorum_reached";
    return "voting";
  }
  if (input.finalized && input.legacyStatus === "active") {
    // Should not happen; treat as review
    return "review";
  }
  return "voting";
}

export function proposalExecutionReady(input: {
  status: DaoProposalStatus;
  quorumReachedBps: number;
  quorumRequiredBps: number;
  approval: number;
  thresholdRequired: number;
}): boolean {
  if (input.status !== "approved" && input.status !== "quorum_reached") return false;
  return (
    input.quorumReachedBps >= input.quorumRequiredBps &&
    thresholdMet(input.approval, input.thresholdRequired)
  );
}

export function lamportsToSolString(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(4);
}
