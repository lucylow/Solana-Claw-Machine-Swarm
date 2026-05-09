import { CLAW_PRODUCT_NAME, SOLANA_SESSION_STORAGE_KEY } from "./config";
import type { SolanaCluster } from "./types";
import type { SolanaSessionNonce, SolanaSessionStatus } from "./types";

/** Human-readable preview matching server `SolanaSessionService.issueNonce` format */
export function buildSessionSignPreview(
  wallet: string,
  cluster: SolanaCluster,
  nonce: string,
  isoTimestamp: string,
) {
  return [
    `${CLAW_PRODUCT_NAME.toUpperCase()} Solana session verification`,
    `Wallet: ${wallet}`,
    `Cluster: ${cluster}`,
    "Purpose: authorize skill publishing, task execution, memory writes, and receipt anchoring",
    `Nonce: ${nonce}`,
    `Timestamp: ${isoTimestamp}`,
  ].join("\n");
}

type SessionResponse = {
  ok: boolean;
  data?: SolanaSessionStatus;
  error?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = (await response.json()) as {
    ok: boolean;
    data?: T;
    error?: string;
  };
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

export async function requestSolanaSessionNonce(
  walletAddress: string,
  cluster: SolanaCluster,
) {
  return request<SolanaSessionNonce>("/api/solana/session/nonce", {
    method: "POST",
    body: JSON.stringify({ walletAddress, cluster }),
  });
}

export async function verifySolanaSession(input: {
  walletAddress: string;
  nonceId: string;
  signature: string;
  cluster: SolanaCluster;
  message: string;
}) {
  return request<{ token: string; profile: SolanaSessionStatus["profile"] }>(
    "/api/solana/session/verify",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function fetchSolanaSession(token: string) {
  const response = await fetch("/api/solana/session", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const body = (await response.json()) as SessionResponse;
  if (!response.ok || !body.ok || !body.data)
    throw new Error(body.error || "session_fetch_failed");
  return body.data;
}

export async function refreshSolanaSession(token: string) {
  return request<{ token: string; profile: SolanaSessionStatus["profile"] }>(
    "/api/solana/session/refresh",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    },
  );
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
