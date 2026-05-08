import { HttpError } from "@shared/_core/errors";
import type { AppError, ErrorCode } from "@shared/errorTypes";
import { inferCodeFromLegacyMessage, normalizeError } from "@shared/normalizeError";

export interface ServerErrorContext {
  route?: string;
  requestId?: string;
  walletAddress?: string;
  cluster?: string;
  txSignature?: string;
}

function httpStatusToCode(status: number, message: string): ErrorCode {
  if (status === 400) return inferCodeFromLegacyMessage(message) ?? "VALIDATION_FAILED";
  if (status === 401) return "SESSION_VERIFICATION_FAILED";
  if (status === 403) return "INSUFFICIENT_PERMISSIONS";
  if (status === 404) return inferCodeFromLegacyMessage(message) ?? "VALIDATION_FAILED";
  if (status === 429) return "RPC_RATE_LIMITED";
  if (status >= 500) return "UNEXPECTED_ROUTE_ERROR";
  return inferCodeFromLegacyMessage(message) ?? "UNEXPECTED_ROUTE_ERROR";
}

export function normalizeServerError(error: unknown, ctx: ServerErrorContext = {}): AppError {
  if (error instanceof HttpError) {
    const code = httpStatusToCode(error.statusCode, error.message);
    return normalizeError(error.message, {
      statusCode: error.statusCode,
      source: "http_error",
      requestPath: ctx.route,
      walletAddress: ctx.walletAddress,
      cluster: ctx.cluster,
      txSignature: ctx.txSignature,
      fallback: {
        code,
        technicalMessage: error.message,
        metadata: { requestId: ctx.requestId },
      },
    });
  }

  return normalizeError(error, {
    source: "server",
    requestPath: ctx.route,
    walletAddress: ctx.walletAddress,
    cluster: ctx.cluster,
    txSignature: ctx.txSignature,
    fallback: {
      metadata: { requestId: ctx.requestId },
    },
  });
}
