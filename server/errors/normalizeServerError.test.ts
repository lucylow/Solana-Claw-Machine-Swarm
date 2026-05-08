import { describe, expect, it } from "vitest";
import { HttpError } from "@shared/_core/errors";
import { normalizeServerError } from "./normalizeServerError";

describe("normalizeServerError", () => {
  it("maps HttpError status to codes", () => {
    const a = normalizeServerError(new HttpError(401, "nope"), { route: "/api/x" });
    expect(a.code).toBe("SESSION_VERIFICATION_FAILED");
    const b = normalizeServerError(new HttpError(429, "slow"), { route: "/api/x" });
    expect(b.code).toBe("RPC_RATE_LIMITED");
  });
});
