import type { OpenClawBridgeReceipt, OpenClawBridgeStatus, OpenClawSkillManifest } from "@shared/openclaw/types";

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
  status: OpenClawBridgeStatus;
  manifests: OpenClawSkillManifest[];
  receipts: OpenClawBridgeReceipt[];
}
