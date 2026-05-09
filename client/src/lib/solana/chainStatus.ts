import type { SolanaBackendStatus } from "@shared/solana/types";

export type { SolanaBackendStatus };

/** Server-orchestrated cluster + session counters + RPC probe */
export async function fetchSolanaBackendStatus(): Promise<SolanaBackendStatus | null> {
  try {
    const response = await fetch("/api/solana/status");
    const body = (await response.json()) as {
      ok?: boolean;
      data?: SolanaBackendStatus;
      error?: string;
    };
    if (!response.ok || !body.ok || !body.data) return null;
    return body.data;
  } catch {
    return null;
  }
}
