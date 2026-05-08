import type { Express, Response } from "express";
import { z } from "zod";
import { DaoService } from "./daoService";
import { mapVoteLedger } from "./governanceMapper";

function ok(res: Response, data: unknown) {
  res.json({ ok: true, data });
}

function fail(res: Response, message: string, status = 400) {
  res.status(status).json({ ok: false, error: message });
}

export function registerDaoRoutes(app: Express, daoService: DaoService) {
  app.get("/api/dao/command-center", (req, res) => {
    try {
      const demo = String(req.query.demo || "") === "1" || String(req.query.demo || "") === "true";
      const walletAddress = req.query.walletAddress ? String(req.query.walletAddress).trim() : undefined;
      const payload = daoService.buildCommandCenterPayload({ walletAddress, demo });
      ok(res, payload);
    } catch (e: unknown) {
      fail(res, e instanceof Error ? e.message : "command_center_failed", 500);
    }
  });

  app.get("/api/dao/config", (_req, res) => {
    res.json({ ok: true, data: daoService.getConfig() });
  });

  app.get("/api/dao/members", (_req, res) => {
    res.json({ ok: true, data: daoService.listMembers() });
  });

  app.get("/api/dao/members/:wallet", (req, res) => {
    const data = daoService.getMember(req.params.wallet);
    if (!data) return fail(res, "member_not_found", 404);
    res.json({ ok: true, data });
  });

  app.post("/api/dao/members/register", async (req, res) => {
    try {
      const { wallet, delegate, stakeLamports, reputationPoints } = req.body;
      const data = await daoService.registerMember(
        String(wallet),
        String(delegate || wallet),
        Number(stakeLamports || 0),
        Number(reputationPoints || 0)
      );
      res.json({ ok: true, data });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "register_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.get("/api/dao/delegations", (_req, res) => {
    ok(res, daoService.listDelegations());
  });

  app.post("/api/dao/delegations", async (req, res) => {
    try {
      const body = z
        .object({
          fromWallet: z.string().min(32),
          toWallet: z.string().min(32),
          reason: z.string().max(500).optional(),
        })
        .parse(req.body);
      const data = await daoService.delegateVotePower(body.fromWallet, body.toWallet, body.reason);
      ok(res, data);
    } catch (e: unknown) {
      fail(res, e instanceof Error ? e.message : "delegation_failed");
    }
  });

  app.post("/api/dao/delegations/revoke", async (req, res) => {
    try {
      const body = z.object({ fromWallet: z.string().min(32) }).parse(req.body);
      await daoService.revokeDelegate(body.fromWallet);
      ok(res, { revoked: true });
    } catch (e: unknown) {
      fail(res, e instanceof Error ? e.message : "revoke_failed");
    }
  });

  app.get("/api/dao/votes", (req, res) => {
    const proposalId = req.query.proposalId ? Number(req.query.proposalId) : undefined;
    if (proposalId !== undefined && Number.isNaN(proposalId)) {
      return fail(res, "invalid_proposal_id");
    }
    ok(res, daoService.listVoteLedger(proposalId).map(mapVoteLedger));
  });

  app.post("/api/dao/proposals", async (req, res) => {
    try {
      const data = await daoService.createProposal({
        proposalId: Number(req.body.proposalId),
        proposer: String(req.body.proposer),
        title: String(req.body.title),
        description: String(req.body.description),
        kind: String(req.body.kind) as import("./daoTypes").DaoProposalKind,
        skillKey: String(req.body.skillKey || ""),
        recipient: String(req.body.recipient || req.body.proposer),
        amountLamports: Number(req.body.amountLamports || 0),
        startSlot: Number(req.body.startSlot || 0),
        endSlot: Number(req.body.endSlot || 0),
        quorumBps: Number(req.body.quorumBps || 4000),
        approvalThresholdBps: Number(req.body.approvalThresholdBps || 5000),
      });
      res.json({ ok: true, data });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "proposal_create_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.get("/api/dao/proposals", (_req, res) => {
    res.json({ ok: true, data: daoService.listProposals() });
  });

  app.get("/api/dao/proposals/:proposalId", (req, res) => {
    const data = daoService.getProposal(Number(req.params.proposalId));
    if (!data) return fail(res, "proposal_not_found", 404);
    res.json({ ok: true, data });
  });

  app.post("/api/dao/proposals/:proposalId/vote", async (req, res) => {
    try {
      const choice = String(req.body.choice) as import("./daoTypes").DaoVoteChoice;
      if (!["yes", "no", "abstain", "veto"].includes(choice)) {
        return fail(res, "invalid_vote_choice");
      }
      const data = await daoService.castVote(
        Number(req.params.proposalId),
        String(req.body.wallet),
        choice,
        String(req.body.reason || "")
      );
      res.json({ ok: true, data });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "vote_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/dao/proposals/:proposalId/finalize", async (req, res) => {
    try {
      const data = await daoService.finalizeProposal(Number(req.params.proposalId));
      res.json({ ok: true, data });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "finalize_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/dao/proposals/:proposalId/execute", async (req, res) => {
    try {
      const data = await daoService.executeProposal(Number(req.params.proposalId));
      res.json({ ok: true, data });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "execute_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.get("/api/dao/discovery", (_req, res) => {
    res.json({ ok: true, data: daoService.listDiscovery() });
  });
}
