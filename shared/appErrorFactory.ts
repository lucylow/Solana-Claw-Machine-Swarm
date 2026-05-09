import { catalogEntry } from "./errorCatalog";
import { newErrorId } from "./errorId";
import { getRetryPolicyForCode } from "./retryPolicy";
import type {
  AppError,
  ErrorCode,
  ErrorScope,
  ErrorSeverity,
} from "./errorTypes";

export function createAppError(
  code: ErrorCode,
  overrides: Partial<AppError> = {},
): AppError {
  const cat = catalogEntry(code);
  const policy = getRetryPolicyForCode(code);
  const now = new Date().toISOString();
  const resolvedCode = overrides.code ?? code;
  return {
    id: overrides.id ?? newErrorId(),
    code: resolvedCode,
    scope: (overrides.scope ?? cat.scope) as ErrorScope,
    severity: (overrides.severity ?? cat.severity) as ErrorSeverity,
    title: overrides.title ?? cat.title,
    message: overrides.message ?? cat.message,
    technicalMessage: overrides.technicalMessage,
    retryable: overrides.retryable ?? policy.retryable,
    recoverable: overrides.recoverable ?? true,
    retryLabel: overrides.retryLabel ?? cat.retryLabel ?? policy.label,
    recoveryAction: overrides.recoveryAction ?? cat.recoveryAction,
    supportHint: overrides.supportHint ?? cat.supportHint,
    actionUrl: overrides.actionUrl,
    source: overrides.source,
    statusCode: overrides.statusCode,
    cause: overrides.cause,
    metadata: overrides.metadata,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt,
  };
}
