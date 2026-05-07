import { describe, expect, it } from "vitest";
import { orchestrateReflectionSidecar } from "./orchestration";

describe("orchestrateReflectionSidecar", () => {
  it("stores artifact, compute output, DA record, and solana proof link", async () => {
    const result = await orchestrateReflectionSidecar({
      reflectionId: `refl_test_${Date.now()}`,
      agentId: "agent_1",
      runId: "run_integration",
      wallet: "8qFwzE9wC2vYVh2kGTH8A7fWjMc2R7qM6wQh4QYzR7uD",
      rootCause: "timeout",
      correctiveAction: "retry with backoff",
      nextAction: "replay",
      fullText: "Root cause: timeout\nFix: retry",
      kind: "failure",
      autonomyLevel: "policy_gated",
    });

    expect(result.zeroGStorageRef).toMatch(/^zg:\/\//);
    expect(result.zeroGComputeRef).toMatch(/^zg:\/\//);
    expect(result.zeroGAvailabilityRef).toMatch(/^zg:\/\//);
    expect(result.solanaTxSignature).toBeDefined();
    expect(result.summaryHash.length).toBeGreaterThan(16);
  });
});
