import type { ErrorCode } from "@shared/errorTypes";

export function mapZeroGErrorMessage(
  message: string,
  phase: "storage" | "da" | "verify",
): ErrorCode {
  const m = message.toLowerCase();
  if (phase === "storage") {
    if (m.includes("verify")) return "ZERO_G_VERIFY_FAILED";
    return "ZERO_G_STORAGE_FAILED";
  }
  if (phase === "da") return "ZERO_G_DA_FAILED";
  return "ZERO_G_VERIFY_FAILED";
}
