import { describe, expect, it } from "vitest";
import { buildCompactSolanaBridgeMemo, metadataDigest } from "./compactMemo";

describe("buildCompactSolanaBridgeMemo", () => {
  it("anchors digest metadata instead of embedding verbose JSON", () => {
    const meta = {
      summary: "LONG TEXT SHOULD NOT APPEAR IN MEMO",
      nested: { foo: "bar" },
    };
    const memo = buildCompactSolanaBridgeMemo(
      {
        requestId: "r1",
        action: "anchor_receipt",
        subjectId: "subj",
        payloadHash: "a".repeat(64),
        accountAddress: "acct",
        walletAddress: "wallet",
        cluster: "devnet",
      },
      meta,
    );
    expect(memo.startsWith("CLAW_SOL_BRIDGE_V1::")).toBe(true);
    expect(memo.includes("LONG TEXT")).toBe(false);
    const parsed = JSON.parse(memo.slice("CLAW_SOL_BRIDGE_V1::".length)) as {
      mh?: string;
    };
    expect(parsed.mh).toBe(metadataDigest(meta));
  });
});
