import { describe, expect, it } from "vitest";
import { buildDemoExecutionArtifacts } from "./buildDemoExecutionRun";
import {
  buildExecutionSteps,
  buildPlan,
  buildReceipts,
  DEMO_WALLET,
  getSkillById,
} from "./demoFixtures";
import {
  applyStoryPlayback,
  getUnifiedStoryBeats,
  SUCCESS_BEATS,
} from "./demoUnifiedStoryPlayback";

describe("demo unified story playback", () => {
  it("hides anchored proof linkage until receipt beats expose them", () => {
    const sk = getSkillById("skill-support-triage")!;
    const outcome = "recovery" as const;
    const steps = buildExecutionSteps(outcome);
    const receipts = buildReceipts(sk, outcome);
    const plan = buildPlan(sk, outcome);
    const art = buildDemoExecutionArtifacts({
      wallet: DEMO_WALLET,
      skill: sk,
      plan,
      stepFixtures: steps,
      receipts,
      outcome,
    });
    const first = getUnifiedStoryBeats(outcome)[0]!;
    const masked = applyStoryPlayback(art.executionRun, first);
    expect(masked.proofId).toBeUndefined();
    expect(masked.steps.every((s) => s.status === "pending")).toBe(true);

    const last = getUnifiedStoryBeats(outcome).at(-1)!;
    const full = applyStoryPlayback(art.executionRun, last);
    expect(full.proofId).toBeTruthy();
    expect(full.steps.every((s) => s.status === "succeeded")).toBe(true);
  });

  it("clears failure copy on retry beat after injecting memory", () => {
    const sk = getSkillById("skill-tool-exec")!;
    const outcome = "recovery" as const;
    const art = buildDemoExecutionArtifacts({
      wallet: DEMO_WALLET,
      skill: sk,
      plan: buildPlan(sk, outcome),
      stepFixtures: buildExecutionSteps(outcome),
      receipts: buildReceipts(sk, outcome),
      outcome,
    });
    const retryBeat = getUnifiedStoryBeats(outcome).find(
      (b) => b.id === "rv-12-retry",
    );
    expect(retryBeat).toBeTruthy();
    const scrubbed = applyStoryPlayback(art.executionRun, retryBeat!);
    expect(scrubbed.failureReason).toBeUndefined();
    expect(scrubbed.steps.find((s) => s.id === "ex-3")?.status).toBe("running");
  });

  it("success trajectory omits structured reflection linkage on terminal beat", () => {
    const sk = getSkillById("skill-receipt-anchor")!;
    const outcome = "success" as const;
    const art = buildDemoExecutionArtifacts({
      wallet: DEMO_WALLET,
      skill: sk,
      plan: buildPlan(sk, outcome),
      stepFixtures: buildExecutionSteps(outcome),
      receipts: buildReceipts(sk, outcome),
      outcome,
    });
    const terminal = SUCCESS_BEATS.at(-1)!;
    const surfaced = applyStoryPlayback(art.executionRun, terminal);
    expect(surfaced.reflectionId).toBeUndefined();
    expect(surfaced.memoryId).toBeUndefined();
  });
});
