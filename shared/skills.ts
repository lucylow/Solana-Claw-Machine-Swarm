export type SkillStatus =
  | "draft"
  | "published"
  | "active"
  | "paused"
  | "deprecated"
  | "archived";

export interface SkillChainRef {
  chainId: number;
  programId: string;
  registryAccount: string;
  skillAccount: string;
  versionAccount: string;
  explorerTxHash?: string;
  explorerUrl?: string;
  proofRef?: string;
}

export interface SkillAsset {
  id: string;
  programId: string;
  mint?: string;
  skillAccount: string;
  currentVersionAccount: string;
  currentVersion: string;
  name: string;
  description: string;
  tags: string[];
  authorWallet: string;
  status: SkillStatus;
  usageCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  reputationScore: number;
  contentHash: string;
  canonicalUri?: string;
  metadataUri?: string;
  publishedAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  lastResolvedAt?: string;
  latestVersionHash: string;
  previousVersionAccount?: string;
  previousVersionHash?: string;
  chainId: number;
  explorerTxHash?: string;
  explorerUrl?: string;
  storageRef?: string;
  proofRef?: string;
  notes?: string;
  flags?: string[];
}

export interface SkillVersionRecord {
  id: string;
  skillId: string;
  version: string;
  versionAccount: string;
  previousVersionAccount?: string;
  hash: string;
  authorWallet: string;
  description: string;
  tags: string[];
  changelog?: string;
  payload?: Record<string, unknown>;
  status: SkillStatus;
  canonicalUri?: string;
  metadataUri?: string;
  publishedAt: string;
  txHash?: string;
  explorerUrl?: string;
}

export interface SkillPublishReceipt {
  skillId: string;
  version: string;
  versionAccount: string;
  contentHash: string;
  txHash?: string;
  explorerUrl?: string;
  chainConfirmed: boolean;
  duplicateContent: boolean;
  requestId: string;
}

export interface SkillUsageRecord {
  skillId: string;
  usageCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  lastUsedAt?: string;
  lastResolvedAt?: string;
}

export interface SkillReputationRecord {
  skillId: string;
  reputationScore: number;
  calculatedAt: string;
  factors: {
    usageWeight: number;
    successWeight: number;
    recencyWeight: number;
  };
}

export interface SkillQuery {
  search?: string;
  status?: SkillStatus | "all";
  authorWallet?: string;
  tag?: string;
  minReputation?: number;
  sortBy?: "latest_published" | "most_used" | "highest_reputation" | "success_rate" | "alphabetical";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface SkillFilter extends SkillQuery {}

export interface SkillVerificationResult {
  skillId: string;
  version: string;
  verified: boolean;
  expectedHash: string;
  onchainHash?: string;
  txHash?: string;
  explorerUrl?: string;
  reason?: string;
  checkedAt: string;
}
