import type {
  SolanaBridgeBuildRequest,
  SolanaBridgeHistoryItem,
  SolanaMirrorAccount,
} from "@shared/solanaBridge";

type ApiResult<T> = { ok: boolean; data?: T; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json()) as ApiResult<T>;
  if (!res.ok || !body.ok || body.data === undefined) {
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return body.data;
}

export function getSolanaSession(walletAddress: string) {
  return request<{
    walletAddress: string;
    cluster: string;
    programId: string;
    isActive: boolean;
    isVerified: boolean;
    hasSignature: boolean;
    expiresAt?: string;
    sessionId?: number;
    userId?: number;
  }>(`/api/solana/session?walletAddress=${encodeURIComponent(walletAddress)}`);
}

export function getSolanaNetwork() {
  return request<{
    cluster: string;
    rpcUrl: string;
    programId: string;
    relayerWallet?: string;
    latestBlockhash: string;
    lastValidBlockHeight: number;
    epoch: number;
    slot: number;
    commitment: string;
  }>("/api/solana/network");
}

export function buildSolanaInstruction(input: SolanaBridgeBuildRequest) {
  return request("/api/solana/transaction/build", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function sendSolanaInstruction(input: SolanaBridgeBuildRequest) {
  return request("/api/solana/transaction/send", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmSolanaInstruction(input: {
  requestId?: string;
  txSignature: string;
  accountAddress?: string;
}) {
  return request("/api/solana/transaction/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listMirrorAccounts(query?: { wallet?: string; kind?: string; status?: string }) {
  const params = new URLSearchParams();
  if (query?.wallet) params.set("wallet", query.wallet);
  if (query?.kind) params.set("kind", query.kind);
  if (query?.status) params.set("status", query.status);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request<SolanaMirrorAccount[]>(`/api/solana/accounts${suffix}`);
}

export function getMirrorAccount(address: string) {
  return request<SolanaMirrorAccount>(`/api/solana/accounts/${address}`);
}

export function listSolanaHistory(query?: {
  wallet?: string;
  account?: string;
  status?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (query?.wallet) params.set("wallet", query.wallet);
  if (query?.account) params.set("account", query.account);
  if (query?.status) params.set("status", query.status);
  if (query?.limit != null) params.set("limit", String(query.limit));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return request<SolanaBridgeHistoryItem[]>(`/api/solana/history${suffix}`);
}
