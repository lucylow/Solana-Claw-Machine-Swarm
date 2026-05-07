import { describe, expect, it } from "vitest";
import { calculateAutonomyScore, evaluatePolicyGate } from "./autonomy";

describe("autonomy policy gating", () => {
  it("blocks critical low-confidence actions", () => {
    const result = evaluatePolicyGate({
      autonomyLevel: "near_autonomous",
      confidence: 42,
      riskLevel: "critical",
    });
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("blocked");
  });

  it("auto-allows low-risk fully autonomous actions", () => {
    const result = evaluatePolicyGate({
      autonomyLevel: "fully_autonomous",
      confidence: 93,
      riskLevel: "low",
    });
    expect(result.allowed).toBe(true);
    expect(result.status).toBe("auto_allowed");
  });
});

describe("autonomy score", () => {
  it("returns high label for strong autonomy metrics", () => {
    const score = calculateAutonomyScore({
      independentDecisionRate: 92,
      manualInterventionRate: 8,
      memoryUseRate: 88,
      reflectionReuseRate: 84,
      policyPassRate: 95,
      proofCompleteness: 97,
      successRate: 91,
      confidenceCalibration: 90,
    });
    expect(score.score).toBeGreaterThan(80);
    expect(score.label).toBe("autonomous");
  });
});
