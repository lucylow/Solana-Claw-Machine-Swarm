import type {
  OpenClawBridgeReceipt,
  OpenClawBridgeSession,
  OpenClawReceiptBridgeTier,
  OpenClawSkillManifest,
} from "@shared/openclaw/types";

export interface ClawSkillAsset {
  skillId: string;
  name: string;
  description: string;
  authorWallet: string;
  version: string;
  tags: string[];
  contentHash: string;
}

export interface OpenClawBridgeState {
  tier: OpenClawReceiptBridgeTier;
  mode: OpenClawBridgeSession["mode"];
  connected: boolean;
  lastSyncAt?: number;
  lastError?: string;
  manifests: OpenClawSkillManifest[];
  receipts: OpenClawBridgeReceipt[];
}
