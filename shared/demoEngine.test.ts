import { describe, expect, it } from "vitest";
import { buildDemoSnapshotForUI, demoPlaybackStepCount } from "./demoEngine";
import { getPlaybackFramesForScenario } from "./demoScenarioPlayback";
import { DEMO_SCENARIOS } from "./demoFixtures";

describe("interactive demo engine", () => {
  it("loads non-empty frames for every scenario", () => {
    for (const s of DEMO_SCENARIOS) {
      const frames = getPlaybackFramesForScenario(s.id, false);
      expect(frames.length).toBeGreaterThan(0);
      expect(demoPlaybackStepCount(s.id, false)).toBe(frames.length);
    }
  });

  it("advances snapshot deterministically across steps", () => {
    const a = buildDemoSnapshotForUI({
      scenarioId: "full-e2e",
      playbackOutcome: "recovery",
      forceError: false,
      selectedSkillId: "skill-support-triage",
      playbackStepIndex: 0,
      playbackStatus: "paused",
      presentationMode: false,
    });
    const b = buildDemoSnapshotForUI({
      scenarioId: "full-e2e",
      playbackOutcome: "recovery",
      forceError: false,
      selectedSkillId: "skill-support-triage",
      playbackStepIndex: 8,
      playbackStatus: "paused",
      presentationMode: false,
    });
    expect(a.stepIndex).toBe(0);
    expect(b.stepIndex).toBe(8);
    expect(a.execution?.currentStage).not.toEqual(b.execution?.currentStage);
    expect(a.scenarioId).toBe("full-e2e");
    expect(b.eventLog.length).toBeGreaterThan(a.eventLog.length);
  });

  it("forceError switches to failure arc", () => {
    const snap = buildDemoSnapshotForUI({
      scenarioId: "execute-task",
      playbackOutcome: "success",
      forceError: true,
      selectedSkillId: "skill-tool-exec",
      playbackStepIndex: 10,
      playbackStatus: "paused",
      presentationMode: false,
    });
    expect(snap.execution?.failureReason).toBeDefined();
    expect(snap.derived.hasFailure || snap.derived.dataPosture === "degraded").toBe(true);
  });

  it("labels demo-only proof posture on receipts", () => {
    const snap = buildDemoSnapshotForUI({
      scenarioId: "receipt-anchor",
      playbackOutcome: "success",
      forceError: false,
      selectedSkillId: "skill-receipt-anchor",
      playbackStepIndex: 2,
      playbackStatus: "paused",
      presentationMode: false,
    });
    expect(snap.proof?.metadata.demoMode).toBe(true);
    expect(["demo_only", "pending", "cached_only"]).toContain(snap.proof?.proofStatus);
  });

  it("openclaw-bridge exposes bridge state on later steps", () => {
    const early = buildDemoSnapshotForUI({
      scenarioId: "openclaw-bridge",
      playbackOutcome: "success",
      forceError: false,
      selectedSkillId: "skill-receipt-anchor",
      playbackStepIndex: 2,
      playbackStatus: "paused",
      presentationMode: false,
    });
    const late = buildDemoSnapshotForUI({
      scenarioId: "openclaw-bridge",
      playbackOutcome: "success",
      forceError: false,
      selectedSkillId: "skill-receipt-anchor",
      playbackStepIndex: 5,
      playbackStatus: "paused",
      presentationMode: false,
    });
    expect(late.openclaw?.importedCount ?? 0).toBeGreaterThanOrEqual(early.openclaw?.importedCount ?? 0);
  });
});
