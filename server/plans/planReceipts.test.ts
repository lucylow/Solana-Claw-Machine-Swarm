import { describe, expect, it } from "vitest";
import { PlanAnchorService } from "./PlanAnchorService";
import { PlanReceiptService } from "./PlanReceiptService";
import { PlanResultService } from "./PlanResultService";
import { PlanStorageService } from "./PlanStorageService";
import { PlanVerificationService } from "./PlanVerificationService";
import { hashCanonical } from "./hash";
import { nowIso } from "./normalize";
import { PlanStore } from "./store";
import type { PlanLifecycleEvent } from "./types";

function createEventWriter(store: PlanStore) {
  return async (event: Omit<PlanLifecycleEvent, "id" | "createdAt">) => {
    await store.pushTimelineEvent({
      ...event,
      id: `evt_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: nowIso(),
    });
  };
}

describe("plan receipt lifecycle", () => {
  it("creates immutable plan receipt versions and records result lifecycle", async () => {
    const store = new PlanStore();
    await store.init();
    const storage = new PlanStorageService();
    const anchor = new PlanAnchorService({
      chainId: 101,
      programId: "test_program",
    });
    const pushEvent = createEventWriter(store);
    const receiptService = new PlanReceiptService(
      store,
      storage,
      anchor,
      pushEvent,
    );
    const resultService = new PlanResultService(
      store,
      storage,
      anchor,
      pushEvent,
    );
    const verifyService = new PlanVerificationService(store);

    const created = await receiptService.create({
      taskType: "planning",
      title: "Debug planner regression",
      summary: "Break down investigation and patching flow",
      goal: "Fix regression in planner receipts",
      steps: [
        {
          id: "s1",
          index: 0,
          title: "Inspect logs",
          description: "Review failing traces",
          dependencies: [],
          chosenSkills: ["skill.log-analysis"],
          status: "pending",
        },
      ],
      dependencies: [{ id: "d1", type: "tool", ref: "rg", required: true }],
      chosenSkills: [{ id: "skill.log-analysis", name: "Log analysis" }],
      expectedOutcome: "Regression root cause found",
      agentId: "agent_test",
      wallet: "wallet_test",
      anchorOnCreate: true,
    });

    expect(created.planId).toBeTruthy();
    const allVersions = await store.listReceiptsByPlanId(created.planId);
    expect(allVersions.length).toBeGreaterThan(1);
    expect(allVersions[0]?.version).toBeGreaterThan(
      allVersions[1]?.version ?? 0,
    );

    const execution = await receiptService.execute({
      planId: created.planId,
      worker: "planner_worker",
      status: "success",
      finalResult: "Patched and verified",
    });
    expect(execution.status).toBe("success");

    const { result } = await resultService.createResult({
      planId: created.planId,
      actualOutcome: "Planner receipts now emitted correctly",
      status: "success",
      resultSummary: "Fix shipped and validated",
      sourceExecutionReceiptId: execution.id,
      reflection: { reflectionId: "refl_1", linked: true },
      memory: { memoryId: "mem_1", linked: true },
    });
    const finalPlan = await receiptService.applyResult(result);
    expect(finalPlan.status).toBe("completed");
    expect(finalPlan.actualOutcome).toContain("Planner receipts");

    const verification = await verifyService.verify(created.planId);
    expect(verification.checks.canonicalPlanHashMatch).toBe(true);
    expect(verification.checks.canonicalSummaryHashMatch).toBe(true);
  });

  it("canonical hash remains deterministic for equal semantic payload", () => {
    const one = hashCanonical({
      b: 2,
      a: 1,
      nested: { y: "two", x: "one" },
      empty: undefined,
    });
    const two = hashCanonical({
      nested: { x: "one", y: "two" },
      a: 1,
      b: 2,
    });
    expect(one).toBe(two);
  });
});
