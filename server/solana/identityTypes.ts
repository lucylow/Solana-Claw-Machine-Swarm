export type IdentityStatus =
  | "unverified"
  | "challenge_issued"
  | "signed"
  | "verified"
  | "revoked"
  | "error";

export type MemoryAnchorKind =
  | "reflection"
  | "lesson"
  | "summary"
  | "skill_trace"
  | "error_trace"
  | "other";

export type MemoryAnchorResult = "success" | "failure" | "mixed" | "unknown";
export type PlannerOutcome = "planned" | "running" | "succeeded" | "failed" | "aborted";
export type DeploymentStatus = "pending" | "uploaded" | "anchored" | "confirmed" | "failed";
export type ReputationEventKind = "memory_anchor" | "planner_run" | "deployment" | "other";

export interface IdentityAccountPointers {
  programId?: string;
  configPda?: string;
  profilePda?: string;
  skillPda?: string;
  skillVersionPda?: string;
}

export interface IdentityChallengeRecord {
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
  signature?: string;
  verifiedAt?: number;
  status: IdentityStatus;
  accounts?: IdentityAccountPointers;
}

export interface IdentityProfileRecord {
  walletAddress: string;
  authorityWallet?: string;
  displayName: string;
  status: "unverified" | "verified" | "revoked";
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
  profileHash?: string;
  accounts?: IdentityAccountPointers;
  metadata?: Record<string, unknown>;
}

export interface IdentityReceiptRecord {
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
  accounts?: IdentityAccountPointers;
  metadata?: Record<string, unknown>;
}

export interface IdentitySkillVersionRecord {
  id: string;
  walletAddress: string;
  slug: string;
  version: string;
  skillPda?: string;
  skillVersionPda?: string;
  status: "active" | "inactive" | "draft" | "deprecated";
  codeHash?: string;
  contentHash?: string;
  artifactUri?: string;
  compatibility?: string;
  usageCount: number;
  score: number;
  createdAt: number;
  updatedAt: number;
}

export interface IdentitySkillRecord {
  id: string;
  walletAddress: string;
  slug: string;
  name: string;
  version: string;
  description: string;
  status: "active" | "inactive" | "draft";
  usageCount: number;
  score: number;
  tags: string[];
  versionCount?: number;
  activeVersionPda?: string;
  accounts?: IdentityAccountPointers;
  versions?: IdentitySkillVersionRecord[];
  createdAt: number;
  updatedAt: number;
}

export interface IdentityMemoryRecord {
  id: string;
  walletAddress: string;
  kind: MemoryAnchorKind | string;
  result?: MemoryAnchorResult;
  taskType?: string;
  title: string;
  summary: string;
  tags: string[];
  importance: number;
  createdAt: number;
  updatedAt?: number;
  pinned?: boolean;
  sourceTurnId?: string;
  sourceHash?: string;
  reflectionHash?: string;
  lessonHash?: string;
  rootCause?: string;
  correctiveAdvice?: string;
  nextBestAction?: string;
  confidenceBps?: number;
  severityBps?: number;
  relatedMemoryIds?: string[];
}

export interface PlannerRunRecord {
  id: string;
  walletAddress: string;
  runId: string;
  taskType: string;
  goal: string;
  planHash: string;
  stepHash: string;
  outcome: PlannerOutcome;
  selectedSkill?: string;
  stepCount: number;
  completedSteps: number;
  failedSteps: number;
  rootCause?: string;
  correctiveAdvice?: string;
  nextBestAction?: string;
  confidenceBps?: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface DeploymentRecord {
  id: string;
  walletAddress: string;
  deployId: string;
  name: string;
  version: string;
  target: string;
  bundleHash: string;
  sourceHash: string;
  storageKey: string;
  receiptHash: string;
  txHash?: string;
  explorerUrl?: string;
  status: DeploymentStatus;
  artifactCount: number;
  bytes: number;
  chainId: number;
  createdAt: number;
  updatedAt: number;
  confirmedAt?: number;
}

export interface ReputationAccountRecord {
  walletAddress: string;
  usageCount: number;
  successCount: number;
  failureCount: number;
  memoryAnchorCount: number;
  plannerRunCount: number;
  deploymentCount: number;
  trustScoreBps: number;
  totalRewardPoints: number;
  lastEventKind: ReputationEventKind;
  lastEventRef: string;
  lastEventAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface IdentityBundleRecord {
  challenge: IdentityChallengeRecord;
  profile: IdentityProfileRecord;
  receipts: IdentityReceiptRecord[];
  skills: IdentitySkillRecord[];
  memories: IdentityMemoryRecord[];
  accounts?: IdentityAccountPointers;
  plannerRuns?: PlannerRunRecord[];
  deployments?: DeploymentRecord[];
  reputation?: ReputationAccountRecord;
}
