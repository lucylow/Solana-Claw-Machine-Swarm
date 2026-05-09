import bs58 from "bs58";
import type { PublicKey } from "@solana/web3.js";
import {
  CLAW_IDENTITY_API,
  CLAW_IDENTITY_APP_NAME,
  CLAW_IDENTITY_DOMAIN,
  CLAW_IDENTITY_STATEMENT,
} from "./constants";
import { normalizeWalletAddress } from "./pda";
import type {
  SolanaDeploymentSummary,
  SolanaChallenge,
  SolanaDiscoveryFilter,
  SolanaDiscoveryProfile,
  SolanaDiscoveryRow,
  SolanaIdentityBundle,
  SolanaIdentityProfile,
  SolanaPlannerRunSummary,
  SolanaReputationAccount,
  SolanaIdentityReceipt,
  SolanaMemorySummary,
  SolanaSkillSummary,
} from "./identityTypes";

function resolveApiBase() {
  if (CLAW_IDENTITY_API) return CLAW_IDENTITY_API;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

async function requestJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${resolveApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function walletAddressToString(address: PublicKey | string): string {
  return normalizeWalletAddress(address);
}

export async function createChallenge(input: {
  walletAddress: PublicKey | string;
  chainId: number;
  sessionId?: string;
  requestId?: string;
  statement?: string;
}) {
  const walletAddress = walletAddressToString(input.walletAddress);

  return requestJSON<{ ok: true; data: SolanaChallenge }>(
    "/api/solana/identity/challenge",
    {
      method: "POST",
      body: JSON.stringify({
        walletAddress,
        chainId: input.chainId,
        sessionId: input.sessionId,
        requestId: input.requestId,
        domain: CLAW_IDENTITY_DOMAIN,
        uri:
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000",
        appName: CLAW_IDENTITY_APP_NAME,
        statement: input.statement || CLAW_IDENTITY_STATEMENT,
      }),
    },
  );
}

export async function verifyChallenge(input: {
  walletAddress: PublicKey | string;
  challenge: SolanaChallenge;
  signature: Uint8Array;
  sessionId?: string;
  requestId?: string;
}) {
  const walletAddress = walletAddressToString(input.walletAddress);

  return requestJSON<{ ok: true; data: SolanaIdentityBundle }>(
    "/api/solana/identity/verify",
    {
      method: "POST",
      body: JSON.stringify({
        walletAddress,
        challengeId: input.challenge.id,
        challenge: input.challenge,
        message: input.challenge.message,
        signature: bs58.encode(input.signature),
        sessionId: input.sessionId,
        requestId: input.requestId,
      }),
    },
  );
}

export async function loadIdentity(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{ ok: true; data: SolanaIdentityBundle }>(
    `/api/solana/identity/${address}`,
  );
}

export async function loadProfile(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{ ok: true; data: SolanaIdentityProfile }>(
    `/api/solana/identity/${address}/profile`,
  );
}

export async function loadSkills(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{ ok: true; data: SolanaSkillSummary[] }>(
    `/api/solana/identity/${address}/skills`,
  );
}

export async function loadMemories(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{ ok: true; data: SolanaMemorySummary[] }>(
    `/api/solana/identity/${address}/memories`,
  );
}

export async function loadReceipts(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{ ok: true; data: SolanaIdentityReceipt[] }>(
    `/api/solana/identity/${address}/receipts`,
  );
}

export async function loadPlannerRuns(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{ ok: true; data: SolanaPlannerRunSummary[] }>(
    `/api/solana/identity/${address}/planner-runs`,
  );
}

export async function loadDeployments(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{ ok: true; data: SolanaDeploymentSummary[] }>(
    `/api/solana/identity/${address}/deployments`,
  );
}

export async function loadReputation(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{ ok: true; data: SolanaReputationAccount }>(
    `/api/solana/identity/${address}/reputation`,
  );
}

export async function loadDiscoveryProfiles() {
  return requestJSON<{ ok: true; data: SolanaDiscoveryProfile[] }>(
    "/api/solana/reputation/profiles",
  );
}

export async function loadDiscoverySkills(filter?: SolanaDiscoveryFilter) {
  const query = new URLSearchParams();
  if (filter?.query) query.set("q", filter.query);
  if (filter?.category) query.set("category", filter.category);
  if (filter?.tag) query.set("tag", filter.tag);
  if (filter?.language) query.set("language", filter.language);
  if (typeof filter?.minTrustBps === "number")
    query.set("minTrustBps", String(filter.minTrustBps));
  if (typeof filter?.minDiscoveryBps === "number") {
    query.set("minDiscoveryBps", String(filter.minDiscoveryBps));
  }
  if (typeof filter?.minUsage === "number")
    query.set("minUsage", String(filter.minUsage));
  if (filter?.verifiedOnly) query.set("verifiedOnly", "true");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return requestJSON<{ ok: true; data: SolanaDiscoveryRow[] }>(
    `/api/solana/discovery/skills${suffix}`,
  );
}

export async function loadDiscoveryWallet(walletAddress: PublicKey | string) {
  const address = walletAddressToString(walletAddress);
  return requestJSON<{
    ok: true;
    data: {
      profile: SolanaIdentityProfile;
      reputation: SolanaReputationAccount;
      skills: SolanaDiscoveryRow[];
      memories: SolanaMemorySummary[];
    };
  }>(`/api/solana/discovery/wallet/${address}`);
}
