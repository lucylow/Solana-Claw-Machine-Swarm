export type DaoProposalKind =
  | "treasury_spend"
  | "parameter_change"
  | "skill_approve"
  | "skill_version_approve"
  | "dao_grant"
  | "text";

export type DaoProposalStatus =
  | "draft"
  | "active"
  | "succeeded"
  | "defeated"
  | "cancelled"
  | "executed";

export type DaoVoteChoice = "yes" | "no" | "abstain";

export interface DaoMemberRecord {
  wallet: string;
  delegate: string;
  stakeLamports: number;
  votingPower: number;
  reputationPoints: number;
  active: boolean;
  joinedAt: number;
  updatedAt: number;
}

export interface DaoProposalRecord {
  proposalId: number;
  proposer: string;
  kind: DaoProposalKind;
  status: DaoProposalStatus;
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
  startSlot: number;
  endSlot: number;
  quorumBps: number;
  approvalThresholdBps: number;
  executionHash: string;
  resultHash: string;
  createdAt: number;
  updatedAt: number;
  executedAt: number;
}

export interface DaoDiscoveryRecord {
  proposalId: number;
  kind: DaoProposalKind;
  title: string;
  status: DaoProposalStatus;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalVotes: number;
  rankScoreBps: number;
  updatedAt: number;
}

export interface DaoConfigRecord {
  name: string;
  symbol: string;
  uri: string;
  chainId: number;
  paused: boolean;
  quorumBps: number;
  proposalThresholdBps: number;
  voteDurationSlots: number;
  minStakeLamports: number;
  spendLimitLamports: number;
  treasury?: string;
  totalMembers: number;
  totalProposals: number;
  totalVotes: number;
  totalExecuted: number;
  totalTreasurySpend: number;
}
