import { describe, expect, it } from "vitest";
import { OpenClawBridgeService } from "./bridge";

describe("OpenClawBridgeService", () => {
  it("imports manifests and emits bridge receipts", () => {
    const service = new OpenClawBridgeService();
    const result = service.importManifest(
      {
        manifestVersion: "1.0",
        skillId: "skill_openclaw_test",
        name: "OpenClaw Toolchain",
        description: "Bridge test manifest",
        authorWallet: "Wallet11111111111111111111111111111111111111",
        version: "1.0.0",
        tags: ["openclaw"],
        tools: [],
        contentHash: "hash_test",
        provenanceHash: "prov_test",
        createdAt: Date.now(),
      },
      "Wallet11111111111111111111111111111111111111",
    );

    expect(result.receipt.direction).toBe("import");
    expect(service.listReceipts().length).toBe(1);
  });

  it("exports claw skills into OpenClaw manifests", () => {
    const service = new OpenClawBridgeService();
    const result = service.exportSkill({
      skillId: "skill_export_test",
      name: "Planner",
      description: "Planner skill",
      authorWallet: "Wallet11111111111111111111111111111111111111",
      version: "2.1.0",
      tags: ["planner", "bridge"],
      contentHash: "hash_export",
    });

    expect(result.manifest.skillId).toBe("skill_export_test");
    expect(result.receipt.direction).toBe("export");
  });
});
