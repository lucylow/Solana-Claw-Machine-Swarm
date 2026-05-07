import type { SolanaCluster } from "./types";

const env = import.meta.env as Record<string, string | undefined>;

export const SOLANA_CLUSTER = (env.VITE_SOLANA_CLUSTER || "devnet") as SolanaCluster;
export const SOLANA_RPC_URL = env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const SOLANA_CHAIN_ID = Number(env.VITE_SOLANA_CHAIN_ID || 101);
export const SOLANA_EXPLORER_BASE = env.VITE_SOLANA_EXPLORER_BASE || "https://explorer.solana.com";
export const SOLANA_SESSION_STORAGE_KEY = "claw.solana.session.cache";
export const CLAW_PRODUCT_NAME = "CLAW MACHINE";

/** Session cache only — wallet truth comes from the adapter + verified backend session */
export const DEMO_MODE =
  import.meta.env.VITE_CLAW_DEMO_MODE === "1" || import.meta.env.VITE_CLAW_DEMO_MODE === "true";
