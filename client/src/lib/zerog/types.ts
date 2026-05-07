export type {
  ReflectionArtifact,
  SolanaProofReceipt,
  SolanaZeroGLink,
  ZeroGBridgeState,
  ZeroGChainLabel,
  ZeroGComputeJob,
  ZeroGConfig,
  ZeroGDataAvailabilityRecord,
  ZeroGEnvironment,
  ZeroGHealthStatus,
  ZeroGPlanArtifact,
  ZeroGSkillAsset,
  ZeroGStorageArtifact,
} from "@shared/zerog";

export interface ZeroGHealthResponse {
  ok: boolean;
  mode: "live" | "demo" | "degraded";
  statusLabel: string;
  config: import("@shared/zerog").ZeroGConfig;
  storage: import("@shared/zerog").ZeroGHealthStatus;
  compute: import("@shared/zerog").ZeroGHealthStatus;
  da: import("@shared/zerog").ZeroGHealthStatus;
  bridge: import("@shared/zerog").ZeroGHealthStatus;
  remoteProbesSkipped?: boolean;
}

export interface ZeroGProofGraphResponse {
  artifacts: import("@shared/zerog").ZeroGStorageArtifact[];
  computeJobs: import("@shared/zerog").ZeroGComputeJob[];
  availability: import("@shared/zerog").ZeroGDataAvailabilityRecord[];
  links: import("@shared/zerog").SolanaZeroGLink[];
  receipts: import("@shared/zerog").SolanaProofReceipt[];
}
