import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";
import { inferCodeFromLegacyMessage, normalizeError } from "./normalizeError";
import { isAppErrorPayload } from "./errorTypes";
import { getRetryPolicyForCode } from "./retryPolicy";

describe("normalizeError", () => {
  it("preserves structured AppError payloads", () => {
    const structured = normalizeError(new Error("x"), {
      fallback: { code: "RPC_TIMEOUT", message: "Timed out" },
    });
    const again = normalizeError(structured);
    expect(again.code).toBe(structured.code);
    expect(isAppErrorPayload(again)).toBe(true);
  });

  it("maps ZodError to VALIDATION_FAILED", () => {
    const err = z.object({ a: z.string().min(2) }).safeParse({ a: "" });
    expect(err.success).toBe(false);
    if (!err.success) {
      const app = normalizeError(err.error);
      expect(app.code).toBe("VALIDATION_FAILED");
      expect(app.retryable).toBe(false);
    }
  });

  it("classifies legacy orchestrator strings", () => {
    expect(inferCodeFromLegacyMessage("wallet_session_inactive")).toBe(
      "SESSION_REQUIRED",
    );
    expect(inferCodeFromLegacyMessage("RPC 429")).toBe("RPC_RATE_LIMITED");
    expect(inferCodeFromLegacyMessage("simulation failed")).toBe(
      "TX_SIMULATION_FAILED",
    );
  });

  it("retry policy covers core tx codes", () => {
    expect(getRetryPolicyForCode("TX_SEND_FAILED").retryable).toBe(true);
    expect(getRetryPolicyForCode("VALIDATION_FAILED").retryable).toBe(false);
  });
});

describe("ZodError direct", () => {
  it("normalizes ZodError instance", () => {
    let ze: ZodError | undefined;
    try {
      z.string().email().parse("not-email");
    } catch (e) {
      ze = e as ZodError;
    }
    expect(ze).toBeDefined();
    const app = normalizeError(ze!);
    expect(app.code).toBe("VALIDATION_FAILED");
  });
});
