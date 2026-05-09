import { describe, expect, it } from "vitest";
import { DaoStore } from "./daoStore";
import { DaoService } from "./daoService";

describe("DaoService governance accounting", () => {
  it("zeroes outbound delegator voting power and aggregates delegatee power", async () => {
    const store = new DaoStore(undefined);
    await store.init();
    const dao = new DaoService(store);
    await dao.bootstrap();

    await dao.registerMember(
      "WalletAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "WalletAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      2_000_000,
      5,
    );
    await dao.registerMember(
      "WalletBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      "WalletBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      1_000_000,
      5,
    );

    const a = "WalletAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const b = "WalletBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

    expect(dao.effectiveVotingPower(a)).toBeGreaterThan(0);
    await dao.delegateVotePower(a, b, "test");
    expect(dao.effectiveVotingPower(a)).toBe(0);
    expect(dao.effectiveVotingPower(b)).toBeGreaterThan(1_000_000);
  });

  it("prevents double vote on same proposal", async () => {
    const store = new DaoStore(undefined);
    await store.init();
    const dao = new DaoService(store);
    await dao.bootstrap();

    const w = "WalletCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    await dao.registerMember(w, w, 2_000_000, 5);
    await dao.createProposal({
      proposalId: 4242,
      proposer: w,
      title: "t",
      description: "d",
      kind: "text",
      skillKey: "",
      recipient: w,
      amountLamports: 0,
      startSlot: 0,
      endSlot: 0,
      quorumBps: 4000,
      approvalThresholdBps: 5000,
    });

    await dao.castVote(4242, w, "yes", "first");
    await expect(dao.castVote(4242, w, "no", "second")).rejects.toThrow(
      "already_voted",
    );
  });
});
