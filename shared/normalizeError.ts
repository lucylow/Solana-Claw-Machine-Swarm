import { catalogEntry } from "./errorCatalog";
import { newErrorId } from "./errorId";
import { getRetryPolicyForCode } from "./retryPolicy";
import type { AppError, ErrorCode, ErrorScope } from "./errorTypes";
import { isAppErrorPayload } from "./errorTypes";
import { ZodError } from "zod";

export { newErrorId } from "./errorId";

export interface NormalizeErrorOptions {
  fallback?: Partial<AppError> & { code?: ErrorCode; scope?: ErrorScope };
  source?: string;
  requestPath?: string;
  statusCode?: number;
  walletAddress?: string;
  cluster?: string;
  txSignature?: string;
}

function mergeMetadata(
  base: Record<string, unknown> | undefined,
  extra: Record<string, unknown>
): Record<string, unknown> {
  return { ...(base ?? {}), ...extra };
}

/** Infer ErrorCode from common legacy string messages (server + orchestrator). */
export function inferCodeFromLegacyMessage(msg: string): ErrorCode | undefined {
  const m = msg.toLowerCase();
  if (
    m.includes("walletaddress_required") ||
    m.includes("wallet_address_required") ||
    m.includes("wallet required")
  )
    return "VALIDATION_FAILED";
  if (m.includes("wallet_session_inactive") || m.includes("session_inactive")) return "SESSION_REQUIRED";
  if (m.includes("session") && m.includes("expired")) return "WALLET_SESSION_EXPIRED";
  if (m.includes("wrong cluster") || m.includes("cluster mismatch")) return "WALLET_WRONG_CLUSTER";
  if (m.includes("user rejected") || m.includes("rejected")) return "WALLET_CONNECTION_REJECTED";
  if (m.includes("not enough sol") || m.includes("insufficient funds")) return "INSUFFICIENT_SOL";
  if (m.includes("429") || m.includes("rate limit")) return "RPC_RATE_LIMITED";
  if (m.includes("timed out") || m.includes("timeout")) return "RPC_TIMEOUT";
  if (m.includes("fetch failed") || m.includes("econnrefused")) return "RPC_UNAVAILABLE";
  if (m.includes("circuit_open")) return "RPC_UNAVAILABLE";
  if (m.includes("simulation failed")) return "TX_SIMULATION_FAILED";
  if (m.includes("blockhash not found") || m.includes("expired")) return "TX_EXPIRED";
  if (m.includes("sendtransaction") || m.includes("send failed")) return "TX_SEND_FAILED";
  if (m.includes("anchor") && m.includes("idl")) return "ANCHOR_IDL_MISMATCH";
  if (m.includes("memory_anchor") || m.includes("anchor_failed")) return "RECEIPT_ANCHOR_FAILED";
  if (m.includes("proof_receipt") || m.includes("proof_failed")) return "RECEIPT_ANCHOR_FAILED";
  if (m.includes("plan_anchor") || m.includes("plan_failed")) return "PLAN_BUILD_FAILED";
  if (m.includes("reflection_failed")) return "REFLECTION_WRITE_FAILED";
  if (m.includes("identity_service_unavailable")) return "INDEXER_SYNC_FAILED";
  if (m.includes("skill_not_found")) return "VALIDATION_FAILED";
  if (m.includes("zerog") && m.includes("storage")) return "ZERO_G_STORAGE_FAILED";
  if (m.includes("zerog") && m.includes("da")) return "ZERO_G_DA_FAILED";
  if (m.includes("openclaw") && m.includes("import")) return "OPENCLAW_IMPORT_FAILED";
  if (m.includes("openclaw") && m.includes("export")) return "OPENCLAW_EXPORT_FAILED";
  if (m.includes("demo") && m.includes("mismatch")) return "DEMO_MODE_MISMATCH";
  if (m.includes("degraded")) return "DEGRADED_MODE";
  if (m.includes("verification failed") || m.includes("proof")) return "PROOF_VERIFICATION_FAILED";
  if (m.includes("database") || m.includes("db_")) return "DB_READ_FAILED";
  return undefined;
}

function technicalFromUnknown(error: unknown): string | undefined {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Convert any thrown value into a structured AppError.
 * Safe for browser and Node.
 */
export function normalizeError(error: unknown, options: NormalizeErrorOptions = {}): AppError {
  const id = options.fallback?.id ?? newErrorId();
  const now = new Date().toISOString();

  if (isAppErrorPayload(error)) {
    const policy = getRetryPolicyForCode(error.code);
    return {
      ...error,
      id: error.id || id,
      retryable: error.retryable ?? policy.retryable,
      recoverable: error.recoverable ?? true,
      createdAt: error.createdAt || now,
      metadata: mergeMetadata(error.metadata as Record<string, unknown> | undefined, {
        requestPath: options.requestPath,
        walletAddress: options.walletAddress,
        cluster: options.cluster,
        txSignature: options.txSignature,
      }),
    };
  }

  if (error instanceof ZodError) {
    const cat = catalogEntry("VALIDATION_FAILED");
    const policy = getRetryPolicyForCode("VALIDATION_FAILED");
    const issues = error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    return {
      id,
      code: "VALIDATION_FAILED",
      scope: cat.scope,
      severity: cat.severity,
      title: cat.title,
      message: issues || cat.message,
      technicalMessage: issues,
      retryable: policy.retryable,
      recoverable: true,
      recoveryAction: cat.recoveryAction,
      retryLabel: cat.retryLabel,
      source: options.source,
      statusCode: options.statusCode ?? 400,
      cause: error,
      metadata: {
        requestPath: options.requestPath,
        zodIssues: error.issues,
      },
      createdAt: now,
    };
  }

  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : technicalFromUnknown(error) ?? "unknown_error";

  const inferred = inferCodeFromLegacyMessage(msg);
  const code: ErrorCode =
    options.fallback?.code ?? inferred ?? ("UNKNOWN" as ErrorCode);
  const cat = catalogEntry(code);
  const policy = getRetryPolicyForCode(code);

  return {
    id,
    code,
    scope: options.fallback?.scope ?? cat.scope,
    severity: options.fallback?.severity ?? cat.severity,
    title: options.fallback?.title ?? cat.title,
    message: options.fallback?.message ?? cat.message,
    technicalMessage: options.fallback?.technicalMessage ?? technicalFromUnknown(error),
    retryable: options.fallback?.retryable ?? policy.retryable,
    recoverable: options.fallback?.recoverable ?? true,
    retryLabel: options.fallback?.retryLabel ?? cat.retryLabel ?? policy.label,
    recoveryAction: options.fallback?.recoveryAction ?? cat.recoveryAction,
    supportHint: options.fallback?.supportHint ?? cat.supportHint,
    actionUrl: options.fallback?.actionUrl,
    source: options.fallback?.source ?? options.source,
    statusCode: options.fallback?.statusCode ?? options.statusCode,
    cause: error,
    metadata: mergeMetadata(options.fallback?.metadata as Record<string, unknown> | undefined, {
      requestPath: options.requestPath,
      walletAddress: options.walletAddress,
      cluster: options.cluster,
      txSignature: options.txSignature,
      legacyMessage: msg,
    }),
    createdAt: now,
  };
}
