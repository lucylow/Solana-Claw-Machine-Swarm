import type express from "express";
import path from "path";
import { IdentityStore } from "./identityStore";
import { SolanaIdentityService } from "./identityService";
import { registerSolanaIdentityRoutes } from "./routes";

export async function mountSolanaIdentity(app: express.Express) {
  const store = new IdentityStore(path.join(process.cwd(), "data", "solana-identity.json"));
  await store.init();

  const service = new SolanaIdentityService(store, {
    domain: process.env.CLAW_IDENTITY_DOMAIN || "localhost",
    uri: process.env.CLAW_IDENTITY_URI || "http://localhost:3000",
    chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
    programId: process.env.SOLANA_PROGRAM_ID || process.env.CLAW_IDENTITY_PROGRAM_ID || undefined,
    statement:
      process.env.CLAW_IDENTITY_STATEMENT ||
      "Sign this message to bind your Solana wallet to CLAW MACHINE.",
  });

  registerSolanaIdentityRoutes(app, service);
  return { store, service };
}
