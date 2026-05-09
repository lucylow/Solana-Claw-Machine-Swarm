import type { DaoCommandCenterPayload } from "@shared/dao/types";
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
  getCommandCenter: (opts?: { demo?: boolean; walletAddress?: string }) => {
    const q = new URLSearchParams();
    if (opts?.demo) q.set("demo", "1");
    if (opts?.walletAddress) q.set("walletAddress", opts.walletAddress);
    const suffix = q.toString() ? `?${q}` : "";
    return request<DaoCommandCenterPayload>(`/api/dao/command-center${suffix}`);
  },

  getConfig: () => request<DaoConfig | null>("/api/dao/config"),
  getMembers: () => request<DaoMember[]>("/api/dao/members"),
  getMember: (wallet: string) =>
    request<DaoMember>(`/api/dao/members/${encodeURIComponent(wallet)}`),
  registerMember: (payload: Record<string, unknown>) =>
    request<DaoMember>("/api/dao/members/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getDelegations: () =>
    request<import("@shared/dao/types").DaoDelegation[]>(
      "/api/dao/delegations",
    ),
  delegate: (payload: {
    fromWallet: string;
    toWallet: string;
    reason?: string;
  }) =>
    request<import("@shared/dao/types").DaoDelegation | undefined>(
      "/api/dao/delegations",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  revokeDelegation: (fromWallet: string) =>
    request<{ revoked: boolean }>("/api/dao/delegations/revoke", {
      method: "POST",
      body: JSON.stringify({ fromWallet }),
    }),

  getVotes: (proposalId?: number) => {
    const q = proposalId !== undefined ? `?proposalId=${proposalId}` : "";
    return request<import("@shared/dao/types").DaoVote[]>(`/api/dao/votes${q}`);
  },

  getProposals: () => request<DaoProposal[]>("/api/dao/proposals"),
  getProposal: (proposalId: number) =>
    request<DaoProposal>(`/api/dao/proposals/${proposalId}`),
  createProposal: (payload: Record<string, unknown>) =>
    request<DaoProposal>("/api/dao/proposals", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  vote: (proposalId: number, payload: Record<string, unknown>) =>
    request<unknown>(`/api/dao/proposals/${proposalId}/vote`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  finalize: (proposalId: number) =>
    request<unknown>(`/api/dao/proposals/${proposalId}/finalize`, {
      method: "POST",
    }),
  execute: (proposalId: number) =>
    request<DaoProposal>(`/api/dao/proposals/${proposalId}/execute`, {
      method: "POST",
    }),
  getDiscovery: () => request<DaoDiscoveryRow[]>("/api/dao/discovery"),
};
