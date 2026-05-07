import crypto from "crypto";
import type { SolanaCluster } from "@shared/solana/types";
import type { ZeroGOrchestrationResult } from "@shared/zerog";
import { hashValue } from "./artifacts";
import type { ZeroGOrchestratorStore } from "./artifacts";
import { createCanonicalBlobAdapter } from "./canonicalBlobAdapter";
import { CanonicalDaService } from "./canonicalDa";
import { solanaProofToReceiptRecord } from "../solana/receipts";

type ZeroGModuleCore = {
  store: ZeroGOrchestratorStore;
};

const daLane = new CanonicalDaService();

export function createSidecarOrchestrator(module: ZeroGModuleCore) {
  const blobs = createCanonicalBlobAdapter(module.store);

  return {
    async persistArtifact(input: {
      wallet: string;
      cluster: SolanaCluster;
      namespace: string;
      receiptType: NonNullable<ZeroGOrchestrationResult["receipt"]>["type"];
      subjectId: string;
      contentType: string;
      payload: Uint8Array;
      explorerBaseUrl?: string;
    }): Promise<ZeroGOrchestrationResult> {
      const errors: NonNullable<ZeroGOrchestrationResult["errors"]> = [];
      let blobRef: ZeroGOrchestrationResult["blobRef"];
      let daRecord: ZeroGOrchestrationResult["daRecord"];
      let daBatch: ZeroGOrchestrationResult["daBatch"];
      let receipt: ZeroGOrchestrationResult["receipt"];

      try {
        blobRef = await blobs.putBlob({
          namespace: input.namespace,
          contentType: input.contentType,
          data: input.payload,
          metadata: {
            wallet: input.wallet,
            cluster: input.cluster,
            subjectId: input.subjectId,
          },
        });
      } catch (e) {
        errors.push({
          code: "storage_put_failed",
          message: e instanceof Error ? e.message : "storage_put_failed",
          retryable: true,
        });
      }

      const payloadHash = crypto.createHash("sha256").update(Buffer.from(input.payload)).digest("hex");

      try {
        daRecord = await daLane.appendRecord({
          subjectType: input.receiptType,
          subjectId: input.subjectId,
          kind: "artifact_lineage",
          payloadHash,
          blobRef: blobRef?.uri,
          wallet: input.wallet,
          metadata: { namespace: input.namespace },
        });
        daBatch = await daLane.appendBatch({
          batchType: "solana_sidecar",
          subjectType: input.receiptType,
          subjectId: input.subjectId,
          records: daRecord ? [daRecord] : [],
          metadata: { wallet: input.wallet },
        });
      } catch (e) {
        errors.push({
          code: "da_append_failed",
          message: e instanceof Error ? e.message : "da_append_failed",
          retryable: true,
        });
      }

      try {
        const subjectType =
          input.receiptType === "zerog_upload"
            ? "zerog_upload"
            : input.receiptType === "zerog_da_batch"
              ? "zerog_da_batch"
              : input.receiptType === "proof"
                ? "proof"
                : input.receiptType === "reflection"
                  ? "reflection"
                  : input.receiptType === "memory"
                    ? "memory"
                    : input.receiptType === "plan"
                      ? "plan"
                      : input.receiptType === "execution"
                        ? "execution"
                        : input.receiptType === "skill"
                          ? "skill"
                          : "bridge";

        const proof = module.store.createSolanaReceipt({
          subjectType,
          subjectId: input.subjectId,
          wallet: input.wallet,
          summaryHash: blobRef?.checksum || hashValue(payloadHash),
          zeroGStorageRef: blobRef?.uri,
          zeroGAvailabilityRef: daBatch?.batchUri,
        });
        receipt = solanaProofToReceiptRecord(proof, input.cluster, input.receiptType, input.explorerBaseUrl);
        receipt.daRoot = daBatch?.rootHash;
      } catch (e) {
        errors.push({
          code: "receipt_mirror_failed",
          message: e instanceof Error ? e.message : "receipt_mirror_failed",
          retryable: false,
        });
      }

      const status: ZeroGOrchestrationResult["status"] =
        blobRef && daRecord && receipt ? "success" : blobRef || daRecord || receipt ? "partial" : errors.length ? "failed" : "degraded";

      return { blobRef, daRecord, daBatch, receipt, status, errors: errors.length ? errors : undefined };
    },
  };
}
