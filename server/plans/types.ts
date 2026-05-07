import type {
  PlanDependency,
  PlanExecutionReceipt,
  PlanFilter,
  PlanMemoryLink,
  PlanQuery,
  PlanReceipt,
  PlanReflectionLink,
  PlanResultReceipt,
  PlanSkillRef,
  PlanStepReceipt,
  PlanTaskType,
  PlanTimelineEvent,
  PlanVerificationResult,
} from "@shared/planReceipts";

export type {
  PlanDependency,
  PlanExecutionReceipt,
  PlanFilter,
  PlanMemoryLink,
  PlanQuery,
  PlanReceipt,
  PlanReflectionLink,
  PlanResultReceipt,
  PlanSkillRef,
  PlanStepReceipt,
  PlanTaskType,
  PlanTimelineEvent,
  PlanVerificationResult,
};

export interface CreatePlanReceiptInput {
  planId?: string;
  taskType: PlanTaskType;
  title: string;
  summary: string;
  goal: string;
  steps: PlanStepReceipt[];
  dependencies?: PlanDependency[];
  chosenSkills?: PlanSkillRef[];
  expectedOutcome: string;
  agentId: string;
  conversationId?: string;
  turnId?: string;
  sessionId?: string;
  wallet?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  anchorOnCreate?: boolean;
}

export interface ExecutePlanInput {
  planId: string;
  worker: string;
  startTime?: string;
  toolCalls?: PlanExecutionReceipt["toolCalls"];
  stepProgress?: PlanExecutionReceipt["stepProgress"];
  failedSteps?: string[];
  finalResult?: string;
  status?: PlanExecutionReceipt["status"];
  outputHash?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePlanResultInput {
  planId: string;
  actualOutcome: string;
  status: PlanResultReceipt["status"];
  resultSummary: string;
  sourceExecutionReceiptId?: string;
  reflection?: PlanReflectionLink;
  memory?: PlanMemoryLink;
  metadata?: Record<string, unknown>;
  autoReflect?: boolean;
}

export interface AnchorPlanInput {
  planId: string;
  wallet?: string;
}

export interface VerifyPlanInput {
  planId: string;
}

export interface LinkPlanReflectionInput {
  planId: string;
  reflectionId: string;
  reflectionReceiptId?: string;
}

export interface LinkPlanMemoryInput {
  planId: string;
  memoryId: string;
}

export interface PlanLifecycleEvent {
  id: string;
  planId: string;
  planReceiptId?: string;
  executionReceiptId?: string;
  resultReceiptId?: string;
  type:
    | "plan_created"
    | "plan_stored"
    | "plan_anchored"
    | "plan_anchor_degraded"
    | "plan_executing"
    | "plan_execution_recorded"
    | "plan_result_recorded"
    | "plan_reflection_linked"
    | "plan_memory_linked"
    | "plan_verified"
    | "plan_verification_failed";
  status: string;
  summary: string;
  createdAt: string;
  data?: Record<string, unknown>;
}
