import { describe, expect, it } from "vitest";
import {
  buildExplorerAddressUrl,
  buildExplorerTxUrl,
  explorerBaseUrl,
} from "./explorer";

describe("server solana explorer helpers", () => {
  it("buildExplorerTxUrl includes cluster query", () => {
    const url = buildExplorerTxUrl("abc123", "devnet");
    expect(url).toContain("/tx/abc123");
    expect(url).toContain("cluster=devnet");
  });

  it("buildExplorerAddressUrl includes cluster query", () => {
    const url = buildExplorerAddressUrl(
      "SoL11111111111111111111111111111111111111112",
      "mainnet-beta",
    );
    expect(url).toContain("/address/");
    expect(url).toContain("cluster=mainnet-beta");
  });

  it("explorerBaseUrl returns a non-empty default", () => {
    expect(explorerBaseUrl().length).toBeGreaterThan(8);
  });
});
