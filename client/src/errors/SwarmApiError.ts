import type { AppError } from "@shared/errorTypes";
import { isAppErrorPayload } from "@shared/errorTypes";
import { normalizeError } from "@shared/normalizeError";

export class SwarmApiError extends Error {
  readonly appError: AppError;

  constructor(appError: AppError) {
    super(appError.message);
    this.name = "SwarmApiError";
    this.appError = appError;
  }
}

export function toSwarmApiError(error: unknown): SwarmApiError {
  if (error instanceof SwarmApiError) return error;
  return new SwarmApiError(normalizeError(error, { source: "client" }));
}

type ApiFail = { ok: false; error: AppError | string | Record<string, unknown> };

export function throwIfApiFailed(body: unknown, res: Response): void {
  if (!body || typeof body !== "object") return;
  const b = body as ApiFail;
  if (b.ok !== false) return;
  const raw: unknown = b.error;
  if (isAppErrorPayload(raw)) {
    throw new SwarmApiError(raw);
  }
  if (typeof raw === "string") {
    throw new SwarmApiError(normalizeError(raw, { source: "api", statusCode: res.status }));
  }
  throw new SwarmApiError(
    normalizeError(raw ?? "api_error", {
      source: "api",
      statusCode: res.status,
      fallback: { message: "Request rejected by server." },
    })
  );
}
