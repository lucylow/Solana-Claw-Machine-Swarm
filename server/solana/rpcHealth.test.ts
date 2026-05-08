import { describe, expect, it } from "vitest";
import { probeSolanaRpc } from "./rpcHealth";

describe("probeSolanaRpc", () => {
  it("returns ok:false quickly for an unreachable endpoint", async () => {
    const result = await probeSolanaRpc("http://127.0.0.1:1", 800);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  }, 10_000);
});
