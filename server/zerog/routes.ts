import crypto from "crypto";
import type { Express, Response } from "express";
import { z } from "zod";
import { ZeroGOrchestratorStore, hashValue } from "./artifacts";
import { ZeroGBridgeService } from "./bridge";
import { ZeroGComputeService } from "./compute";
import { getZeroGConfig } from "./config";
import { ZeroGDataAvailabilityService } from "./da";
import { getZeroGHealth } from "./health";
import { createZeroGReplayService } from "./replay";
import { ZeroGStorageService } from "./storage";
import type { ZeroGStorageArtifact } from "./types";
import { buildZeroGIntegrationStatus } from "./integrationSummary";
import { createSidecarOrchestrator } from "./sidecarOrchestrator";
import { createCanonicalBlobAdapter } from "./canonicalBlobAdapter";
import { canonicalDaService } from "./canonicalDa";

function ok(res: Response, data: unknown) {
  res.json({ ok: true, data });
}

function fail(res: Response, error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "zerog_route_failed";
  res.status(status).json({ ok: false, error: message });
}

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function mockWallet() {
  return `demo_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function createZeroGModule() {
  const store = new ZeroGOrchestratorStore();
  const storage = new ZeroGStorageService(store);
  const compute = new ZeroGComputeService(store);
  const da = new ZeroGDataAvailabilityService(store);
  const bridge = new ZeroGBridgeService(store);
  const replay = createZeroGReplayService(store);

  const services = { store, storage, compute, da, bridge, replay };

  async function runDemoFlow(input?: {
    wallet?: string;
    skill?: string;
    prompt?: string;
  }) {
    const now = new Date().toISOString();
    const reflectionId = randomId("reflection");
    const fullReflection = `Root cause: schema mismatch\nCorrection: enforce schema-first tool calls\nNext action: replay using normalized receipt path`;
    const artifact = await storage.storeArtifact({
      id: reflectionId,
      kind: "reflection",
      title: "Runtime Reflection Artifact",
      summary: "Failure reflection stored in 0G sidecar for replay.",
      content: {
        wallet: input?.wallet || mockWallet(),
        skill: input?.skill || "planner-core",
        prompt: input?.prompt || "Demonstrate Solana + 0G proof flow",
        fullText: fullReflection,
        createdAt: now,
      },
      contentHash: hashValue(fullReflection),
      checksum: hashValue({ fullReflection, now }),
      contentType: "application/json",
      sizeBytes: Buffer.byteLength(fullReflection, "utf8"),
      createdAt: now,
      status: "pending",
      tags: ["demo", "reflection", "memory"],
      metadata: { source: "zerog-demo" },
    });

    const computeJob = await compute.submitJob({
      id: randomId("job"),
      taskType: "summarize_reflection",
      inputRef: artifact.storageRef,
      input: artifact.content,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      metadata: { source: "zerog-demo", wallet: input?.wallet || null },
    });

    const availability = await da.publish({
      artifactId: artifact.id,
      artifactKind: artifact.kind,
      rootHash: artifact.contentHash,
      sizeBytes: artifact.sizeBytes,
      metadata: {
        storageRef: artifact.storageRef,
      },
    });

    const bridgeState = await bridge.simulate({
      sourceChain: "Solana",
      destinationChain: "0G",
      tokenSymbol: "0G",
      amount: "42",
    });

    const receipt = store.createSolanaReceipt({
      subjectType: "reflection",
      subjectId: artifact.id,
      wallet: input?.wallet || mockWallet(),
      summaryHash: hashValue(computeJob.output || artifact.summary),
      zeroGStorageRef: artifact.storageRef,
      zeroGComputeRef: computeJob.computeRef,
      zeroGAvailabilityRef: availability.availabilityRef,
    });

    const link = store.createLink({
      subjectType: "reflection",
      subjectId: artifact.id,
      contentHash: artifact.contentHash,
      summaryHash: receipt.summaryHash,
      receipt,
      artifact,
      computeJob,
      availability,
      bridgeState,
    });

    return { artifact, computeJob, availability, bridgeState, receipt, link };
  }

  return {
    ...services,
    runDemoFlow,
  };
}

const createArtifactSchema = z.object({
  id: z.string().optional(),
  kind: z.enum([
    "reflection",
    "memory",
    "plan",
    "execution",
    "receipt",
    "proof",
    "skill",
    "bridge",
    "asset",
  ]),
  title: z.string().min(2),
  summary: z.string().min(2),
  content: z.unknown(),
  contentType: z.string().default("application/json"),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const createComputeSchema = z.object({
  id: z.string().optional(),
  taskType: z.enum([
    "summarize_reflection",
    "consolidate_memory",
    "compress_plan",
    "extract_metadata",
    "normalize_receipt",
    "generate_proof_summary",
    "multimodal_reasoning",
  ]),
  inputRef: z.string().optional(),
  input: z.unknown(),
  model: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const publishDaSchema = z.object({
  artifactId: z.string().min(1),
  artifactKind: z.string().min(1),
  rootHash: z.string().min(8),
  sizeBytes: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const bridgeSimSchema = z.object({
  sourceChain: z.string().default("Solana"),
  destinationChain: z.string().default("0G"),
  tokenSymbol: z.string().default("0G"),
  amount: z.string().optional(),
});

export function registerZeroGRoutes(
  app: Express,
  moduleParam?: ReturnType<typeof createZeroGModule>,
) {
  const module = moduleParam ?? getZeroGModule();
  app.get("/api/zerog/config", (_req, res) => {
    ok(res, getZeroGConfig());
  });

  app.get("/api/zerog/network", (_req, res) => {
    const c = getZeroGConfig();
    ok(res, {
      ogChainId: c.ogChainId,
      bridgeProvider: c.bridgeProvider,
      tokenMetadataDisclaimer: c.tokenMetadataDisclaimer,
      explorerUrl: c.explorerUrl,
      bridgeUrl: c.bridgeUrl,
    });
  });

  app.get("/api/zerog/health", async (_req, res) => {
    try {
      const data = await getZeroGHealth(module);
      ok(res, data);
    } catch (error) {
      fail(res, error, 500);
    }
  });

  app.get("/api/zerog/integration", async (_req, res) => {
    try {
      ok(res, await buildZeroGIntegrationStatus(module));
    } catch (error) {
      fail(res, error, 500);
    }
  });

  app.get("/api/zerog/status", async (_req, res) => {
    try {
      ok(res, await buildZeroGIntegrationStatus(module));
    } catch (error) {
      fail(res, error, 500);
    }
  });

  const storageUploadSchema = z.object({
    namespace: z.string().min(1),
    contentType: z.string().default("application/json"),
    payloadB64: z.string().min(1),
    metadata: z.record(z.string(), z.string()).optional(),
  });

  const blobRefVerifySchema = z.object({
    blobId: z.string(),
    namespace: z.string(),
    checksum: z.string(),
    uri: z.string(),
    sizeBytes: z.number(),
    contentType: z.string(),
    createdAt: z.string(),
    status: z.enum(["not_stored", "stored", "retrieved", "failed", "degraded"]),
  });

  app.post("/api/zerog/storage/upload", async (req, res) => {
    try {
      const input = storageUploadSchema.parse(req.body ?? {});
      const blobAdapter = createCanonicalBlobAdapter(module.store);
      const data = Buffer.from(input.payloadB64, "base64");
      ok(
        res,
        await blobAdapter.putBlob({
          namespace: input.namespace,
          contentType: input.contentType,
          data: new Uint8Array(data),
          metadata: input.metadata,
        }),
      );
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/zerog/storage/verify", async (req, res) => {
    try {
      const ref = blobRefVerifySchema.parse(req.body?.ref ?? req.body ?? {});
      const blobAdapter = createCanonicalBlobAdapter(module.store);
      const verified = await blobAdapter.verifyBlob(ref);
      ok(res, { verified, ref });
    } catch (error) {
      fail(res, error);
    }
  });

  app.get("/api/zerog/storage/health", async (_req, res) =>
    ok(res, await module.storage.getHealth()),
  );

  app.get("/api/zerog/storage/blob/:storageId", async (req, res) => {
    try {
      const id = decodeURIComponent(String(req.params.storageId));
      const blobAdapter = createCanonicalBlobAdapter(module.store);
      const bytes = await blobAdapter.getBlob(id);
      ok(res, { bytesB64: Buffer.from(bytes).toString("base64"), ref: id });
    } catch (error) {
      fail(res, error, 404);
    }
  });

  const daAppendSchema = z.object({
    subjectType: z.string().min(1),
    subjectId: z.string().min(1),
    kind: z.string().min(1),
    payloadHash: z.string().min(8),
    blobRef: z.string().optional(),
    wallet: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  const daBatchSchema = z.object({
    batchType: z.string().min(1),
    subjectType: z.string().min(1),
    subjectId: z.string().optional(),
    records: z.array(z.any()),
    metadata: z.record(z.string(), z.unknown()).optional(),
  });

  app.post("/api/zerog/da/append", async (req, res) => {
    try {
      const input = daAppendSchema.parse(req.body ?? {});
      ok(
        res,
        await canonicalDaService.appendRecord({
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          kind: input.kind,
          payloadHash: input.payloadHash,
          blobRef: input.blobRef,
          wallet: input.wallet,
          metadata: input.metadata,
        }),
      );
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/zerog/da/batch", async (req, res) => {
    try {
      const input = daBatchSchema.parse(req.body ?? {});
      ok(
        res,
        await canonicalDaService.appendBatch({
          batchType: input.batchType,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          records: input.records as import("@shared/zerog").ZeroGDaRecord[],
          metadata: input.metadata,
        }),
      );
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/zerog/da/verify", async (req, res) => {
    try {
      const rootHash = String(req.body?.rootHash ?? "").trim();
      if (!rootHash) throw new Error("rootHash_required");
      const verified = await canonicalDaService.verifyBatch(rootHash);
      ok(res, { verified, rootHash });
    } catch (error) {
      fail(res, error);
    }
  });

  app.get("/api/zerog/compute/health", async (_req, res) =>
    ok(res, await module.compute.getHealth()),
  );
  app.get("/api/zerog/da/health", async (_req, res) =>
    ok(res, await module.da.getHealth()),
  );
  app.get("/api/zerog/bridge/health", async (_req, res) =>
    ok(res, await module.bridge.getHealth()),
  );

  app.get("/api/zerog/bridge/status", async (_req, res) =>
    ok(res, await module.bridge.getStatus()),
  );
  app.post("/api/zerog/bridge/simulate", async (req, res) => {
    try {
      const input = bridgeSimSchema.parse(req.body ?? {});
      ok(res, await module.bridge.simulate(input));
    } catch (error) {
      fail(res, error);
    }
  });
  app.get("/api/zerog/bridge/history", async (_req, res) =>
    ok(res, await module.bridge.listHistory()),
  );

  app.post("/api/zerog/artifacts", async (req, res) => {
    try {
      const input = createArtifactSchema.parse(req.body);
      const id = input.id || randomId("artifact");
      const contentHash = hashValue(input.content);
      const artifact = await module.storage.storeArtifact({
        id,
        kind: input.kind,
        title: input.title,
        summary: input.summary,
        content: input.content,
        contentHash,
        checksum: hashValue({ id, contentHash }),
        contentType: input.contentType,
        sizeBytes: Buffer.byteLength(JSON.stringify(input.content), "utf8"),
        createdAt: new Date().toISOString(),
        status: "pending",
        tags: input.tags,
        metadata: input.metadata ?? {},
      });
      ok(res, artifact);
    } catch (error) {
      fail(res, error);
    }
  });

  app.get("/api/zerog/artifacts", (_req, res) =>
    ok(res, module.store.listArtifacts()),
  );
  app.get("/api/zerog/artifacts/kind/:kind", (req, res) => {
    const kind = String(req.params.kind) as ZeroGStorageArtifact["kind"];
    ok(
      res,
      module.store.listArtifacts().filter((item) => item.kind === kind),
    );
  });

  app.get("/api/zerog/artifacts/:storageRef", async (req, res) => {
    try {
      const storageRef = decodeURIComponent(String(req.params.storageRef));
      const artifact = await module.storage.getArtifact(storageRef);
      if (!artifact) return fail(res, "artifact_not_found", 404);
      ok(res, artifact);
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/zerog/artifacts/:storageRef/verify", async (req, res) => {
    try {
      const storageRef = decodeURIComponent(String(req.params.storageRef));
      const expectedHash = String(req.body?.expectedHash || "");
      if (!expectedHash) throw new Error("expectedHash_required");
      const verified = await module.storage.verifyArtifact(
        storageRef,
        expectedHash,
      );
      ok(res, { verified, storageRef, expectedHash });
    } catch (error) {
      fail(res, error);
    }
  });

  app.post("/api/zerog/compute/jobs", async (req, res) => {
    try {
      const input = createComputeSchema.parse(req.body);
      const now = new Date().toISOString();
      const job = await module.compute.submitJob({
        id: input.id || randomId("job"),
        taskType: input.taskType,
        inputRef: input.inputRef,
        input: input.input,
        status: "queued",
        createdAt: now,
        updatedAt: now,
        model: input.model,
        metadata: input.metadata ?? {},
      });
      ok(res, job);
    } catch (error) {
      fail(res, error);
    }
  });

  app.get("/api/zerog/compute/jobs", (_req, res) =>
    ok(res, module.store.listComputeJobs()),
  );
  app.get("/api/zerog/compute/jobs/:jobId", async (req, res) => {
    const job = await module.compute.getJob(String(req.params.jobId));
    if (!job) return fail(res, "compute_job_not_found", 404);
    ok(res, job);
  });
  app.post("/api/zerog/compute/jobs/:jobId/wait", async (req, res) => {
    try {
      const job = await module.compute.waitForJob(String(req.params.jobId));
      ok(res, job);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.post("/api/zerog/da/publish", async (req, res) => {
    try {
      const input = publishDaSchema.parse(req.body);
      ok(res, await module.da.publish(input));
    } catch (error) {
      fail(res, error);
    }
  });
  app.get("/api/zerog/da/records", (_req, res) =>
    ok(res, module.store.listAvailability()),
  );

  /** Lookup append-only lineage row — path avoids shadowing `/api/zerog/da/records` and `/health`. */
  app.get("/api/zerog/da/root/:rootHash", async (req, res) => {
    try {
      const rootHash = decodeURIComponent(String(req.params.rootHash));
      const hit = canonicalDaService
        .listRecords()
        .find((r) => r.rootHash === rootHash);
      if (!hit) return fail(res, "da_record_not_found", 404);
      ok(res, hit);
    } catch (error) {
      fail(res, error, 404);
    }
  });

  app.get("/api/zerog/links", (_req, res) => ok(res, module.store.listLinks()));
  app.get("/api/zerog/receipts", (_req, res) =>
    ok(res, module.store.listReceipts()),
  );
  app.get("/api/zerog/proof-graph", (_req, res) =>
    ok(res, module.replay.getGraph()),
  );

  app.get("/api/zerog/replay/artifact", (req, res) => {
    const storageRef = String(req.query.storageRef || "");
    if (!storageRef) return fail(res, "storageRef_required");
    const artifact = module.replay.getArtifact(storageRef);
    if (!artifact) return fail(res, "artifact_not_found", 404);
    ok(res, artifact);
  });

  app.post("/api/zerog/demo/run", async (req, res) => {
    try {
      const body = z
        .object({
          wallet: z.string().optional(),
          skill: z.string().optional(),
          prompt: z.string().optional(),
        })
        .optional()
        .parse(req.body);
      ok(res, await module.runDemoFlow(body));
    } catch (error) {
      fail(res, error);
    }
  });

  const persistSchema = z.object({
    wallet: z.string().min(32),
    cluster: z
      .enum(["devnet", "testnet", "mainnet-beta", "localnet"])
      .default("devnet"),
    namespace: z.string().min(1).default("claw_sidecar"),
    receiptType: z.enum([
      "skill",
      "plan",
      "execution",
      "reflection",
      "memory",
      "proof",
      "zerog_upload",
      "zerog_da_batch",
    ]),
    subjectId: z.string().min(1),
    contentType: z.string().default("application/json"),
    payloadB64: z.string().min(1),
    explorerBaseUrl: z.string().optional(),
  });

  app.post("/api/zerog/orchestrate/persist", async (req, res) => {
    try {
      const input = persistSchema.parse(req.body ?? {});
      const orchestrator = createSidecarOrchestrator(module);
      const payload = new Uint8Array(Buffer.from(input.payloadB64, "base64"));
      ok(
        res,
        await orchestrator.persistArtifact({
          wallet: input.wallet,
          cluster: input.cluster,
          namespace: input.namespace,
          receiptType: input.receiptType,
          subjectId: input.subjectId,
          contentType: input.contentType,
          payload,
          explorerBaseUrl: input.explorerBaseUrl,
        }),
      );
    } catch (error) {
      fail(res, error);
    }
  });
}

let zeroGSingleton: ReturnType<typeof createZeroGModule> | null = null;

export function getZeroGModule() {
  if (!zeroGSingleton) zeroGSingleton = createZeroGModule();
  return zeroGSingleton;
}
