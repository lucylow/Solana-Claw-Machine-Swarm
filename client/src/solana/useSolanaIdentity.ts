import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import {
  createChallenge,
  loadDiscoveryProfiles,
  loadDiscoverySkills,
  loadDeployments,
  loadIdentity,
  loadMemories,
  loadPlannerRuns,
  loadReputation,
  loadReceipts,
  loadSkills,
  verifyChallenge,
} from "./identityClient";
import { CLAW_IDENTITY_SESSION_KEY, SOLANA_CHAIN_ID } from "./constants";
import type {
  SolanaChallenge,
  SolanaDiscoveryProfile,
  SolanaDiscoveryRow,
  SolanaIdentityBundle,
  SolanaIdentityProfile,
  SolanaIdentityReceipt,
  SolanaPlannerRunSummary,
  SolanaReputationAccount,
  SolanaDeploymentSummary,
  SolanaMemorySummary,
  SolanaSkillSummary,
  WalletIdentityStatus,
} from "./identityTypes";

type StoredSession = {
  walletAddress: string;
  sessionId: string;
  verifiedAt: number;
  profileHash: string | null;
};

function readSession(): StoredSession | null {
  try {
    return JSON.parse(
      localStorage.getItem(CLAW_IDENTITY_SESSION_KEY) || "null",
    );
  } catch {
    return null;
  }
}

function writeSession(value: StoredSession | null) {
  try {
    if (!value) {
      localStorage.removeItem(CLAW_IDENTITY_SESSION_KEY);
      return;
    }
    localStorage.setItem(CLAW_IDENTITY_SESSION_KEY, JSON.stringify(value));
  } catch {
    // ignore localStorage failures
  }
}

/**
 * Legacy identity challenge flow for discovery dataset hydration.
 * Wallet authority always comes from the adapter public key — never from cached session rows.
 */
export function useSolanaIdentity() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [status, setStatus] = useState<WalletIdentityStatus>("unverified");
  const [challenge, setChallenge] = useState<SolanaChallenge | null>(null);
  const [profile, setProfile] = useState<SolanaIdentityProfile | null>(null);
  const [receipts, setReceipts] = useState<SolanaIdentityReceipt[]>([]);
  const [skills, setSkills] = useState<SolanaSkillSummary[]>([]);
  const [memories, setMemories] = useState<SolanaMemorySummary[]>([]);
  const [plannerRuns, setPlannerRuns] = useState<SolanaPlannerRunSummary[]>([]);
  const [deployments, setDeployments] = useState<SolanaDeploymentSummary[]>([]);
  const [reputation, setReputation] = useState<SolanaReputationAccount | null>(
    null,
  );
  const [discoveryProfiles, setDiscoveryProfiles] = useState<
    SolanaDiscoveryProfile[]
  >([]);
  const [discoverySkills, setDiscoverySkills] = useState<SolanaDiscoveryRow[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<StoredSession | null>(() =>
    typeof window !== "undefined" ? readSession() : null,
  );
  const [loading, setLoading] = useState(false);

  const adapterWalletAddress = useMemo(
    () => wallet.publicKey?.toBase58() ?? null,
    [wallet.publicKey],
  );

  const cachedWalletHint = useMemo(() => {
    if (adapterWalletAddress) return null;
    const cached = session?.walletAddress;
    if (!cached) return null;
    return cached;
  }, [adapterWalletAddress, session?.walletAddress]);

  const refreshIdentity = useCallback(
    async (address?: PublicKey | string | null) => {
      const target = address ?? wallet.publicKey?.toBase58();
      if (!target) return;

      const addressString =
        typeof target === "string" ? target : target.toBase58();

      const [
        bundle,
        receiptRes,
        skillRes,
        memoryRes,
        plannerRes,
        deploymentRes,
        reputationRes,
        discoveryProfileRes,
        discoverySkillRes,
      ] = await Promise.all([
        loadIdentity(addressString),
        loadReceipts(addressString).catch(() => ({
          ok: true as const,
          data: [],
        })),
        loadSkills(addressString).catch(() => ({
          ok: true as const,
          data: [],
        })),
        loadMemories(addressString).catch(() => ({
          ok: true as const,
          data: [],
        })),
        loadPlannerRuns(addressString).catch(() => ({
          ok: true as const,
          data: [],
        })),
        loadDeployments(addressString).catch(() => ({
          ok: true as const,
          data: [],
        })),
        loadReputation(addressString).catch(() => ({
          ok: true as const,
          data: null as SolanaReputationAccount | null,
        })),
        loadDiscoveryProfiles().catch(() => ({ ok: true as const, data: [] })),
        loadDiscoverySkills().catch(() => ({ ok: true as const, data: [] })),
      ]);

      const data = bundle.data as SolanaIdentityBundle;
      setChallenge(data.challenge);
      setProfile(data.profile);
      setReceipts(receiptRes.data || data.receipts || []);
      setSkills(skillRes.data || data.skills || []);
      setMemories(memoryRes.data || data.memories || []);
      setPlannerRuns(plannerRes.data || data.plannerRuns || []);
      setDeployments(deploymentRes.data || data.deployments || []);
      setReputation(reputationRes.data || data.reputation || null);
      setDiscoveryProfiles(discoveryProfileRes.data || []);
      setDiscoverySkills(discoverySkillRes.data || []);
      setStatus(
        data.profile?.status === "verified" ? "verified" : "unverified",
      );
      return data;
    },
    [wallet.publicKey],
  );

  useEffect(() => {
    const pk = wallet.publicKey?.toBase58();
    if (!pk) return;
    refreshIdentity(pk).catch(() => undefined);
  }, [wallet.publicKey?.toBase58(), refreshIdentity]);

  const connectAndVerify = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signMessage) {
      throw new Error("Connect a wallet that supports message signing.");
    }

    setLoading(true);
    setError(null);
    setStatus("challenge_issued");

    try {
      const challengeRes = await createChallenge({
        walletAddress: wallet.publicKey,
        chainId: SOLANA_CHAIN_ID,
        sessionId: session?.sessionId || undefined,
        requestId: `req_${Date.now()}`,
      });

      const issued = challengeRes.data;
      setChallenge(issued);

      const msgBytes = new TextEncoder().encode(issued.message);
      const signature = await wallet.signMessage(msgBytes);
      setStatus("signed");

      const verifyRes = await verifyChallenge({
        walletAddress: wallet.publicKey,
        challenge: issued,
        signature,
        sessionId: session?.sessionId || undefined,
        requestId: `req_${Date.now()}`,
      });

      const bundle = verifyRes.data;
      setProfile(bundle.profile);
      setReceipts(bundle.receipts);
      setSkills(bundle.skills);
      setMemories(bundle.memories);
      setPlannerRuns(bundle.plannerRuns || []);
      setDeployments(bundle.deployments || []);
      setReputation(bundle.reputation || null);
      loadDiscoveryProfiles()
        .then((res) => setDiscoveryProfiles(res.data))
        .catch(() => undefined);
      loadDiscoverySkills()
        .then((res) => setDiscoverySkills(res.data))
        .catch(() => undefined);
      setStatus("verified");

      const nextSession: StoredSession = {
        walletAddress: wallet.publicKey.toBase58(),
        sessionId: bundle.profile.walletAddress,
        verifiedAt: Date.now(),
        profileHash: bundle.receipts?.[0]?.profileHash || null,
      };
      setSession(nextSession);
      writeSession(nextSession);

      return bundle;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Wallet verification failed";
      setError(message);
      setStatus("error");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.sessionId, wallet]);

  const disconnectIdentity = useCallback(() => {
    setStatus("unverified");
    setChallenge(null);
    setProfile(null);
    setReceipts([]);
    setSkills([]);
    setMemories([]);
    setPlannerRuns([]);
    setDeployments([]);
    setReputation(null);
    setDiscoveryProfiles([]);
    setDiscoverySkills([]);
    setError(null);
    setSession(null);
    writeSession(null);
  }, []);

  return {
    wallet,
    connection,
    /** Adapter-derived wallet — never read from localStorage */
    walletAddress: adapterWalletAddress,
    /** Cached label only when disconnected */
    cachedWalletHint,
    status,
    challenge,
    profile,
    receipts,
    skills,
    memories,
    plannerRuns,
    deployments,
    reputation,
    discoveryProfiles,
    discoverySkills,
    error,
    loading,
    session,
    connectAndVerify,
    refreshIdentity,
    disconnectIdentity,
  };
}
