import { describe, expect, it } from "vitest";
import { formatSessionExpiry, formatSolBalance, shortenAddress } from "./format";

describe("solana format helpers", () => {
  it("shortens addresses predictably", () => {
    expect(shortenAddress("ABCDE12345FGHIJ", 4, 4)).toBe("ABCD...GHIJ");
  });

  it("formats balance values", () => {
    expect(formatSolBalance(1.234567)).toBe("1.2346 SOL");
    expect(formatSolBalance(null)).toBe("-- SOL");
  });

  it("formats session expiry labels", () => {
    const future = Date.now() + 30 * 60 * 1000;
    expect(formatSessionExpiry(future)).toContain("remaining");
    expect(formatSessionExpiry(Date.now() - 1000)).toBe("Expired");
  });
});
