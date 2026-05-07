/**
 * Canonical structured receipt model — shared by client, server, and fixtures.
 * No claim without evidence: derive proof badges with `inferProofIntegrity` from `./proof/integrity`.
 */

import type { ProofIntegrityStatus } from "./zerog";

export type ReceiptStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "verified"
  | "failed"
  | "degraded"
  | "cached";

/** Same union as `@shared/zerog` ProofIntegrityStatus — explicit proof posture for receipts. */
export type ProofStatus = ProofIntegrityStatus;

export type StructuredReceiptType =
  | "wallet_session"
  | "skill_publish"
  | "skill_update"
  | "plan"
  | "execution"
  | "reflection"
  | "memory"
  | "proof"
  | "zerog_storage"
  | "zerog_da_batch"
  | "openclaw_import"
  | "openclaw_export"
  | "reputation_update"
  | "autonomy_update";

export interface ProofReference {
  kind:
    | "solana_tx"
    | "solana_account"
    | "solana_pda"
    | "zero_g_storage"
    | "zero_g_da"
    | "offchain_checksum"
    | "reflection"
    | "memory"
    | "skill_version"
    | "plan"
    | "execution";
  id: string;
  label: string;
  url?: string;
  checksum?: string;
  verified?: boolean;
}

export interface ReceiptEvidence {
  txSignature?: string;
  accountAddress?: string;
  pda?: string;
  storageRef?: string;
  daRoot?: string;
  checksum?: string;
  proofHash?: string;
  verificationUrl?: string;
  explorerUrl?: string;
  storageUrl?: string;
  daUrl?: string;
}

export interface StructuredReceipt {
  id: string;
  receiptType: StructuredReceiptType;
  subjectId: string;
  subjectType: string;
  walletAddress: string;
  cluster: "devnet" | "testnet" | "mainnet-beta" | "localnet";
  title: string;
  summary: string;
  status: ReceiptStatus;
  proofStatus: ProofStatus;
  createdAt: string;
  updatedAt: string;
  evidence: ReceiptEvidence;
  references: ProofReference[];
  links: {
    explorer?: string;
    storage?: string;
    da?: string;
    detail?: string;
  };
  provenance: {
    sourceTurnId?: string;
    sourceExecutionId?: string;
    sourcePlanId?: string;
    sourceReflectionId?: string;
    sourceSkillId?: string;
    sourceMemoryId?: string;
  };
  claim: {
    text: string;
    supportedBy: string[];
    unsupported?: string[];
  };
  metadata: Record<string, unknown>;
}

export interface ProofClaim {
  label: string;
  value: string;
  proofStatus: ProofStatus;
  evidence: ReceiptEvidence;
  sourceArtifacts?: ProofReference[];
  explanation?: string;
}

export interface ProofSummary {
  title: string;
  status: ProofStatus;
  statement: string;
  evidenceCount: number;
  sourceCount: number;
  lastVerifiedAt?: string;
}
