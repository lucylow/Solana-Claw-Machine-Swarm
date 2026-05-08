/**
 * Server-side re-exports for the canonical shared `AppError` model.
 */
export type { ApiErrorEnvelope, AppError, ErrorCode, ErrorScope, ErrorSeverity, ErrorState } from "@shared/errorTypes";
export { createAppError } from "@shared/appErrorFactory";
export { normalizeError } from "@shared/normalizeError";
