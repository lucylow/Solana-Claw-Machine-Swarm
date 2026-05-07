import crypto from "crypto";
import type { Express } from "express";
import type { OpenClawBridgeReceipt, OpenClawSkillManifest } from "@shared/openclaw/types";
import type { ClawSkillAsset, OpenClawBridgeState } from "./types";

function hashJson(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function receiptId() {
  return `bridge_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export class OpenClawBridgeService {
  private readonly state: OpenClawBridgeState = {
    status: "verified",
    manifests: [],
    receipts: [],
  };

  listManifests() {
    return [...this.state.manifests];
  }

  listReceipts() {
    return [...this.state.receipts].sort((a, b) => b.timestamp - a.timestamp);
  }

  getStatus() {
    return {
      status: this.state.status,
      manifestCount: this.state.manifests.length,
      receiptCount: this.state.receipts.length,
    };
  }

  importManifest(manifest: OpenClawSkillManifest, wallet: string) {
    const manifestHash = hashJson(manifest);
    const next = {
      ...manifest,
      contentHash: manifest.contentHash || manifestHash,
      provenanceHash: manifest.provenanceHash || manifestHash,
    };
    const exists = this.state.manifests.findIndex(item => item.skillId === next.skillId && item.version === next.version);
    if (exists >= 0) this.state.manifests[exists] = next;
    else this.state.manifests.unshift(next);

    const receipt: OpenClawBridgeReceipt = {
      id: receiptId(),
      direction: "import",
      bridgeStatus: this.state.status,
      sourceFormat: "openclaw",
      targetFormat: "claw",
      skillId: next.skillId,
      wallet,
      manifestHash,
      timestamp: Date.now(),
    };
    this.state.receipts.unshift(receipt);
    return { manifest: next, receipt };
  }

  exportSkill(skill: ClawSkillAsset): { manifest: OpenClawSkillManifest; receipt: OpenClawBridgeReceipt } {
    const manifest: OpenClawSkillManifest = {
      manifestVersion: "1.0",
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description,
      authorWallet: skill.authorWallet,
      version: skill.version,
      tags: skill.tags,
      tools: [],
      contentHash: skill.contentHash,
      provenanceHash: hashJson(skill),
      createdAt: Date.now(),
    };
    const manifestHash = hashJson(manifest);
    this.state.manifests.unshift(manifest);
    const receipt: OpenClawBridgeReceipt = {
      id: receiptId(),
      direction: "export",
      bridgeStatus: this.state.status,
      sourceFormat: "claw",
      targetFormat: "openclaw",
      skillId: skill.skillId,
      wallet: skill.authorWallet,
      manifestHash,
      timestamp: Date.now(),
    };
    this.state.receipts.unshift(receipt);
    return { manifest, receipt };
  }
}

export function registerOpenClawBridgeRoutes(app: Express, service: OpenClawBridgeService) {
  app.get("/api/openclaw/status", (_req, res) => {
    res.json({ ok: true, data: service.getStatus() });
  });

  app.get("/api/openclaw/manifests", (_req, res) => {
    res.json({ ok: true, data: service.listManifests() });
  });

  app.get("/api/openclaw/receipts", (_req, res) => {
    res.json({ ok: true, data: service.listReceipts() });
  });

  app.post("/api/openclaw/import", (req, res) => {
    try {
      const wallet = String(req.body.wallet || "").trim();
      const manifest = req.body.manifest as OpenClawSkillManifest | undefined;
      if (!wallet || !manifest?.skillId) throw new Error("wallet and manifest are required");
      const data = service.importManifest(manifest, wallet);
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "openclaw_import_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });

  app.post("/api/openclaw/export", (req, res) => {
    try {
      const skill = req.body.skill as ClawSkillAsset | undefined;
      if (!skill?.skillId || !skill.authorWallet) throw new Error("skill payload is required");
      const data = service.exportSkill(skill);
      res.json({ ok: true, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "openclaw_export_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
}

