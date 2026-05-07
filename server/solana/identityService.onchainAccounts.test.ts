import { describe, expect, it } from "vitest";
import { SolanaIdentityService } from "./identityService";
import { IdentityStore } from "./identityStore";

describe("solana on-chain style account records", () => {
  it("records memory/planner/deployment and updates reputation", async () => {
    const store = new IdentityStore();
    const service = new SolanaIdentityService(store, {
      domain: "localhost",
      uri: "http://localhost:3000",
      chainId: 101,
      statement: "Sign to verify wallet ownership.",
    });
    const walletAddress = "7wy8f47N6PufhANhn7owaxT2Gf9s2E6TQtu4r8V9X4Jx";

    await service.recordMemoryAnchor({
      walletAddress,
      sourceTurnId: "turn_001",
      taskType: "reflection",
      kind: "reflection",
      result: "success",
      sourceHash: "source_hash_001",
      reflectionHash: "reflection_hash_001",
      lessonHash: "lesson_hash_001",
      summary: "Captured reflection and lesson hashes for future retrieval.",
      rootCause: "A retrieval timeout happened during context hydration.",
      correctiveAdvice: "Start with canonical docs to reduce retries.",
      nextBestAction: "Promote this lesson into planner constraints.",
      confidenceBps: 9000,
      severityBps: 2500,
      tags: ["memory", "reflection"],
      relatedMemoryIds: [],
      pinned: true,
    });

    await service.recordPlannerRun({
      walletAddress,
      runId: "run_001",
      taskType: "planning",
      goal: "Build a reliable deployment plan.",
      planHash: "plan_hash_001",
      stepHash: "step_hash_001",
      outcome: "succeeded",
      selectedSkill: "Planner",
      stepCount: 5,
      completedSteps: 5,
      failedSteps: 0,
      confidenceBps: 9100,
    });

    await service.recordDeployment({
      walletAddress,
      deployId: "deploy_001",
      name: "claw-agent",
      version: "1.0.0",
      target: "solana-devnet",
      bundleHash: "bundle_hash_001",
      sourceHash: "source_hash_001",
      storageKey: "ar://bundle_hash_001",
      receiptHash: "receipt_hash_001",
      txHash: "tx_hash_001",
      explorerUrl: "https://explorer.solana.com/tx/tx_hash_001?cluster=devnet",
      status: "confirmed",
      artifactCount: 3,
      bytes: 2048,
      chainId: 101,
    });

    const memories = await service.getMemories(walletAddress);
    const plannerRuns = await service.getPlannerRuns(walletAddress);
    const deployments = await service.getDeployments(walletAddress);
    const reputation = await service.getReputation(walletAddress);
    const profile = await service.getProfile(walletAddress);

    expect(memories).toHaveLength(1);
    expect(plannerRuns).toHaveLength(1);
    expect(deployments).toHaveLength(1);
    expect(reputation).toBeTruthy();
    expect(reputation?.memoryAnchorCount).toBe(1);
    expect(reputation?.plannerRunCount).toBe(1);
    expect(reputation?.deploymentCount).toBe(1);
    expect(reputation?.usageCount).toBe(3);
    expect(profile.memoryCount).toBe(1);
    expect(profile.plannerRunCount).toBe(1);
    expect(profile.deploymentCount).toBe(1);
    expect(profile.trustScoreBps).toBe(10_000);
  });
});
