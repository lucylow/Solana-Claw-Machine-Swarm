import type { PlanVerificationResult } from "@shared/planReceipts";
import { hashPlan, hashPlanSummary, hashResult } from "./hash";
import type { PlanStore } from "./store";

export class PlanVerificationService {
  constructor(private readonly store: PlanStore) {}

  async verify(planId: string): Promise<PlanVerificationResult> {
    const receipt = await this.store.getLatestReceiptByPlanId(planId);
    if (!receipt) throw new Error("plan_not_found");

    const result = await this.store.getLatestResultByPlanId(planId);
    const canonicalPlanHashMatch = hashPlan(receipt) === receipt.planHash;
    const canonicalSummaryHashMatch =
      hashPlanSummary(receipt) === receipt.summaryHash;
    const resultHashMatch = result
      ? hashResult(result) === result.resultHash
      : true;
    const anchorPresent = Boolean(
      receipt.solana?.anchorHash || receipt.solana?.txSignature,
    );
    const reflectionLinked = Boolean(
      result?.reflection?.linked || receipt.reflection?.linked,
    );
    const memoryLinked = Boolean(
      result?.memory?.linked || receipt.memory?.linked,
    );

    const checks = {
      canonicalPlanHashMatch,
      canonicalSummaryHashMatch,
      resultHashMatch,
      anchorPresent,
      reflectionLinked,
      memoryLinked,
    };

    const issues = Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);
    const verified = issues.length === 0;

    const status: PlanVerificationResult["status"] = verified
      ? "verified"
      : anchorPresent && (canonicalPlanHashMatch || canonicalSummaryHashMatch)
        ? "partially_verified"
        : anchorPresent
          ? "anchored_only"
          : receipt.storage?.ref
            ? "stored_only"
            : "degraded";

    return {
      planId,
      planReceiptId: receipt.id,
      verified,
      status,
      checks,
      issues,
      verifiedAt: new Date().toISOString(),
    };
  }
}
