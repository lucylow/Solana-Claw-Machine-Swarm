import crypto from "crypto";
import type { DaStatus, ZeroGDaAdapter, ZeroGDaRecord } from "@shared/zerog";

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function leafHash(payloadHash: string, subjectId: string, ts: string) {
  return crypto.createHash("sha256").update(`${payloadHash}|${subjectId}|${ts}`).digest("hex");
}

function combineRoot(hashes: string[]) {
  return hashes.reduce((acc, h) => crypto.createHash("sha256").update(`${acc}:${h}`).digest("hex"), "GENESIS");
}

/** Append-only DA log + batch roots (demo/mock-safe). */
export class CanonicalDaService implements ZeroGDaAdapter {
  private readonly records: ZeroGDaRecord[] = [];
  private readonly roots = new Map<string, { batchId: string; createdAt: string; status: DaStatus }>();

  async appendRecord(input: {
    subjectType: string;
    subjectId: string;
    kind: string;
    payloadHash: string;
    blobRef?: string;
    wallet?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ZeroGDaRecord> {
    const batchId = `batch_${input.subjectType}_${input.subjectId}`.slice(0, 64);
    const createdAt = new Date().toISOString();
    const lh = leafHash(input.payloadHash, input.subjectId, createdAt);
    const rootHash = combineRoot([lh]);
    const rec: ZeroGDaRecord = {
      id: randomId("da"),
      batchId,
      rootHash,
      leafHash: lh,
      payloadHash: input.payloadHash,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      createdAt,
      uri: input.blobRef ? `zg://da/leaves/${lh.slice(0, 16)}` : undefined,
      status: "rooted",
    };
    this.records.unshift(rec);
    return rec;
  }

  async appendBatch(input: {
    batchType: string;
    subjectType: string;
    subjectId?: string;
    records: ZeroGDaRecord[];
    metadata?: Record<string, unknown>;
  }): Promise<{ batchId: string; rootHash: string; batchUri?: string; createdAt: string }> {
    const batchId = randomId(`batch_${input.batchType}`);
    const createdAt = new Date().toISOString();
    const hashes = input.records.map(r => r.leafHash);
    const rootHash = hashes.length ? combineRoot(hashes) : crypto.randomBytes(32).toString("hex");
    this.roots.set(rootHash, { batchId, createdAt, status: "batched" });
    return {
      batchId,
      rootHash,
      batchUri: `zg://da/batches/${batchId}`,
      createdAt,
    };
  }

  async verifyBatch(rootHash: string): Promise<boolean> {
    const row = this.roots.get(rootHash);
    if (!row) return false;
    this.roots.set(rootHash, { ...row, status: "verified" });
    return true;
  }

  listRecords() {
    return [...this.records];
  }
}

/** Shared append-only lane for sidecar orchestration + HTTP DA routes. */
export const canonicalDaService = new CanonicalDaService();
