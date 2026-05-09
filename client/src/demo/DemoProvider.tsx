import { buildDemoExecutionArtifacts } from "@shared/buildDemoExecutionRun";
import { buildDemoSnapshotForUI } from "@shared/demoEngine";
import { getPlaybackFramesForScenario } from "@shared/demoScenarioPlayback";
import { getUnifiedStoryBeats } from "@shared/demoUnifiedStoryPlayback";
import {
  buildAgentsForScenario,
  buildExecutionSteps,
  buildMemoryTimeline,
  buildPlan,
  buildReceipts,
  DEMO_SCENARIOS,
  DEMO_SKILLS,
  DEMO_WALLET,
  getSkillById,
} from "@shared/demoFixtures";
import type { DemoSnapshot } from "@shared/demoEngineTypes";
import type { DemoPlaybackFrame } from "@shared/demoEngineTypes";
import type {
  DemoAgentFixture,
  DemoExecutionStepFixture,
  DemoMemoryFixture,
  DemoMemoryTimelineStage,
  DemoPlanFixture,
  DemoReceiptFixture,
  DemoReflectionFixture,
  DemoRunOutcome,
  DemoScenarioFixture,
  DemoSection,
  DemoSkillFixture,
} from "@shared/demoTypes";
import {
  memoryRecordToDemoFixture,
  reflectionRecordToDemoFixture,
} from "@shared/demoUiAdapter";
import type { ExecutionRun, UnifiedStoryBeat } from "@shared/executionStory";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type { DemoSection };

export interface DemoContextValue {
  walletConnectedDemo: boolean;
  setWalletConnectedDemo: (v: boolean) => void;
  selectedScenarioId: DemoScenarioFixture["id"];
  setSelectedScenarioId: (id: DemoScenarioFixture["id"]) => void;
  selectedSkillId: string;
  setSelectedSkillId: (id: string) => void;
  runOutcome: DemoRunOutcome;
  setRunOutcome: (o: DemoRunOutcome) => void;
  presentationMode: boolean;
  setPresentationMode: (v: boolean) => void;

  /** Canonical snapshot — drives wallet, execution, receipts, 0G, OpenClaw, timeline, events */
  demoSnapshot: DemoSnapshot;
  playbackFrames: DemoPlaybackFrame[];
  activeUnifiedBeat: UnifiedStoryBeat;

  storyPlaybackIndex: number;
  setStoryPlaybackIndex: (i: number | ((p: number) => number)) => void;
  storyPlaybackAutoplay: boolean;
  setStoryPlaybackAutoplay: (v: boolean) => void;
  storyBeatCount: number;
  replayStory: () => void;
  playbackDrivesDemoWallet: boolean;
  setPlaybackDrivesDemoWallet: (v: boolean) => void;

  storyBeatsVersion: "_interactive_demo_engine_v3";

  showPresenterNotes: boolean;
  setShowPresenterNotes: (v: boolean) => void;
  simulateLoading: boolean;
  setSimulateLoading: (v: boolean) => void;
  forceError: boolean;
  setForceError: (v: boolean) => void;

  activeScenario: DemoScenarioFixture;
  activeSkill: DemoSkillFixture;
  plan: DemoPlanFixture;
  agents: DemoAgentFixture[];
  steps: DemoExecutionStepFixture[];
  reflection: DemoReflectionFixture | null;
  memory: DemoMemoryFixture | null;
  receipts: DemoReceiptFixture[];
  memoryTimeline: DemoMemoryTimelineStage[];
  executionRunFull: ExecutionRun;
  displayedExecutionRun: ExecutionRun;

  reflectionStory: ReturnType<typeof buildDemoExecutionArtifacts>["reflection"];
  traceableMemory: ReturnType<
    typeof buildDemoExecutionArtifacts
  >["traceableMemory"];
  commandReceipts: ReturnType<
    typeof buildDemoExecutionArtifacts
  >["commandReceipts"];

  applyScenarioDefaults: () => void;

  guidedStepIndex: number;
  setGuidedStepIndex: (i: number | ((p: number) => number)) => void;
  guidedAutoplay: boolean;
  setGuidedAutoplay: (v: boolean) => void;
  guidedStepCount: number;
  replayGuided: () => void;
}

const DemoCtx = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [walletConnectedDemo, setWalletConnectedDemo] = useState(false);
  const [playbackDrivesDemoWallet, setPlaybackDrivesDemoWallet] =
    useState(true);
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<DemoScenarioFixture["id"]>("full-e2e");
  const [selectedSkillId, setSelectedSkillId] = useState<string>(
    "skill-support-triage",
  );
  const [runOutcome, setRunOutcome] = useState<DemoRunOutcome>("recovery");
  const [presentationMode, setPresentationMode] = useState(false);
  const [storyPlaybackIndex, setStoryPlaybackIndex] = useState(0);
  const [storyPlaybackAutoplay, setStoryPlaybackAutoplay] = useState(false);
  const [showPresenterNotes, setShowPresenterNotes] = useState(true);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [forceError, setForceError] = useState(false);

  const activeScenario = useMemo(
    () =>
      DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId) ??
      DEMO_SCENARIOS[DEMO_SCENARIOS.length - 1]!,
    [selectedScenarioId],
  );

  const applyScenarioDefaults = useCallback(() => {
    setSelectedSkillId(activeScenario.defaultSkillId);
    setRunOutcome(activeScenario.preferredOutcome);
  }, [activeScenario.defaultSkillId, activeScenario.preferredOutcome]);

  useEffect(() => {
    applyScenarioDefaults();
  }, [applyScenarioDefaults, selectedScenarioId]);

  const activeSkill = useMemo(
    () => getSkillById(selectedSkillId) ?? DEMO_SKILLS[0]!,
    [selectedSkillId],
  );

  const effectiveOutcome = useMemo((): DemoRunOutcome => {
    if (forceError) return "failure";
    return runOutcome;
  }, [forceError, runOutcome]);

  const playbackFrames = useMemo(
    () => getPlaybackFramesForScenario(selectedScenarioId, forceError),
    [selectedScenarioId, forceError],
  );

  const storyBeatCount = playbackFrames.length;

  const demoSnapshot = useMemo(
    () =>
      buildDemoSnapshotForUI({
        scenarioId: selectedScenarioId,
        playbackOutcome: effectiveOutcome,
        forceError,
        selectedSkillId,
        playbackStepIndex: storyPlaybackIndex,
        playbackStatus: storyPlaybackAutoplay ? "playing" : "paused",
        presentationMode,
      }),
    [
      selectedScenarioId,
      effectiveOutcome,
      forceError,
      selectedSkillId,
      storyPlaybackIndex,
      storyPlaybackAutoplay,
      presentationMode,
    ],
  );

  const unifiedBeats = useMemo(
    () => getUnifiedStoryBeats(effectiveOutcome),
    [effectiveOutcome],
  );
  const activeFrame =
    playbackFrames[
      Math.min(storyPlaybackIndex, Math.max(storyBeatCount - 1, 0))
    ] ?? playbackFrames[0]!;
  const activeUnifiedBeat =
    unifiedBeats[activeFrame.beatIndex] ?? unifiedBeats[0]!;

  const plan = useMemo(
    () => buildPlan(activeSkill, effectiveOutcome),
    [activeSkill, effectiveOutcome],
  );
  const agents = useMemo(
    () => buildAgentsForScenario(selectedScenarioId, effectiveOutcome),
    [effectiveOutcome, selectedScenarioId],
  );
  const steps = useMemo(
    () => buildExecutionSteps(effectiveOutcome),
    [effectiveOutcome],
  );
  const receipts = useMemo(
    () => buildReceipts(activeSkill, effectiveOutcome),
    [activeSkill, effectiveOutcome],
  );
  const memoryTimeline = useMemo(
    () => buildMemoryTimeline(effectiveOutcome !== "success"),
    [effectiveOutcome],
  );

  const artifact = useMemo(
    () =>
      buildDemoExecutionArtifacts({
        wallet: DEMO_WALLET,
        skill: activeSkill,
        plan,
        stepFixtures: steps,
        receipts,
        outcome: effectiveOutcome,
      }),
    [activeSkill, plan, steps, receipts, effectiveOutcome],
  );

  const executionRunFull = artifact.executionRun;
  const displayedExecutionRun = demoSnapshot.execution ?? executionRunFull;

  const reflection = useMemo((): DemoReflectionFixture | null => {
    if (!demoSnapshot.reflection) return null;
    return reflectionRecordToDemoFixture(demoSnapshot.reflection);
  }, [demoSnapshot.reflection]);

  const memory = useMemo((): DemoMemoryFixture | null => {
    if (!demoSnapshot.memory) return null;
    return memoryRecordToDemoFixture(demoSnapshot.memory);
  }, [demoSnapshot.memory]);

  useEffect(() => {
    setStoryPlaybackIndex(0);
  }, [effectiveOutcome, selectedScenarioId, forceError]);

  useEffect(() => {
    setStoryPlaybackIndex((idx) =>
      Math.min(idx, Math.max(storyBeatCount - 1, 0)),
    );
  }, [storyBeatCount]);

  useEffect(() => {
    if (!storyPlaybackAutoplay) return undefined;
    const i = Math.min(storyPlaybackIndex, Math.max(storyBeatCount - 1, 0));
    const delay =
      (playbackFrames[i]?.delayMs ?? 4800) * (presentationMode ? 1.15 : 1);
    const id = window.setTimeout(() => {
      setStoryPlaybackIndex((prev) =>
        prev >= storyBeatCount - 1 ? 0 : prev + 1,
      );
    }, delay);
    return () => window.clearTimeout(id);
  }, [
    storyPlaybackAutoplay,
    presentationMode,
    playbackFrames,
    storyPlaybackIndex,
    storyBeatCount,
  ]);

  useEffect(() => {
    if (!playbackDrivesDemoWallet) return undefined;
    setWalletConnectedDemo(Boolean(demoSnapshot.wallet.connected));
    return undefined;
  }, [playbackDrivesDemoWallet, demoSnapshot.wallet.connected]);

  const replayStory = useCallback(() => {
    setStoryPlaybackIndex(0);
  }, []);

  const setGuidedStepIndex = useCallback(
    (i: number | ((p: number) => number)) => {
      setStoryPlaybackIndex(i);
    },
    [],
  );

  const setGuidedAutoplay = useCallback((v: boolean) => {
    setStoryPlaybackAutoplay(v);
  }, []);

  const replayGuided = replayStory;
  const guidedStepCount = storyBeatCount;
  const activeBeatIndex = Math.min(
    storyPlaybackIndex,
    Math.max(storyBeatCount - 1, 0),
  );

  const value = useMemo(
    () => ({
      walletConnectedDemo,
      setWalletConnectedDemo,
      selectedScenarioId,
      setSelectedScenarioId,
      selectedSkillId,
      setSelectedSkillId,
      runOutcome,
      setRunOutcome,
      presentationMode,
      setPresentationMode,
      demoSnapshot,
      playbackFrames,
      activeUnifiedBeat,
      storyPlaybackIndex,
      setStoryPlaybackIndex,
      storyPlaybackAutoplay,
      setStoryPlaybackAutoplay,
      storyBeatCount,
      replayStory,
      playbackDrivesDemoWallet,
      setPlaybackDrivesDemoWallet,
      storyBeatsVersion: "_interactive_demo_engine_v3" as const,
      showPresenterNotes,
      setShowPresenterNotes,
      simulateLoading,
      setSimulateLoading,
      forceError,
      setForceError,
      activeScenario,
      activeSkill,
      plan,
      agents,
      steps,
      reflection,
      memory,
      receipts,
      memoryTimeline,
      executionRunFull,
      displayedExecutionRun,
      reflectionStory: artifact.reflection,
      traceableMemory: artifact.traceableMemory,
      commandReceipts: artifact.commandReceipts,
      applyScenarioDefaults,
      guidedStepIndex: activeBeatIndex,
      setGuidedStepIndex,
      guidedAutoplay: storyPlaybackAutoplay,
      setGuidedAutoplay,
      guidedStepCount,
      replayGuided,
    }),
    [
      walletConnectedDemo,
      selectedScenarioId,
      selectedSkillId,
      runOutcome,
      presentationMode,
      demoSnapshot,
      playbackFrames,
      activeUnifiedBeat,
      storyPlaybackIndex,
      storyPlaybackAutoplay,
      storyBeatCount,
      replayStory,
      playbackDrivesDemoWallet,
      showPresenterNotes,
      simulateLoading,
      forceError,
      activeScenario,
      activeSkill,
      plan,
      agents,
      steps,
      reflection,
      memory,
      receipts,
      memoryTimeline,
      executionRunFull,
      displayedExecutionRun,
      artifact.reflection,
      artifact.traceableMemory,
      artifact.commandReceipts,
      applyScenarioDefaults,
      activeBeatIndex,
      setGuidedStepIndex,
      setGuidedAutoplay,
      guidedStepCount,
      replayGuided,
    ],
  );

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo(): DemoContextValue {
  const v = useContext(DemoCtx);
  if (!v) throw new Error("useDemo must be used within DemoProvider");
  return v;
}
