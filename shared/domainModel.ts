/**
 * Canonical domain model shared by frontend, backend, and indexer views.
 * Maps cleanly onto discovery rows, plan receipts, memory reflections, and bridge memos.
 */

import type { StructuredReceipt } from "./structuredReceipt";

export type SkillStatus =
  | "draft"
  | "published"
  | "active"
  | "paused"
  | "deprecated"
  | "archived";

export interface SkillIdentity {
  id: string;
  name: string;
  description: string;
  tags: string[];
  version: string;
  authorWallet: string;
  contentHash: string;
  status: SkillStatus;
  usageCount: number;
  reputationScore: number;
  successRate: number;
  lastUsedAt?: string;
  lastUpdatedAt?: string;
  currentVersionAccount?: string;
  historyCount?: number;
  explorerUrl?: string;
  storageRef?: string;
}

export type ExecutionStatus =
  | "idle"
  | "planning"
  | "running"
  | "succeeded"
  | "failed"
  | "reflected"
  | "stored"
  | "anchored"
  | "verified"
  | "degraded";

export interface OrchestrationAgentStep {
  role: "planner" | "researcher" | "operator" | "critic" | "support" | "coordinator";
  label: string;
  status: "pending" | "active" | "done" | "failed";
  detail?: string;
  at?: string;
}

export interface ExecutionRecord {
  id: string;
  agentId: string;
  wallet: string;
  skillId: string;
  taskType: string;
  goal: string;
  outcome?: string;
  status: ExecutionStatus;
  createdAt: string;
  updatedAt: string;
  planReceiptId?: string;
  planId?: string;
  reflectionId?: string;
  memoryId?: string;
  proofReceiptId?: string;
  txSignature?: string;
  explorerUrl?: string;
  metadata: Record<string, unknown>;
  orchestration?: OrchestrationAgentStep[];
}

export interface ReflectionRecord {
  id: string;
  agentId: string;
  skillId: string;
  sourceTurnId: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  summary: string;
  fullText?: string;
  createdAt: string;
  updatedAt: string;
  memoryId?: string;
  offchainStorageRef?: string;
  onchainReceiptId?: string;
  proofHash?: string;
  status: "captured" | "stored" | "anchored" | "linked" | "verified" | "failed" | "degraded";
}

export type MemoryKind =
  | "working"
  | "session"
  | "episodic"
  | "semantic"
  | "reflection"
  | "failure"
  | "plan"
  | "summary";

export interface MemoryRecord {
  id: string;
  agentId: string;
  sourceTurnId: string;
  sourceExecutionId?: string;
  kind: MemoryKind;
  title: string;
  summary: string;
  content?: string;
  tags: string[];
  storageRef?: string;
  checksum?: string;
  proofReceiptId?: string;
  createdAt: string;
  updatedAt: string;
  linkedNextTurnId?: string;
}

export type ReceiptRecordType =
  | "skill.publish"
  | "skill.update"
  | "plan"
  | "execution"
  | "reflection"
  | "memory"
  | "proof"
  | "dao"
  | "queue"
  | "wallet";

export interface ReceiptRecord {
  id: string;
  type: ReceiptRecordType;
  subjectId: string;
  subjectType: string;
  wallet: string;
  chainId: number;
  txSignature?: string;
  accountAddress?: string;
  storageRef?: string;
  summaryHash: string;
  status: "draft" | "submitted" | "confirmed" | "verified" | "failed" | "degraded";
  createdAt: string;
  updatedAt: string;
  explorerUrl?: string;
  verificationStatus?: string;
  metadata: Record<string, unknown>;
}

export interface WalletSessionView {
  walletAddress: string;
  cluster: string;
  programId: string;
  sessionActive: boolean;
  sessionVerified: boolean;
  hasSignature: boolean;
  expiresAt?: string;
  canPublish: boolean;
  canAnchor: boolean;
  canRun: boolean;
  staleReason?: string;
}

export interface SwarmExecuteResult {
  execution: ExecutionRecord;
  reflection?: ReflectionRecord;
  memoryReflectionId?: string;
  receipts: ReceiptRecord[];
  /** Canonical structured receipts (same semantics as `receipts`, proof-normalized). */
  structuredReceipts?: StructuredReceipt[];
  planReceiptId?: string;
  planId?: string;
  degraded: boolean;
  errors: string[];
}
