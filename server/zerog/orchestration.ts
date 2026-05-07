import type { ReflectionKind } from "@shared/memoryReceipts";
import crypto from "crypto";
import { hashValue } from "./artifacts";
import { getZeroGModule } from "./routes";

export interface OrchestratedReflectionSidecar {
  artifactId: string;
  zeroGStorageRef?: string;
  zeroGComputeRef?: string;
  zeroGAvailabilityRef?: string;
  solanaProofReceiptId?: string;
  solanaTxSignature?: string;
  linkId?: string;
  summaryHash: string;
}

/**
 * Persists the full reflection payload in the 0G storage adapter, runs a compute normalization pass,
 * publishes a DA record, and links a compact Solana-side proof receipt — without putting narrative on-chain.
 */
export async function orchestrateReflectionSidecar(input: {
  reflectionId: string;
  agentId: string;
  runId: string;
  wallet: string;
  rootCause: string;
  correctiveAction: string;
  nextAction: string;
  fullText: string;
  kind: ReflectionKind;
  autonomyLevel: string;
}): Promise<OrchestratedReflectionSidecar> {
  const module = getZeroGModule();
  const now = new Date().toISOString();
  const fullText = input.fullText;

  const artifact = await module.storage.storeArtifact({
    id: input.reflectionId,
    kind: "reflection",
    title: `Reflection ${input.reflectionId}`,
    summary: input.correctiveAction.slice(0, 280),
    content: {
      agentId: input.agentId,
      runId: input.runId,
      wallet: input.wallet,
      kind: input.kind,
      autonomyLevel: input.autonomyLevel,
      rootCause: input.rootCause,
      correctiveAction: input.correctiveAction,
      nextAction: input.nextAction,
      fullText,
      createdAt: now,
    },
    contentHash: hashValue(fullText),
    checksum: hashValue({ id: input.reflectionId, fullText, wallet: input.wallet }),
    contentType: "application/json",
    sizeBytes: Buffer.byteLength(fullText, "utf8"),
    createdAt: now,
    status: "pending",
    tags: ["reflection", "autonomy", input.autonomyLevel],
    metadata: { source: "autonomy.reflection", runId: input.runId },
  });

  const computeJob = await module.compute.submitJob({
    id: `job_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
    taskType: "summarize_reflection",
    inputRef: artifact.storageRef,
    input: { summary: input.correctiveAction, fullTextLen: fullText.length, kind: input.kind },
    status: "queued",
    createdAt: now,
    updatedAt: now,
    metadata: { reflectionId: input.reflectionId },
  });

  const availability = await module.da.publish({
    artifactId: artifact.id,
    artifactKind: artifact.kind,
    rootHash: artifact.contentHash,
    sizeBytes: artifact.sizeBytes,
    metadata: { storageRef: artifact.storageRef },
  });

  const summaryHash = hashValue(computeJob.output ?? { summary: artifact.summary });

  const receipt = module.store.createSolanaReceipt({
    subjectType: "reflection",
    subjectId: input.reflectionId,
    wallet: input.wallet,
    summaryHash,
    zeroGStorageRef: artifact.storageRef,
    zeroGComputeRef: computeJob.computeRef,
    zeroGAvailabilityRef: availability.availabilityRef,
  });

  const bridgeState = await module.bridge.getStatus();

  const link = module.store.createLink({
    subjectType: "reflection",
    subjectId: input.reflectionId,
    contentHash: artifact.contentHash,
    summaryHash: receipt.summaryHash,
    receipt,
    artifact,
    computeJob,
    availability,
    bridgeState,
  });

  return {
    artifactId: artifact.id,
    zeroGStorageRef: artifact.storageRef,
    zeroGComputeRef: computeJob.computeRef,
    zeroGAvailabilityRef: availability.availabilityRef,
    solanaProofReceiptId: receipt.id,
    solanaTxSignature: receipt.txSignature,
    linkId: link.id,
    summaryHash,
  };
}
