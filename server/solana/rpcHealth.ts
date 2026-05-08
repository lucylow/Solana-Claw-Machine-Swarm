import { Connection } from "@solana/web3.js";
import type { SolanaRpcProbe } from "@shared/solana/types";

/**
 * Lightweight RPC reachability check (slot + latency). Uses the same RPC URL the server is configured for.
 */
export async function probeSolanaRpc(rpcUrl: string, timeoutMs = 4500): Promise<SolanaRpcProbe> {
  const started = Date.now();
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    disableRetryOnRateLimit: true,
  });

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("rpc_timeout")), timeoutMs);
  });

  try {
    const slot = await Promise.race([connection.getSlot("confirmed"), timeout]);
    return {
      ok: true,
      slot,
      latencyMs: Date.now() - started,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "rpc_probe_failed";
    return {
      ok: false,
      error: message,
      latencyMs: Date.now() - started,
    };
  }
}
