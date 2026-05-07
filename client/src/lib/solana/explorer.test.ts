import { describe, expect, it } from "vitest";
import { addressExplorerUrl, createSolanaExplorerUrl, txExplorerUrl } from "./explorer";

describe("solana explorer helpers", () => {
  it("builds transaction explorer urls", () => {
    const url = txExplorerUrl("5w7Xsig");
    expect(url).toContain("/tx/5w7Xsig");
    expect(url).toContain("cluster=devnet");
  });

  it("builds address explorer urls with cluster override", () => {
    const url = createSolanaExplorerUrl("address", "4n2Wallet", "mainnet-beta");
    expect(url).toContain("/address/4n2Wallet");
    expect(url).toContain("cluster=mainnet-beta");
  });

  it("returns empty urls when missing ids", () => {
    expect(addressExplorerUrl("")).toBe("");
    expect(txExplorerUrl(undefined)).toBe("");
  });
});
