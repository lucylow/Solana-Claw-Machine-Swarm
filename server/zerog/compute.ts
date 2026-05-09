import { hashValue, ZeroGOrchestratorStore } from "./artifacts";
import { getZeroGConfig } from "./config";
import type {
  ZeroGComputeAdapter,
  ZeroGComputeJob,
  ZeroGHealthStatus,
} from "./types";

function now() {
  return new Date().toISOString();
}

function toComputeRef(id: string) {
  return `zg://compute/jobs/${id}`;
}

function computeOutput(job: ZeroGComputeJob) {
  if (job.taskType === "summarize_reflection") {
    const text =
      typeof job.input === "string" ? job.input : JSON.stringify(job.input);
    return {
      summary: text.slice(0, 220),
      bullets: [
        "Root cause captured",
        "Corrective advice extracted",
        "Anchoring-ready summary generated",
      ],
    };
  }

  if (job.taskType === "normalize_receipt") {
    return {
      normalized: true,
      digest: hashValue(job.input).slice(0, 32),
      schema: "solana-zerog-receipt-v1",
    };
  }

  return {
    status: "processed",
    digest: hashValue(job.input),
    taskType: job.taskType,
  };
}

export class ZeroGComputeService implements ZeroGComputeAdapter {
  constructor(private readonly store: ZeroGOrchestratorStore) {}

  async submitJob(input: ZeroGComputeJob): Promise<ZeroGComputeJob> {
    const config = getZeroGConfig();
    const queued: ZeroGComputeJob = {
      ...input,
      status: config.enabled ? "running" : "degraded",
      createdAt: input.createdAt || now(),
      updatedAt: now(),
      metadata: {
        mode: config.mode,
        environment: config.environment,
        ...input.metadata,
      },
      computeRef: input.computeRef || toComputeRef(input.id),
    };
    this.store.putComputeJob(queued);

    if (!config.enabled) {
      const degraded = {
        ...queued,
        status: "degraded" as const,
        finishedAt: now(),
      };
      return this.store.putComputeJob(degraded);
    }

    const output = computeOutput(input);
    const completed: ZeroGComputeJob = {
      ...queued,
      output,
      outputHash: hashValue(output),
      status: config.mode === "degraded" ? "degraded" : "completed",
      updatedAt: now(),
      finishedAt: now(),
    };
    return this.store.putComputeJob(completed);
  }

  async getJob(jobId: string): Promise<ZeroGComputeJob | null> {
    return this.store.getJobById(jobId);
  }

  async waitForJob(jobId: string): Promise<ZeroGComputeJob> {
    const job = this.store.getJobById(jobId);
    if (!job) throw new Error("compute_job_not_found");
    if (
      job.status === "completed" ||
      job.status === "failed" ||
      job.status === "degraded"
    )
      return job;
    return {
      ...job,
      status: "completed",
      output: job.output || computeOutput(job),
      outputHash: job.outputHash || hashValue(job.output || computeOutput(job)),
      updatedAt: now(),
      finishedAt: now(),
    };
  }

  async getHealth(): Promise<ZeroGHealthStatus> {
    const config = getZeroGConfig();
    return {
      ok: config.enabled,
      reason: config.enabled ? undefined : "zerog_compute_disabled",
      latencyMs: 12,
      mode: config.mode,
    };
  }
}
