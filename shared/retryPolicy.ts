import type { ErrorCode } from "./errorTypes";

export type RetryStrategy =
  | "none"
  | "immediate"
  | "backoff"
  | "manual"
  | "session_refresh"
  | "cluster_fix";

export interface RetryPolicy {
  retryable: boolean;
  strategy: RetryStrategy;
  maxRetries: number;
  baseDelayMs: number;
  label: string;
}

const DEFAULT: RetryPolicy = {
  retryable: false,
  strategy: "none",
  maxRetries: 0,
  baseDelayMs: 0,
  label: "Not retryable",
};

/** Maps each error code to how retries should behave in UI and workers. */
export const RETRY_POLICY_BY_CODE: Record<ErrorCode, RetryPolicy> = {
  WALLET_NOT_CONNECTED: {
    retryable: true,
    strategy: "manual",
    maxRetries: 0,
    baseDelayMs: 0,
    label: "Connect wallet first",
  },
  WALLET_CONNECTION_REJECTED: {
    retryable: true,
    strategy: "manual",
    maxRetries: 3,
    baseDelayMs: 500,
    label: "Retry connection",
  },
  WALLET_SESSION_SIGN_FAILED: {
    retryable: true,
    strategy: "session_refresh",
    maxRetries: 5,
    baseDelayMs: 400,
    label: "Retry signature",
  },
  WALLET_SESSION_EXPIRED: {
    retryable: true,
    strategy: "session_refresh",
    maxRetries: 0,
    baseDelayMs: 0,
    label: "Refresh session",
  },
  WALLET_WRONG_CLUSTER: {
    retryable: true,
    strategy: "cluster_fix",
    maxRetries: 0,
    baseDelayMs: 0,
    label: "Fix cluster",
  },
  WALLET_UNSUPPORTED: { ...DEFAULT, label: "Change wallet" },
  SESSION_VERIFICATION_FAILED: {
    retryable: true,
    strategy: "session_refresh",
    maxRetries: 3,
    baseDelayMs: 600,
    label: "Re-verify",
  },
  SESSION_TOKEN_EXPIRED: {
    retryable: true,
    strategy: "session_refresh",
    maxRetries: 0,
    baseDelayMs: 0,
    label: "Refresh session",
  },
  SESSION_REQUIRED: {
    retryable: true,
    strategy: "session_refresh",
    maxRetries: 0,
    baseDelayMs: 0,
    label: "Complete session",
  },
  RPC_UNAVAILABLE: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 5,
    baseDelayMs: 2000,
    label: "Retry with backoff",
  },
  RPC_TIMEOUT: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 4,
    baseDelayMs: 1500,
    label: "Retry",
  },
  RPC_RATE_LIMITED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 6,
    baseDelayMs: 3000,
    label: "Wait and retry",
  },
  TX_BUILD_FAILED: {
    retryable: true,
    strategy: "manual",
    maxRetries: 2,
    baseDelayMs: 0,
    label: "Retry after fix",
  },
  TX_SIMULATION_FAILED: {
    retryable: true,
    strategy: "manual",
    maxRetries: 2,
    baseDelayMs: 0,
    label: "Retry after simulation fix",
  },
  TX_SEND_FAILED: {
    retryable: true,
    strategy: "immediate",
    maxRetries: 3,
    baseDelayMs: 800,
    label: "Retry send",
  },
  TX_CONFIRMATION_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 8,
    baseDelayMs: 2000,
    label: "Poll confirmation",
  },
  TX_EXPIRED: {
    retryable: true,
    strategy: "immediate",
    maxRetries: 3,
    baseDelayMs: 0,
    label: "Rebuild tx",
  },
  ACCOUNT_NOT_FOUND: { ...DEFAULT, label: "Initialize or fix cluster" },
  ACCOUNT_DECODE_FAILED: { ...DEFAULT },
  PDA_DERIVATION_FAILED: { ...DEFAULT },
  PROGRAM_ERROR: {
    retryable: true,
    strategy: "manual",
    maxRetries: 1,
    baseDelayMs: 0,
    label: "Retry after program fix",
  },
  ANCHOR_IDL_MISMATCH: { ...DEFAULT },
  INSUFFICIENT_SOL: {
    retryable: true,
    strategy: "manual",
    maxRetries: 0,
    baseDelayMs: 0,
    label: "Fund wallet",
  },
  INSUFFICIENT_PERMISSIONS: { ...DEFAULT },
  RECEIPT_ANCHOR_FAILED: {
    retryable: true,
    strategy: "immediate",
    maxRetries: 4,
    baseDelayMs: 1200,
    label: "Retry anchor",
  },
  PROOF_VERIFICATION_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 10,
    baseDelayMs: 3000,
    label: "Recheck proof",
  },
  MEMORY_WRITE_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 4,
    baseDelayMs: 1000,
    label: "Retry write",
  },
  MEMORY_RETRIEVE_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 4,
    baseDelayMs: 800,
    label: "Retry load",
  },
  REFLECTION_WRITE_FAILED: {
    retryable: true,
    strategy: "immediate",
    maxRetries: 3,
    baseDelayMs: 600,
    label: "Retry reflection",
  },
  SKILL_PUBLISH_FAILED: {
    retryable: true,
    strategy: "manual",
    maxRetries: 2,
    baseDelayMs: 0,
    label: "Retry publish",
  },
  SKILL_UPDATE_FAILED: {
    retryable: true,
    strategy: "manual",
    maxRetries: 2,
    baseDelayMs: 0,
    label: "Retry update",
  },
  PLAN_BUILD_FAILED: {
    retryable: true,
    strategy: "immediate",
    maxRetries: 3,
    baseDelayMs: 500,
    label: "Retry plan",
  },
  EXECUTION_FAILED: {
    retryable: true,
    strategy: "manual",
    maxRetries: 3,
    baseDelayMs: 0,
    label: "Retry execution",
  },
  OPENCLAW_IMPORT_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 3,
    baseDelayMs: 2000,
    label: "Retry import",
  },
  OPENCLAW_EXPORT_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 3,
    baseDelayMs: 2000,
    label: "Retry export",
  },
  ZERO_G_STORAGE_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 5,
    baseDelayMs: 2500,
    label: "Retry storage",
  },
  ZERO_G_DA_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 5,
    baseDelayMs: 2500,
    label: "Retry DA",
  },
  ZERO_G_VERIFY_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 4,
    baseDelayMs: 1500,
    label: "Retry verify",
  },
  DB_WRITE_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 3,
    baseDelayMs: 2000,
    label: "Retry",
  },
  DB_READ_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 4,
    baseDelayMs: 1000,
    label: "Retry",
  },
  INDEXER_SYNC_FAILED: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 6,
    baseDelayMs: 4000,
    label: "Retry sync",
  },
  UNEXPECTED_ROUTE_ERROR: {
    retryable: true,
    strategy: "backoff",
    maxRetries: 2,
    baseDelayMs: 1500,
    label: "Retry",
  },
  VALIDATION_FAILED: { ...DEFAULT, label: "Fix input" },
  DEMO_MODE_MISMATCH: { ...DEFAULT },
  DEGRADED_MODE: {
    retryable: true,
    strategy: "manual",
    maxRetries: 0,
    baseDelayMs: 0,
    label: "Retry when healthy",
  },
  UNKNOWN: {
    retryable: true,
    strategy: "manual",
    maxRetries: 2,
    baseDelayMs: 1000,
    label: "Retry",
  },
};

export function getRetryPolicyForCode(code: ErrorCode): RetryPolicy {
  return RETRY_POLICY_BY_CODE[code] ?? RETRY_POLICY_BY_CODE.UNKNOWN;
}
