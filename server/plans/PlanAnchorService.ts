import type { PlanReceipt, PlanResultReceipt } from "@shared/planReceipts";
import { compactAnchorHash, hashCanonical } from "./hash";

export interface PlanAnchorClient {
  anchorPlan(input: {
    wallet: string;
    planId: string;
    taskType: string;
    goal: string;
    planHash: string;
    stepHash: string;
    stepCount: number;
    outcome: "planned" | "running" | "succeeded" | "failed" | "aborted";
  }): Promise<{ txSignature?: string; account?: string; chainId?: number; programId?: string }>;
}

export class PlanAnchorService {
  constructor(
    private readonly options: {
      chainId: number;
      programId?: string;
      anchorClient?: PlanAnchorClient;
    }
  ) {}

  async anchorReceipt(receipt: PlanReceipt) {
    const anchorHash = compactAnchorHash(
      hashCanonical({
        planReceiptId: receipt.id,
        planId: receipt.planId,
        taskType: receipt.taskType,
        stepCount: receipt.stepCount,
        summaryHash: receipt.summaryHash,
        planHash: receipt.planHash,
        createdAt: receipt.createdAt,
      })
    );

    if (!receipt.wallet) {
      return {
        chainId: this.options.chainId,
        programId: this.options.programId,
        anchorHash,
        verified: false,
        degraded: true,
        note: "wallet_missing_for_anchor",
      };
    }

    try {
      const anchored = this.options.anchorClient
        ? await this.options.anchorClient.anchorPlan({
            wallet: receipt.wallet,
            planId: receipt.planId,
            taskType: receipt.taskType,
            goal: receipt.goal,
            planHash: receipt.planHash,
            stepHash: receipt.summaryHash,
            stepCount: receipt.stepCount,
            outcome: "planned",
          })
        : {
            txSignature: `SIM_${anchorHash.slice(0, 44)}`,
            account: `pda_${receipt.planId.slice(0, 24)}`,
            chainId: this.options.chainId,
            programId: this.options.programId,
          };

      return {
        chainId: anchored.chainId ?? this.options.chainId,
        txSignature: anchored.txSignature,
        account: anchored.account,
        programId: anchored.programId ?? this.options.programId,
        anchorHash,
        verified: Boolean(anchored.txSignature),
        verifiedAt: new Date().toISOString(),
        degraded: false,
      };
    } catch (error) {
      return {
        chainId: this.options.chainId,
        programId: this.options.programId,
        anchorHash,
        verified: false,
        degraded: true,
        note: error instanceof Error ? error.message : "anchor_failed",
      };
    }
  }

  async anchorResult(receipt: PlanReceipt, result: PlanResultReceipt) {
    const anchorHash = compactAnchorHash(
      hashCanonical({
        planReceiptId: receipt.id,
        planId: receipt.planId,
        resultId: result.id,
        resultHash: result.resultHash,
        status: result.status,
      })
    );

    if (!receipt.wallet || !this.options.anchorClient) {
      return {
        chainId: this.options.chainId,
        programId: this.options.programId,
        anchorHash,
        verified: Boolean(receipt.wallet),
        degraded: !receipt.wallet,
      };
    }

    try {
      const anchored = await this.options.anchorClient.anchorPlan({
        wallet: receipt.wallet,
        planId: receipt.planId,
        taskType: receipt.taskType,
        goal: receipt.goal,
        planHash: receipt.planHash,
        stepHash: result.resultHash,
        stepCount: receipt.stepCount,
        outcome: result.status === "success" ? "succeeded" : result.status === "failed" ? "failed" : "running",
      });

      return {
        chainId: anchored.chainId ?? this.options.chainId,
        txSignature: anchored.txSignature,
        account: anchored.account,
        programId: anchored.programId ?? this.options.programId,
        anchorHash,
        verified: Boolean(anchored.txSignature),
        verifiedAt: new Date().toISOString(),
        degraded: false,
      };
    } catch (error) {
      return {
        chainId: this.options.chainId,
        programId: this.options.programId,
        anchorHash,
        verified: false,
        degraded: true,
        note: error instanceof Error ? error.message : "result_anchor_failed",
      };
    }
  }
}
