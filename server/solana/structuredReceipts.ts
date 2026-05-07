import type { SolanaProofReceipt } from "@shared/zerog";
import { inferProofIntegrity, isDemoSimulatedTxSignature } from "@shared/proof/integrity";
import type { StructuredReceipt } from "@shared/structuredReceipt";
import type { SolanaCluster, SolanaReceiptRecord } from "@shared/solana/types";
import type { ZeroGIntegrationStatus } from "@shared/zerog";
import { buildExplorerAddressUrl, buildExplorerTxUrl } from "./explorer";
import { getServerSolanaCluster } from "./config";
import { solanaProofToReceiptRecord } from "./receipts";

const manualStructured: StructuredReceipt[] = [];

/** Optional operator-supplied receipts (audits, migrations, tests). */
export function pushManualStructuredReceipt(receipt: StructuredReceipt) {
  manualStructured.unshift(receipt);
}

function integrationMode(mode: ZeroGIntegrationStatus["mode"]): ZeroGIntegrationStatus["mode"] {
  return mode;
}

function receiptRowTypeFromProofSubject(st: SolanaProofReceipt["subjectType"]): SolanaReceiptRecord["type"] {
  switch (st) {
    case "bridge":
      return "proof";
    case "skill":
      return "skill";
    case "reflection":
      return "reflection";
    case "memory":
      return "memory";
    case "plan":
      return "plan";
    case "execution":
      return "execution";
    case "proof":
      return "proof";
    case "zerog_upload":
      return "zerog_upload";
    case "zerog_da_batch":
      return "zerog_da_batch";
    default:
      return "proof";
  }
}

function structuredTypeFromMirrorRow(row: SolanaReceiptRecord): StructuredReceipt["receiptType"] {
  if (row.type === "session") return "wallet_session";
  if (row.type === "skill") return "skill_publish";
  if (row.type === "zerog_upload") return "zerog_storage";
  if (row.type === "zerog_da_batch") return "zerog_da_batch";
  if (row.type === "openclaw_import") return "openclaw_import";
  if (row.type === "openclaw_export") return "openclaw_export";
  return row.type as StructuredReceipt["receiptType"];
}

/** Maps sidecar mirrors + indexer rows into the canonical structured receipt surface. */
export function mirrorReceiptRowToStructured(
  row: SolanaReceiptRecord,
  integration: ZeroGIntegrationStatus
): StructuredReceipt {
  const cluster = row.cluster ?? getServerSolanaCluster();
  const now = new Date().toISOString();
  const mode = integrationMode(integration.mode);

  const proofStatus = inferProofIntegrity({
    txSignature: row.txSignature,
    zerogMode: mode,
    degradedFlags: row.status === "degraded",
  });

  const showExplorer = Boolean(row.txSignature && !isDemoSimulatedTxSignature(row.txSignature));
  const explorerUrl =
    showExplorer &&
    row.explorerUrl === undefined &&
    row.txSignature !== undefined &&
    cluster
      ? buildExplorerTxUrl(row.txSignature, cluster as SolanaCluster)
      : row.explorerUrl;

  const title = `${structuredTypeFromMirrorRow(row)} · ${row.subjectId.slice(0, 12)}`;
  const summary = `Compact Solana receipt mirror for ${row.type} subject ${row.subjectId}`;

  return {
    id: row.id,
    receiptType: structuredTypeFromMirrorRow(row),
    subjectId: row.subjectId,
    subjectType: row.type,
    walletAddress: row.wallet,
    cluster: cluster as StructuredReceipt["cluster"],
    title,
    summary,
    status: row.status as StructuredReceipt["status"],
    proofStatus,
    createdAt: row.createdAt,
    updatedAt: now,
    evidence: {
      txSignature: row.txSignature,
      accountAddress: row.account,
      pda: row.account,
      storageRef: row.storageRef,
      daRoot: row.daRoot,
      checksum: row.summaryHash,
      proofHash: row.summaryHash,
      verificationUrl: explorerUrl,
      explorerUrl: showExplorer ? explorerUrl : undefined,
      storageUrl: row.storageRef,
      daUrl: row.daRoot ? `zg://da/root/${row.daRoot}` : undefined,
    },
    references: [
      ...(row.storageRef
        ? [
            {
              kind: "zero_g_storage" as const,
              id: row.storageRef,
              label: "Stored in 0G Storage",
              url: row.storageRef,
              checksum: row.summaryHash,
              verified: proofStatus === "verified",
            },
          ]
        : []),
      ...(row.daRoot
        ? [
            {
              kind: "zero_g_da" as const,
              id: row.daRoot,
              label: "Committed to 0G DA",
              url: `zg://da/root/${row.daRoot}`,
              verified: proofStatus === "verified",
            },
          ]
        : []),
      ...(row.txSignature && showExplorer && explorerUrl
        ? [
            {
              kind: "solana_tx" as const,
              id: row.txSignature,
              label: "Open on Solana Explorer",
              url: explorerUrl,
              verified: proofStatus === "verified",
            },
          ]
        : []),
    ],
    links: {
      explorer: showExplorer ? explorerUrl : undefined,
      storage: row.storageRef ?? undefined,
      da: row.daRoot ? `zg://da/root/${row.daRoot}` : undefined,
    },
    provenance: {},
    claim: {
      text: `${row.wallet} anchored a ${row.type} receipt with summary hash ${row.summaryHash.slice(0, 16)}….`,
      supportedBy: [
        ...(row.storageRef ? ["0G Storage ref present"] : ["No 0G Storage ref"]),
        ...(row.daRoot ? ["0G DA root present"] : ["No DA root"]),
        ...(row.txSignature ? (showExplorer ? ["Solana tx signature present"] : ["Demo Solana mirror signature"]) : ["No Solana signature"]),
      ],
      unsupported:
        proofStatus === "demo_only"
          ? ["Not an explorer-verified mainnet/devnet confirmation without RPC check"]
          : proofStatus === "pending"
            ? ["Awaiting confirmation / indexing"]
            : undefined,
    },
    metadata: {
      source: "solana-sidecar-mirror",
      integrationMode: integration.mode,
    },
  };
}

export function proofsToStructuredReceipts(params: {
  proofs: SolanaProofReceipt[];
  integration: ZeroGIntegrationStatus;
}): StructuredReceipt[] {
  const cluster = getServerSolanaCluster();
  const rows = params.proofs.map(p =>
    solanaProofToReceiptRecord(p, cluster, receiptRowTypeFromProofSubject(p.subjectType))
  );
  const structured = rows.map(r => mirrorReceiptRowToStructured(r, params.integration));

  structured.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return structured;
}

/** Merge mirror-derived receipts with manually registered rows. */
export function mergeStructuredReceiptLists(a: StructuredReceipt[], b: StructuredReceipt[]) {
  const map = new Map<string, StructuredReceipt>();
  for (const item of [...a, ...b]) {
    map.set(item.id, item);
  }
  return [...map.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export function listManualStructuredReceipts() {
  return [...manualStructured];
}

/** Default wallet profile card — session signing is not yet a stored structured receipt unless mirrored. */
export function buildSessionStructuredStub(input: {
  walletAddress: string;
  cluster: SolanaCluster;
  sessionId: string;
}): StructuredReceipt {
  const now = new Date().toISOString();
  return {
    id: `sess_struct_${input.sessionId}`,
    receiptType: "wallet_session",
    subjectId: input.sessionId,
    subjectType: "wallet_session",
    walletAddress: input.walletAddress,
    cluster: input.cluster,
    title: "Solana wallet session",
    summary: "Backend-verified session bound to adapter public key (Bearer token is a cache, not identity).",
    status: "verified",
    proofStatus: "pending",
    createdAt: now,
    updatedAt: now,
    evidence: {
      explorerUrl: buildExplorerAddressUrl(input.walletAddress, input.cluster),
    },
    references: [],
    links: {
      explorer: buildExplorerAddressUrl(input.walletAddress, input.cluster),
    },
    provenance: {},
    claim: {
      text: "Wallet signed the session challenge; server verified ed25519 signature.",
      supportedBy: ["Solana wallet public key", "Session message + nonce"],
      unsupported: ["On-chain program receipt not implied by session alone"],
    },
    metadata: { source: "session-handshake" },
  };
}
