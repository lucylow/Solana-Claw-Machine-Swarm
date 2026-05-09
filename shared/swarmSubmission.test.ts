import { describe, expect, it } from "vitest";
import {
  calculateSwarmSubmissionScore,
  clampScore,
  SWARM_JUDGING_CRITERIA,
} from "./swarmSubmission";

describe("swarmSubmission", () => {
  it("keeps SWARM judging weights aligned with the published rubric", () => {
    expect(SWARM_JUDGING_CRITERIA.map((criterion) => criterion.weight)).toEqual(
      [40, 30, 30],
    );
    expect(
      SWARM_JUDGING_CRITERIA.reduce(
        (total, criterion) => total + criterion.weight,
        0,
      ),
    ).toBe(100);
  });

  it("clamps invalid judge scores into a safe 0-100 range", () => {
    expect(clampScore(-20)).toBe(0);
    expect(clampScore(120)).toBe(100);
    expect(clampScore(Number.NaN)).toBe(0);
    expect(clampScore(87.5)).toBe(87.5);
  });

  it("computes weighted submission readiness points", () => {
    const result = calculateSwarmSubmissionScore({
      innovation: 95,
      agenticSophistication: 90,
      traction: 80,
    });

    expect(result.breakdown).toEqual([
      {
        criterion: "innovation",
        normalizedScore: 95,
        weightedPoints: 38,
      },
      {
        criterion: "agenticSophistication",
        normalizedScore: 90,
        weightedPoints: 27,
      },
      {
        criterion: "traction",
        normalizedScore: 80,
        weightedPoints: 24,
      },
    ]);
    expect(result.total).toBe(89);
  });
});
