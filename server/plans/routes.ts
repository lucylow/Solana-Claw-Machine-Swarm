import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { PlanTaskType } from "@shared/planReceipts";
import { PlanTimelineService } from "./PlanTimelineService";
import { PlanVerificationService } from "./PlanVerificationService";
import { PlanReceiptService } from "./PlanReceiptService";
import { PlanResultService } from "./PlanResultService";
import type { PlanStore } from "./store";

function ok(res: Response, data: unknown) {
  res.json({ ok: true, data });
}

function fail(res: Response, error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "plan_route_failed";
  res.status(status).json({ ok: false, error: message });
}

function requestId(req: Request) {
  return String(req.headers["x-request-id"] || `req_${Date.now()}`);
}

const taskTypes: [PlanTaskType, ...PlanTaskType[]] = [
  "support",
  "research",
  "coding",
  "deployment",
  "governance",
  "analysis",
  "planning",
  "execution",
  "retrieval",
  "multimodal",
  "queue_processing",
  "proof_generation",
  "skill_usage",
];

const createReceiptSchema = z.object({
  planId: z.string().optional(),
  taskType: z.enum(taskTypes),
  title: z.string().min(2).max(180),
  summary: z.string().min(2).max(2000),
  goal: z.string().min(2).max(4000),
  steps: z
    .array(
      z.object({
        id: z.string().optional(),
        index: z.number().min(0).optional(),
        title: z.string().min(1),
        description: z.string().min(1),
        dependencies: z.array(z.string()).default([]),
        chosenSkills: z.array(z.string()).default([]),
        expectedResult: z.string().optional(),
        status: z.enum(["pending", "running", "done", "failed", "skipped"]).default("pending"),
        resultSummary: z.string().optional(),
        resultHash: z.string().optional(),
      })
    )
    .min(1),
  dependencies: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["skill", "memory", "artifact", "queue", "contract", "tool"]),
        ref: z.string().min(1),
        label: z.string().optional(),
        required: z.boolean(),
      })
    )
    .optional(),
  chosenSkills: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        version: z.string().optional(),
        hash: z.string().optional(),
        active: z.boolean().optional(),
      })
    )
    .optional(),
  expectedOutcome: z.string().min(2).max(2000),
  agentId: z.string().min(1),
  conversationId: z.string().optional(),
  turnId: z.string().optional(),
  sessionId: z.string().optional(),
  wallet: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  anchorOnCreate: z.boolean().optional(),
});

const planQuerySchema = z.object({
  taskType: z.enum(taskTypes).optional(),
  status: z
    .enum([
      "draft",
      "generated",
      "stored",
      "anchored",
      "executing",
      "completed",
      "failed",
      "partially_completed",
      "reflected",
      "linked_to_memory",
      "verified",
      "degraded",
    ])
    .optional(),
  outcomeStatus: z.enum(["pending", "success", "partial", "failed", "degraded"]).optional(),
  agentId: z.string().optional(),
  wallet: z.string().optional(),
  conversationId: z.string().optional(),
  verified: z
    .string()
    .optional()
    .transform(v => (v === "true" ? true : v === "false" ? false : undefined)),
  limit: z
    .string()
    .optional()
    .transform(v => (v ? Number(v) : undefined)),
  offset: z
    .string()
    .optional()
    .transform(v => (v ? Number(v) : undefined)),
});

const executeSchema = z.object({
  planId: z.string().min(1),
  worker: z.string().min(1),
  startTime: z.string().optional(),
  toolCalls: z
    .array(
      z.object({
        id: z.string().min(1),
        tool: z.string().min(1),
        status: z.enum(["success", "failed"]),
        summary: z.string().optional(),
      })
    )
    .optional(),
  stepProgress: z
    .array(
      z.object({
        stepId: z.string().min(1),
        status: z.enum(["pending", "running", "done", "failed", "skipped"]),
      })
    )
    .optional(),
  failedSteps: z.array(z.string()).optional(),
  finalResult: z.string().optional(),
  status: z.enum(["pending", "running", "success", "partial", "failed", "degraded"]).optional(),
  outputHash: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const resultSchema = z.object({
  planId: z.string().min(1),
  actualOutcome: z.string().min(1),
  status: z.enum(["pending", "success", "partial", "failed", "degraded"]),
  resultSummary: z.string().min(1),
  sourceExecutionReceiptId: z.string().optional(),
  reflection: z
    .object({
      reflectionId: z.string().optional(),
      reflectionReceiptId: z.string().optional(),
      linked: z.boolean().optional(),
    })
    .optional(),
  memory: z
    .object({
      memoryId: z.string().optional(),
      linked: z.boolean().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const anchorSchema = z.object({
  planId: z.string().min(1),
  wallet: z.string().optional(),
});

const storeSchema = z.object({
  receiptId: z.string().min(1),
});

const verifySchema = z.object({
  planId: z.string().min(1),
});

const reflectionLinkSchema = z.object({
  planId: z.string().min(1),
  reflectionId: z.string().min(1),
  reflectionReceiptId: z.string().optional(),
});

const memoryLinkSchema = z.object({
  planId: z.string().min(1),
  memoryId: z.string().min(1),
});

const demoSchema = z.object({
  agentId: z.string().default("agent_demo"),
  wallet: z.string().optional(),
  goal: z.string().default("Ship Solana planner receipts with timeline proof."),
});

export function registerPlanRoutes(
  app: Express,
  services: {
    store: PlanStore;
    receiptService: PlanReceiptService;
    resultService: PlanResultService;
    verificationService: PlanVerificationService;
    timelineService: PlanTimelineService;
  }
) {
  app.post("/api/plans/receipt", async (req, res) => {
    try {
      const body = createReceiptSchema.parse(req.body);
      const receipt = await services.receiptService.create({
        ...body,
        steps: body.steps.map((step, index) => ({
          id: step.id || `step_${index + 1}`,
          index,
          title: step.title,
          description: step.description,
          dependencies: step.dependencies,
          chosenSkills: step.chosenSkills,
          expectedResult: step.expectedResult,
          status: step.status,
          resultSummary: step.resultSummary,
          resultHash: step.resultHash,
        })),
      });
      ok(res, { requestId: requestId(req), receipt });
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/plans/receipt/store", async (req, res) => {
    try {
      const body = storeSchema.parse(req.body);
      const receipt = await services.receiptService.storeReceipt(body.receiptId);
      ok(res, receipt);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/plans/receipt/anchor", async (req, res) => {
    try {
      const body = anchorSchema.parse(req.body);
      const receipt = await services.receiptService.anchorReceipt(body);
      ok(res, receipt);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/plans/receipt/verify", async (req, res) => {
    try {
      const body = verifySchema.parse(req.body);
      const verification = await services.verificationService.verify(body.planId);
      ok(res, verification);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/plans/execute", async (req, res) => {
    try {
      const body = executeSchema.parse(req.body);
      const execution = await services.receiptService.execute(body);
      ok(res, execution);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/plans/result", async (req, res) => {
    try {
      const body = resultSchema.parse(req.body);
      const created = await services.resultService.createResult(body);
      const planReceipt = await services.receiptService.applyResult(created.result);
      ok(res, {
        result: created.result,
        planReceipt,
        degraded: created.degraded,
      });
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/plans/result/reflection-link", async (req, res) => {
    try {
      const body = reflectionLinkSchema.parse(req.body);
      const result = await services.resultService.linkReflection(
        body.planId,
        body.reflectionId,
        body.reflectionReceiptId
      );
      const planReceipt = await services.receiptService.applyResult(result);
      ok(res, { result, planReceipt });
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/plans/result/memory-link", async (req, res) => {
    try {
      const body = memoryLinkSchema.parse(req.body);
      const result = await services.resultService.linkMemory(body.planId, body.memoryId);
      const planReceipt = await services.receiptService.applyResult(result);
      ok(res, { result, planReceipt });
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/plans/demo/run", async (req, res) => {
    try {
      const body = demoSchema.parse(req.body ?? {});
      const created = await services.receiptService.create({
        taskType: "planning",
        title: "Planner receipt demo",
        summary: "Generate, execute, result, reflect, and link to memory.",
        goal: body.goal,
        steps: [
          {
            id: "step_goal",
            index: 0,
            title: "Goal intake",
            description: "Capture user goal and acceptance criteria.",
            dependencies: [],
            chosenSkills: ["goal-parser"],
            status: "pending",
          },
          {
            id: "step_breakdown",
            index: 1,
            title: "Breakdown",
            description: "Generate step sequence and dependencies.",
            dependencies: ["step_goal"],
            chosenSkills: ["planner-core"],
            status: "pending",
          },
        ],
        dependencies: [{ id: "dep_skill", type: "skill", ref: "planner-core@1.0.0", required: true }],
        chosenSkills: [
          { id: "goal-parser", name: "Goal parser", version: "1.0.0", active: true },
          { id: "planner-core", name: "Planner core", version: "1.0.0", active: true },
        ],
        expectedOutcome: "A verifiable plan lifecycle",
        agentId: body.agentId,
        wallet: body.wallet,
        tags: ["demo", "timeline", "proof"],
        anchorOnCreate: true,
      });

      const execution = await services.receiptService.execute({
        planId: created.planId,
        worker: "demo_worker",
        status: "success",
        finalResult: "Execution completed in demo mode.",
      });

      const { result } = await services.resultService.createResult({
        planId: created.planId,
        actualOutcome: "Plan completed and linked to memory.",
        status: "success",
        resultSummary: "Demo run completed full lifecycle.",
        sourceExecutionReceiptId: execution.id,
        reflection: {
          reflectionId: `refl_demo_${Date.now()}`,
          linked: true,
        },
        memory: {
          memoryId: `mem_demo_${Date.now()}`,
          linked: true,
        },
      });
      const finalPlan = await services.receiptService.applyResult(result);
      const verification = await services.verificationService.verify(created.planId);

      ok(res, {
        plan: finalPlan,
        execution,
        result,
        verification,
      });
    } catch (error) {
      fail(res, error);
    }
  });

  app.get("/api/plans", async (req, res) => {
    try {
      const query = planQuerySchema.parse(req.query);
      const plans = await services.receiptService.list(query);
      ok(res, plans);
    } catch (error) {
      fail(res, error);
    }
  });

  app.get("/api/plans/health", async (_req, res) => {
    try {
      const plans = await services.receiptService.list({ limit: 5 });
      ok(res, {
        ok: true,
        module: "plans",
        planCountPreview: plans.length,
      });
    } catch (error) {
      fail(res, error, 500);
    }
  });

  app.get("/api/plans/:id", async (req, res) => {
    try {
      const plan = await services.receiptService.get(String(req.params.id));
      ok(res, plan);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/plans/:id/timeline", async (req, res) => {
    try {
      const raw = await services.store.listTimelineForPlan(String(req.params.id));
      const timeline = services.timelineService.toTimelineEvents(raw);
      ok(res, timeline);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/plans/:id/result", async (req, res) => {
    try {
      const result = await services.store.getLatestResultByPlanId(String(req.params.id));
      ok(res, result || null);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/plans/:id/reflection", async (req, res) => {
    try {
      const result = await services.store.getLatestResultByPlanId(String(req.params.id));
      ok(res, result?.reflection || null);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/plans/:id/verify", async (req, res) => {
    try {
      const verification = await services.verificationService.verify(String(req.params.id));
      ok(res, verification);
    } catch (error) {
      fail(res, error, 404);
    }
  });
}
