import { hashValue, ZeroGOrchestratorStore } from "./artifacts";
import { getZeroGConfig } from "./config";
import type {
  ZeroGHealthStatus,
  ZeroGStorageAdapter,
  ZeroGStorageArtifact,
} from "./types";

function storageRefFromId(id: string) {
  return `zg://storage/artifacts/${id}`;
}

function sizeOf(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

export class ZeroGStorageService implements ZeroGStorageAdapter {
  constructor(private readonly store: ZeroGOrchestratorStore) {}

  async storeArtifact(
    input: ZeroGStorageArtifact,
  ): Promise<ZeroGStorageArtifact> {
    const config = getZeroGConfig();
    const contentHash = input.contentHash || hashValue(input.content);
    const next: ZeroGStorageArtifact = {
      ...input,
      contentHash,
      checksum:
        input.checksum ||
        hashValue({ id: input.id, contentHash, title: input.title }),
      sizeBytes: input.sizeBytes || sizeOf(input.content),
      storageRef: input.storageRef || storageRefFromId(input.id),
      status: config.enabled
        ? config.mode === "degraded"
          ? "degraded"
          : "stored"
        : "failed",
      createdAt: input.createdAt || new Date().toISOString(),
      metadata: {
        mode: config.mode,
        environment: config.environment,
        ...input.metadata,
      },
    };
    return this.store.putArtifact(next);
  }

  async getArtifact(storageRef: string): Promise<ZeroGStorageArtifact | null> {
    return this.store.getArtifactByRef(storageRef);
  }

  async verifyArtifact(
    storageRef: string,
    expectedHash: string,
  ): Promise<boolean> {
    const artifact = this.store.getArtifactByRef(storageRef);
    if (!artifact) return false;
    const verified = artifact.contentHash === expectedHash;
    if (verified) {
      this.store.putArtifact({
        ...artifact,
        status: "verified",
      });
    }
    return verified;
  }

  async listArtifactsByKind(
    kind: ZeroGStorageArtifact["kind"],
  ): Promise<ZeroGStorageArtifact[]> {
    return this.store
      .listArtifacts()
      .filter((item) => item.kind === kind)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getHealth(): Promise<ZeroGHealthStatus> {
    const config = getZeroGConfig();
    const started = Date.now();
    const ok = config.enabled;
    return {
      ok,
      reason: ok ? undefined : "zerog_disabled",
      latencyMs: Date.now() - started,
      mode: config.mode,
    };
  }
}
