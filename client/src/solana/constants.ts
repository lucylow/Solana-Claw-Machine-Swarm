const env = import.meta.env as Record<string, string | undefined>;

export const SOLANA_CLUSTER = env.VITE_SOLANA_CLUSTER || "devnet";
export const SOLANA_RPC_URL = env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const SOLANA_CHAIN_ID = Number(env.VITE_SOLANA_CHAIN_ID || 101);

export const CLAW_IDENTITY_API = env.VITE_CLAW_IDENTITY_API || "";
export const CLAW_ONCHAIN_PROGRAM_ID = env.VITE_CLAW_IDENTITY_PROGRAM_ID || "";
export const CLAW_IDENTITY_DOMAIN =
  env.VITE_CLAW_IDENTITY_DOMAIN ||
  (typeof window !== "undefined" ? window.location.host : "localhost");
export const CLAW_IDENTITY_APP_NAME = "CLAW MACHINE";
export const CLAW_IDENTITY_STATEMENT =
  "Sign this message to bind your Solana wallet to CLAW MACHINE identity.";
export const CLAW_IDENTITY_SESSION_KEY = "claw.identity.session";
