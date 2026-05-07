/** Receipt verification tier for OpenClaw ↔ CLAW bridge rows */
export type OpenClawReceiptBridgeTier = "verified" | "degraded" | "unavailable";

/** @deprecated Use OpenClawReceiptBridgeTier */
export type OpenClawBridgeTier = OpenClawReceiptBridgeTier;

/** Registered tool surface inside a skill manifest */
export interface OpenClawToolManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  authorWallet: string;
  inputSchema: unknown;
  outputSchema: unknown;
  tags: string[];
  hash: string;
  status: "draft" | "published" | "active" | "deprecated";
  chainRef?: string;
  storageRef?: string;
  proofRef?: string;
}

export interface OpenClawSkillManifest {
  manifestVersion: string;
  skillId: string;
  name: string;
  description: string;
  authorWallet: string;
  version: string;
  tags: string[];
  tools: OpenClawToolManifest[];
  contentHash: string;
  provenanceHash: string;
  createdAt: number;
}

/** Bridge panel + skill-card counters (canonical session row). */
export interface OpenClawBridgeStatus {
  connected: boolean;
  mode: "import" | "export" | "sync" | "idle" | "degraded" | "failed";
  lastSyncAt?: string;
  lastError?: string;
  importedCount: number;
  exportedCount: number;
}

/** Historical alias used by server bridge helpers */
export type OpenClawBridgeSession = OpenClawBridgeStatus;

export interface OpenClawBridgeReceipt {
  id: string;
  direction: "import" | "export";
  bridgeStatus: OpenClawReceiptBridgeTier;
  sourceFormat: "openclaw" | "claw";
  targetFormat: "openclaw" | "claw";
  skillId: string;
  wallet: string;
  manifestHash: string;
  txSignature?: string;
  explorerUrl?: string;
  timestamp: number;
}
