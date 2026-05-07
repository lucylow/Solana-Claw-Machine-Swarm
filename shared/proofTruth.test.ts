import { describe, expect, it } from "vitest";
import { DEMO_CHAIN_RECEIPT } from "./solana/demoCanonical";
import {
  canClaimAnchored,
  domainReceiptsToStructured,
  getClaimText,
  getReceiptTruthLine,
  solanaTxRecordToStructured,
} from "./proofTruth";
import type { ReceiptRecord } from "./domainModel";

describe("proofTruth", () => {
  it("labels demo Solana rows as cache-only when demoMode", () => {
    const s = solanaTxRecordToStructured(DEMO_CHAIN_RECEIPT, { demoMode: true });
    expect(s.proofStatus).toBe("cached_only");
    expect(s.status).toBe("cached");
    expect(getReceiptTruthLine(s)).toContain("Demo");
  });

  it("does not claim anchored without verified proof chain row", () => {
    const s = solanaTxRecordToStructured(DEMO_CHAIN_RECEIPT);
    expect(canClaimAnchored(s)).toBe(false);
    expect(getClaimText(s)).toContain("unavailable");
  });

  it("maps domain receipts to structured claims", () => {
    const row: ReceiptRecord = {
      id: "r1",
      type: "proof",
      subjectId: "sub",
      subjectType: "execution_proof",
      wallet: "9q2x8sFz3wJmYcP4VnK7aL1tR6eU2bQ8hJ5mX9pZ",
      chainId: 103,
      txSignature: "abc",
      summaryHash: "hashhashhashhash",
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      explorerUrl: "https://explorer.solana.com/tx/abc",
      metadata: { executionId: "ex1" },
    };
    const [structured] = domainReceiptsToStructured([row]);
    expect(structured.proofStatus).toBe("pending");
    expect(structured.provenance.sourceExecutionId).toBe("ex1");
    expect(getReceiptTruthLine(structured)).toContain("pending");
  });
});
