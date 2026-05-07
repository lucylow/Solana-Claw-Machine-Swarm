import type {
  ReflectionArtifact,
  SolanaProofReceipt,
  SolanaZeroGLink,
  ZeroGEnvironment,
  ZeroGBridgeState,
  ZeroGConfig,
  ZeroGComputeJob,
  ZeroGDataAvailabilityRecord,
  ZeroGHealthStatus,
  ZeroGStorageArtifact,
} from "@shared/zerog";

export type {
  ReflectionArtifact,
  SolanaProofReceipt,
  SolanaZeroGLink,
  ZeroGEnvironment,
  ZeroGBridgeState,
  ZeroGConfig,
  ZeroGComputeJob,
  ZeroGDataAvailabilityRecord,
  ZeroGHealthStatus,
  ZeroGStorageArtifact,
};

export interface ZeroGStorageAdapter {
  storeArtifact(input: ZeroGStorageArtifact): Promise<ZeroGStorageArtifact>;
  getArtifact(storageRef: string): Promise<ZeroGStorageArtifact | null>;
  verifyArtifact(storageRef: string, expectedHash: string): Promise<boolean>;
  listArtifactsByKind(kind: ZeroGStorageArtifact["kind"]): Promise<ZeroGStorageArtifact[]>;
  getHealth(): Promise<ZeroGHealthStatus>;
}

export interface ZeroGComputeAdapter {
  submitJob(input: ZeroGComputeJob): Promise<ZeroGComputeJob>;
  getJob(jobId: string): Promise<ZeroGComputeJob | null>;
  waitForJob(jobId: string): Promise<ZeroGComputeJob>;
  getHealth(): Promise<ZeroGHealthStatus>;
}

export interface ZeroGDataAvailabilityAdapter {
  publish(input: {
    artifactId: string;
    artifactKind: string;
    rootHash: string;
    sizeBytes?: number;
    metadata?: Record<string, unknown>;
  }): Promise<ZeroGDataAvailabilityRecord>;
  getByRef(availabilityRef: string): Promise<ZeroGDataAvailabilityRecord | null>;
  getHealth(): Promise<ZeroGHealthStatus>;
}

export interface ZeroGBridgeAdapter {
  getStatus(): Promise<ZeroGBridgeState>;
  simulate(input: {
    sourceChain: string;
    destinationChain: string;
    tokenSymbol: string;
    amount?: string;
  }): Promise<ZeroGBridgeState>;
  listHistory(): Promise<ZeroGBridgeState[]>;
  getHealth(): Promise<ZeroGHealthStatus>;
}

export interface ZeroGOrchestratorState {
  artifacts: ZeroGStorageArtifact[];
  computeJobs: ZeroGComputeJob[];
  availability: ZeroGDataAvailabilityRecord[];
  links: SolanaZeroGLink[];
  receipts: SolanaProofReceipt[];
  bridgeHistory: ZeroGBridgeState[];
}
