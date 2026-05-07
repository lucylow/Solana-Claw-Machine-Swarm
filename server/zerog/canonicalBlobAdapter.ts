import type { ZeroGArtifactKind, ZeroGBlobRef, ZeroGStorageAdapter } from "@shared/zerog";
import { hashValue, ZeroGOrchestratorStore } from "./artifacts";
import { ZeroGStorageService } from "./storage";

async function loadBlobBytes(inner: ZeroGStorageService, uri: string): Promise<Uint8Array> {
  const artifact = await inner.getArtifact(uri);
  if (!artifact || typeof artifact.content !== "object" || artifact.content === null) {
    throw new Error("blob_not_found");
  }
  const bytesB64 = (artifact.content as { bytesB64?: string }).bytesB64;
  if (!bytesB64) throw new Error("blob_payload_missing");
  return new Uint8Array(Buffer.from(bytesB64, "base64"));
}

/** Canonical blob adapter over the existing artifact store (namespaced, hashed payloads). */
export function createCanonicalBlobAdapter(store: ZeroGOrchestratorStore): ZeroGStorageAdapter {
  const inner = new ZeroGStorageService(store);

  return {
    async putBlob(input) {
      const id = `blob_${hashValue({ ns: input.namespace, ct: input.contentType }).slice(0, 24)}`;
      const buf = Buffer.from(input.data);
      const checksum = hashValue(buf.toString("base64"));
      const artifact = await inner.storeArtifact({
        id,
        kind: "asset" as ZeroGArtifactKind,
        title: input.namespace,
        summary: `Canonical blob (${input.contentType})`,
        content: {
          namespace: input.namespace,
          bytesB64: buf.toString("base64"),
          metadata: input.metadata ?? {},
        },
        contentHash: checksum,
        checksum,
        contentType: input.contentType,
        sizeBytes: buf.byteLength,
        createdAt: new Date().toISOString(),
        status: "pending",
        tags: [input.namespace, "canonical_blob"],
        metadata: input.metadata ?? {},
      });
      const ref: ZeroGBlobRef = {
        blobId: artifact.id,
        namespace: input.namespace,
        checksum: artifact.checksum,
        sizeBytes: artifact.sizeBytes,
        contentType: input.contentType,
        uri: artifact.storageRef || `zg://storage/artifacts/${artifact.id}`,
        createdAt: artifact.createdAt,
      };
      return ref;
    },

    async getBlob(uriOrId: string) {
      return loadBlobBytes(inner, uriOrId);
    },

    async verifyBlob(ref: ZeroGBlobRef) {
      try {
        const data = await loadBlobBytes(inner, ref.uri);
        const checksum = hashValue(Buffer.from(data).toString("base64"));
        return checksum === ref.checksum;
      } catch {
        return false;
      }
    },

    async listBlobs(namespace?: string) {
      const kinds = await inner.listArtifactsByKind("asset");
      return kinds
        .filter(a => !namespace || a.tags.includes(namespace))
        .map(
          (a): ZeroGBlobRef => ({
            blobId: a.id,
            namespace:
              typeof a.content === "object" && a.content && "namespace" in a.content
                ? String((a.content as { namespace?: string }).namespace ?? a.title)
                : a.title || "default",
            checksum: a.checksum,
            sizeBytes: a.sizeBytes,
            contentType: a.contentType,
            uri: a.storageRef || `zg://storage/artifacts/${a.id}`,
            createdAt: a.createdAt,
          })
        );
    },
  };
}
