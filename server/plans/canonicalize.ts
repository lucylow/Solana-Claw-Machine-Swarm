import type {
  PlanExecutionReceipt,
  PlanReceipt,
  PlanResultReceipt,
} from "@shared/planReceipts";

type CanonicalValue =
  | null
  | boolean
  | number
  | string
  | CanonicalValue[]
  | { [k: string]: CanonicalValue };

function normalizeValue(input: unknown): CanonicalValue {
  if (
    input === null ||
    typeof input === "boolean" ||
    typeof input === "number" ||
    typeof input === "string"
  ) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => normalizeValue(item));
  }

  if (input && typeof input === "object") {
    const sorted: { [k: string]: CanonicalValue } = {};
    for (const key of Object.keys(input).sort()) {
      const value = (input as Record<string, unknown>)[key];
      if (typeof value === "undefined") continue;
      sorted[key] = normalizeValue(value);
    }
    return sorted;
  }

  return String(input);
}

export function canonicalize(input: unknown): string {
  return JSON.stringify(normalizeValue(input));
}

export function canonicalPlanSummaryPayload(plan: PlanReceipt) {
  return {
    version: plan.version,
    planId: plan.planId,
    taskType: plan.taskType,
    title: plan.title,
    summary: plan.summary,
    goal: plan.goal,
    stepCount: plan.stepCount,
    steps: plan.steps.map((step) => ({
      id: step.id,
      index: step.index,
      title: step.title,
      description: step.description,
      dependencies: step.dependencies,
      chosenSkills: step.chosenSkills,
      expectedResult: step.expectedResult ?? null,
    })),
    dependencies: plan.dependencies.map((dep) => ({
      id: dep.id,
      type: dep.type,
      ref: dep.ref,
      required: dep.required,
      label: dep.label ?? null,
    })),
    chosenSkills: plan.chosenSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      version: skill.version ?? null,
      hash: skill.hash ?? null,
      active: skill.active ?? null,
    })),
    expectedOutcome: plan.expectedOutcome,
    agentId: plan.agentId,
    wallet: plan.wallet ?? null,
  };
}

export function canonicalPlanPayload(plan: PlanReceipt) {
  return {
    ...canonicalPlanSummaryPayload(plan),
    id: plan.id,
    status: plan.status,
    outcomeStatus: plan.outcomeStatus,
    actualOutcome: plan.actualOutcome ?? null,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    conversationId: plan.conversationId ?? null,
    turnId: plan.turnId ?? null,
    sessionId: plan.sessionId ?? null,
    storage: plan.storage ?? null,
    solana: plan.solana ?? null,
    reflection: plan.reflection ?? null,
    memory: plan.memory ?? null,
    tags: plan.tags,
    metadata: plan.metadata,
  };
}

export function canonicalExecutionPayload(execution: PlanExecutionReceipt) {
  return {
    id: execution.id,
    planReceiptId: execution.planReceiptId,
    planId: execution.planId,
    status: execution.status,
    startTime: execution.startTime,
    endTime: execution.endTime ?? null,
    worker: execution.worker,
    toolCalls: execution.toolCalls,
    stepProgress: execution.stepProgress,
    failedSteps: execution.failedSteps,
    finalResult: execution.finalResult ?? null,
    outputHash: execution.outputHash ?? null,
  };
}

export function canonicalResultPayload(result: PlanResultReceipt) {
  return {
    id: result.id,
    planReceiptId: result.planReceiptId,
    planId: result.planId,
    status: result.status,
    actualOutcome: result.actualOutcome,
    resultSummary: result.resultSummary,
    resultHash: result.resultHash,
    sourceExecutionReceiptId: result.sourceExecutionReceiptId ?? null,
    reflection: result.reflection ?? null,
    memory: result.memory ?? null,
    storage: result.storage ?? null,
    solana: result.solana ?? null,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}
