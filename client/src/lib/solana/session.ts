import { SOLANA_SESSION_STORAGE_KEY } from "./config";
import type { SolanaSessionNonce, SolanaSessionStatus } from "./types";

type SessionResponse = { ok: boolean; data?: SolanaSessionStatus; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = (await response.json()) as { ok: boolean; data?: T; error?: string };
  if (!response.ok || !body.ok || body.data === undefined) {
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return body.data;
}

export function loadStoredSessionToken() {
  try {
    return localStorage.getItem(SOLANA_SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeSessionToken(token: string | null) {
  try {
    if (!token) {
      localStorage.removeItem(SOLANA_SESSION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SOLANA_SESSION_STORAGE_KEY, token);
  } catch {
    // best-effort cache only
  }
}

export async function requestSolanaSessionNonce(walletAddress: string) {
  return request<SolanaSessionNonce>("/api/solana/session/nonce", {
    method: "POST",
    body: JSON.stringify({ walletAddress }),
  });
}

export async function verifySolanaSession(input: {
  walletAddress: string;
  nonceId: string;
  signature: string;
}) {
  return request<{ token: string; profile: SolanaSessionStatus["profile"] }>("/api/solana/session/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchSolanaSession(token: string) {
  const response = await fetch("/api/solana/session", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const body = (await response.json()) as SessionResponse;
  if (!response.ok || !body.ok || !body.data) throw new Error(body.error || "session_fetch_failed");
  return body.data;
}

export async function refreshSolanaSession(token: string) {
  return request<{ token: string; profile: SolanaSessionStatus["profile"] }>("/api/solana/session/refresh", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token }),
  });
}

export async function logoutSolanaSession(token: string) {
  return request<{ ok: true }>("/api/solana/session/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token }),
  });
}
