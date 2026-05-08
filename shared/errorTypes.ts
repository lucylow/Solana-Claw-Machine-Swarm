/**
 * Canonical application error model — shared by client, server, and tooling.
 */

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

export type ErrorScope =
  | "wallet"
  | "session"
  | "frontend"
  | "backend"
  | "solana"
  | "anchor"
  | "rpc"
  | "transaction"
  | "account"
  | "proof"
  | "receipt"
  | "memory"
  | "reflection"
  | "skill"
  | "plan"
  | "execution"
  | "zerog"
  | "openclaw"
  | "database"
  | "indexer"
  | "demo"
  | "unknown";

export type ErrorCode =
  | "WALLET_NOT_CONNECTED"
  | "WALLET_CONNECTION_REJECTED"
  | "WALLET_SESSION_SIGN_FAILED"
  | "WALLET_SESSION_EXPIRED"
  | "WALLET_WRONG_CLUSTER"
  | "WALLET_UNSUPPORTED"
  | "SESSION_VERIFICATION_FAILED"
  | "SESSION_TOKEN_EXPIRED"
  | "SESSION_REQUIRED"
  | "RPC_UNAVAILABLE"
  | "RPC_TIMEOUT"
  | "RPC_RATE_LIMITED"
  | "TX_BUILD_FAILED"
  | "TX_SIMULATION_FAILED"
  | "TX_SEND_FAILED"
  | "TX_CONFIRMATION_FAILED"
  | "TX_EXPIRED"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_DECODE_FAILED"
  | "PDA_DERIVATION_FAILED"
  | "PROGRAM_ERROR"
  | "ANCHOR_IDL_MISMATCH"
  | "INSUFFICIENT_SOL"
  | "INSUFFICIENT_PERMISSIONS"
  | "RECEIPT_ANCHOR_FAILED"
  | "PROOF_VERIFICATION_FAILED"
  | "MEMORY_WRITE_FAILED"
  | "MEMORY_RETRIEVE_FAILED"
  | "REFLECTION_WRITE_FAILED"
  | "SKILL_PUBLISH_FAILED"
  | "SKILL_UPDATE_FAILED"
  | "PLAN_BUILD_FAILED"
  | "EXECUTION_FAILED"
  | "OPENCLAW_IMPORT_FAILED"
  | "OPENCLAW_EXPORT_FAILED"
  | "ZERO_G_STORAGE_FAILED"
  | "ZERO_G_DA_FAILED"
  | "ZERO_G_VERIFY_FAILED"
  | "DB_WRITE_FAILED"
  | "DB_READ_FAILED"
  | "INDEXER_SYNC_FAILED"
  | "UNEXPECTED_ROUTE_ERROR"
  | "VALIDATION_FAILED"
  | "DEMO_MODE_MISMATCH"
  | "DEGRADED_MODE"
  | "UNKNOWN";

export interface AppError {
  id: string;
  code: ErrorCode;
  scope: ErrorScope;
  severity: ErrorSeverity;
  title: string;
  message: string;
  technicalMessage?: string;
  retryable: boolean;
  recoverable: boolean;
  retryLabel?: string;
  recoveryAction?: string;
  supportHint?: string;
  actionUrl?: string;
  source?: string;
  statusCode?: number;
  cause?: unknown;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface ErrorState {
  active: AppError | null;
  history: AppError[];
  pendingRetryIds: string[];
  lastSuccessAt?: string;
  lastFailureAt?: string;
  isDegraded: boolean;
}

/** Standard JSON envelope for failed REST handlers. */
export interface ApiErrorEnvelope {
  ok: false;
  error: AppError;
}

export interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
  /** Present when outcome is partial / degraded but HTTP succeeded. */
  degraded?: boolean;
}

export function isAppErrorPayload(value: unknown): value is AppError {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.code === "string" &&
    typeof o.scope === "string" &&
    typeof o.severity === "string" &&
    typeof o.message === "string" &&
    typeof o.retryable === "boolean" &&
    typeof o.recoverable === "boolean" &&
    typeof o.createdAt === "string"
  );
}
