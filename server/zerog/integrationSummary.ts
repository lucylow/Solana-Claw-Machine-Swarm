import type { ZeroGIntegrationStatus } from "@shared/zerog";
import type { ZeroGOrchestratorStore } from "./artifacts";
import { getZeroGConfig } from "./config";

type MinimalZeroGModule = {
  storage: { getHealth(): Promise<{ ok: boolean; reason?: string }> };
  da: { getHealth(): Promise<{ ok: boolean; reason?: string }> };
  store: ZeroGOrchestratorStore;
};

export async function buildZeroGIntegrationStatus(
  module: MinimalZeroGModule,
): Promise<ZeroGIntegrationStatus> {
  const cfg = getZeroGConfig();
  const [storageH, daH] = await Promise.all([
    module.storage.getHealth(),
    module.da.getHealth(),
  ]);
  const mode =
    cfg.mode === "live"
      ? "live"
      : cfg.mode === "degraded"
        ? "degraded"
        : "mock";
  const lastArtifact = module.store.listArtifacts()[0];
  const lastDa = module.store.listAvailability()[0];
  return {
    storage: {
      available: cfg.enabled && storageH.ok,
      connected: storageH.ok,
      lastUploadAt: lastArtifact?.createdAt,
      lastError: storageH.ok ? undefined : storageH.reason,
    },
    da: {
      available: cfg.enabled && daH.ok,
      connected: daH.ok,
      lastBatchAt: lastDa?.createdAt,
      lastRootHash: lastDa?.rootHash,
      lastError: daH.ok ? undefined : daH.reason,
    },
    mode,
  };
}
