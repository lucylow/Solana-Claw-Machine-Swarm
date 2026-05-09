import crypto from "crypto";
import { ZeroGOrchestratorStore } from "./artifacts";
import { getZeroGConfig } from "./config";
import type {
  ZeroGBridgeAdapter,
  ZeroGBridgeState,
  ZeroGHealthStatus,
} from "./types";

function now() {
  return new Date().toISOString();
}

function hash(seed: string) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

export class ZeroGBridgeService implements ZeroGBridgeAdapter {
  private latest: ZeroGBridgeState;

  constructor(private readonly store: ZeroGOrchestratorStore) {
    const config = getZeroGConfig();
    this.latest = {
      enabled: true,
      sourceChain: "Solana",
      destinationChain: "0G",
      tokenSymbol: "0G",
      status: "idle",
      provider: config.bridgeProvider,
      notes:
        "Bridge-aware stub: official flows use XSwap toward 0G Chain. No live bridge API is implied unless mode is live. Treat exchange token labels as untrusted metadata.",
      mode: "mock",
      version: "bridge-v1",
      lastUpdatedAt: now(),
    };
  }

  async getStatus(): Promise<ZeroGBridgeState> {
    return this.latest;
  }

  async simulate(input: {
    sourceChain: string;
    destinationChain: string;
    tokenSymbol: string;
    amount?: string;
  }): Promise<ZeroGBridgeState> {
    const config = getZeroGConfig();
    const txHash = `0x${hash(`${input.sourceChain}:${input.destinationChain}:${Date.now()}`).slice(0, 64)}`;
    const status: ZeroGBridgeState = {
      enabled: config.enabled,
      sourceChain: input.sourceChain,
      destinationChain: input.destinationChain,
      tokenSymbol: input.tokenSymbol,
      status: config.enabled ? "confirmed" : "degraded",
      txHash,
      explorerUrl: `${config.explorerUrl}/bridge/${txHash}`,
      provider: config.bridgeProvider,
      notes: config.enabled
        ? `Simulated transfer toward 0G Chain (chainId ${config.ogChainId})${input.amount ? `; amount=${input.amount}` : ""}. Not a claim about real token custody.`
        : "Bridge simulated while sidecar is degraded.",
      mode: config.mode === "live" ? "live" : "mock",
      version: "bridge-v1",
      lastUpdatedAt: now(),
    };
    this.latest = status;
    this.store.pushBridgeState(status);
    return status;
  }

  async listHistory(): Promise<ZeroGBridgeState[]> {
    return this.store.listBridgeHistory();
  }

  async getHealth(): Promise<ZeroGHealthStatus> {
    const config = getZeroGConfig();
    return {
      ok: config.enabled,
      reason: config.enabled ? undefined : "zerog_bridge_disabled",
      latencyMs: 8,
      mode: config.mode,
    };
  }
}
