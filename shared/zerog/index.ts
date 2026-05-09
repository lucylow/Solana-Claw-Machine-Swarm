import type { SolanaReceiptRecord } from "../solana/types";

export type ZeroGEnvironment = "local" | "testnet" | "mainnet" | "demo";

export type ZeroGArtifactKind =
  | "reflection"
  | "memory"
  | "plan"
  | "execution"
  | "receipt"
  | "proof"
  | "skill"
  | "bridge"
  | "asset";

export type ZeroGChainLabel = "Solana" | "BNB" | "EVM" | "0G" | string;

/** Official 0G Chain id per public documentation (XSwap bridge target). */
export const ZEROG_CHAIN_ID_DEFAULT = 16661;

export interface ZeroGConfig {
  environment: ZeroGEnvironment;
  storageUrl: string;
  computeUrl: string;
  dataAvailabilityUrl: string;
  explorerUrl: string;
  bridgeUrl?: string;
  /** 0G L1 chain id (e.g. bridge destination). Not Solana cluster id. */
  ogChainId: number;
  /** Named bridge surface from official docs (e.g. XSwap); UI must not imply live txs unless mode is live. */
  bridgeProvider: string;
  /**
   * Shown in UI: third-party “Solana token” labels are not canonical proof of origin.
   * Token/asset truth comes from configured official sources only.
   */
  tokenMetadataDisclaimer: string;
  apiKey?: string;
  timeoutMs: number;
  enabled: boolean;
  readOnly: boolean;
  mode: "live" | "demo" | "degraded";
  version: string;
}

export interface ZeroGStorageArtifact {
  id: string;
  kind: ZeroGArtifactKind;
  title: string;
  summary: string;
  content: unknown;
  contentHash: string;
  checksum: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  status: "pending" | "stored" | "verified" | "failed" | "degraded";
  storageRef?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ZeroGComputeJob {
  id: string;
  taskType:
    | "summarize_reflection"
    | "consolidate_memory"
    | "compress_plan"
    | "extract_metadata"
    | "normalize_receipt"
    | "generate_proof_summary"
    | "multimodal_reasoning";
  inputRef?: string;
  input: unknown;
  output?: unknown;
  outputHash?: string;
  status: "queued" | "running" | "completed" | "failed" | "degraded";
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
  computeRef?: string;
  model?: string;
  metadata: Record<string, unknown>;
}

export interface ZeroGDataAvailabilityRecord {
  id: string;
  artifactId: string;
  artifactKind: string;
  availabilityRef: string;
  rootHash: string;
  chunkCount?: number;
  sizeBytes?: number;
  createdAt: string;
  status: "pending" | "available" | "verified" | "failed" | "degraded";
  metadata: Record<string, unknown>;
}

export interface ZeroGBridgeState {
  enabled: boolean;
  sourceChain: ZeroGChainLabel;
  destinationChain: ZeroGChainLabel;
  tokenSymbol: string;
  status: "idle" | "pending" | "confirmed" | "failed" | "degraded";
  txHash?: string;
  explorerUrl?: string;
  provider?: string;
  lastUpdatedAt?: string;
  notes?: string;
  mode?: "mock" | "live" | "unavailable";
  version?: string;
}

export interface SolanaProofReceipt {
  id: string;
  subjectType:
    | "reflection"
    | "memory"
    | "plan"
    | "execution"
    | "skill"
    | "bridge"
    | "proof"
    | "zerog_upload"
    | "zerog_da_batch";
  subjectId: string;
  wallet: string;
  txSignature?: string;
  account?: string;
  summaryHash: string;
  zeroGStorageRef?: string;
  zeroGComputeRef?: string;
  zeroGAvailabilityRef?: string;
  createdAt: string;
  status:
    | "draft"
    | "submitted"
    | "confirmed"
    | "verified"
    | "failed"
    | "degraded";
}

export interface SolanaZeroGLink {
  id: string;
  subjectType:
    | "reflection"
    | "memory"
    | "plan"
    | "execution"
    | "skill"
    | "proof";
  subjectId: string;
  solanaReceiptId?: string;
  solanaTxSignature?: string;
  solanaAccount?: string;
  zeroGStorageRef?: string;
  zeroGComputeRef?: string;
  zeroGAvailabilityRef?: string;
  bridgeState?: ZeroGBridgeState;
  contentHash: string;
  summaryHash: string;
  createdAt: string;
  status: "linked" | "verified" | "degraded" | "failed";
}

export interface ReflectionArtifact {
  id: string;
  agentId: string;
  runId: string;
  kind: "success" | "failure" | "retry" | "lesson" | "correction";
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  summary: string;
  fullText: string;
  confidence: number;
  createdAt: string;
  zeroGStorageRef?: string;
  zeroGComputeRef?: string;
  zeroGAvailabilityRef?: string;
  solanaReceiptId?: string;
  proofHash: string;
  status: "captured" | "stored" | "anchored" | "verified" | "degraded";
  metadata: Record<string, unknown>;
}

export interface ZeroGSkillAsset {
  id: string;
  skillId: string;
  version: string;
  name: string;
  description: string;
  tags: string[];
  authorWallet: string;
  contentHash: string;
  zeroGStorageRef?: string;
  zeroGComputeRef?: string;
  solanaReceiptId?: string;
  status: "draft" | "published" | "active" | "deprecated";
  createdAt: string;
  updatedAt: string;
}

export interface ZeroGPlanArtifact {
  id: string;
  planId: string;
  goal: string;
  steps: string[];
  dependencies: string[];
  chosenSkills: string[];
  expectedOutcome: string;
  actualOutcome?: string;
  summaryHash: string;
  zeroGStorageRef?: string;
  zeroGComputeRef?: string;
  solanaReceiptId?: string;
  status: "draft" | "stored" | "anchored" | "verified" | "degraded";
  createdAt: string;
  updatedAt: string;
}

export interface ZeroGHealthStatus {
  ok: boolean;
  reason?: string;
  latencyMs?: number;
  mode: "live" | "demo" | "degraded";
  /** When set, indicates an optional HTTP reachability probe of the configured endpoint (not proof of correct API). */
  remoteReachable?: boolean;
}

/** Lifecycle of a blob inside 0G Storage (shown in receipts + wallets). */
export type StorageStatus =
  | "not_stored"
  | "stored"
  | "retrieved"
  | "failed"
  | "degraded";

/** Lifecycle of DA lineage commitments (shown in explorers + timelines). */
export type DaStatus =
  | "not_batched"
  | "batched"
  | "rooted"
  | "verified"
  | "failed"
  | "degraded";

/** Proof posture for mirrored receipts / UI badges (never inflate beyond evidence). */
export type ProofIntegrityStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "degraded"
  | "cached_only"
  | "demo_only";

/** Durable blob reference returned by 0G Storage adapters (canonical). */
export interface ZeroGBlobRef {
  blobId: string;
  namespace: string;
  checksum: string;
  sizeBytes: number;
  contentType: string;
  uri: string;
  createdAt: string;
  status: StorageStatus;
}

/** Append-only DA lineage row (canonical). */
export interface ZeroGDaRecord {
  id: string;
  batchId: string;
  rootHash: string;
  leafHash: string;
  payloadHash: string;
  subjectType: string;
  subjectId: string;
  createdAt: string;
  uri?: string;
  status: DaStatus;
}

/** Unified integration health for UI + orchestrator (canonical). */
export interface ZeroGIntegrationStatus {
  storage: {
    available: boolean;
    connected: boolean;
    lastUploadAt?: string;
    lastDownloadAt?: string;
    lastError?: string;
  };
  da: {
    available: boolean;
    connected: boolean;
    lastBatchAt?: string;
    lastRootHash?: string;
    lastError?: string;
  };
  mode: "live" | "mock" | "degraded";
}

/** Storage adapter: full payloads live here; Solana only anchors hashes (canonical). */
export interface ZeroGStorageAdapter {
  putBlob(input: {
    namespace: string;
    contentType: string;
    data: Uint8Array;
    metadata?: Record<string, string>;
  }): Promise<ZeroGBlobRef>;

  getBlob(uriOrId: string): Promise<Uint8Array>;

  verifyBlob(ref: ZeroGBlobRef): Promise<boolean>;

  listBlobs?(namespace?: string): Promise<ZeroGBlobRef[]>;
}

/** DA adapter: append-only batches / roots for audit + replay (canonical). */
export interface ZeroGDaAdapter {
  appendRecord(input: {
    subjectType: string;
    subjectId: string;
    kind: string;
    payloadHash: string;
    blobRef?: string;
    wallet?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ZeroGDaRecord>;

  appendBatch(input: {
    batchType: string;
    subjectType: string;
    subjectId?: string;
    records: ZeroGDaRecord[];
    metadata?: Record<string, unknown>;
  }): Promise<{
    batchId: string;
    rootHash: string;
    batchUri?: string;
    createdAt: string;
  }>;

  verifyBatch(rootHash: string): Promise<boolean>;
}

/** Single orchestration outcome across storage, DA, and Solana receipt mirror (canonical). */
export interface ZeroGOrchestrationResult {
  blobRef?: ZeroGBlobRef;
  daRecord?: ZeroGDaRecord;
  daBatch?: {
    batchId: string;
    rootHash: string;
    batchUri?: string;
  };
  receipt?: SolanaReceiptRecord;
  /** Honest proof surface: demo SIM sigs, missing DA, etc. */
  proofStatus?: ProofIntegrityStatus;
  status: "success" | "partial" | "failed" | "degraded";
  errors?: Array<{
    code: string;
    message: string;
    retryable: boolean;
  }>;
}
