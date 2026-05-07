import type { SkillIdentity, SwarmExecuteResult } from "@shared/domainModel";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiOk<T> | ApiErr;
  if (!body.ok) throw new Error("error" in body ? body.error : "api_error");
  return body.data;
}

export const STORY_LOOP_LABELS = [
  "Connect wallet",
  "Choose skill",
  "Run task",
  "Reflection",
  "Memory",
  "Receipt anchored",
] as const;

export async function fetchSolanaStatus() {
  const res = await fetch("/api/solana/status");
  return parse<{
    cluster: string;
    programId: string;
    rpcUrl: string;
    relayerConfigured: boolean;
    slot: number;
  }>(res);
}

export async function fetchSession(walletAddress: string) {
  const res = await fetch(`/api/session?walletAddress=${encodeURIComponent(walletAddress)}`);
  return parse<{
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
  return parse<{ skills: SkillIdentity[]; total: number }>(res);
}

export async function selectSkill(skillId: string, walletAddress: string) {
  const res = await fetch(`/api/skills/${encodeURIComponent(skillId)}/select`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });
  return parse<{ walletAddress: string; skillId: string; selectedAt: string }>(res);
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
  const body = (await res.json()) as { ok: boolean; data?: SwarmExecuteResult; error?: string };
  if (!body.data) throw new Error(body.error || "execute_failed");
  return body.data;
}

export async function fetchHistory(wallet?: string, limit = 30) {
  const sp = new URLSearchParams();
  if (wallet) sp.set("wallet", wallet);
  sp.set("limit", String(limit));
  const res = await fetch(`/api/history?${sp.toString()}`);
  return parse<{ executions: unknown[]; bridgeHistory: unknown[] }>(res);
}
