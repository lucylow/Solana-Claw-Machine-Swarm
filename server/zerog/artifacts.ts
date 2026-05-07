import crypto from "crypto";
import type {
  SolanaProofReceipt,
  SolanaZeroGLink,
  ZeroGBridgeState,
  ZeroGComputeJob,
  ZeroGDataAvailabilityRecord,
  ZeroGOrchestratorState,
  ZeroGStorageArtifact,
} from "./types";

function now() {
  return new Date().toISOString();
}

export function hashValue(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function mockTxSignature(seed: string) {
  const base = crypto.createHash("sha256").update(seed).digest("hex");
  return `SIM_${base.slice(0, 64)}`;
}

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export class ZeroGOrchestratorStore {
  private readonly state: ZeroGOrchestratorState = {
    artifacts: [],
    computeJobs: [],
    availability: [],
    links: [],
    receipts: [],
    bridgeHistory: [],
  };

  listArtifacts() {
    return [...this.state.artifacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listComputeJobs() {
    return [...this.state.computeJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listAvailability() {
    return [...this.state.availability].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listLinks() {
    return [...this.state.links].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listReceipts() {
    return [...this.state.receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listBridgeHistory() {
    return [...this.state.bridgeHistory].sort(
      (a, b) => (b.lastUpdatedAt || "").localeCompare(a.lastUpdatedAt || "")
    );
  }

  putArtifact(artifact: ZeroGStorageArtifact) {
    this.state.artifacts = this.state.artifacts.filter(item => item.id !== artifact.id);
    this.state.artifacts.unshift(artifact);
    return artifact;
  }

  putComputeJob(job: ZeroGComputeJob) {
    this.state.computeJobs = this.state.computeJobs.filter(item => item.id !== job.id);
    this.state.computeJobs.unshift(job);
    return job;
  }

  putAvailability(record: ZeroGDataAvailabilityRecord) {
    this.state.availability = this.state.availability.filter(item => item.id !== record.id);
    this.state.availability.unshift(record);
    return record;
  }

  putLink(link: SolanaZeroGLink) {
    this.state.links = this.state.links.filter(item => item.id !== link.id);
    this.state.links.unshift(link);
    return link;
  }

  putReceipt(receipt: SolanaProofReceipt) {
    this.state.receipts = this.state.receipts.filter(item => item.id !== receipt.id);
    this.state.receipts.unshift(receipt);
    return receipt;
  }

  pushBridgeState(bridge: ZeroGBridgeState) {
    this.state.bridgeHistory.unshift(bridge);
    this.state.bridgeHistory = this.state.bridgeHistory.slice(0, 200);
    return bridge;
  }

  getArtifactByRef(storageRef: string) {
    return this.state.artifacts.find(item => item.storageRef === storageRef) || null;
  }

  getJobById(jobId: string) {
    return this.state.computeJobs.find(item => item.id === jobId) || null;
  }

  getAvailabilityByRef(ref: string) {
    return this.state.availability.find(item => item.availabilityRef === ref) || null;
  }

  createSolanaReceipt(input: {
    subjectType: SolanaProofReceipt["subjectType"];
    subjectId: string;
    wallet: string;
    summaryHash: string;
    zeroGStorageRef?: string;
    zeroGComputeRef?: string;
    zeroGAvailabilityRef?: string;
  }) {
    const id = randomId("solproof");
    const receipt: SolanaProofReceipt = {
      id,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      wallet: input.wallet,
      txSignature: mockTxSignature(id),
      account: `pda_${hashValue(id).slice(0, 32)}`,
      summaryHash: input.summaryHash,
      zeroGStorageRef: input.zeroGStorageRef,
      zeroGComputeRef: input.zeroGComputeRef,
      zeroGAvailabilityRef: input.zeroGAvailabilityRef,
      createdAt: now(),
      status: "confirmed",
    };
    return this.putReceipt(receipt);
  }

  createLink(input: {
    subjectType: SolanaZeroGLink["subjectType"];
    subjectId: string;
    contentHash: string;
    summaryHash: string;
    bridgeState?: ZeroGBridgeState;
    receipt?: SolanaProofReceipt;
    artifact?: ZeroGStorageArtifact;
    computeJob?: ZeroGComputeJob;
    availability?: ZeroGDataAvailabilityRecord;
  }) {
    const link: SolanaZeroGLink = {
      id: randomId("link"),
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      solanaReceiptId: input.receipt?.id,
      solanaTxSignature: input.receipt?.txSignature,
      solanaAccount: input.receipt?.account,
      zeroGStorageRef: input.artifact?.storageRef,
      zeroGComputeRef: input.computeJob?.computeRef,
      zeroGAvailabilityRef: input.availability?.availabilityRef,
      bridgeState: input.bridgeState,
      contentHash: input.contentHash,
      summaryHash: input.summaryHash,
      createdAt: now(),
      status: input.receipt ? "verified" : "linked",
    };
    return this.putLink(link);
  }
}
