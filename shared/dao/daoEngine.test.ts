import { describe, expect, it } from "vitest";
import {
  approvalRatio,
  deriveCanonicalStatus,
  participationBpsFromCounts,
  quorumMetBps,
  thresholdMet,
} from "./engine";

describe("dao engine", () => {
  it("computes participation bps", () => {
    expect(participationBpsFromCounts(2, 4)).toBe(5000);
    expect(participationBpsFromCounts(0, 10)).toBe(0);
  });

  it("detects quorum", () => {
    expect(quorumMetBps(4000, 4000)).toBe(true);
    expect(quorumMetBps(3999, 4000)).toBe(false);
  });

  it("computes approval ratio excluding abstain", () => {
    expect(approvalRatio(6, 4)).toBeCloseTo(0.6);
    expect(approvalRatio(0, 0)).toBe(0);
  });

  it("threshold met", () => {
    expect(thresholdMet(0.55, 0.5)).toBe(true);
    expect(thresholdMet(0.45, 0.5)).toBe(false);
  });

  it("derives canonical status for voting", () => {
    expect(
      deriveCanonicalStatus({
        legacyStatus: "active",
        participationBps: 2000,
        quorumBps: 4000,
        approval: 0.6,
        threshold: 0.5,
        finalized: false,
        executed: false,
      }),
    ).toBe("voting");

    expect(
      deriveCanonicalStatus({
        legacyStatus: "active",
        participationBps: 4500,
        quorumBps: 4000,
        approval: 0.6,
        threshold: 0.5,
        finalized: false,
        executed: false,
      }),
    ).toBe("quorum_reached");
  });

  it("maps terminal legacy states", () => {
    expect(
      deriveCanonicalStatus({
        legacyStatus: "executed",
        participationBps: 0,
        quorumBps: 4000,
        approval: 0,
        threshold: 0.5,
        finalized: true,
        executed: true,
      }),
    ).toBe("executed");

    expect(
      deriveCanonicalStatus({
        legacyStatus: "defeated",
        participationBps: 5000,
        quorumBps: 4000,
        approval: 0.4,
        threshold: 0.5,
        finalized: true,
        executed: false,
      }),
    ).toBe("rejected");
  });
});
