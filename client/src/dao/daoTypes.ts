export type DaoVoteChoice = "yes" | "no" | "abstain";
export type DaoProposalKind =
  | "treasury_spend"
  | "parameter_change"
  | "skill_approve"
  | "skill_version_approve"
  | "dao_grant"
  | "text";

export interface DaoConfig {
  name: string;
  symbol: string;
  uri: string;
  paused: boolean;
  quorumBps: number;
  proposalThresholdBps: number;
  voteDurationSlots: number;
  minStakeLamports: number;
  spendLimitLamports: number;
  totalMembers: number;
  totalProposals: number;
  totalVotes: number;
  totalExecuted: number;
  totalTreasurySpend: number;
}

export interface DaoMember {
  wallet: string;
  delegate: string;
  stakeLamports: number;
  votingPower: number;
  reputationPoints: number;
  active: boolean;
  joinedAt: number;
  updatedAt: number;
}

export interface DaoProposal {
  proposalId: number;
  proposer: string;
  kind: DaoProposalKind;
  status: "draft" | "active" | "succeeded" | "defeated" | "cancelled" | "executed";
  title: string;
  description: string;
  skillKey: string;
  recipient: string;
  amountLamports: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalVotes: number;
  voterCount: number;
  quorumBps: number;
  approvalThresholdBps: number;
  executionHash: string;
  resultHash: string;
  createdAt: number;
  updatedAt: number;
  executedAt: number;
}

export interface DaoDiscoveryRow {
  proposalId: number;
  kind: DaoProposalKind;
  title: string;
  status: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalVotes: number;
  rankScoreBps: number;
  updatedAt: number;
}
