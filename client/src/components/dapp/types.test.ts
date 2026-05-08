import { describe, expect, it } from "vitest";
import {
  DAPP_TX_STATUS_HINT,
  DAPP_TX_STATUS_LABEL,
  type TransactionStatus,
} from "./types";

const STATUSES: TransactionStatus[] = [
  "idle",
  "preparing",
  "signing",
  "submitted",
  "confirming",
  "confirmed",
  "failed",
  "expired",
  "degraded",
];

describe("dApp transaction status copy", () => {
  it("provides a label for every transaction status", () => {
    for (const status of STATUSES) {
      expect(DAPP_TX_STATUS_LABEL[status], status).toBeTruthy();
    }
  });

  it("provides a hint for every transaction status", () => {
    for (const status of STATUSES) {
      expect(DAPP_TX_STATUS_HINT[status], status).toBeTruthy();
    }
  });

  it("uses dApp-flavoured copy (not generic)", () => {
    expect(DAPP_TX_STATUS_HINT.signing.toLowerCase()).toContain("wallet");
    expect(DAPP_TX_STATUS_HINT.submitted.toLowerCase()).toContain("cluster");
    expect(DAPP_TX_STATUS_HINT.confirmed.toLowerCase()).toContain("solana");
    expect(DAPP_TX_STATUS_HINT.expired.toLowerCase()).toContain("blockhash");
  });
});
