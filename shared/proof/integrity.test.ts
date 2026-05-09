import { describe, expect, it } from "vitest";
import { inferProofIntegrity, isDemoSimulatedTxSignature } from "./integrity";

describe("inferProofIntegrity", () => {
  it("labels SIM signatures as demo-only", () => {
    expect(isDemoSimulatedTxSignature("SIM_abc")).toBe(true);
    expect(isDemoSimulatedTxSignature("4wFx")).toBe(false);
    expect(
      inferProofIntegrity({
        txSignature:
          "SIM_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        zerogMode: "live",
        degradedFlags: false,
      }),
    ).toBe("demo_only");
  });

  it("uses degraded when flags set", () => {
    expect(
      inferProofIntegrity({
        zerogMode: "live",
        degradedFlags: true,
      }),
    ).toBe("degraded");
  });

  it("defaults missing tx under mock integrator to demo-only", () => {
    expect(inferProofIntegrity({ zerogMode: "mock" })).toBe("demo_only");
  });
});
