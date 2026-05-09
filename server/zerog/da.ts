import crypto from "crypto";
import { ZeroGOrchestratorStore } from "./artifacts";
import { getZeroGConfig } from "./config";
import type {
  ZeroGDataAvailabilityAdapter,
  ZeroGDataAvailabilityRecord,
  ZeroGHealthStatus,
} from "./types";

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function now() {
  return new Date().toISOString();
}

export class ZeroGDataAvailabilityService
  implements ZeroGDataAvailabilityAdapter
{
  constructor(private readonly store: ZeroGOrchestratorStore) {}

  async publish(input: {
    artifactId: string;
    artifactKind: string;
    rootHash: string;
    sizeBytes?: number;
    metadata?: Record<string, unknown>;
  }): Promise<ZeroGDataAvailabilityRecord> {
    const config = getZeroGConfig();
    const id = randomId("da");
    const record: ZeroGDataAvailabilityRecord = {
      id,
      artifactId: input.artifactId,
      artifactKind: input.artifactKind,
      availabilityRef: `zg://da/records/${id}`,
      rootHash: input.rootHash,
      chunkCount:
        typeof input.sizeBytes === "number"
          ? Math.max(1, Math.ceil(input.sizeBytes / 4096))
          : 1,
      sizeBytes: input.sizeBytes,
      createdAt: now(),
      status: config.enabled
        ? config.mode === "degraded"
          ? "degraded"
          : "available"
        : "failed",
      metadata: {
        mode: config.mode,
        ...input.metadata,
      },
    };
    return this.store.putAvailability(record);
  }

  async getByRef(
    availabilityRef: string,
  ): Promise<ZeroGDataAvailabilityRecord | null> {
    return this.store.getAvailabilityByRef(availabilityRef);
  }

  async getHealth(): Promise<ZeroGHealthStatus> {
    const config = getZeroGConfig();
    return {
      ok: config.enabled,
      reason: config.enabled ? undefined : "zerog_da_disabled",
      latencyMs: 9,
      mode: config.mode,
    };
  }
}
