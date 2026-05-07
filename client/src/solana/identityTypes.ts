export type WalletIdentityStatus =
  | "unverified"
  | "challenge_issued"
  | "signed"
  | "verified"
  | "error";

export interface SolanaAccountPointers {
  programId?: string;
  configPda?: string;
  profilePda?: string;
  skillPda?: string;
  skillVersionPda?: string;
}

export interface SolanaChallenge {
  id: string;
  walletAddress: string;
  domain: string;
  uri: string;
  statement: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  chainId: number;
  requestId: string;
  message: string;
  accounts?: SolanaAccountPointers;
  metadata?: Record<string, unknown>;
}

export interface SolanaIdentityProfile {
  walletAddress: string;
  authorityWallet?: string;
  status: "unverified" | "verified" | "revoked";
  displayName?: string;
  avatarUrl?: string;
  reputation: number;
  trustScoreBps?: number;
  verifiedAt?: number;
  lastSeenAt?: number;
  skillCount: number;
  memoryCount: number;
  plannerRunCount?: number;
  deploymentCount?: number;
  receiptCount: number;
  chainId?: number;
  accounts?: SolanaAccountPointers;
  metadata?: Record<string, unknown>;
}

export interface SolanaIdentityReceipt {
  id: string;
  walletAddress: string;
  profileHash: string;
  challengeHash: string;
  signatureHash: string;
  receiptHash: string;
  txHash?: string;
  programId?: string;
  chainId?: number;
  createdAt: number;
  labels: string[];
  summary: string;
  status: "pending" | "confirmed" | "failed";
  accounts?: SolanaAccountPointers;
  metadata?: Record<string, unknown>;
}

export interface SolanaSkillVersionSummary {
  id: string;
  slug: string;
  version: string;
  status: "active" | "inactive" | "draft" | "deprecated";
  usageCount: number;
  score: number;
  skillPda?: string;
  skillVersionPda?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SolanaSkillSummary {
  id: string;
  walletAddress?: string;
  slug?: string;
  name: string;
  version: string;
  description: string;
  status: "active" | "inactive" | "draft";
  usageCount: number;
  score: number;
  tags: string[];
  versionCount?: number;
  activeVersionPda?: string;
  accounts?: SolanaAccountPointers;
  versions?: SolanaSkillVersionSummary[];
}

export interface SolanaMemorySummary {
  id: string;
  kind: string;
  title: string;
  summary: string;
  tags: string[];
  importance: number;
  createdAt: number;
  pinned?: boolean;
  sourceTurnId?: string;
  rootCause?: string;
  correctiveAdvice?: string;
}

export interface SolanaPlannerRunSummary {
  id: string;
  runId: string;
  taskType: string;
  goal: string;
  planHash: string;
  stepHash: string;
  outcome: "planned" | "running" | "succeeded" | "failed" | "aborted";
  selectedSkill?: string;
  stepCount: number;
  completedSteps: number;
  failedSteps: number;
  createdAt: number;
  completedAt?: number;
}

export interface SolanaDeploymentSummary {
  id: string;
  deployId: string;
  name: string;
  version: string;
  target: string;
  bundleHash: string;
  sourceHash: string;
  receiptHash: string;
  txHash?: string;
  explorerUrl?: string;
  status: "pending" | "uploaded" | "anchored" | "confirmed" | "failed";
  artifactCount: number;
  bytes: number;
  chainId: number;
  createdAt: number;
}

export interface SolanaReputationAccount {
  walletAddress: string;
  usageCount: number;
  successCount: number;
  failureCount: number;
  memoryAnchorCount: number;
  plannerRunCount: number;
  deploymentCount: number;
  trustScoreBps: number;
  totalRewardPoints: number;
  lastEventKind: "memory_anchor" | "planner_run" | "deployment" | "other";
  lastEventRef: string;
  lastEventAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface SolanaIdentityBundle {
  challenge: SolanaChallenge;
  profile: SolanaIdentityProfile;
  receipts: SolanaIdentityReceipt[];
  skills: SolanaSkillSummary[];
  memories: SolanaMemorySummary[];
  plannerRuns?: SolanaPlannerRunSummary[];
  deployments?: SolanaDeploymentSummary[];
  reputation?: SolanaReputationAccount;
  accounts?: SolanaAccountPointers;
}
