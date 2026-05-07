import type { CreateNftCollectionRequest, CreateNftRequest, NftCollectionState, NftMintRecord } from "@shared/nft/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = (await res.json()) as { ok: boolean; data?: T; error?: string };
  if (!res.ok || !json.ok || json.data === undefined) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return json.data;
}

export const nftApi = {
  getCollection: () => request<NftCollectionState | null>("/api/nft/collection"),
  createCollection: (payload: CreateNftCollectionRequest) =>
    request<NftCollectionState>("/api/nft/collection/create", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  mint: (payload: CreateNftRequest) =>
    request<NftMintRecord>("/api/nft/mint", { method: "POST", body: JSON.stringify(payload) }),
  getMints: () => request<NftMintRecord[]>("/api/nft/mints"),
  getMintsByOwner: (owner: string) => request<NftMintRecord[]>(`/api/nft/mints/${encodeURIComponent(owner)}`),
  freeze: () => request<NftCollectionState>("/api/nft/freeze", { method: "POST" }),
};
