import { describe, expect, it } from "vitest";
import { buildDemoExecutionArtifacts } from "./buildDemoExecutionRun";
import {
  DEMO_AUTHORITY_WALLET,
  DEMO_SKILLS,
  DEMO_WALLET,
  buildExecutionSteps,
  buildPlan,
  buildReceipts,
} from "./demoFixtures";
import {
  applyStoryPlayback,
  getUnifiedStoryBeats,
} from "./demoUnifiedStoryPlayback";

describe("buildDemoExecutionArtifacts + story playback", () => {
  it("hydrates lineage fields for recovery outcome", () => {
    const skill =
      DEMO_SKILLS.find((s) => s.id === "skill-support-triage") ??
      DEMO_SKILLS[0]!;
    const plan = buildPlan(skill, "recovery");
    const steps = buildExecutionSteps("recovery");
    const receipts = buildReceipts(skill, "recovery");

    const { executionRun, reflection, traceableMemory, commandReceipts } =
      buildDemoExecutionArtifacts({
        wallet: DEMO_WALLET,
        skill,
        plan,
        stepFixtures: steps,
        receipts,
        outcome: "recovery",
      });

    expect(executionRun.walletAddress).toBe(DEMO_AUTHORITY_WALLET);
    expect(reflection).toBeTruthy();
    expect(traceableMemory?.sourceExecutionId).toBe(executionRun.id);
    expect(traceableMemory?.linkedNextTurnId).toBeTruthy();
    expect(commandReceipts.length).toBeGreaterThan(4);
    const operatorStep = executionRun.steps.find((s) =>
      s.title.includes("Execute primary"),
    );
    expect(operatorStep?.toolCalls?.length).toBeGreaterThan(0);
    expect(operatorStep?.receiptRefs?.length).toBeGreaterThan(0);
  });

  it("rewinds playback beats without mutating the terminal run snapshot", () => {
    const skill =
      DEMO_SKILLS.find((s) => s.id === "skill-support-triage") ??
      DEMO_SKILLS[0]!;
    const plan = buildPlan(skill, "recovery");
    const steps = buildExecutionSteps("recovery");
    const receipts = buildReceipts(skill, "recovery");
    const bundle = buildDemoExecutionArtifacts({
      wallet: DEMO_WALLET,
      skill,
      plan,
      stepFixtures: steps,
      receipts,
      outcome: "recovery",
    });

    const beats = getUnifiedStoryBeats("recovery");
    const early = applyStoryPlayback(bundle.executionRun, beats[0]!);
    expect(early.steps.every((s) => s.status === "pending")).toBe(true);
    expect(early.reflectionId).toBeUndefined();

    expect(bundle.executionRun.reflectionId).toBeTruthy();
  });
});
