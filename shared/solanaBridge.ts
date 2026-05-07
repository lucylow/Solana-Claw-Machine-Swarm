export type SolanaBridgeAction =
  | "initialize_registry"
  | "create_skill"
  | "update_skill_version"
  | "create_plan_receipt"
  | "complete_plan_receipt"
  | "create_memory_receipt"
  | "create_reflection_receipt"
  | "create_proof_receipt"
  | "anchor_receipt"
  | "verify_receipt"
  | "record_queue_event"
  | "record_deployment_receipt";

export interface SolanaBridgeBuildRequest {
  walletAddress: string;
  action: SolanaBridgeAction;
  subjectId: string;
  payloadHash: string;
  receiptId?: string;
  metadata?: Record<string, unknown>;
}

export interface SolanaMirrorAccount {
  address: string;
  kind:
    | "registry"
    | "skill"
    | "skill_version"
    | "plan_receipt"
    | "memory_receipt"
    | "proof_receipt"
    | "unknown";
  ownerWallet?: string;
  programId?: string;
  subjectId: string;
  status: "pending" | "confirmed" | "failed";
  action: string;
  payloadHash: string;
  txSignature?: string;
  explorerUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SolanaBridgeHistoryItem {
  id: string;
  action: string;
  walletAddress: string;
  cluster: string;
  txSignature?: string;
  accountAddress: string;
  accountKind: SolanaMirrorAccount["kind"];
  programId?: string;
  payloadHash: string;
  status: "building" | "submitted" | "confirmed" | "indexed" | "failed";
  receiptId?: string;
  requestId?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
}
