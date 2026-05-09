import type { ReceiptRecord } from "./domainModel";
import type {
  ProofReference,
  ProofStatus,
  ReceiptEvidence,
  ReceiptStatus,
  StructuredReceipt,
  StructuredReceiptType,
} from "./structuredReceipt";
import type { SolanaTxRecord } from "./solana/types";

export function canClaimAnchored(receipt: StructuredReceipt): boolean {
  return (
    !!receipt.evidence.txSignature &&
    !!receipt.links.explorer &&
    receipt.proofStatus === "verified" &&
    (receipt.status === "verified" || receipt.status === "confirmed")
  );
}

export function canClaimStored(receipt: StructuredReceipt): boolean {
  return !!(receipt.evidence.storageRef || receipt.evidence.checksum);
}

export function canClaimLearned(receipt: StructuredReceipt): boolean {
  return (
    receipt.receiptType === "reflection" || receipt.receiptType === "memory"
  );
}

export function getReceiptTruthLine(receipt: StructuredReceipt): string {
  if (receipt.proofStatus === "verified" && receipt.evidence.txSignature) {
    return `Verified on Solana: ${receipt.evidence.txSignature}`;
  }
  if (receipt.proofStatus === "pending") {
    return "Proof pending verification";
  }
  if (receipt.proofStatus === "degraded") {
    const missing = receipt.claim.unsupported?.length
      ? `Missing: ${receipt.claim.unsupported.join(", ")}`
      : "Proof degraded — see evidence panel";
    return missing;
  }
  if (receipt.proofStatus === "cached_only") {
    return receipt.metadata?.demoMode === true
      ? "Demo cache / preview only"
      : "Cached sample only";
  }
  if (receipt.proofStatus === "demo_only") {
    return "Demo fixture — not asserted as live chain verification";
  }
  return "Proof unavailable";
}

export function getClaimText(receipt: StructuredReceipt): string {
  if (receipt.proofStatus === "verified") {
    return receipt.claim.text;
  }
  return "Claim unavailable until proof is verified.";
}

const SOLANA_TYPE_MAP: Record<
  SolanaTxRecord["type"],
  StructuredReceiptType | undefined
> = {
  session: "wallet_session",
  skill: "skill_publish",
  plan: "plan",
  execution: "execution",
  reflection: "reflection",
  memory: "memory",
  proof: "proof",
  openclaw_import: "openclaw_import",
  openclaw_export: "openclaw_export",
  zerog_upload: "zerog_storage",
  zerog_da_batch: "zerog_da_batch",
};

function receiptStatusToStructured(
  status: SolanaTxRecord["status"],
): ReceiptStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "submitted":
      return "submitted";
    case "confirmed":
      return "confirmed";
    case "verified":
      return "verified";
    case "failed":
      return "failed";
    case "degraded":
      return "degraded";
    default:
      return "submitted";
  }
}

function deriveProofStatusFromSolanaRow(
  row: SolanaTxRecord,
  evidence: ReceiptEvidence,
): ProofStatus {
  if (evidence.txSignature?.startsWith("SIM_")) return "demo_only";
  if (!evidence.txSignature && !evidence.explorerUrl) {
    return row.status === "verified" ? "pending" : "unverified";
  }
  if (row.status === "failed") return "degraded";
  if (row.status === "degraded") return "degraded";
  if (row.status === "verified" && evidence.txSignature && evidence.explorerUrl)
    return "verified";
  if (row.status === "confirmed" && evidence.txSignature) return "pending";
  return "pending";
}

function titleForStructuredType(
  t: StructuredReceiptType,
  subjectId: string,
): string {
  const short =
    subjectId.length > 14
      ? `${subjectId.slice(0, 6)}…${subjectId.slice(-4)}`
      : subjectId;
  const labels: Record<StructuredReceiptType, string> = {
    wallet_session: `Wallet session receipt · ${short}`,
    skill_publish: `Skill publish receipt · ${short}`,
    skill_update: `Skill update receipt · ${short}`,
    plan: `Plan receipt · ${short}`,
    execution: `Execution receipt · ${short}`,
    reflection: `Reflection receipt · ${short}`,
    memory: `Memory write receipt · ${short}`,
    proof: `Proof anchor receipt · ${short}`,
    zerog_storage: `0G storage receipt · ${short}`,
    zerog_da_batch: `0G DA batch receipt · ${short}`,
    openclaw_import: `OpenClaw import receipt · ${short}`,
    openclaw_export: `OpenClaw export receipt · ${short}`,
    reputation_update: `Reputation update receipt · ${short}`,
    autonomy_update: `Autonomy update receipt · ${short}`,
  };
  return labels[t];
}

function chainIdToCluster(chainId: number): StructuredReceipt["cluster"] {
  switch (chainId) {
    case 101:
      return "mainnet-beta";
    case 102:
      return "testnet";
    case 103:
      return "devnet";
    default:
      return "devnet";
  }
}

const DOMAIN_RECEIPT_TYPE_MAP: Record<
  ReceiptRecord["type"],
  StructuredReceiptType
> = {
  "skill.publish": "skill_publish",
  "skill.update": "skill_update",
  plan: "plan",
  execution: "execution",
  reflection: "reflection",
  memory: "memory",
  proof: "proof",
  dao: "reputation_update",
  queue: "proof",
  wallet: "wallet_session",
};

function deriveProofStatusDomain(
  r: ReceiptRecord,
  evidence: ReceiptEvidence,
): ProofStatus {
  if (r.status === "failed") return "degraded";
  if (r.status === "degraded") return "degraded";
  if (!evidence.txSignature)
    return r.status === "verified" ? "pending" : "unverified";
  if (r.status === "verified" && evidence.txSignature && evidence.explorerUrl)
    return "verified";
  if (
    evidence.txSignature &&
    evidence.explorerUrl &&
    (r.status === "submitted" || r.status === "confirmed")
  ) {
    return "pending";
  }
  if (evidence.txSignature && !evidence.explorerUrl) return "pending";
  return "unverified";
}

/** Maps orchestrator / API `ReceiptRecord` payloads to structured receipts (proof-first contract). */
export function receiptRecordToStructured(r: ReceiptRecord): StructuredReceipt {
  const receiptType = DOMAIN_RECEIPT_TYPE_MAP[r.type] ?? "proof";
  const cluster = chainIdToCluster(r.chainId);
  const evidence: ReceiptEvidence = {
    txSignature: r.txSignature,
    accountAddress: r.accountAddress,
    storageRef: r.storageRef,
    checksum: r.summaryHash,
    explorerUrl: r.explorerUrl,
  };
  const proofStatus = deriveProofStatusDomain(r, evidence);
  const status: ReceiptStatus =
    r.status === "draft"
      ? "draft"
      : r.status === "submitted"
        ? "submitted"
        : r.status === "confirmed"
          ? "confirmed"
          : r.status === "verified"
            ? "verified"
            : r.status === "failed"
              ? "failed"
              : "degraded";

  const references: ProofReference[] = [];
  if (r.txSignature) {
    references.push({
      kind: "solana_tx",
      id: r.txSignature,
      label: "Solana transaction",
      url: r.explorerUrl,
      verified: proofStatus === "verified",
    });
  }
  if (r.accountAddress) {
    references.push({
      kind: "solana_account",
      id: r.accountAddress,
      label: "Solana account / PDA",
      verified: proofStatus === "verified",
    });
  }
  if (r.storageRef) {
    references.push({
      kind: "zero_g_storage",
      id: r.storageRef,
      label: "Storage reference",
    });
  }
  if (r.summaryHash) {
    references.push({
      kind: "offchain_checksum",
      id: r.summaryHash,
      label: "Summary hash",
      checksum: r.summaryHash,
    });
  }

  const unsupported: string[] = [];
  if (!r.txSignature) unsupported.push("txSignature");
  if (!r.explorerUrl && r.txSignature) unsupported.push("explorerUrl");

  const anchoredClaim = proofStatus === "verified";
  const claimText = anchoredClaim
    ? "Execution artifact anchored with explorer-verifiable Solana transaction."
    : "Receipt recorded; verifier pending or incomplete — see evidence fields.";

  return {
    id: r.id,
    receiptType,
    subjectId: r.subjectId,
    subjectType: r.subjectType,
    walletAddress: r.wallet,
    cluster,
    title: titleForStructuredType(receiptType, r.subjectId),
    summary: `${r.subjectType} · ${r.type} · ${r.summaryHash.slice(0, 18)}…`,
    status,
    proofStatus,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    evidence,
    references,
    links: {
      explorer: r.explorerUrl,
      storage: r.storageRef,
    },
    provenance: {
      sourceExecutionId:
        typeof r.metadata?.executionId === "string"
          ? r.metadata.executionId
          : undefined,
    },
    claim: {
      text: claimText,
      supportedBy: anchoredClaim
        ? ["solana_tx", "explorer"]
        : ["receipt_draft"],
      unsupported: unsupported.length ? unsupported : undefined,
    },
    metadata: { ...r.metadata, domainReceiptType: r.type },
  };
}

export function domainReceiptsToStructured(
  receipts: ReceiptRecord[],
): StructuredReceipt[] {
  return receipts.map(receiptRecordToStructured);
}

export function solanaTxRecordToStructured(
  row: SolanaTxRecord,
  options?: { demoMode?: boolean },
): StructuredReceipt {
  const receiptType = SOLANA_TYPE_MAP[row.type] ?? "proof";
  const evidence: ReceiptEvidence = {
    txSignature: row.txSignature,
    accountAddress: row.account,
    storageRef: row.storageRef,
    daRoot: row.daRoot,
    checksum: row.summaryHash,
    proofHash: row.proofRef,
    explorerUrl: row.explorerUrl,
  };
  const proofStatus = options?.demoMode
    ? "cached_only"
    : deriveProofStatusFromSolanaRow(row, evidence);
  const status = options?.demoMode
    ? "cached"
    : receiptStatusToStructured(row.status);

  const references: ProofReference[] = [];
  if (row.txSignature) {
    references.push({
      kind: "solana_tx",
      id: row.txSignature,
      label: "Solana transaction",
      url: row.explorerUrl,
      verified: proofStatus === "verified",
    });
  }
  if (row.account) {
    references.push({
      kind: "solana_account",
      id: row.account,
      label: "Solana account / PDA",
      verified: proofStatus === "verified",
    });
  }
  if (row.storageRef) {
    references.push({
      kind: "zero_g_storage",
      id: row.storageRef,
      label: "0G storage reference",
    });
  }
  if (row.daRoot) {
    references.push({
      kind: "zero_g_da",
      id: row.daRoot,
      label: "0G DA root",
    });
  }
  if (row.summaryHash) {
    references.push({
      kind: "offchain_checksum",
      id: row.summaryHash,
      label: "Summary hash",
      checksum: row.summaryHash,
    });
  }

  const unsupported: string[] = [];
  if (!row.txSignature) unsupported.push("txSignature");
  if (!row.explorerUrl && row.txSignature) unsupported.push("explorerUrl");
  if (!row.account) unsupported.push("account");

  const anchoredClaim = proofStatus === "verified";

  const claimText = anchoredClaim
    ? "Compact receipt fields anchor on Solana with explorer-verifiable transaction."
    : "Receipt row present; complete explorer URL and verified status to treat as proven on-chain.";

  return {
    id: row.id,
    receiptType,
    subjectId: row.subjectId,
    subjectType: row.type,
    walletAddress: row.wallet,
    cluster: row.cluster,
    title: titleForStructuredType(receiptType, row.subjectId),
    summary: `Subject ${row.subjectId} · ${row.type} · hash ${row.summaryHash}`,
    status,
    proofStatus,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    evidence,
    references,
    links: {
      explorer: row.explorerUrl,
      storage: row.storageRef,
      da: row.daRoot,
    },
    provenance: {},
    claim: {
      text: claimText,
      supportedBy: anchoredClaim ? ["solana_tx", "explorer"] : ["row_present"],
      unsupported: unsupported.length ? unsupported : undefined,
    },
    metadata: {
      originalSolanaType: row.type,
      demoMode: options?.demoMode === true,
    },
  };
}
