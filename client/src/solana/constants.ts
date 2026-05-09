import {
  CLAW_PRODUCT_NAME,
  SOLANA_CHAIN_ID,
  SOLANA_CLUSTER,
  SOLANA_RPC_URL,
} from "@/lib/solana/config";

const env = import.meta.env as Record<string, string | undefined>;

export { SOLANA_CHAIN_ID, SOLANA_CLUSTER, SOLANA_RPC_URL };

export const CLAW_IDENTITY_API = env.VITE_CLAW_IDENTITY_API || "";
export const CLAW_ONCHAIN_PROGRAM_ID = env.VITE_CLAW_IDENTITY_PROGRAM_ID || "";
export const CLAW_IDENTITY_DOMAIN =
  env.VITE_CLAW_IDENTITY_DOMAIN ||
  (typeof window !== "undefined" ? window.location.host : "localhost");
export const CLAW_IDENTITY_APP_NAME = CLAW_PRODUCT_NAME;
export const CLAW_IDENTITY_STATEMENT =
  "Sign this message to bind your Solana wallet to CLAW MACHINE identity.";
export const CLAW_IDENTITY_SESSION_KEY = "claw.identity.session";
