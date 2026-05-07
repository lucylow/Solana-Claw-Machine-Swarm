import { describe, expect, it } from "vitest";
import { DEMO_SKILLS, DEMO_CHAIN_RECEIPT } from "./demoCanonical";

describe("canonical demo fixtures", () => {
  it("keeps skill assets OpenClaw-flagged", () => {
    expect(DEMO_SKILLS[0]?.openClawCompatible).toBe(true);
  });

  it("includes explorer proof url on demo receipt", () => {
    expect(DEMO_CHAIN_RECEIPT.explorerUrl).toContain("explorer.solana.com");
  });
});
