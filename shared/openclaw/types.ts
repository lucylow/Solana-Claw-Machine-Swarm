export interface OpenClawToolManifest {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
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

export type OpenClawBridgeStatus = "verified" | "degraded" | "unavailable";

export interface OpenClawBridgeReceipt {
  id: string;
  direction: "import" | "export";
  bridgeStatus: OpenClawBridgeStatus;
  sourceFormat: "openclaw" | "claw";
  targetFormat: "openclaw" | "claw";
  skillId: string;
  wallet: string;
  manifestHash: string;
  txSignature?: string;
  explorerUrl?: string;
  timestamp: number;
}
