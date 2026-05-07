import {
  buildAgentsForScenario,
  buildExecutionSteps,
  buildMemory,
  buildMemoryTimeline,
  buildPlan,
  buildReceipts,
  buildReflection,
  DEMO_GUIDED_STEPS,
  DEMO_SCENARIOS,
  DEMO_SKILLS,
  getSkillById,
} from "@shared/demoFixtures";
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
  guidedStepIndex: number;
  setGuidedStepIndex: (i: number | ((p: number) => number)) => void;
  guidedAutoplay: boolean;
  setGuidedAutoplay: (v: boolean) => void;
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
  guidedStepCount: number;
  applyScenarioDefaults: () => void;
  replayGuided: () => void;
}

const DemoCtx = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [walletConnectedDemo, setWalletConnectedDemo] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<DemoScenarioFixture["id"]>("full-e2e");
  const [selectedSkillId, setSelectedSkillId] = useState<string>("skill-support-triage");
  const [runOutcome, setRunOutcome] = useState<DemoRunOutcome>("recovery");
  const [presentationMode, setPresentationMode] = useState(false);
  const [guidedStepIndex, setGuidedStepIndex] = useState(0);
  const [guidedAutoplay, setGuidedAutoplay] = useState(false);
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
  const reflection = useMemo(() => buildReflection(effectiveOutcome), [effectiveOutcome]);
  const memory = useMemo(() => buildMemory(reflection), [reflection]);
  const receipts = useMemo(() => buildReceipts(activeSkill, effectiveOutcome), [activeSkill, effectiveOutcome]);
  const memoryTimeline = useMemo(
    () => buildMemoryTimeline(effectiveOutcome !== "success"),
    [effectiveOutcome]
  );

  useEffect(() => {
    if (!guidedAutoplay) return undefined;
    const id = window.setInterval(() => {
      setGuidedStepIndex(prev => (prev >= DEMO_GUIDED_STEPS.length - 1 ? 0 : prev + 1));
    }, 5200);
    return () => window.clearInterval(id);
  }, [guidedAutoplay]);

  const replayGuided = useCallback(() => {
    setGuidedStepIndex(0);
  }, []);

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
      guidedStepIndex,
      setGuidedStepIndex,
      guidedAutoplay,
      setGuidedAutoplay,
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
      guidedStepCount: DEMO_GUIDED_STEPS.length,
      applyScenarioDefaults,
      replayGuided,
    }),
    [
      activeScenario,
      activeSkill,
      agents,
      guidedAutoplay,
      guidedStepIndex,
      memory,
      memoryTimeline,
      plan,
      presentationMode,
      receipts,
      reflection,
      replayGuided,
      runOutcome,
      selectedScenarioId,
      selectedSkillId,
      showPresenterNotes,
      simulateLoading,
      forceError,
      steps,
      walletConnectedDemo,
      applyScenarioDefaults,
    ]
  );

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo(): DemoContextValue {
  const v = useContext(DemoCtx);
  if (!v) throw new Error("useDemo must be used within DemoProvider");
  return v;
}
