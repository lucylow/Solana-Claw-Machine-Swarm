import { createAppError } from "@shared/appErrorFactory";
import type { AppError } from "@shared/errorTypes";
import { inferCodeFromLegacyMessage } from "@shared/normalizeError";

export function orchestratorStringsToAppErrors(
  errors: string[],
  ctx: Record<string, string | undefined>
): AppError[] {
  return errors.map(msg => {
    const code = inferCodeFromLegacyMessage(msg) ?? "EXECUTION_FAILED";
    return createAppError(code, {
      message: msg.length > 200 ? `${msg.slice(0, 197)}…` : msg,
      technicalMessage: msg,
      metadata: { ...ctx, orchestratorLane: true },
      source: "orchestrator",
    });
  });
}
