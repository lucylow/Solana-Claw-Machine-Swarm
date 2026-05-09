export type ReflectionStatus =
  | "captured"
  | "stored"
  | "anchored"
  | "linked"
  | "injected"
  | "verified"
  | "failed"
  | "degraded";

export type ReflectionKind =
  | "success"
  | "failure"
  | "retry"
  | "correction"
  | "lesson";

export interface StructuredReflection {
  rootCause: string;
  failureMode?: string;
  correctiveAdvice: string;
  nextTurnInjection: string;
  lessonSummary: string;
  confidence: number;
  reusable: boolean;
  priority: "low" | "normal" | "high" | "critical";
}

export interface ReflectionRecordOffchain {
  id: string;
  version: number;
  agentId: string;
  conversationId?: string;
  sourceTurnId: string;
  parentReceiptId?: string;
  kind: ReflectionKind;
  title: string;
  summary: string;
  fullText: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  tags: string[];
  storageRef?: string;
  storageChecksum?: string;
  createdAt: string;
  updatedAt: string;
  payloadHash: string;
  sourceContextHash: string;
  visibility: "private" | "workspace" | "public";
  structured: StructuredReflection;
}

export interface MemoryReceiptOnChain {
  id: string;
  version: number;
  agentId: string;
  wallet: string;
  sourceTurnIdHash: string;
  parentReceiptIdHash?: string;
  reflectionHash: string;
  summaryHash: string;
  nextActionHash: string;
  storageRefHash: string;
  createdAtUnix: number;
  status: ReflectionStatus;
  chainId: number;
  solanaTxSig?: string;
  solanaAccount?: string;
  nextTurnIdHash?: string;
  verified: boolean;
  verifiedAt?: string;
  sourceMemoryIdHash?: string;
  note?: string;
  tags: string[];
}

export interface MemoryTurnLink {
  id: string;
  receiptId: string;
  sourceTurnIdHash: string;
  nextTurnIdHash: string;
  agentId: string;
  wallet: string;
  createdAt: string;
  reason?: string;
}

export interface MemoryReceiptStatus {
  reflectionId: string;
  receiptId?: string;
  status: ReflectionStatus;
  message: string;
}

export interface MemoryLinkStatus {
  receiptId: string;
  linked: boolean;
  nextTurnIdHash?: string;
  linkedAt?: string;
  note?: string;
}

export interface MemoryVerificationResult {
  receiptId: string;
  reflectionId: string;
  status: "verified" | "partial" | "missing" | "degraded";
  verified: boolean;
  checks: {
    reflectionPresent: boolean;
    storagePresent: boolean;
    reflectionHashMatch: boolean;
    summaryHashMatch: boolean;
    nextActionHashMatch: boolean;
    sourceTurnHashMatch: boolean;
  };
  issues: string[];
  verifiedAt: string;
}

export interface MemoryChainQuery {
  agentId?: string;
  wallet?: string;
  conversationId?: string;
  sourceTurnId?: string;
  nextTurnId?: string;
  status?: ReflectionStatus;
  verified?: boolean;
  receiptHash?: string;
  storageRef?: string;
  txSig?: string;
  limit?: number;
  offset?: number;
}

export interface MemoryInjectionItem {
  receiptId: string;
  reflectionId: string;
  summary: string;
  rootCause: string;
  correctiveAdvice: string;
  nextAction: string;
  confidence: number;
  priority: StructuredReflection["priority"];
  createdAt: string;
  verified: boolean;
  txSig?: string;
}

export interface MemoryInjectionBundle {
  bundleId: string;
  agentId: string;
  conversationId?: string;
  nextTurnId: string;
  createdAt: string;
  items: MemoryInjectionItem[];
  injectedPrompt: string;
}

export interface MemoryLifecycleEvent {
  id: string;
  reflectionId: string;
  receiptId?: string;
  kind:
    | "reflection_created"
    | "reflection_stored"
    | "receipt_anchored"
    | "receipt_linked"
    | "receipt_verified"
    | "receipt_degraded"
    | "injection_built";
  message: string;
  createdAt: string;
  data?: Record<string, unknown>;
}
