import crypto from "crypto";

export type CompactMemoInput = {
  requestId: string;
  action: string;
  subjectId: string;
  payloadHash: string;
  accountAddress: string;
  walletAddress: string;
  cluster: string;
};

/**
 * On-chain memo payloads must stay compact: hashes, IDs, and pointers — never full narratives or large JSON.
 */
export function metadataDigest(metadata?: Record<string, unknown>): string | undefined {
  if (!metadata || Object.keys(metadata).length === 0) return undefined;
  return crypto.createHash("sha256").update(JSON.stringify(metadata)).digest("hex").slice(0, 32);
}

export function buildCompactSolanaBridgeMemo(input: CompactMemoInput, metadata?: Record<string, unknown>): string {
  const mh = metadataDigest(metadata);
  const body: Record<string, string | number | undefined> = {
    v: 1,
    rid: input.requestId,
    a: input.action,
    sid: input.subjectId,
    ph: input.payloadHash,
    acct: input.accountAddress,
    w: input.walletAddress,
    c: input.cluster,
    mh,
  };
  Object.keys(body).forEach(k => {
    const key = k as keyof typeof body;
    if (body[key] === undefined) delete body[key];
  });
  return `CLAW_SOL_BRIDGE_V1::${JSON.stringify(body)}`;
}
