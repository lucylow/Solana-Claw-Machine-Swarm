import { ZEROG_CHAIN_ID_DEFAULT } from "@shared/zerog";
import type { ZeroGConfig, ZeroGEnvironment } from "./types";

function parseEnvironment(input?: string): ZeroGEnvironment {
  if (input === "local" || input === "testnet" || input === "mainnet" || input === "demo") {
    return input;
  }
  if (process.env.NODE_ENV === "production") return "mainnet";
  return "demo";
}

function parseBoolean(input: string | undefined, fallback: boolean) {
  if (input === undefined) return fallback;
  return input === "true";
}

export function getZeroGConfig(): ZeroGConfig {
  const environment = parseEnvironment(process.env.ZEROG_ENV);
  const demoMode = parseBoolean(process.env.ZEROG_DEMO_MODE, environment === "demo");
  const enabled = parseBoolean(process.env.ZEROG_ENABLED, true);
  const readOnly = parseBoolean(process.env.ZEROG_READ_ONLY, demoMode);

  const ogChainId = Number(process.env.ZEROG_OG_CHAIN_ID || ZEROG_CHAIN_ID_DEFAULT);
  return {
    environment,
    storageUrl: process.env.ZEROG_STORAGE_URL || "https://storage.demo.0g.ai/v1",
    computeUrl: process.env.ZEROG_COMPUTE_URL || "https://compute.demo.0g.ai/v1",
    dataAvailabilityUrl: process.env.ZEROG_DA_URL || "https://da.demo.0g.ai/v1",
    explorerUrl: process.env.ZEROG_EXPLORER_URL || "https://explorer.demo.0g.ai",
    bridgeUrl: process.env.ZEROG_BRIDGE_URL || "https://bridge.demo.0g.ai",
    ogChainId: Number.isFinite(ogChainId) ? ogChainId : ZEROG_CHAIN_ID_DEFAULT,
    bridgeProvider: process.env.ZEROG_BRIDGE_PROVIDER || "XSwap (per official 0G docs)",
    tokenMetadataDisclaimer:
      process.env.ZEROG_TOKEN_DISCLAIMER ||
      "Third-party exchange or tracker labels (e.g. “Solana-based token”) are untrusted metadata unless verified against your configured official 0G sources.",
    apiKey: process.env.ZEROG_API_KEY,
    timeoutMs: Number(process.env.ZEROG_TIMEOUT_MS || 12_000),
    enabled,
    readOnly,
    mode: !enabled ? "degraded" : demoMode ? "demo" : "live",
    version: process.env.ZEROG_VERSION || "0g-sidecar-v1",
  };
}
