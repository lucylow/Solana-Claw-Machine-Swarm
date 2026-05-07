import { buildDemoExecutionArtifacts } from "@shared/buildDemoExecutionRun";
import { applyStoryPlayback, getUnifiedStoryBeats } from "@shared/demoUnifiedStoryPlayback";
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
import type { ExecutionRun } from "@shared/executionStory";
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
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

  /** Story playback (execution stage rail + highlights) */
  storyPlaybackIndex: number;
  setStoryPlaybackIndex: (i: number | ((p: number) => number)) => void;
  storyPlaybackAutoplay: boolean;
  setStoryPlaybackAutoplay: (v: boolean) => void;
  storyBeatCount: number;
  replayStory: () => void;
  /** When true, wallet card follows playback patches (beats 01–…) */
  playbackDrivesDemoWallet: boolean;
  setPlaybackDrivesDemoWallet: (v: boolean) => void;

  storyBeatsVersion: "_unified_story_engine_v2";

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
  traceableMemory: ReturnType<typeof buildDemoExecutionArtifacts>["traceableMemory"];
  commandReceipts: ReturnType<typeof buildDemoExecutionArtifacts>["commandReceipts"];

  applyScenarioDefaults: () => void;

  /** @deprecated Guided stepper migrated to unified story beats — use storyPlaybackIndex */
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
  const [playbackDrivesDemoWallet, setPlaybackDrivesDemoWallet] = useState(true);
  const [selectedScenarioId, setSelectedScenarioId] = useState<DemoScenarioFixture["id"]>("full-e2e");
  const [selectedSkillId, setSelectedSkillId] = useState<string>("skill-support-triage");
  const [runOutcome, setRunOutcome] = useState<DemoRunOutcome>("recovery");
  const [presentationMode, setPresentationMode] = useState(false);
  const [storyPlaybackIndex, setStoryPlaybackIndex] = useState(0);
  const [storyPlaybackAutoplay, setStoryPlaybackAutoplay] = useState(false);
  const [showPresenterNotes, setShowPresenterNotes] = useState(true);
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [forceError, setForceError] = useState(false);

  const activeScenario = useMemo(
    () => DEMO_SCENARIOS.find(s => s.id === selectedScenarioId) ?? DEMO_SCENARIOS[DEMO_SCENARIOS.length - 1]!,
    [selectedScenarioId]
  );

  const applyScenarioDefaults = useCallback(() => {
    setSelectedSkillId(activeScenario.defaultSkillId);
    setRunOutcome(activeScenario.preferredOutcome);
  }, [activeScenario.defaultSkillId, activeScenario.preferredOutcome]);

  useEffect(() => {
    applyScenarioDefaults();
  }, [applyScenarioDefaults, selectedScenarioId]);

  const activeSkill = useMemo(() => getSkillById(selectedSkillId) ?? DEMO_SKILLS[0]!, [selectedSkillId]);

  const effectiveOutcome = useMemo((): DemoRunOutcome => {
    if (forceError) return "failure";
    return runOutcome;
  }, [forceError, runOutcome]);

  const plan = useMemo(() => buildPlan(activeSkill, effectiveOutcome), [activeSkill, effectiveOutcome]);
  const agents = useMemo(
    () => buildAgentsForScenario(selectedScenarioId, effectiveOutcome),
    [effectiveOutcome, selectedScenarioId]
  );
  const steps = useMemo(() => buildExecutionSteps(effectiveOutcome), [effectiveOutcome]);
  const receipts = useMemo(() => buildReceipts(activeSkill, effectiveOutcome), [activeSkill, effectiveOutcome]);
  const memoryTimeline = useMemo(
    () => buildMemoryTimeline(effectiveOutcome !== "success"),
    [effectiveOutcome]
  );

  const storyBeats = useMemo(() => getUnifiedStoryBeats(effectiveOutcome), [effectiveOutcome]);
  const storyBeatCount = storyBeats.length;

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
    [activeSkill, plan, steps, receipts, effectiveOutcome]
  );

  const executionRunFull = artifact.executionRun;
  const activeBeatIndex = Math.min(storyPlaybackIndex, Math.max(storyBeatCount - 1, 0));
  const activeBeat = storyBeats[activeBeatIndex] ?? storyBeats[0];
  const displayedExecutionRun = useMemo(
    () => (activeBeat ? applyStoryPlayback(executionRunFull, activeBeat) : executionRunFull),
    [activeBeat, executionRunFull]
  );

  const reflection = useMemo((): DemoReflectionFixture | null => {
    const r = artifact.reflection;
    if (!r) return null;
    return {
      id: r.id,
      sourceTurnId: r.sourceTurnId,
      outcome: effectiveOutcome === "recovery" ? "lesson" : effectiveOutcome === "failure" ? "failure" : "success",
      rootCause: r.rootCause,
      correctiveAdvice: r.correctiveAdvice,
      nextAction: r.nextAction,
      confidence: effectiveOutcome === "recovery" ? 91 : effectiveOutcome === "failure" ? 74 : 88,
      linkedMemoryId: artifact.traceableMemory?.id ?? "",
      linkedReceiptId: r.proofRef ?? receipts.find(x => x.kind === "reflection_store")?.id ?? "",
      proofStatus: r.status === "verified" ? "verified" : r.status === "degraded" ? "failed" : "pending",
    };
  }, [artifact.reflection, artifact.traceableMemory, effectiveOutcome, receipts]);

  const memory = useMemo((): DemoMemoryFixture | null => {
    const tm = artifact.traceableMemory;
    if (!tm) return null;
    return {
      id: tm.id,
      memoryType: tm.kind,
      source: artifact.reflection ? `Reflection ${artifact.reflection.id}` : "Orchestration",
      summary: tm.summary,
      storageReference: tm.storageRef ?? "",
      proofReference: tm.proofReceiptId ?? "",
      linkedNextTurnId: tm.linkedNextTurnId ?? "",
      verification:
        artifact.commandReceipts.find(c => c.id === tm.proofReceiptId)?.status === "verified" ? "verified" : "pending",
      timestampIso: tm.createdAt,
    };
  }, [artifact.traceableMemory, artifact.reflection, artifact.commandReceipts]);

  useEffect(() => {
    setStoryPlaybackIndex(0);
  }, [effectiveOutcome]);

  useEffect(() => {
    setStoryPlaybackIndex(idx => Math.min(idx, Math.max(storyBeatCount - 1, 0)));
  }, [storyBeatCount]);

  useEffect(() => {
    if (!storyPlaybackAutoplay) return undefined;
    const intervalMs = presentationMode ? 6200 : 4800;
    const id = window.setInterval(() => {
      setStoryPlaybackIndex(prev => (prev >= storyBeatCount - 1 ? 0 : prev + 1));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [storyPlaybackAutoplay, presentationMode, storyBeatCount]);

  useEffect(() => {
    if (!playbackDrivesDemoWallet || !activeBeat) return undefined;
    setWalletConnectedDemo(activeBeat.patch.walletConnectedDemo);
    return undefined;
  }, [playbackDrivesDemoWallet, activeBeat]);

  const replayStory = useCallback(() => {
    setStoryPlaybackIndex(0);
  }, []);

  const setGuidedStepIndex = useCallback((i: number | ((p: number) => number)) => {
    setStoryPlaybackIndex(i);
  }, []);

  const setGuidedAutoplay = useCallback((v: boolean) => {
    setStoryPlaybackAutoplay(v);
  }, []);

  const replayGuided = replayStory;

  const guidedStepCount = storyBeatCount;

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
      storyPlaybackIndex,
      setStoryPlaybackIndex,
      storyPlaybackAutoplay,
      setStoryPlaybackAutoplay,
      storyBeatCount,
      replayStory,
      playbackDrivesDemoWallet,
      setPlaybackDrivesDemoWallet,
      storyBeatsVersion: "_unified_story_engine_v2" as const,
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
    ]
  );

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo(): DemoContextValue {
  const v = useContext(DemoCtx);
  if (!v) throw new Error("useDemo must be used within DemoProvider");
  return v;
}