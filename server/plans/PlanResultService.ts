import { nanoid } from "nanoid";
import type { PlanResultReceipt } from "@shared/planReceipts";
import { hashResult } from "./hash";
import { nowIso } from "./normalize";
import { PlanAnchorService } from "./PlanAnchorService";
import { PlanStorageService } from "./PlanStorageService";
import type { PlanStore } from "./store";
import type { CreatePlanResultInput, PlanLifecycleEvent } from "./types";

export class PlanResultService {
  constructor(
    private readonly store: PlanStore,
    private readonly storage: PlanStorageService,
    private readonly anchor: PlanAnchorService,
    private readonly pushEvent: (
      event: Omit<PlanLifecycleEvent, "id" | "createdAt">,
    ) => Promise<void>,
  ) {}

  async createResult(input: CreatePlanResultInput) {
    const receipt = await this.store.getLatestReceiptByPlanId(input.planId);
    if (!receipt) throw new Error("plan_not_found");

    const now = nowIso();
    const result: PlanResultReceipt = {
      id: `pres_${nanoid(12)}`,
      planReceiptId: receipt.id,
      planId: receipt.planId,
      actualOutcome: input.actualOutcome,
      status: input.status,
      resultSummary: input.resultSummary,
      resultHash: "",
      sourceExecutionReceiptId: input.sourceExecutionReceiptId,
      reflection: input.reflection,
      memory: input.memory,
      storage: undefined,
      solana: undefined,
      createdAt: now,
      updatedAt: now,
      metadata: { ...(input.metadata || {}) },
    };

    result.resultHash = hashResult(result);
    const storage = await this.storage.store("plan-results", result.id, result);
    result.storage = {
      ref: storage.ref,
      checksum: storage.checksum,
      namespace: storage.namespace,
    };

    const anchored = await this.anchor.anchorResult(receipt, result);
    result.solana = {
      chainId: anchored.chainId,
      txSignature: anchored.txSignature,
      account: anchored.account,
      programId: anchored.programId,
      anchorHash: anchored.anchorHash,
      verified: anchored.verified,
      verifiedAt: anchored.verifiedAt,
    };

    await this.store.saveResult(result);
    await this.pushEvent({
      planId: input.planId,
      planReceiptId: receipt.id,
      resultReceiptId: result.id,
      type: "plan_result_recorded",
      status: input.status,
      summary: input.resultSummary,
      data: {
        resultHash: result.resultHash,
        storageRef: storage.ref,
        txSignature: result.solana?.txSignature,
      },
    });

    return { result, degraded: storage.degraded };
  }

  async linkReflection(
    planId: string,
    reflectionId: string,
    reflectionReceiptId?: string,
  ) {
    const result = await this.store.getLatestResultByPlanId(planId);
    if (!result) throw new Error("plan_result_not_found");

    const linked: PlanResultReceipt = {
      ...result,
      reflection: {
        reflectionId,
        reflectionReceiptId,
        linked: true,
      },
      updatedAt: nowIso(),
    };
    await this.store.saveResult(linked);
    await this.pushEvent({
      planId,
      planReceiptId: linked.planReceiptId,
      resultReceiptId: linked.id,
      type: "plan_reflection_linked",
      status: "reflected",
      summary: "Reflection linked to plan result.",
      data: { reflectionId, reflectionReceiptId },
    });
    return linked;
  }

  async linkMemory(planId: string, memoryId: string) {
    const result = await this.store.getLatestResultByPlanId(planId);
    if (!result) throw new Error("plan_result_not_found");

    const linked: PlanResultReceipt = {
      ...result,
      memory: {
        memoryId,
        linked: true,
      },
      updatedAt: nowIso(),
    };
    await this.store.saveResult(linked);
    await this.pushEvent({
      planId,
      planReceiptId: linked.planReceiptId,
      resultReceiptId: linked.id,
      type: "plan_memory_linked",
      status: "linked_to_memory",
      summary: "Plan result linked to memory.",
      data: { memoryId },
    });
    return linked;
  }
}
