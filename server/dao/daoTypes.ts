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

export type DaoVoteChoice = "yes" | "no" | "abstain" | "veto";

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
  vetoVotes?: number;
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
  executionTxSignature?: string;
  executionReceiptId?: string;
  proposalReceiptId?: string;
  proofStatus?: string;
  onchainPda?: string;
  onchainAccount?: string;
  createTxSignature?: string;
  offchainStorageRef?: string;
  discussionThreadId?: string;
  offchainChecksum?: string;
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

export interface DaoDelegationRecord {
  id: string;
  fromWallet: string;
  toWallet: string;
  weight: number;
  reason?: string;
  createdAt: number;
  revokedAt?: number;
  status: "active" | "revoked" | "expired" | "pending";
  proofReceiptId?: string;
  pda?: string;
}

export interface DaoVoteLedgerRecord {
  id: string;
  proposalId: number;
  voterWallet: string;
  choice: DaoVoteChoice;
  weight: number;
  reason?: string;
  createdAt: number;
  proofReceiptId?: string;
}

export interface DaoAgentRecommendationRecord {
  id: string;
  proposalId: number;
  agentId: string;
  agentName: string;
  role: string;
  summary: string;
  recommendation: string;
  confidence: number;
  risks: string[];
  supportingEvidence: string[];
  createdAt: number;
  status: "draft" | "ready" | "approved" | "rejected" | "degraded" | "demo_only";
  humanDisposition?: "accepted" | "modified" | "rejected" | "pending";
}

export interface DaoGovernanceMemoryPersist {
  id: string;
  proposalId: number;
  title: string;
  lesson: string;
  outcome: string;
  createdAt: number;
  linkedReceiptIds: string[];
  storageRef?: string;
}

export interface DaoExecutionReceiptPersist {
  id: string;
  proposalId: number;
  walletAddress: string;
  txSignature?: string;
  title: string;
  summary: string;
  status: string;
  proofStatus: string;
  createdAt: number;
  explorerUrl?: string;
  storageRef?: string;
}

export interface DaoTreasurySnapshotPersist {
  id: string;
  walletAddress: string;
  totalBalanceLamports: string;
  totalBalanceSol: string;
  tokenBalances: Array<{ mint: string; symbol?: string; balance: string; valueUsd?: number }>;
  lastUpdatedAt: string;
  proofReceiptId?: string;
  account?: string;
  pda?: string;
  status: string;
}
