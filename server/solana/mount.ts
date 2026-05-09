import type express from "express";
import path from "path";
import { IdentityStore } from "./identityStore";
import { SolanaIdentityService } from "./identityService";
import { registerSolanaIdentityRoutes } from "./routes";
import { SolanaSessionService } from "./session";
import type { SolanaBridgeService } from "./bridgeService";
import { getServerSolanaCluster } from "./config";

export async function mountSolanaIdentity(
  app: express.Express,
  options?: {
    solanaBridge?: SolanaBridgeService;
  },
) {
  const store = new IdentityStore(
    path.join(process.cwd(), "data", "solana-identity.json"),
  );
  await store.init();

  const service = new SolanaIdentityService(store, {
    domain: process.env.CLAW_IDENTITY_DOMAIN || "localhost",
    uri: process.env.CLAW_IDENTITY_URI || "http://localhost:3000",
    chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
    programId:
      process.env.SOLANA_PROGRAM_ID ||
      process.env.CLAW_IDENTITY_PROGRAM_ID ||
      undefined,
    statement:
      process.env.CLAW_IDENTITY_STATEMENT ||
      "Sign this message to bind your Solana wallet to CLAW MACHINE.",
    onchain: options?.solanaBridge
      ? {
          anchorReceipt: async (input) => {
            const tx = await options.solanaBridge!.sendInstruction({
              walletAddress: input.walletAddress,
              action: "anchor_receipt",
              subjectId: input.receiptId,
              payloadHash: input.receiptHash,
              receiptId: input.receiptId,
              metadata: {
                profileHash: input.profileHash,
                challengeHash: input.challengeHash,
                signatureHash: input.signatureHash,
                chainId: input.chainId,
                labels: input.labels,
                summary: input.summary,
              },
            });
            if (tx.status === "failed" || !tx.txSignature) {
              throw new Error(tx.error || "solana_bridge_anchor_failed");
            }
            return {
              txHash: tx.txSignature,
              receiptPda: tx.accountAddress,
            };
          },
        }
      : undefined,
  });

  const sessionService = new SolanaSessionService({
    cluster: getServerSolanaCluster(),
    productName: process.env.CLAW_IDENTITY_APP_NAME || "CLAW MACHINE",
  });

  registerSolanaIdentityRoutes(app, service, sessionService);
  return { store, service, sessionService };
}
