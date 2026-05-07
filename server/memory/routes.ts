import type { Express, Request, Response } from "express";
import { z } from "zod";
import type { ReflectionKind } from "@shared/memoryReceipts";
import { MemoryReceiptService } from "./service";

function ok(res: Response, data: unknown) {
  res.json({ ok: true, data });
}

function fail(res: Response, error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "memory_route_failed";
  res.status(status).json({ ok: false, error: message });
}

function requestId(req: Request) {
  return String(req.headers["x-request-id"] || `req_${Date.now()}`);
}

const createReflectionSchema = z.object({
  agentId: z.string().min(1),
  conversationId: z.string().optional(),
  wallet: z.string().optional(),
  sourceTurnId: z.string().min(1),
  parentReceiptId: z.string().optional(),
  kind: z.enum(["success", "failure", "retry", "correction", "lesson"]),
  title: z.string().min(3).max(160),
  summary: z.string().min(3).max(400),
  fullText: z.string().min(5),
  rootCause: z.string().min(3).max(800),
  correctiveAdvice: z.string().min(3).max(800),
  nextAction: z.string().min(3).max(400),
  tags: z.array(z.string().min(1).max(40)).optional(),
  visibility: z.enum(["private", "workspace", "public"]).optional(),
  structured: z
    .object({
      confidence: z.number().min(0).max(1).optional(),
      reusable: z.boolean().optional(),
      priority: z.enum(["low", "normal", "high", "critical"]).optional(),
      failureMode: z.string().optional(),
    })
    .optional(),
  autoAnchor: z.boolean().default(true),
  autoVerify: z.boolean().default(false),
});

const listQuerySchema = z.object({
  agentId: z.string().optional(),
  wallet: z.string().optional(),
  conversationId: z.string().optional(),
  sourceTurnId: z.string().optional(),
  nextTurnId: z.string().optional(),
  status: z
    .enum(["captured", "stored", "anchored", "linked", "injected", "verified", "failed", "degraded"])
    .optional(),
  verified: z
    .string()
    .optional()
    .transform(v => (v === "true" ? true : v === "false" ? false : undefined)),
  receiptHash: z.string().optional(),
  storageRef: z.string().optional(),
  txSig: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform(v => (v ? Number(v) : undefined)),
  offset: z
    .string()
    .optional()
    .transform(v => (v ? Number(v) : undefined)),
});

export function registerMemoryRoutes(app: Express, service: MemoryReceiptService) {
  app.get("/api/memory/reflections", async (req, res) => {
    try {
      const query = listQuerySchema.parse(req.query);
      const data = await service.listReflections(query);
      ok(res, data);
    } catch (error) {
      fail(res, error);
    }
  });

  app.get("/api/memory/reflections/agent/:agentId", async (req, res) => {
    try {
      const data = await service.listReflections({
        ...listQuerySchema.parse(req.query),
        agentId: String(req.params.agentId),
      });
      ok(res, data);
    } catch (error) {
      fail(res, error);
    }
  });

  app.get("/api/memory/reflections/conversation/:conversationId", async (req, res) => {
    try {
      const data = await service.listReflections({
        ...listQuerySchema.parse(req.query),
        conversationId: String(req.params.conversationId),
      });
      ok(res, data);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/memory/reflections", async (req, res) => {
    try {
      const body = createReflectionSchema.parse(req.body);
      const created = await service.createReflection({
        agentId: body.agentId,
        conversationId: body.conversationId,
        wallet: body.wallet,
        sourceTurnId: body.sourceTurnId,
        parentReceiptId: body.parentReceiptId,
        kind: body.kind as ReflectionKind,
        title: body.title,
        summary: body.summary,
        fullText: body.fullText,
        rootCause: body.rootCause,
        correctiveAdvice: body.correctiveAdvice,
        nextAction: body.nextAction,
        tags: body.tags,
        visibility: body.visibility,
        structured: body.structured,
      });

      let receipt = null;
      if (body.autoAnchor) {
        receipt = await service.anchorReflection(created.reflection.id, body.wallet);
      }
      let verification = null;
      if (body.autoVerify) {
        verification = await service.verifyReflection(created.reflection.id);
      }

      ok(res, {
        requestId: requestId(req),
        reflection: created.reflection,
        status: created.status,
        receipt,
        verification,
      });
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/memory/reflections/:id/store", async (req, res) => {
    try {
      const reflection = await service.getReflection(String(req.params.id));
      ok(res, {
        reflection,
        status: reflection.storageRef ? "stored" : "captured",
      });
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.post("/api/memory/reflections/:id/anchor", async (req, res) => {
    try {
      const receipt = await service.anchorReflection(String(req.params.id), req.body?.wallet);
      ok(res, receipt);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.post("/api/memory/reflections/:id/link-next-turn", async (req, res) => {
    try {
      const nextTurnId = String(req.body?.nextTurnId || "").trim();
      if (!nextTurnId) throw new Error("nextTurnId_required");
      const data = await service.linkReceiptToNextTurn(String(req.params.id), {
        nextTurnId,
        reason: req.body?.reason ? String(req.body.reason) : undefined,
      });
      ok(res, data);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/memory/reflections/:id/verify", async (req, res) => {
    try {
      const result = await service.verifyReflection(String(req.params.id));
      ok(res, result);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/memory/reflections/:id/chain", async (req, res) => {
    try {
      const data = await service.getChain(String(req.params.id));
      ok(res, data);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/memory/reflections/:id/timeline", async (req, res) => {
    try {
      const data = await service.getTimeline(String(req.params.id));
      ok(res, data);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/memory/reflections/:id/receipt", async (req, res) => {
    try {
      const data = await service.getReceipt(String(req.params.id));
      ok(res, data);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/memory/reflections/:id", async (req, res) => {
    try {
      const data = await service.getReflection(String(req.params.id));
      ok(res, data);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.post("/api/memory/injection-bundle", async (req, res) => {
    try {
      const body = z
        .object({
          agentId: z.string().min(1),
          conversationId: z.string().optional(),
          nextTurnId: z.string().min(1),
          wallet: z.string().optional(),
          maxItems: z.number().min(1).max(10).optional(),
        })
        .parse(req.body);
      const bundle = await service.buildInjectionBundle(body);
      ok(res, bundle);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/memory/demo/run", async (req, res) => {
    try {
      const body = z
        .object({
          agentId: z.string().default("agent_demo"),
          wallet: z.string().optional(),
          conversationId: z.string().optional(),
        })
        .parse(req.body ?? {});
      const data = await service.runDemoFlow(body);
      ok(res, data);
    } catch (error) {
      fail(res, error);
    }
  });
}
