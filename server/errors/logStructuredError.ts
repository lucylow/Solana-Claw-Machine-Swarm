import type { AppError } from "@shared/errorTypes";

export function logStructuredError(
  appError: AppError,
  ctx: Record<string, unknown> = {},
) {
  const payload = {
    ts: new Date().toISOString(),
    kind: "claw_app_error",
    id: appError.id,
    code: appError.code,
    scope: appError.scope,
    severity: appError.severity,
    message: appError.message,
    technicalMessage: appError.technicalMessage,
    retryable: appError.retryable,
    recoverable: appError.recoverable,
    recoveryAction: appError.recoveryAction,
    route: ctx.route,
    component: ctx.component,
    service: ctx.service,
    walletAddress: ctx.walletAddress ?? appError.metadata?.walletAddress,
    cluster: ctx.cluster ?? appError.metadata?.cluster,
    receiptId: ctx.receiptId,
    memoryId: ctx.memoryId,
    skillId: ctx.skillId,
    planId: ctx.planId,
    txSignature: ctx.txSignature ?? appError.metadata?.txSignature,
    requestId: ctx.requestId,
  };

  const line = JSON.stringify(payload);
  if (appError.severity === "critical" || appError.severity === "error") {
    console.error(line);
  } else {
    console.warn(line);
  }
}
