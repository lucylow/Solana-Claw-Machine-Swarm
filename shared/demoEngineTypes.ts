/**
 * Canonical interactive demo engine types — shared by client + server.
 * Uses real product shapes (SolanaWalletState, ExecutionRun, StructuredReceipt, …).
 */

import type {
  MemoryRecord,
  ReflectionRecord,
  SkillIdentity,
} from "./domainModel";
import type { OpenClawBridgeStatus } from "./openclaw/types";
import type { SolanaWalletState } from "./solana/types";
import type { StructuredReceipt } from "./structuredReceipt";
import type { ProofStatus } from "./structuredReceipt";
import type { ZeroGIntegrationStatus } from "./zerog";
import type { DemoRunOutcome, DemoScenarioId } from "./demoTypes";
import type { ExecutionRun } from "./executionStory";
import type { UXTimelineItem } from "./uxState";

export type DemoStoryStage =
  | "intro"
  | "wallet"
  | "skills"
  | "plan"
  | "execution"
  | "failure"
  | "reflection"
  | "memory"
  | "receipt"
  | "proof"
  | "reputation"
  | "autonomy"
  | "bridge"
  | "complete";

export type DemoPlaybackStatus =
  | "idle"
  | "playing"
  | "paused"
  | "completed"
  | "jumping"
  | "replaying";

export interface DemoPlaybackFrame {
  beatIndex: number;
  delayMs: number;
  /** Presenter-facing line for this frame (optional; defaults to beat title) */
  annotation?: string;
  openclaw?: Partial<OpenClawBridgeStatus>;
  zerog?: Partial<ZeroGIntegrationStatus>;
  /** Applied to primary anchor receipt after fixture→structured conversion */
  primaryReceiptProofPatch?: Partial<
    Pick<StructuredReceipt, "proofStatus" | "status" | "summary" | "claim">
  >;
}

export interface DemoStoryStepView {
  id: string;
  index: number;
  title: string;
  description: string;
  stage: DemoStoryStage;
  status: "pending" | "active" | "completed" | "failed" | "skipped";
  delayMs: number;
  canJumpTo: boolean;
  beatId?: string;
}

export interface DemoEvent {
  id: string;
  timestamp: string;
  stage: DemoStoryStage;
  label: string;
  description: string;
  status: "info" | "success" | "warning" | "error" | "live";
  relatedIds: {
    walletId?: string;
    skillId?: string;
    planId?: string;
    executionId?: string;
    reflectionId?: string;
    memoryId?: string;
    receiptId?: string;
    proofId?: string;
  };
  proofStatus?: ProofStatus;
  linkUrl?: string;
  notes?: string;
}

export interface DemoSnapshotDerived {
  isWalletVerified: boolean;
  isProofVerified: boolean;
  isMemoryLinked: boolean;
  hasFailure: boolean;
  hasRecovery: boolean;
  autonomyLabel?: string;
  reputationLabel?: string;
  /** Honest posture for the whole scrub */
  dataPosture:
    | "verified"
    | "pending"
    | "cached_only"
    | "demo_only"
    | "degraded";
}

export interface DemoSnapshot {
  scenarioId: DemoScenarioId;
  stepId: string;
  stepIndex: number;
  stepCount: number;
  playbackStatus: DemoPlaybackStatus;
  progressPercent: number;
  wallet: SolanaWalletState;
  skill?: SkillIdentity;
  execution?: ExecutionRun;
  reflection?: ReflectionRecord;
  memory?: MemoryRecord;
  receipt?: StructuredReceipt;
  proof?: StructuredReceipt;
  zerog?: ZeroGIntegrationStatus;
  openclaw?: OpenClawBridgeStatus;
  timeline: UXTimelineItem[];
  eventLog: DemoEvent[];
  derived: DemoSnapshotDerived;
  storySteps: DemoStoryStepView[];
  activeStoryAnnotation?: string;
  reputation?: { score: number; label: string };
  autonomy?: { score: number; label: string };
}

export interface DemoEngineInput {
  scenarioId: DemoScenarioId;
  /** Effective arc (playground can diverge from scenario default). */
  playbackOutcome: DemoRunOutcome;
  forceError: boolean;
  selectedSkillId: string;
  playbackStepIndex: number;
  playbackStatus: DemoPlaybackStatus;
  presentationMode: boolean;
}
