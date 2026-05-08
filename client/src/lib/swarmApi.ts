import type { SkillIdentity, SwarmExecuteResult } from "@shared/domainModel";
import { normalizeError } from "@shared/normalizeError";
import { SwarmApiError, throwIfApiFailed } from "@/errors/SwarmApiError";

export { STORY_LOOP_LABELS } from "@shared/copy";

type ApiOk<T> = { ok: true; data: T; degraded?: boolean };

async function readBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    throw new SwarmApiError(
      normalizeError(`Invalid JSON response (HTTP ${res.status})`, {
        source: "swarm_api",
        statusCode: res.status,
        fallback: { code: "UNEXPECTED_ROUTE_ERROR" },
      })
    );
  }
}

async function parseOk<T>(res: Response): Promise<T> {
  const body = await readBody(res);
  throwIfApiFailed(body, res);
  if (!body || typeof body !== "object" || (body as ApiOk<T>).ok !== true) {
    throw new SwarmApiError(
      normalizeError("Malformed success envelope from API.", {
        source: "swarm_api",
        statusCode: res.status,
        fallback: { code: "UNEXPECTED_ROUTE_ERROR" },
      })
    );
  }
  return (body as ApiOk<T>).data;
}

export async function fetchSolanaStatus() {
  const res = await fetch("/api/solana/status");
  return parseOk<{
    cluster: string;
    programId: string;
    rpcUrl: string;
    relayerConfigured: boolean;
    slot: number;
  }>(res);
}

export async function fetchSession(walletAddress: string) {
  const res = await fetch(`/api/session?walletAddress=${encodeURIComponent(walletAddress)}`);
  return parseOk<{
    walletAddress: string;
    cluster: string;
    sessionActive: boolean;
    sessionVerified: boolean;
    canAnchor: boolean;
    network: { rpcUrl: string; slot: number; relayerWallet: string | null };
  }>(res);
}

export async function fetchSkillsList(params?: { q?: string; sort?: string }) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.sort) sp.set("sort", params.sort);
  const res = await fetch(`/api/skills?${sp.toString()}`);
  return parseOk<{ skills: SkillIdentity[]; total: number }>(res);
}

export async function selectSkill(skillId: string, walletAddress: string) {
  const res = await fetch(`/api/skills/${encodeURIComponent(skillId)}/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  return parseOk<{ walletAddress: string; skillId: string; selectedAt: string }>(res);
}

export async function executeSwarm(input: {
  walletAddress: string;
  goal: string;
  skillId: string;
  skillName?: string;
  agentId?: string;
}): Promise<SwarmExecuteResult> {
  const res = await fetch("/api/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress: input.walletAddress,
      goal: input.goal,
      skillId: input.skillId,
      skillName: input.skillName,
      agentId: input.agentId ?? "agent_swarm",
    }),
  });
  return parseOk<SwarmExecuteResult>(res);
}

export async function fetchHistory(wallet?: string, limit = 30) {
  const sp = new URLSearchParams();
  if (wallet) sp.set("wallet", wallet);
  sp.set("limit", String(limit));
  const res = await fetch(`/api/history?${sp.toString()}`);
  return parseOk<{ executions: unknown[]; bridgeHistory: unknown[] }>(res);
}
