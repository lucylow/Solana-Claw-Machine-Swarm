import type { DemoEngineInput, DemoSnapshot } from "./demoEngineTypes";
import { getPlaybackFramesForScenario } from "./demoScenarioPlayback";
import { buildDemoSnapshot } from "./demoSnapshotBuild";

/** Single entry: scenario + playback index → authoritative demo snapshot for UI. */
export function buildDemoSnapshotForUI(input: DemoEngineInput): DemoSnapshot {
  const frames = getPlaybackFramesForScenario(input.scenarioId, input.forceError);
  return buildDemoSnapshot({
    scenarioId: input.scenarioId,
    playbackOutcome: input.playbackOutcome,
    forceError: input.forceError,
    selectedSkillId: input.selectedSkillId,
    playbackStepIndex: input.playbackStepIndex,
    playbackStatus: input.playbackStatus,
    frames,
  });
}

export function demoPlaybackStepCount(scenarioId: import("./demoTypes").DemoScenarioId, forceError: boolean): number {
  return getPlaybackFramesForScenario(scenarioId, forceError).length;
}
