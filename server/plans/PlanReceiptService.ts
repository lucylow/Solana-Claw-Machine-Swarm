import { nanoid } from "nanoid";
import type {
  PlanExecutionReceipt,
  PlanFilter,
  PlanReceipt,
  PlanResultReceipt,
} from "@shared/planReceipts";
import { hashExecution, hashPlan, hashPlanSummary } from "./hash";
import {
  normalizeDate,
  normalizeMetadata,
  normalizePlanId,
  normalizeSteps,
  normalizeTags,
  nowIso,
} from "./normalize";
import { PlanAnchorService } from "./PlanAnchorService";
import { PlanStorageService } from "./PlanStorageService";
import type { PlanStore } from "./store";
import type {
  AnchorPlanInput,
  CreatePlanReceiptInput,
  ExecutePlanInput,
  PlanLifecycleEvent,
} from "./types";

export class PlanReceiptService {
  constructor(
    private readonly store: PlanStore,
    private readonly storage: PlanStorageService,
    private readonly anchor: PlanAnchorService,
    private readonly pushEvent: (
      event: Omit<PlanLifecycleEvent, "id" | "createdAt">,
    ) => Promise<void>,
  ) {}

  async create(input: CreatePlanReceiptInput) {
    if (!input.goal.trim()) throw new Error("goal_required");
    if (!input.steps?.length) throw new Error("steps_required");

    const planId = normalizePlanId(input.planId);
    const now = nowIso();
    const existingVersions = await this.store.listReceiptsByPlanId(planId);
    const version = (existingVersions[0]?.version || 0) + 1;

    const base: PlanReceipt = {
      id: `prc_${nanoid(12)}`,
      version,
      planId,
      taskType: input.taskType,
      title: input.title,
      summary: input.summary,
      goal: input.goal,
      stepCount: input.steps.length,
      steps: normalizeSteps(input.steps),
      dependencies: [...(input.dependencies || [])],
      chosenSkills: [...(input.chosenSkills || [])],
      expectedOutcome: input.expectedOutcome,
      actualOutcome: undefined,
      outcomeStatus: "pending",
      summaryHash: "",
      planHash: "",
      createdAt: now,
      updatedAt: now,
      agentId: input.agentId,
      conversationId: input.conversationId,
      turnId: input.turnId,
      sessionId: input.sessionId,
      wallet: input.wallet,
      status: "generated",
      storage: undefined,
      solana: undefined,
      reflection: undefined,
      memory: undefined,
      metadata: normalizeMetadata(input.metadata),
      tags: normalizeTags(input.tags),
    };

    base.summaryHash = hashPlanSummary(base);
    base.planHash = hashPlan(base);

    await this.store.saveReceipt(base);
    await this.pushEvent({
      planId,
      planReceiptId: base.id,
      type: "plan_created",
      status: base.status,
      summary: "Plan generated with canonical hashes.",
      data: {
        taskType: base.taskType,
        stepCount: base.stepCount,
        summaryHash: base.summaryHash,
        planHash: base.planHash,
      },
    });

    let stored = await this.storeReceipt(base.id);
    if (input.anchorOnCreate) {
      stored = await this.anchorReceipt({ planId });
    }
    return stored;
  }

  async storeReceipt(receiptId: string) {
    const receipt = await this.store.getReceiptById(receiptId);
    if (!receipt) throw new Error("plan_receipt_not_found");

    const stored = await this.storage.store("plans", receipt.id, receipt);
    const next = await this.cloneWithChanges(receipt, {
      status: stored.degraded ? "degraded" : "stored",
      storage: {
        ref: stored.ref,
        checksum: stored.checksum,
        namespace: stored.namespace,
      },
    });

    await this.pushEvent({
      planId: receipt.planId,
      planReceiptId: next.id,
      type: "plan_stored",
      status: next.status,
      summary: stored.degraded
        ? "Plan stored locally; remote storage unavailable."
        : "Plan stored off-chain.",
      data: {
        storageRef: stored.ref,
        hash: next.planHash,
      },
    });
    return next;
  }

  async anchorReceipt(input: AnchorPlanInput) {
    const latest = await this.store.getLatestReceiptByPlanId(input.planId);
    if (!latest) throw new Error("plan_not_found");

    const anchored = await this.anchor.anchorReceipt({
      ...latest,
      wallet: input.wallet || latest.wallet,
    });
    const status = anchored.degraded ? "degraded" : "anchored";
    const next = await this.cloneWithChanges(latest, {
      status,
      wallet: input.wallet || latest.wallet,
      solana: {
        chainId: anchored.chainId,
        txSignature: anchored.txSignature,
        account: anchored.account,
        programId: anchored.programId,
        anchorHash: anchored.anchorHash,
        verified: anchored.verified,
        verifiedAt: anchored.verifiedAt,
      },
    });

    await this.pushEvent({
      planId: next.planId,
      planReceiptId: next.id,
      type: anchored.degraded ? "plan_anchor_degraded" : "plan_anchored",
      status: next.status,
      summary: anchored.degraded
        ? "Plan anchor failed; degraded proof mode active."
        : "Plan anchored on Solana.",
      data: {
        txSignature: anchored.txSignature,
        hash: anchored.anchorHash,
      },
    });
    return next;
  }

  async execute(input: ExecutePlanInput): Promise<PlanExecutionReceipt> {
    const plan = await this.store.getLatestReceiptByPlanId(input.planId);
    if (!plan) throw new Error("plan_not_found");

    const now = nowIso();
    const execution: PlanExecutionReceipt = {
      id: `pex_${nanoid(12)}`,
      planReceiptId: plan.id,
      planId: plan.planId,
      status: input.status ?? "running",
      startTime: normalizeDate(input.startTime),
      endTime: input.status && input.status !== "running" ? now : undefined,
      worker: input.worker,
      toolCalls: [...(input.toolCalls || [])],
      stepProgress:
        input.stepProgress ||
        plan.steps.map((step) => ({
          stepId: step.id,
          status: "pending",
        })),
      failedSteps: [...(input.failedSteps || [])],
      finalResult: input.finalResult,
      outputHash: input.outputHash,
      memoryWrite: undefined,
      reflectionWrite: undefined,
      solana: undefined,
      metadata: normalizeMetadata(input.metadata),
      createdAt: now,
      updatedAt: now,
    };

    if (!execution.outputHash && execution.finalResult) {
      execution.outputHash = hashExecution({
        ...execution,
        outputHash: undefined,
      });
    }

    await this.store.saveExecution(execution);
    await this.pushEvent({
      planId: plan.planId,
      planReceiptId: plan.id,
      executionReceiptId: execution.id,
      type: "plan_execution_recorded",
      status: execution.status,
      summary: execution.finalResult || "Execution receipt recorded.",
      data: {
        hash: execution.outputHash,
      },
    });

    return execution;
  }

  async list(query: PlanFilter = {}) {
    let plans = await this.store.listLatestReceipts();
    plans = plans.filter((plan) => {
      if (query.taskType && plan.taskType !== query.taskType) return false;
      if (query.status && plan.status !== query.status) return false;
      if (query.outcomeStatus && plan.outcomeStatus !== query.outcomeStatus)
        return false;
      if (query.agentId && plan.agentId !== query.agentId) return false;
      if (query.wallet && plan.wallet !== query.wallet) return false;
      if (query.conversationId && plan.conversationId !== query.conversationId)
        return false;
      if (
        typeof query.verified === "boolean" &&
        Boolean(plan.solana?.verified) !== query.verified
      )
        return false;
      return true;
    });
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    return plans.slice(offset, offset + limit);
  }

  async get(planId: string) {
    const plan = await this.store.getLatestReceiptByPlanId(planId);
    if (!plan) throw new Error("plan_not_found");
    return plan;
  }

  async getByReceiptId(receiptId: string) {
    const receipt = await this.store.getReceiptById(receiptId);
    if (!receipt) throw new Error("plan_receipt_not_found");
    return receipt;
  }

  async applyResult(result: PlanResultReceipt) {
    const latest = await this.store.getLatestReceiptByPlanId(result.planId);
    if (!latest) throw new Error("plan_not_found");

    const status =
      result.status === "success"
        ? "completed"
        : result.status === "partial"
          ? "partially_completed"
          : result.status === "failed"
            ? "failed"
            : "degraded";

    return this.cloneWithChanges(latest, {
      actualOutcome: result.actualOutcome,
      outcomeStatus: result.status,
      status,
      reflection: result.reflection ?? latest.reflection,
      memory: result.memory ?? latest.memory,
    });
  }

  private async cloneWithChanges(
    receipt: PlanReceipt,
    changes: Partial<PlanReceipt>,
  ) {
    const next: PlanReceipt = {
      ...receipt,
      ...changes,
      id: `prc_${nanoid(12)}`,
      version: receipt.version + 1,
      createdAt: receipt.createdAt,
      updatedAt: nowIso(),
      metadata: {
        ...receipt.metadata,
        previousReceiptId: receipt.id,
      },
    };
    next.summaryHash = hashPlanSummary(next);
    next.planHash = hashPlan(next);
    await this.store.saveReceipt(next);
    return next;
  }
}
