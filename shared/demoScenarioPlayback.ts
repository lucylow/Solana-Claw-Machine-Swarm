import type { DemoScenarioId } from "./demoTypes";
import type { DemoPlaybackFrame } from "./demoEngineTypes";

function seq(
  indices: number[],
  delayMs: number,
  extras?: Partial<DemoPlaybackFrame>[]
): DemoPlaybackFrame[] {
  return indices.map((beatIndex, i) => ({
    beatIndex,
    delayMs,
    ...(extras?.[i] ?? {}),
  }));
}

/** Full failure arc (degraded terminal) — 11 beats. */
export const FAILURE_PLAYBACK_FRAMES: DemoPlaybackFrame[] = seq(
  Array.from({ length: 11 }, (_, i) => i),
  850
);

/** Full recovery arc — 15 beats. */
export const RECOVERY_PLAYBACK_FRAMES: DemoPlaybackFrame[] = seq(
  Array.from({ length: 15 }, (_, i) => i),
  800
);

/** Clean success arc — 9 beats. */
export const SUCCESS_PLAYBACK_FRAMES: DemoPlaybackFrame[] = seq(
  Array.from({ length: 9 }, (_, i) => i),
  750
);

/**
 * Scenario-specific playback frames (beat indices into getUnifiedStoryBeats(outcome)).
 * Outcome is scenario.preferredOutcome unless forceError (failure beats).
 */
export const DEMO_SCENARIO_PLAYBACK: Record<DemoScenarioId, DemoPlaybackFrame[]> = {
  "wallet-skill-discovery": seq([0, 1, 2, 3, 4], 720),
  "publish-skill": seq([2, 3, 4, 5, 6, 7, 8], 780),
  "execute-task": SUCCESS_PLAYBACK_FRAMES,
  "failure-reflection-memory": RECOVERY_PLAYBACK_FRAMES,
  "receipt-anchor": seq([6, 7, 8], 900),
  "reputation-update": seq([7, 8], 880),
  "multi-agent": seq([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 820),
  "full-e2e": RECOVERY_PLAYBACK_FRAMES,
  "proof-degraded": FAILURE_PLAYBACK_FRAMES,
  "openclaw-bridge": [
    { beatIndex: 0, delayMs: 700 },
    { beatIndex: 1, delayMs: 720 },
    { beatIndex: 2, delayMs: 740 },
    { beatIndex: 3, delayMs: 760 },
    {
      beatIndex: 4,
      delayMs: 900,
      annotation: "OpenClaw import — skill manifest translated with compatibility checks.",
      openclaw: {
        connected: true,
        mode: "import",
        lastSyncAt: "2026-05-07T09:12:30.000Z",
        importedCount: 11,
        exportedCount: 1,
      },
    },
    {
      beatIndex: 5,
      delayMs: 880,
      openclaw: {
        connected: true,
        mode: "sync",
        lastSyncAt: "2026-05-07T09:13:05.000Z",
        importedCount: 12,
        exportedCount: 3,
      },
    },
    {
      beatIndex: 6,
      delayMs: 900,
      zerog: {
        storage: {
          available: true,
          connected: true,
          lastUploadAt: "2026-05-07T09:13:40.000Z",
        },
        da: {
          available: true,
          connected: true,
          lastBatchAt: "2026-05-07T09:13:41.200Z",
          lastRootHash: "da_root_7Qk2mN9pL4vR8sT1uV3wX5yZ6aB0cD2eF4gH8jK",
        },
        mode: "mock",
      },
    },
    {
      beatIndex: 7,
      delayMs: 920,
      annotation: "Bridge export — CLAW skill mirrored back to OpenClaw with provenance hash.",
      openclaw: {
        connected: true,
        mode: "export",
        lastSyncAt: "2026-05-07T09:14:12.000Z",
        importedCount: 12,
        exportedCount: 7,
      },
    },
    {
      beatIndex: 8,
      delayMs: 860,
      openclaw: {
        connected: true,
        mode: "sync",
        lastSyncAt: "2026-05-07T09:14:45.000Z",
        importedCount: 12,
        exportedCount: 8,
      },
    },
  ],
};

export function getPlaybackFramesForScenario(
  scenarioId: DemoScenarioId,
  forceError: boolean
): DemoPlaybackFrame[] {
  if (forceError) {
    return FAILURE_PLAYBACK_FRAMES;
  }
  return DEMO_SCENARIO_PLAYBACK[scenarioId] ?? RECOVERY_PLAYBACK_FRAMES;
}
