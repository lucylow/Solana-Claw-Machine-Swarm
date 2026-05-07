import type { Express } from "express";
import { DaoService } from "./daoService";

export function registerDaoRoutes(app: Express, daoService: DaoService) {
  app.get("/api/dao/config", (_req, res) => {
    res.json({ ok: true, data: daoService.getConfig() });
  });

  app.get("/api/dao/members", (_req, res) => {
    res.json({ ok: true, data: daoService.listMembers() });
  });

  app.get("/api/dao/members/:wallet", (req, res) => {
    const data = daoService.getMember(req.params.wallet);
    if (!data) return res.status(404).json({ ok: false, error: "member_not_found" });
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
    if (!data) return res.status(404).json({ ok: false, error: "proposal_not_found" });
    res.json({ ok: true, data });
  });

  app.post("/api/dao/proposals/:proposalId/vote", async (req, res) => {
    try {
      const data = await daoService.castVote(
        Number(req.params.proposalId),
        String(req.body.wallet),
        String(req.body.choice) as import("./daoTypes").DaoVoteChoice,
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
