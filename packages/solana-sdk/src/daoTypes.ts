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

export interface DaoConfig {
  name: string;
  symbol: string;
  uri: string;
  chainId: number;
  paused: boolean;
  quorumBps: number;
  proposalThresholdBps: number;
  voteDurationSlots: number;
  minStakeLamports: number;
  totalMembers: number;
  totalProposals: number;
  totalVotes: number;
  totalExecuted: number;
  totalTreasurySpend: number;
  treasury: string;
}

export interface DaoMember {
  wallet: string;
  delegate: string;
  stakeLamports: number;
  votingPower: number;
  reputationPoints: number;
  proposalsCreated: number;
  votesCast: number;
  active: boolean;
  joinedAt: number;
  updatedAt: number;
}

export interface DaoProposal {
  proposalId: number;
  proposer: string;
  kind: DaoProposalKind;
  status: DaoProposalStatus;
  title: string;
  description: string;
  skillKey: string;
  targetProgram: string;
  targetAccount: string;
  recipient: string;
  amountLamports: number;
  startSlot: number;
  endSlot: number;
  quorumBps: number;
  approvalThresholdBps: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalVotes: number;
  voterCount: number;
  executionHash: string;
  resultHash: string;
  createdAt: number;
  updatedAt: number;
  executedAt: number;
  cancelledAt: number;
}

export interface DaoVoteRecord {
  voter: string;
  delegate: string;
  choice: DaoVoteChoice;
  weight: number;
  reason: string;
  createdAt: number;
}

export interface DaoDiscoveryRow {
  proposalId: number;
  kind: DaoProposalKind;
  title: string;
  status: DaoProposalStatus;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalVotes: number;
  quorumBps: number;
  approvalThresholdBps: number;
  rankScoreBps: number;
  updatedAt: number;
}
