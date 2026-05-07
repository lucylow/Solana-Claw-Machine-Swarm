import type { Express, Request } from "express";
import { SolanaIdentityService } from "./identityService";
import { normalizeWalletAddress } from "./pda";

function requestId(req: Request) {
  return (req.headers["x-request-id"] as string) || `req_${Date.now()}`;
}

export function registerSolanaIdentityRoutes(app: Express, service: SolanaIdentityService) {
  app.post("/api/solana/identity/challenge", async (req, res) => {
    try {
      const walletAddress = String(req.body.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress required");
      const challenge = await service.createChallenge(normalizeWalletAddress(walletAddress), requestId(req));
      res.json({ ok: true, data: challenge });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "challenge_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/solana/identity/verify", async (req, res) => {
    try {
      const walletAddress = String(req.body.walletAddress || "").trim();
      const challengeId = String(req.body.challengeId || "").trim();
      const signature = String(req.body.signature || "").trim();
      const message = String(req.body.message || "").trim();

      if (!walletAddress || !challengeId || !signature || !message) {
        throw new Error("walletAddress, challengeId, signature, and message are required");
      }

      const data = await service.verifySignature({
        walletAddress: normalizeWalletAddress(walletAddress),
        challengeId,
        signatureBase58: signature,
        message,
      });

      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "verify_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.get("/api/solana/identity/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getIdentity(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "identity_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });

  app.get("/api/solana/identity/:walletAddress/profile", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getProfile(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "profile_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });

  app.get("/api/solana/identity/:walletAddress/skills", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getSkills(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "skills_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });

  app.get("/api/solana/identity/:walletAddress/memories", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getMemories(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "memories_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });

  app.get("/api/solana/identity/:walletAddress/receipts", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getReceipts(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "receipts_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });

  app.post("/api/solana/identity/:walletAddress/skill-use", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const skillRef = String(req.body.skillSlug || req.body.skillName || req.body.skillId || "").trim();
      if (!skillRef) throw new Error("skillSlug, skillName, or skillId required");
      const data = await service.recordSkillUse(normalizedWallet, skillRef);
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "skill_use_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/solana/identity/:walletAddress/memory", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const memory = await service.recordMemory({
        id: `mem_${Date.now()}`,
        walletAddress: normalizedWallet,
        kind: String(req.body.kind || "reflection"),
        title: String(req.body.title || "Untitled memory"),
        summary: String(req.body.summary || ""),
        tags: Array.isArray(req.body.tags) ? req.body.tags.map(String) : [],
        importance: Number(req.body.importance || 0.5),
        createdAt: Date.now(),
        pinned: Boolean(req.body.pinned),
        sourceTurnId: req.body.sourceTurnId ? String(req.body.sourceTurnId) : undefined,
        rootCause: req.body.rootCause ? String(req.body.rootCause) : undefined,
        correctiveAdvice: req.body.correctiveAdvice ? String(req.body.correctiveAdvice) : undefined,
      });
      res.json({ ok: true, data: memory });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "memory_store_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/solana/identity/:walletAddress/memory-anchor", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const data = await service.recordMemoryAnchor({
        walletAddress: normalizedWallet,
        sourceTurnId: String(req.body.sourceTurnId || `turn_${Date.now()}`),
        taskType: String(req.body.taskType || "general"),
        kind: String(req.body.kind || "reflection"),
        result: String(req.body.result || "unknown"),
        sourceHash: String(req.body.sourceHash || ""),
        reflectionHash: String(req.body.reflectionHash || ""),
        lessonHash: String(req.body.lessonHash || ""),
        summary: String(req.body.summary || ""),
        rootCause: String(req.body.rootCause || ""),
        correctiveAdvice: String(req.body.correctiveAdvice || ""),
        nextBestAction: String(req.body.nextBestAction || ""),
        confidenceBps: Number(req.body.confidenceBps || 0),
        severityBps: Number(req.body.severityBps || 0),
        tags: Array.isArray(req.body.tags) ? req.body.tags.map(String) : [],
        relatedMemoryIds: Array.isArray(req.body.relatedMemoryIds)
          ? req.body.relatedMemoryIds.map(String)
          : [],
        pinned: Boolean(req.body.pinned),
      });
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "memory_anchor_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/solana/identity/:walletAddress/planner-run", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const data = await service.recordPlannerRun({
        walletAddress: normalizedWallet,
        runId: String(req.body.runId || `run_${Date.now()}`),
        taskType: String(req.body.taskType || "general"),
        goal: String(req.body.goal || ""),
        planHash: String(req.body.planHash || ""),
        stepHash: String(req.body.stepHash || ""),
        outcome: String(req.body.outcome || "planned") as
          | "planned"
          | "running"
          | "succeeded"
          | "failed"
          | "aborted",
        selectedSkill: req.body.selectedSkill ? String(req.body.selectedSkill) : undefined,
        stepCount: Number(req.body.stepCount || 0),
        completedSteps: Number(req.body.completedSteps || 0),
        failedSteps: Number(req.body.failedSteps || 0),
        rootCause: req.body.rootCause ? String(req.body.rootCause) : undefined,
        correctiveAdvice: req.body.correctiveAdvice ? String(req.body.correctiveAdvice) : undefined,
        nextBestAction: req.body.nextBestAction ? String(req.body.nextBestAction) : undefined,
        confidenceBps: Number(req.body.confidenceBps || 0),
      });
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "planner_run_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/solana/identity/:walletAddress/deployment", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const data = await service.recordDeployment({
        walletAddress: normalizedWallet,
        deployId: String(req.body.deployId || `deploy_${Date.now()}`),
        name: String(req.body.name || "Unnamed deployment"),
        version: String(req.body.version || "0.0.1"),
        target: String(req.body.target || "solana"),
        bundleHash: String(req.body.bundleHash || ""),
        sourceHash: String(req.body.sourceHash || ""),
        storageKey: String(req.body.storageKey || ""),
        receiptHash: String(req.body.receiptHash || ""),
        txHash: req.body.txHash ? String(req.body.txHash) : undefined,
        explorerUrl: req.body.explorerUrl ? String(req.body.explorerUrl) : undefined,
        status: String(req.body.status || "pending") as
          | "pending"
          | "uploaded"
          | "anchored"
          | "confirmed"
          | "failed",
        artifactCount: Number(req.body.artifactCount || 0),
        bytes: Number(req.body.bytes || 0),
        chainId: Number(req.body.chainId || 0) || undefined,
      });
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "deployment_record_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/solana/identity/:walletAddress/reputation", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const data = await service.recordReputationEvent({
        walletAddress: normalizedWallet,
        eventKind: String(req.body.eventKind || "other") as
          | "memory_anchor"
          | "planner_run"
          | "deployment"
          | "other",
        eventRef: String(req.body.eventRef || ""),
        success: Boolean(req.body.success),
        weight: Number(req.body.weight || 0),
      });
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "reputation_update_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.get("/api/solana/identity/:walletAddress/planner-runs", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getPlannerRuns(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "planner_runs_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });

  app.get("/api/solana/identity/:walletAddress/deployments", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getDeployments(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "deployments_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });

  app.get("/api/solana/identity/:walletAddress/reputation", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getReputation(normalizeWalletAddress(walletAddress));
      if (!data) {
        res.status(404).json({ ok: false, error: "reputation_not_found" });
        return;
      }
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "reputation_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
}
