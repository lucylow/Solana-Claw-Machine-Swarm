import { describe, expect, it } from "vitest";
import { buildDappActivityFromState } from "./DappActivityTimeline";
import { DEMO_CHAIN_RECEIPT } from "@shared/solana/demoCanonical";

describe("buildDappActivityFromState", () => {
  it("marks the wallet step as active when not yet connected", () => {
    const items = buildDappActivityFromState({
      walletConnected: false,
      sessionVerified: false,
    });
    const wallet = items.find((i) => i.kind === "wallet_connect");
    expect(wallet?.status).toBe("pending");
  });

  it("flows from wallet → session → action → tx → receipt as state advances", () => {
    const items = buildDappActivityFromState({
      walletConnected: true,
      sessionVerified: true,
      skillSelected: true,
      actionPrepared: true,
      txSignature: "sig123",
      txConfirmed: true,
      receiptAnchored: true,
      proofVerified: true,
      memoryUpdated: true,
    });

    const status = (kind: string) => items.find((i) => i.kind === kind)?.status;

    expect(status("wallet_connect")).toBe("complete");
    expect(status("session_verify")).toBe("complete");
    expect(status("skill_selected")).toBe("complete");
    expect(status("action_prepared")).toBe("complete");
    expect(status("tx_signed")).toBe("complete");
    expect(status("tx_submitted")).toBe("complete");
    expect(status("tx_confirmed")).toBe("complete");
    expect(status("receipt_anchored")).toBe("complete");
    expect(status("proof_verified")).toBe("complete");
    expect(status("memory_updated")).toBe("complete");
  });

  it("attaches a tx signature to the receipt anchor row when receipts include a confirmed proof", () => {
    const items = buildDappActivityFromState({
      walletConnected: true,
      sessionVerified: true,
      txSignature: "abc",
      receipts: [DEMO_CHAIN_RECEIPT],
    });
    const anchored = items.find((i) => i.kind === "receipt_anchored");
    expect(anchored?.txSignature).toBe(DEMO_CHAIN_RECEIPT.txSignature);
  });

  it("propagates the demo flag to every row when set", () => {
    const items = buildDappActivityFromState({
      walletConnected: true,
      sessionVerified: true,
      demo: true,
    });
    expect(items.every((i) => i.demo === true)).toBe(true);
  });

  it("marks a failure step when failureKind is supplied", () => {
    const items = buildDappActivityFromState({
      walletConnected: true,
      sessionVerified: true,
      txSignature: "sig",
      failureKind: "tx_confirmed",
    });
    const failed = items.find((i) => i.kind === "tx_confirmed");
    expect(failed?.status).toBe("failed");
  });
});
