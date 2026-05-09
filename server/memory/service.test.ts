import { describe, expect, it } from "vitest";
import { MemoryReceiptStore } from "./store";
import { MemoryReceiptService } from "./service";

describe("memory receipt service", () => {
  it("creates reflection, anchors proof, links turn, and verifies chain", async () => {
    const service = new MemoryReceiptService(new MemoryReceiptStore(), {
      chainId: 101,
      defaultWallet: "wallet_demo",
    });

    const created = await service.createReflection({
      agentId: "agent_1",
      conversationId: "conv_1",
      sourceTurnId: "turn_1",
      kind: "failure",
      title: "Failure learned",
      summary: "A tool call failed due to invalid assumptions.",
      fullText: "Long-form reflection payload persisted off-chain.",
      rootCause: "Schema assumptions drifted.",
      correctiveAdvice: "Validate schema before tool invocation.",
      nextAction: "Inject schema-first reminder in the next turn.",
      tags: ["failure", "schema"],
    });

    const anchored = await service.anchorReflection(
      created.reflection.id,
      "wallet_demo",
    );
    expect(anchored.solanaTxSig).toBeTruthy();
    expect(anchored.reflectionHash).toBe(created.reflection.payloadHash);

    const link = await service.linkReceiptToNextTurn(created.reflection.id, {
      nextTurnId: "turn_2",
      reason: "Applied correction in next execution turn.",
    });
    expect(link.receipt.nextTurnIdHash).toBeTruthy();
    expect(link.receipt.status).toBe("linked");

    const verification = await service.verifyReflection(created.reflection.id);
    expect(verification.verified).toBe(true);
    expect(verification.issues).toHaveLength(0);

    const bundle = await service.buildInjectionBundle({
      agentId: "agent_1",
      conversationId: "conv_1",
      nextTurnId: "turn_3",
      wallet: "wallet_demo",
      maxItems: 2,
    });
    expect(bundle.items.length).toBeGreaterThan(0);
    expect(bundle.injectedPrompt).toContain("Memory injection");

    const chain = await service.getChain(created.reflection.id);
    expect(chain.receipt?.id).toBe(anchored.id);
    expect(chain.links.length).toBeGreaterThan(0);
  });
});
