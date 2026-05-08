import type { Express, Request, Response } from "express";
import { z } from "zod";
import { createAppError } from "@shared/appErrorFactory";
import type { SkillIdentity } from "@shared/domainModel";
import { sdk } from "../_core/sdk";
import {
  circuitBreakerAllowOrThrow,
  recordCircuitFailure,
  recordCircuitSuccess,
} from "../errors/circuitBreaker";
import { sendAppError, sendAppOk } from "../errors/httpRespond";
import { logStructuredError } from "../errors/logStructuredError";
import { normalizeServerError } from "../errors/normalizeServerError";
import type { MemoryReceiptService } from "../memory";
import type { PlanReceiptService } from "../plans/PlanReceiptService";
import type { SolanaBridgeService } from "../solana/bridgeService";
import type { SolanaIdentityService } from "../solana/identityService";
import { normalizeWalletAddress } from "../solana/pda";
import { ExecutionOrchestratorService } from "./ExecutionOrchestratorService";
import { SwarmMirrorStore } from "./swarmMirrorStore";

function ok(res: Response, data: unknown) {
  sendAppOk(res, data);
}

function fail(res: Response, error: unknown, status = 400, req?: Request) {
  const appError = normalizeServerError(error, {
    route: req?.path,
    requestId: requestId(req ?? ({} as Request)),
  });
  const outStatus = appError.statusCode && appError.statusCode >= 400 ? appError.statusCode : status;
  logStructuredError(appError, {
    route: req?.path,
    requestId: req ? requestId(req) : undefined,
  });
  sendAppError(res, { ...appError, statusCode: outStatus }, outStatus);
}

function notFound(res: Response, message: string, technical?: string) {
  const appError = createAppError("VALIDATION_FAILED", {
    message,
    technicalMessage: technical ?? message,
    statusCode: 404,
  });
  logStructuredError(appError, {});
  sendAppError(res, appError, 404);
}

function requestId(req: Request) {
  return String(req.headers["x-request-id"] || `req_${Date.now()}`);
}

function discoveryToSkillIdentity(row: {
  skillAddress: string;
  owner: string;
  slug: string;
  name: string;
  category: string;
  tags: string[];
  contentHash?: string;
  versionCount: number;
  usageCount: number;
  successCount: number;
  failureCount: number;
  trustScoreBps: number;
  discoveryScoreBps: number;
  updatedAt: number;
}): SkillIdentity {
  const total = row.successCount + row.failureCount;
  const successRate = total > 0 ? Number(((row.successCount / total) * 100).toFixed(2)) : 0;
  return {
    id: row.skillAddress || row.slug,
    name: row.name,
    description: `${row.category} · discovery rank ${row.discoveryScoreBps} bps`,
    tags: row.tags?.length ? row.tags : [row.category],
    version: `${row.versionCount}.0.0`,
    authorWallet: row.owner,
    contentHash: row.contentHash || row.skillAddress,
    status: "published",
    usageCount: row.usageCount,
    reputationScore: Number((row.trustScoreBps / 100).toFixed(2)),
    successRate,
    lastUpdatedAt: new Date(row.updatedAt).toISOString(),
    currentVersionAccount: row.skillAddress,
    historyCount: row.versionCount,
    explorerUrl: undefined,
    storageRef: undefined,
  };
}

const selectSkillBody = z.object({
  walletAddress: z.string().min(32),
});

const executeBody = z.object({
  walletAddress: z.string().min(32),
  goal: z.string().min(4).max(8000),
  skillId: z.string().min(1),
  skillName: z.string().optional(),
  agentId: z.string().min(1).default("agent_swarm"),
});

const demoBody = z.object({
  walletAddress: z.string().min(32).optional(),
  agentId: z.string().default("agent_demo"),
});

const memoryPostBody = z.object({
  agentId: z.string().min(1),
  wallet: z.string().min(32).optional(),
  sourceTurnId: z.string().min(1),
  kind: z.enum(["success", "failure", "retry", "correction", "lesson"]).default("lesson"),
  title: z.string().min(2),
  summary: z.string().min(2),
  fullText: z.string().min(4),
  rootCause: z.string().min(2),
  correctiveAdvice: z.string().min(2),
  nextAction: z.string().min(2),
  tags: z.array(z.string()).optional(),
  autoAnchor: z.boolean().default(true),
});

export async function registerSwarmApiRoutes(
  app: Express,
  deps: {
    bridge: SolanaBridgeService;
    memoryService: MemoryReceiptService;
    identityService?: SolanaIdentityService;
    planReceiptService?: PlanReceiptService;
  }
) {
  const mirror = new SwarmMirrorStore();
  await mirror.init();
  const orchestrator = new ExecutionOrchestratorService({
    bridge: deps.bridge,
    memoryService: deps.memoryService,
    mirror,
    planReceiptService: deps.planReceiptService,
    identityService: deps.identityService,
  });

  app.get("/api/health", (_req, res) => {
    ok(res, {
      requestId: `health_${Date.now()}`,
      status: "ok",
      module: "swarm_orchestration",
      time: new Date().toISOString(),
    });
  });

  app.get("/api/session", async (req, res) => {
    try {
      const walletAddress = String(req.query.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress_required");
      const normalized = normalizeWalletAddress(walletAddress);
      const [session, network] = await Promise.all([
        deps.bridge.getSession(normalized),
        deps.bridge.getNetwork(),
      ]);
      ok(res, {
        walletAddress: normalized,
        cluster: session.cluster,
        programId: session.programId,
        sessionActive: session.isActive,
        sessionVerified: session.isVerified,
        hasSignature: session.hasSignature,
        expiresAt: session.expiresAt,
        canPublish: session.isActive && session.isVerified,
        canAnchor: session.isActive,
        canRun: true,
        staleReason: session.isActive ? undefined : "session_inactive_or_unsigned",
        network: {
          rpcUrl: network.rpcUrl,
          slot: network.slot,
          relayerWallet: network.relayerWallet,
        },
      });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/solana/status", async (req, res) => {
    try {
      circuitBreakerAllowOrThrow("solana_rpc");
      const network = await deps.bridge.getNetwork();
      recordCircuitSuccess("solana_rpc");
      ok(res, {
        cluster: network.cluster,
        programId: network.programId,
        rpcUrl: network.rpcUrl,
        slot: network.slot,
        epoch: network.epoch,
        commitment: network.commitment,
        relayerConfigured: Boolean(network.relayerWallet),
        relayerWallet: network.relayerWallet,
        healthy: true,
      });
    } catch (error) {
      recordCircuitFailure("solana_rpc");
      fail(res, error, 500, req);
    }
  });

  app.get("/api/skills", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const rows = await deps.identityService.listDiscoverySkills({
        query: req.query.q ? String(req.query.q) : undefined,
        category: req.query.category ? String(req.query.category) : undefined,
        tag: req.query.tag ? String(req.query.tag) : undefined,
        minTrustBps: req.query.minTrustBps ? Number(req.query.minTrustBps) : undefined,
        minUsage: req.query.minUsage ? Number(req.query.minUsage) : undefined,
      });
      let mapped = rows.map(discoveryToSkillIdentity);
      if (req.query.minReputation) {
        const min = Number(req.query.minReputation);
        mapped = mapped.filter(s => s.reputationScore >= min);
      }
      const sort = req.query.sort as string | undefined;
      if (sort === "success_rate") mapped.sort((a, b) => b.successRate - a.successRate);
      else if (sort === "most_used") mapped.sort((a, b) => b.usageCount - a.usageCount);
      else mapped.sort((a, b) => b.reputationScore - a.reputationScore);

      ok(res, { skills: mapped, total: mapped.length });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/skills/session/current", async (req, res) => {
    try {
      const walletAddress = String(req.query.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress_required");
      const wallet = normalizeWalletAddress(walletAddress);
      const skillId = mirror.getSelectedSkill(wallet);
      ok(res, { walletAddress: wallet, skillId });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/skills/:id", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const id = String(req.params.id);
      if (id === "session") {
        notFound(res, "Skill not found.", "skill_not_found");
        return;
      }
      const rows = await deps.identityService.listDiscoverySkills();
      const row = rows.find(r => r.skillAddress === id || r.slug === id || r.name === id);
      if (!row) {
        notFound(res, "Skill not found.", "skill_not_found");
        return;
      }
      ok(res, discoveryToSkillIdentity(row));
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.post("/api/skills/:id/select", async (req, res) => {
    try {
      const body = selectSkillBody.parse(req.body);
      const wallet = normalizeWalletAddress(body.walletAddress);
      const skillId = String(req.params.id);
      await mirror.setSelectedSkill(wallet, skillId);
      console.log(`[${requestId(req)}] skill_selected`, wallet, skillId);
      ok(res, { walletAddress: wallet, skillId, selectedAt: new Date().toISOString() });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.post("/api/execute/:id/reflect", async (req, res) => {
    try {
      const executionId = String(req.params.id);
      const body = z
        .object({
          walletAddress: z.string().min(32),
          rootCause: z.string().min(2),
          correctiveAdvice: z.string().min(2),
          nextAction: z.string().min(2),
          agentId: z.string().default("agent_swarm"),
        })
        .parse(req.body);
      const wallet = normalizeWalletAddress(body.walletAddress);
      const execution = mirror.getExecution(executionId);
      const sourceTurnId = execution?.id || `turn_${Date.now()}`;
      const created = await deps.memoryService.createReflection({
        agentId: body.agentId,
        wallet,
        conversationId: executionId,
        sourceTurnId,
        kind: "lesson",
        title: `Reflection for ${executionId}`,
        summary: body.correctiveAdvice,
        fullText: `${body.rootCause}\n${body.correctiveAdvice}\n${body.nextAction}`,
        rootCause: body.rootCause,
        correctiveAdvice: body.correctiveAdvice,
        nextAction: body.nextAction,
        tags: ["manual", "reflect"],
      });
      const receipt = await deps.memoryService.anchorReflection(created.reflection.id, wallet);
      ok(res, { executionId, reflection: created.reflection, receipt });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.post("/api/execute", async (req, res) => {
    try {
      const body = executeBody.parse(req.body);
      const wallet = normalizeWalletAddress(body.walletAddress);
      let userId: number | null = null;
      try {
        const user = await sdk.authenticateRequest(req);
        userId = user?.id ?? null;
      } catch {
        userId = null;
      }

      const result = await orchestrator.runSwarmExecute({
        wallet,
        goal: body.goal,
        skillId: body.skillId,
        skillName: body.skillName,
        agentId: body.agentId,
        userId,
        requestId: requestId(req),
      });

      console.log(
        `[${requestId(req)}] execute_complete`,
        result.execution.id,
        result.execution.status,
        result.errors.join(";")
      );

      sendAppOk(res, result, {
        degraded: result.degraded,
        status: result.degraded ? 207 : 200,
      });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.post("/api/demo/story", async (req, res) => {
    try {
      const body = demoBody.parse(req.body ?? {});
      let wallet = body.walletAddress?.trim();
      if (!wallet) {
        wallet = process.env.SWARM_DEMO_WALLET || "";
      }
      if (!wallet || wallet.length < 32) {
        throw new Error("walletAddress_required_for_demo");
      }
      wallet = normalizeWalletAddress(wallet);
      const skills = deps.identityService ? await deps.identityService.listDiscoverySkills() : [];
      const first = skills[0];
      const skillId = first?.skillAddress || first?.slug || "skill_demo";
      const skillName = first?.name || "SWARM discovery skill";

      const result = await orchestrator.runSwarmExecute({
        wallet,
        goal: "Demo: full SWARM loop — discover, coordinate, reflect, anchor proof, compound reputation.",
        skillId,
        skillName,
        agentId: body.agentId,
        userId: null,
        requestId: requestId(req),
      });
      sendAppOk(res, result, { degraded: result.degraded, status: 200 });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/memory", async (req, res) => {
    try {
      const agentId = req.query.agentId ? String(req.query.agentId) : undefined;
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const data = await deps.memoryService.listReflections({
        agentId,
        wallet,
        limit,
      });
      ok(res, data);
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/memory/:id", async (req, res) => {
    try {
      const data = await deps.memoryService.getReflection(String(req.params.id));
      ok(res, data);
    } catch (error) {
      fail(res, error, 404, req);
    }
  });

  app.post("/api/memory", async (req, res) => {
    try {
      const body = memoryPostBody.parse(req.body);
      const created = await deps.memoryService.createReflection({
        agentId: body.agentId,
        wallet: body.wallet,
        sourceTurnId: body.sourceTurnId,
        kind: body.kind,
        title: body.title,
        summary: body.summary,
        fullText: body.fullText,
        rootCause: body.rootCause,
        correctiveAdvice: body.correctiveAdvice,
        nextAction: body.nextAction,
        tags: body.tags,
      });
      let receipt = null;
      if (body.autoAnchor && body.wallet) {
        receipt = await deps.memoryService.anchorReflection(created.reflection.id, body.wallet);
      }
      ok(res, { reflection: created.reflection, receipt });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/receipts", async (req, res) => {
    try {
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : undefined;
      const mirrorReceipts = mirror.listReceipts({ wallet, limit: 100 });
      const chainAccounts = await deps.bridge.listMirrorAccounts({ wallet });
      ok(res, {
        mirror: mirrorReceipts,
        chain: chainAccounts.slice(0, 50),
      });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/receipts/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      const fromBridge = await deps.bridge.getMirrorAccount(id);
      if (fromBridge) {
        ok(res, fromBridge);
        return;
      }
      const fromMirror = mirror.listReceipts({ limit: 2000 }).find(r => r.id === id);
      if (fromMirror) {
        ok(res, fromMirror);
        return;
      }
      notFound(res, "Receipt not found.", "receipt_not_found");
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.post("/api/receipts", async (req, res) => {
    try {
      const body = z
        .object({
          walletAddress: z.string().min(32),
          type: z.enum(["skill.publish", "skill.update", "plan", "execution", "reflection", "memory", "proof", "dao", "queue", "wallet"]),
          subjectId: z.string().min(1),
          subjectType: z.string().min(1),
          summaryHash: z.string().min(32),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
        .parse(req.body);
      const wallet = normalizeWalletAddress(body.walletAddress);
      const record = {
        id: `rcpt_manual_${Date.now()}`,
        type: body.type,
        subjectId: body.subjectId,
        subjectType: body.subjectType,
        wallet,
        chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
        summaryHash: body.summaryHash,
        status: "draft" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: body.metadata || {},
      };
      await mirror.appendReceipt(record);
      ok(res, record);
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/proofs", async (req, res) => {
    try {
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : undefined;
      const accounts = await deps.bridge.listMirrorAccounts({
        wallet,
        kind: "proof_receipt",
      } as never);
      ok(res, accounts);
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/proofs/:id", async (req, res) => {
    try {
      const data = await deps.bridge.getMirrorAccount(String(req.params.id));
      if (!data) {
        notFound(res, "Proof receipt not found.", "proof_not_found");
        return;
      }
      ok(res, data);
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/reputation", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const profiles = await deps.identityService.listDiscoveryProfiles();
      ok(res, { profiles });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/reputation/:skillId", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const skillId = String(req.params.skillId);
      const rows = await deps.identityService.listDiscoverySkills();
      const row = rows.find(r => r.skillAddress === skillId || r.slug === skillId);
      if (!row) {
        notFound(res, "Skill not found.", "skill_not_found");
        return;
      }
      ok(res, {
        skill: discoveryToSkillIdentity(row),
        signals: {
          trustScoreBps: row.trustScoreBps,
          discoveryScoreBps: row.discoveryScoreBps,
          usageCount: row.usageCount,
          successCount: row.successCount,
          failureCount: row.failureCount,
        },
      });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });

  app.get("/api/history", async (req, res) => {
    try {
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 40;
      const [executions, bridgeHistory] = await Promise.all([
        Promise.resolve(mirror.listExecutions({ wallet, limit })),
        deps.bridge.listHistory({ wallet, limit }),
      ]);
      ok(res, { executions, bridgeHistory });
    } catch (error) {
      fail(res, error, 400, req);
    }
  });
}
