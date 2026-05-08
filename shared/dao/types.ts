import type { SolanaCluster } from "../solana/types";

export type DaoProposalStatus =
  | "draft"
  | "review"
  | "voting"
  | "quorum_reached"
  | "approved"
  | "rejected"
  | "executing"
  | "executed"
  | "archived"
  | "failed"
  | "degraded"
  | "demo_only";

export type DaoVoteChoice = "yes" | "no" | "abstain" | "veto";

export type DaoMemberRole =
  | "member"
  | "delegate"
  | "council"
  | "treasurer"
  | "moderator"
  | "admin"
  | "agent";

export type DaoProposalType =
  | "treasury_allocation"
  | "grant"
  | "parameter_change"
  | "skill_listing"
  | "skill_deprecation"
  | "agent_policy"
  | "memory_policy"
  | "reputation_update"
  | "execution_action"
  | "community_initiative"
  | "other";

export interface DaoMember {
  id: string;
  walletAddress: string;
  displayName?: string;
  role: DaoMemberRole;
  weight: number;
  delegatedWeight?: number;
  reputationScore: number;
  joinedAt: string;
  lastActiveAt?: string;
  verified?: boolean;
  permissions: {
    canVote: boolean;
    canDelegate: boolean;
    canPropose: boolean;
    canExecute: boolean;
    canViewTreasury: boolean;
    canReviewProposals: boolean;
  };
  metadata: Record<string, unknown>;
}

export interface DaoDelegation {
  id: string;
  fromWallet: string;
  toWallet: string;
  weight: number;
  reason?: string;
  createdAt: string;
  revokedAt?: string;
  status: "active" | "revoked" | "expired" | "pending";
  proofReceiptId?: string;
  pda?: string;
}

export interface DaoProposal {
  id: string;
  title: string;
  summary: string;
  fullDescription?: string;
  proposalType: DaoProposalType;
  status: DaoProposalStatus;
  createdAt: string;
  updatedAt: string;
  startAt?: string;
  endAt?: string;
  authorWallet: string;
  creatorAgentId?: string;
  policyLevel: "low" | "medium" | "high" | "critical";
  quorumRequired: number;
  quorumReached: number;
  thresholdRequired: number;
  voteYes: number;
  voteNo: number;
  voteAbstain: number;
  voteVeto: number;
  totalVotingPower: number;
  executionReady: boolean;
  executionTxSignature?: string;
  executionReceiptId?: string;
  proposalReceiptId?: string;
  proofStatus: "unverified" | "pending" | "verified" | "degraded" | "cached_only" | "demo_only";
  onchain?: {
    pda?: string;
    account?: string;
    txSignature?: string;
    programId?: string;
    cluster?: SolanaCluster;
  };
  offchain?: {
    storageRef?: string;
    checksum?: string;
    discussionThreadId?: string;
  };
  treasuryImpact?: {
    amount?: number;
    mint?: string;
    destination?: string;
    budgetCategory?: string;
  };
  metadata: Record<string, unknown>;
}

export interface DaoVote {
  id: string;
  proposalId: string;
  voterWallet: string;
  choice: DaoVoteChoice;
  weight: number;
  reason?: string;
  createdAt: string;
  proofReceiptId?: string;
  pda?: string;
  status: "submitted" | "counted" | "rejected" | "degraded" | "demo_only";
  metadata: Record<string, unknown>;
}

export interface DaoTreasurySnapshot {
  id: string;
  walletAddress: string;
  cluster: SolanaCluster;
  totalBalanceLamports: string;
  totalBalanceSol: string;
  tokenBalances: Array<{
    mint: string;
    symbol?: string;
    balance: string;
    valueUsd?: number;
  }>;
  lastUpdatedAt: string;
  proofReceiptId?: string;
  account?: string;
  pda?: string;
  status: "verified" | "pending" | "cached_only" | "degraded" | "demo_only";
}

export interface DaoExecutionReceipt {
  id: string;
  proposalId: string;
  walletAddress: string;
  cluster: SolanaCluster;
  txSignature?: string;
  pda?: string;
  account?: string;
  title: string;
  summary: string;
  status: "draft" | "submitted" | "confirmed" | "verified" | "failed" | "degraded" | "demo_only";
  proofStatus: "unverified" | "pending" | "verified" | "degraded" | "cached_only" | "demo_only";
  createdAt: string;
  explorerUrl?: string;
  storageRef?: string;
  checksum?: string;
  metadata: Record<string, unknown>;
}

export type DaoAgentRole =
  | "proposal_drafter"
  | "risk_analyst"
  | "policy_reviewer"
  | "treasury_analyst"
  | "vote_summarizer"
  | "execution_coordinator"
  | "dissent_detector"
  | "memory_writer"
  | "reputation_updater";

export interface DaoAgentRecommendation {
  id: string;
  proposalId: string;
  agentId: string;
  agentName: string;
  role: DaoAgentRole;
  summary: string;
  recommendation: string;
  confidence: number;
  risks: string[];
  supportingEvidence: string[];
  createdAt: string;
  proofReceiptId?: string;
  storageRef?: string;
  status: "draft" | "ready" | "approved" | "rejected" | "degraded" | "demo_only";
  humanDisposition?: "accepted" | "modified" | "rejected" | "pending";
}

export interface DaoGovernanceMemoryRecord {
  id: string;
  proposalId: string;
  title: string;
  lesson: string;
  outcome: DaoProposalStatus;
  createdAt: string;
  linkedReceiptIds: string[];
  storageRef?: string;
  precedentProposalIds?: string[];
  metadata: Record<string, unknown>;
}

export interface DaoTimelineStage {
  id: string;
  label: string;
  at?: string;
  done: boolean;
  artifact?: "receipt" | "offchain" | "chain";
}

export interface DaoCommandCenterPayload {
  cluster: SolanaCluster;
  programId?: string;
  explorerBaseUrl: string;
  demoMode: boolean;
  walletAddress?: string;
  member?: DaoMember | null;
  effectiveVoteWeight: number;
  delegationsIncoming: DaoDelegation[];
  delegationsOutgoing: DaoDelegation[];
  configSummary: {
    name: string;
    quorumBps: number;
    thresholdBps: number;
    paused: boolean;
    minStakeLamports: number;
    spendLimitLamports: number;
  };
  proposals: DaoProposal[];
  members: DaoMember[];
  delegations: DaoDelegation[];
  votes: DaoVote[];
  treasury: DaoTreasurySnapshot | null;
  executionReceipts: DaoExecutionReceipt[];
  agentRecommendations: DaoAgentRecommendation[];
  governanceMemory: DaoGovernanceMemoryRecord[];
  activeProposalId: string | null;
  timeline: DaoTimelineStage[];
  degradedReasons: string[];
}
