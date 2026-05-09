import crypto from "crypto";
import type { Express } from "express";
import { nanoid } from "nanoid";
import type { StructuredReceipt } from "@shared/structuredReceipt";
import { z } from "zod";
import type { MemoryReceiptService } from "../memory";
import type { PlanReceiptService } from "../plans/PlanReceiptService";
import type { SolanaIdentityService } from "./identityService";
import { normalizeWalletAddress } from "./pda";
import type { SolanaBridgeService } from "./bridgeService";
import {
  listManualStructuredReceipts,
  mergeStructuredReceiptLists,
  proofsToStructuredReceipts,
  pushManualStructuredReceipt,
} from "./structuredReceipts";

function normalizeStructuredCluster(
  cluster: string,
): StructuredReceipt["cluster"] {
  const c = cluster.toLowerCase();
  if (c === "mainnet" || c === "mainnet-beta") return "mainnet-beta";
  if (c === "testnet") return "testnet";
  if (c === "localnet") return "localnet";
  return "devnet";
}

function hashPayload(payload: unknown) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload ?? {}))
    .digest("hex");
}

function requestId() {
  return `req_${Date.now()}`;
}

function fail(error: unknown) {
  return {
    ok: false as const,
    error: error instanceof Error ? error.message : "solana_bridge_failed",
  };
}

const buildSchema = z.object({
  walletAddress: z.string().min(20),
  action: z.enum([
    "initialize_registry",
    "create_skill",
    "update_skill_version",
    "create_plan_receipt",
    "complete_plan_receipt",
    "create_memory_receipt",
    "create_reflection_receipt",
    "create_proof_receipt",
    "anchor_receipt",
    "verify_receipt",
    "record_queue_event",
    "record_deployment_receipt",
  ]),
  subjectId: z.string().min(1).max(96),
  payloadHash: z.string().regex(/^[0-9a-f]{32,128}$/i),
  receiptId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const sendSchema = buildSchema;
const confirmSchema = z.object({
  requestId: z.string().optional(),
  txSignature: z.string().min(20),
  accountAddress: z.string().optional(),
});

const publishSkillSchema = z.object({
  walletAddress: z.string().min(20),
  skillId: z.string().min(1),
  skillSlug: z.string().min(1),
  version: z.string().optional(),
  contentHash: z.string().min(12),
  tags: z.array(z.string()).default([]),
  summary: z.string().optional(),
});

const postPlanSchema = z.object({
  walletAddress: z.string().min(20),
  planId: z.string().min(1),
  taskType: z.string().min(1),
  goal: z.string().min(1),
  stepCount: z.number().int().nonnegative().default(0),
  planHash: z.string().min(12),
  stepHash: z.string().min(12),
  outcome: z
    .enum(["planned", "running", "succeeded", "failed", "aborted"])
    .default("planned"),
});

const postMemorySchema = z.object({
  walletAddress: z.string().min(20),
  sourceTurnId: z.string().min(1),
  kind: z.string().default("reflection"),
  summary: z.string().min(1),
  reflectionHash: z.string().min(12),
  nextAction: z.string().default(""),
  tags: z.array(z.string()).default([]),
});

const postReflectionSchema = z.object({
  walletAddress: z.string().min(20),
  agentId: z.string().min(1),
  sourceTurnId: z.string().min(1),
  kind: z
    .enum(["success", "failure", "retry", "correction", "lesson"])
    .default("lesson"),
  title: z.string().min(2),
  summary: z.string().min(2),
  fullText: z.string().min(2),
  rootCause: z.string().min(2),
  correctiveAdvice: z.string().min(2),
  nextAction: z.string().min(2),
  tags: z.array(z.string()).default([]),
});

const postReceiptSchema = z.object({
  walletAddress: z.string().min(20),
  receiptId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectType: z.string().default("generic"),
  payloadHash: z.string().min(12),
  summary: z.string().default(""),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export function registerSolanaBridgeRoutes(
  app: Express,
  deps: {
    bridge: SolanaBridgeService;
    identityService?: SolanaIdentityService;
    memoryService?: MemoryReceiptService;
    planReceiptService?: PlanReceiptService;
  },
) {
  /** DB-backed wallet session row — distinct from Bearer `/api/solana/session` identity handshake */
  app.get("/api/solana/wallet-session", async (req, res) => {
    try {
      const walletAddress = String(req.query.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress query is required");
      const data = await deps.bridge.getSession(walletAddress);
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.get("/api/solana/network", async (_req, res) => {
    try {
      const data = await deps.bridge.getNetwork();
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json(fail(error));
    }
  });

  app.post("/api/solana/transaction/build", async (req, res) => {
    try {
      const body = buildSchema.parse(req.body);
      const data = await deps.bridge.buildInstruction({
        ...body,
        walletAddress: normalizeWalletAddress(body.walletAddress),
      });
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/transaction/send", async (req, res) => {
    try {
      const body = sendSchema.parse(req.body);
      const data = await deps.bridge.sendInstruction({
        ...body,
        walletAddress: normalizeWalletAddress(body.walletAddress),
      });
      res
        .status(data.status === "failed" ? 400 : 200)
        .json({ ok: data.status !== "failed", data });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/transaction/confirm", async (req, res) => {
    try {
      const body = confirmSchema.parse(req.body);
      const data = await deps.bridge.confirmInstruction(body);
      res
        .status(data.status === "failed" ? 400 : 200)
        .json({ ok: data.status !== "failed", data });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.get("/api/solana/accounts", async (req, res) => {
    try {
      const wallet = req.query.wallet
        ? normalizeWalletAddress(String(req.query.wallet))
        : undefined;
      const kind = req.query.kind ? String(req.query.kind) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const data = await deps.bridge.listMirrorAccounts({
        wallet,
        kind: kind as never,
        status,
      });
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.get("/api/solana/accounts/:address", async (req, res) => {
    try {
      const data = await deps.bridge.getMirrorAccount(
        String(req.params.address),
      );
      if (!data) {
        res.status(404).json({ ok: false, error: "account_not_found" });
        return;
      }
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.get("/api/solana/program", async (_req, res) => {
    const programId = deps.bridge.getProgramId();
    res.json({
      ok: true,
      data: {
        cluster: deps.bridge.getCluster(),
        programId,
        explorerProgramUrl: deps.bridge.buildExplorerUrl("address", programId),
      },
    });
  });

  app.get("/api/solana/skills", async (req, res) => {
    try {
      if (!deps.identityService)
        throw new Error("identity_service_unavailable");
      const data = await deps.identityService.listDiscoverySkills({
        query: req.query.q ? String(req.query.q) : undefined,
        category: req.query.category ? String(req.query.category) : undefined,
        tag: req.query.tag ? String(req.query.tag) : undefined,
      });
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/skills/publish", async (req, res) => {
    try {
      if (!deps.identityService)
        throw new Error("identity_service_unavailable");
      const body = publishSkillSchema.parse(req.body);
      const payload = {
        skillId: body.skillId,
        skillSlug: body.skillSlug,
        version: body.version || "1.0.0",
        contentHash: body.contentHash,
        tags: body.tags,
        summary: body.summary || "",
      };
      const send = await deps.bridge.sendInstruction({
        walletAddress: normalizeWalletAddress(body.walletAddress),
        action: "create_skill",
        subjectId: body.skillSlug,
        payloadHash: hashPayload(payload),
        metadata: payload,
      });
      if (send.status === "failed") {
        res
          .status(400)
          .json({
            ok: false,
            error: send.error || "skill_publish_failed",
            data: send,
          });
        return;
      }
      await deps.identityService.recordReputationEvent({
        walletAddress: normalizeWalletAddress(body.walletAddress),
        eventKind: "skill_publish",
        eventRef: body.skillId,
        success: true,
        weight: 3,
      });
      res.json({ ok: true, data: send });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/skills/:id/update", async (req, res) => {
    try {
      if (!deps.identityService)
        throw new Error("identity_service_unavailable");
      const body = publishSkillSchema.parse({
        ...req.body,
        skillId: String(req.params.id),
      });
      const payload = {
        skillId: body.skillId,
        skillSlug: body.skillSlug,
        version: body.version || "1.0.0",
        contentHash: body.contentHash,
        tags: body.tags,
        summary: body.summary || "",
      };
      const send = await deps.bridge.sendInstruction({
        walletAddress: normalizeWalletAddress(body.walletAddress),
        action: "update_skill_version",
        subjectId: `${body.skillSlug}:${payload.version}`,
        payloadHash: hashPayload(payload),
        metadata: payload,
      });
      if (send.status === "failed") {
        res
          .status(400)
          .json({
            ok: false,
            error: send.error || "skill_update_failed",
            data: send,
          });
        return;
      }
      await deps.identityService.recordReputationEvent({
        walletAddress: normalizeWalletAddress(body.walletAddress),
        eventKind: "skill_version",
        eventRef: body.skillId,
        success: true,
        weight: 2,
      });
      res.json({ ok: true, data: send });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/plans", async (req, res) => {
    try {
      const body = postPlanSchema.parse(req.body);
      const walletAddress = normalizeWalletAddress(body.walletAddress);
      const payloadHash = hashPayload({
        planId: body.planId,
        taskType: body.taskType,
        goal: body.goal,
        stepCount: body.stepCount,
        planHash: body.planHash,
        stepHash: body.stepHash,
        outcome: body.outcome,
      });
      const tx = await deps.bridge.sendInstruction({
        walletAddress,
        action: "create_plan_receipt",
        subjectId: body.planId,
        payloadHash,
        metadata: body,
      });
      if (deps.identityService) {
        await deps.identityService.recordPlannerRun({
          walletAddress,
          runId: body.planId,
          taskType: body.taskType,
          goal: body.goal,
          planHash: body.planHash,
          stepHash: body.stepHash,
          outcome: body.outcome,
          stepCount: body.stepCount,
          completedSteps: body.outcome === "succeeded" ? body.stepCount : 0,
          failedSteps: body.outcome === "failed" ? body.stepCount : 0,
        });
      }
      if (tx.status === "failed") {
        res
          .status(400)
          .json({ ok: false, error: tx.error || "plan_tx_failed", data: tx });
        return;
      }
      res.json({ ok: true, data: tx });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/memory", async (req, res) => {
    try {
      const body = postMemorySchema.parse(req.body);
      const walletAddress = normalizeWalletAddress(body.walletAddress);
      const payloadHash = hashPayload({
        sourceTurnId: body.sourceTurnId,
        kind: body.kind,
        summary: body.summary,
        reflectionHash: body.reflectionHash,
        nextAction: body.nextAction,
        tags: body.tags,
      });
      const tx = await deps.bridge.sendInstruction({
        walletAddress,
        action: "create_memory_receipt",
        subjectId: body.sourceTurnId,
        payloadHash,
        metadata: body,
      });

      if (deps.identityService) {
        await deps.identityService.recordMemoryAnchor({
          walletAddress,
          sourceTurnId: body.sourceTurnId,
          taskType: "memory",
          kind: body.kind,
          result: "success",
          sourceHash: body.reflectionHash,
          reflectionHash: body.reflectionHash,
          lessonHash: body.reflectionHash,
          summary: body.summary,
          rootCause: "",
          correctiveAdvice: "",
          nextBestAction: body.nextAction,
          confidenceBps: 7000,
          severityBps: 2000,
          tags: body.tags,
          relatedMemoryIds: [],
          pinned: false,
        });
      }

      if (tx.status === "failed") {
        res
          .status(400)
          .json({ ok: false, error: tx.error || "memory_tx_failed", data: tx });
        return;
      }
      res.json({ ok: true, data: tx });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/reflections", async (req, res) => {
    try {
      const body = postReflectionSchema.parse(req.body);
      const walletAddress = normalizeWalletAddress(body.walletAddress);
      const reflectionPayload = {
        agentId: body.agentId,
        sourceTurnId: body.sourceTurnId,
        kind: body.kind,
        title: body.title,
        summary: body.summary,
        fullText: body.fullText,
        rootCause: body.rootCause,
        correctiveAdvice: body.correctiveAdvice,
        nextAction: body.nextAction,
        tags: body.tags,
      };
      const tx = await deps.bridge.sendInstruction({
        walletAddress,
        action: "create_reflection_receipt",
        subjectId: body.sourceTurnId,
        payloadHash: hashPayload(reflectionPayload),
        metadata: reflectionPayload,
      });

      let reflectionId: string | undefined;
      if (deps.memoryService) {
        const created = await deps.memoryService.createReflection({
          ...reflectionPayload,
          wallet: walletAddress,
          conversationId: undefined,
        });
        reflectionId = created.reflection.id;
      }

      if (tx.status === "failed") {
        res
          .status(400)
          .json({
            ok: false,
            error: tx.error || "reflection_tx_failed",
            data: { ...tx, reflectionId },
          });
        return;
      }

      res.json({ ok: true, data: { ...tx, reflectionId } });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.get("/api/solana/receipts", async (req, res) => {
    try {
      const walletFilter = req.query.wallet
        ? normalizeWalletAddress(String(req.query.wallet))
        : undefined;
      const { getZeroGModule } = await import("../zerog/routes");
      const { buildZeroGIntegrationStatus } = await import(
        "../zerog/integrationSummary"
      );
      const module = getZeroGModule();
      const integration = await buildZeroGIntegrationStatus(module);
      const derived = proofsToStructuredReceipts({
        proofs: module.store.listReceipts(),
        integration,
      });
      const merged = mergeStructuredReceiptLists(
        derived,
        listManualStructuredReceipts(),
      );
      const filtered = walletFilter
        ? merged.filter((r) => r.walletAddress === walletFilter)
        : merged;
      res.json({ ok: true, data: filtered });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/receipt", async (req, res) => {
    try {
      const body = req.body as Partial<StructuredReceipt> &
        Pick<StructuredReceipt, "walletAddress" | "subjectId">;
      if (
        !body.walletAddress ||
        !body.subjectId ||
        !body.title ||
        !body.summary
      ) {
        throw new Error("walletAddress, subjectId, title, summary required");
      }
      const nowIso = new Date().toISOString();
      const net = await deps.bridge.getNetwork();
      const cluster = body.cluster ?? normalizeStructuredCluster(net.cluster);
      const full: StructuredReceipt = {
        id: body.id ?? `rcpt_${nanoid()}`,
        receiptType: (body.receiptType ??
          "proof") as StructuredReceipt["receiptType"],
        subjectId: body.subjectId,
        subjectType: body.subjectType ?? "custom",
        walletAddress: normalizeWalletAddress(body.walletAddress),
        cluster,
        title: body.title,
        summary: body.summary,
        status: body.status ?? "draft",
        proofStatus: body.proofStatus ?? "pending",
        createdAt: body.createdAt ?? nowIso,
        updatedAt: nowIso,
        evidence: body.evidence ?? {},
        references: body.references ?? [],
        links: body.links ?? {},
        provenance: body.provenance ?? {},
        claim: body.claim ?? {
          text: body.summary,
          supportedBy: [],
        },
        metadata: body.metadata ?? { source: "api.post_solana_receipt" },
      };
      pushManualStructuredReceipt(full);
      res.json({ ok: true, data: full });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.post("/api/solana/receipts", async (req, res) => {
    try {
      const body = postReceiptSchema.parse(req.body);
      const walletAddress = normalizeWalletAddress(body.walletAddress);
      const tx = await deps.bridge.sendInstruction({
        walletAddress,
        action: "anchor_receipt",
        subjectId: body.subjectId,
        payloadHash: body.payloadHash,
        receiptId: body.receiptId,
        metadata: {
          subjectType: body.subjectType,
          summary: body.summary,
          ...body.metadata,
        },
      });
      res.status(tx.status === "failed" ? 400 : 200).json({
        ok: tx.status !== "failed",
        data: {
          ...tx,
          receiptId: body.receiptId,
          verificationState: tx.status === "submitted" ? "pending" : "failed",
        },
      });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.get("/api/solana/receipts/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      const { getZeroGModule } = await import("../zerog/routes");
      const { buildZeroGIntegrationStatus } = await import(
        "../zerog/integrationSummary"
      );
      const module = getZeroGModule();
      const integration = await buildZeroGIntegrationStatus(module);
      const derived = proofsToStructuredReceipts({
        proofs: module.store.listReceipts(),
        integration,
      });
      const structured = mergeStructuredReceiptLists(
        derived,
        listManualStructuredReceipts(),
      ).find((r) => r.id === id);
      if (structured) {
        res.json({ ok: true, data: structured });
        return;
      }
      const account = await deps.bridge.getMirrorAccount(id);
      if (!account) {
        res.status(404).json({ ok: false, error: "receipt_not_found" });
        return;
      }
      res.json({ ok: true, data: account });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.get("/api/solana/history", async (req, res) => {
    try {
      const wallet = req.query.wallet
        ? normalizeWalletAddress(String(req.query.wallet))
        : undefined;
      const account = req.query.account ? String(req.query.account) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = await deps.bridge.listHistory({
        wallet,
        account,
        status: status as never,
        limit,
      });
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail(error));
    }
  });

  app.get("/api/solana/health", async (_req, res) => {
    try {
      const network = await deps.bridge.getNetwork();
      const history = await deps.bridge.listHistory({ limit: 20 });
      res.json({
        ok: true,
        data: {
          requestId: requestId(),
          module: "solana_bridge",
          cluster: network.cluster,
          programId: network.programId,
          rpcUrl: network.rpcUrl,
          recentEvents: history.length,
          relayerWallet: network.relayerWallet || null,
        },
      });
    } catch (error) {
      res.status(500).json(fail(error));
    }
  });
}
