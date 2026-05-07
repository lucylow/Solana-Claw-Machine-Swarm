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

export interface ZeroGConfig {
  environment: ZeroGEnvironment;
  storageUrl: string;
  computeUrl: string;
  dataAvailabilityUrl: string;
  explorerUrl: string;
  bridgeUrl?: string;
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
  subjectType: "reflection" | "memory" | "plan" | "execution" | "skill" | "bridge";
  subjectId: string;
  wallet: string;
  txSignature?: string;
  account?: string;
  summaryHash: string;
  zeroGStorageRef?: string;
  zeroGComputeRef?: string;
  zeroGAvailabilityRef?: string;
  createdAt: string;
  status: "draft" | "submitted" | "confirmed" | "verified" | "failed" | "degraded";
}

export interface SolanaZeroGLink {
  id: string;
  subjectType: "reflection" | "memory" | "plan" | "execution" | "skill" | "proof";
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
}
