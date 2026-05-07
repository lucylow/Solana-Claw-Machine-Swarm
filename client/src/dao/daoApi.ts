import type {
  DaoConfig,
  DaoDiscoveryRow,
  DaoMember,
  DaoProposal,
} from "./daoTypes";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = (await res.json()) as { ok: boolean; data?: T; error?: string };
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return json.data as T;
}

export const daoApi = {
  getConfig: () => request<DaoConfig | null>("/api/dao/config"),
  getMembers: () => request<DaoMember[]>("/api/dao/members"),
  getMember: (wallet: string) => request<DaoMember>(`/api/dao/members/${encodeURIComponent(wallet)}`),
  registerMember: (payload: Record<string, unknown>) =>
    request<DaoMember>("/api/dao/members/register", { method: "POST", body: JSON.stringify(payload) }),
  getProposals: () => request<DaoProposal[]>("/api/dao/proposals"),
  getProposal: (proposalId: number) => request<DaoProposal>(`/api/dao/proposals/${proposalId}`),
  createProposal: (payload: Record<string, unknown>) =>
    request<DaoProposal>("/api/dao/proposals", { method: "POST", body: JSON.stringify(payload) }),
  vote: (proposalId: number, payload: Record<string, unknown>) =>
    request<unknown>(`/api/dao/proposals/${proposalId}/vote`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  finalize: (proposalId: number) =>
    request<unknown>(`/api/dao/proposals/${proposalId}/finalize`, { method: "POST" }),
  execute: (proposalId: number) =>
    request<DaoProposal>(`/api/dao/proposals/${proposalId}/execute`, { method: "POST" }),
  getDiscovery: () => request<DaoDiscoveryRow[]>("/api/dao/discovery"),
};
