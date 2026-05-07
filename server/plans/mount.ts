import path from "path";
import crypto from "crypto";
import type express from "express";
import type { SolanaIdentityService } from "../solana";
import type { SolanaBridgeService } from "../solana/bridgeService";
import { PlanAnchorService } from "./PlanAnchorService";
import { PlanReceiptService } from "./PlanReceiptService";
import { PlanResultService } from "./PlanResultService";
import { PlanStorageService } from "./PlanStorageService";
import { PlanTimelineService } from "./PlanTimelineService";
import { PlanVerificationService } from "./PlanVerificationService";
import { registerPlanRoutes } from "./routes";
import { PlanStore } from "./store";
import type { PlanLifecycleEvent } from "./types";
import { nowIso } from "./normalize";
import { nanoid } from "nanoid";

export async function mountPlanReceipts(
  app: express.Express,
  options?: {
    solanaIdentityService?: SolanaIdentityService;
    solanaBridge?: SolanaBridgeService;
  }
) {
  const store = new PlanStore(path.join(process.cwd(), "data", "plan-receipts.json"));
  await store.init();

  const storage = new PlanStorageService();
  const anchor = new PlanAnchorService({
    chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
    programId: process.env.SOLANA_PROGRAM_ID || process.env.CLAW_IDENTITY_PROGRAM_ID,
    anchorClient: options?.solanaIdentityService
      ? {
          anchorPlan: async input => {
            const payloadHash = crypto.createHash("sha256").update(
              JSON.stringify({
                planId: input.planId,
                taskType: input.taskType,
                goal: input.goal,
                planHash: input.planHash,
                stepHash: input.stepHash,
                stepCount: input.stepCount,
                outcome: input.outcome,
              })
            ).digest("hex");

            const bridgeTx = options.solanaBridge
              ? await options.solanaBridge.sendInstruction({
                  walletAddress: input.wallet,
                  action:
                    input.outcome === "planned" || input.outcome === "running"
                      ? "create_plan_receipt"
                      : "complete_plan_receipt",
                  subjectId: input.planId,
                  payloadHash,
                  metadata: {
                    taskType: input.taskType,
                    goal: input.goal,
                    stepCount: input.stepCount,
                    outcome: input.outcome,
                  },
                })
              : undefined;

            const plannerRun = await options.solanaIdentityService!.recordPlannerRun({
              walletAddress: input.wallet,
              runId: input.planId,
              taskType: input.taskType,
              goal: input.goal,
              planHash: input.planHash,
              stepHash: input.stepHash,
              outcome: input.outcome,
              stepCount: input.stepCount,
              completedSteps: input.outcome === "succeeded" ? input.stepCount : 0,
              failedSteps: input.outcome === "failed" ? input.stepCount : 0,
            });
            return {
              chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
              programId: process.env.SOLANA_PROGRAM_ID || process.env.CLAW_IDENTITY_PROGRAM_ID,
              account: plannerRun.id,
              txSignature: bridgeTx?.txSignature,
            };
          },
        }
      : undefined,
  });

  async function pushEvent(event: Omit<PlanLifecycleEvent, "id" | "createdAt">) {
    await store.pushTimelineEvent({
      ...event,
      id: `pevt_${nanoid(10)}`,
      createdAt: nowIso(),
    });
  }

  const receiptService = new PlanReceiptService(store, storage, anchor, pushEvent);
  const resultService = new PlanResultService(store, storage, anchor, pushEvent);
  const timelineService = new PlanTimelineService();
  const verificationService = new PlanVerificationService(store);

  registerPlanRoutes(app, {
    store,
    receiptService,
    resultService,
    timelineService,
    verificationService,
  });

  return {
    store,
    receiptService,
    resultService,
    timelineService,
    verificationService,
  };
}
