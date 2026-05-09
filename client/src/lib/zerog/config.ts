import { ZEROG_CHAIN_ID_DEFAULT } from "@shared/zerog";
import type { ZeroGConfig, ZeroGEnvironment } from "./types";

function parseEnvironment(value?: string): ZeroGEnvironment {
  if (
    value === "local" ||
    value === "testnet" ||
    value === "mainnet" ||
    value === "demo"
  )
    return value;
  return "demo";
}

export function getClientZeroGConfig(): ZeroGConfig {
  const env = parseEnvironment(import.meta.env.VITE_ZEROG_ENV);
  const enabled = import.meta.env.VITE_ZEROG_ENABLED !== "false";
  const mode = !enabled
    ? "degraded"
    : import.meta.env.VITE_ZEROG_MODE === "live"
      ? "live"
      : "demo";
  const ogChainId = Number(
    import.meta.env.VITE_ZEROG_OG_CHAIN_ID || ZEROG_CHAIN_ID_DEFAULT,
  );
  return {
    environment: env,
    storageUrl:
      import.meta.env.VITE_ZEROG_STORAGE_URL || "https://storage.demo.0g.ai/v1",
    computeUrl:
      import.meta.env.VITE_ZEROG_COMPUTE_URL || "https://compute.demo.0g.ai/v1",
    dataAvailabilityUrl:
      import.meta.env.VITE_ZEROG_DA_URL || "https://da.demo.0g.ai/v1",
    explorerUrl:
      import.meta.env.VITE_ZEROG_EXPLORER_URL || "https://explorer.demo.0g.ai",
    bridgeUrl:
      import.meta.env.VITE_ZEROG_BRIDGE_URL || "https://bridge.demo.0g.ai",
    ogChainId: Number.isFinite(ogChainId) ? ogChainId : ZEROG_CHAIN_ID_DEFAULT,
    bridgeProvider:
      import.meta.env.VITE_ZEROG_BRIDGE_PROVIDER ||
      "XSwap (per official 0G docs)",
    tokenMetadataDisclaimer:
      import.meta.env.VITE_ZEROG_TOKEN_DISCLAIMER ||
      "Third-party exchange or tracker labels (e.g. “Solana-based token”) are untrusted metadata unless verified against your configured official 0G sources.",
    apiKey: undefined,
    timeoutMs: Number(import.meta.env.VITE_ZEROG_TIMEOUT_MS || 12_000),
    enabled,
    readOnly: mode !== "live",
    mode,
    version: import.meta.env.VITE_ZEROG_VERSION || "0g-sidecar-v1",
  };
}
