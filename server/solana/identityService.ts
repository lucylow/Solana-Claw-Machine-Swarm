import bs58 from "bs58";
import crypto from "crypto";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { createChallengeRecord, isChallengeExpired } from "./challengeService";
import { IdentityStore } from "./identityStore";
import {
  deriveConfigPda,
  deriveProfilePda,
  deriveSkillPda,
  deriveSkillVersionPda,
  normalizeWalletAddress,
  validateSkillSlug,
  validateSkillVersion,
} from "./pda";
import type {
  DiscoveryProfileRecord,
  DiscoverySkillRowRecord,
  DeploymentRecord,
  IdentityBundleRecord,
  IdentityChallengeRecord,
  IdentityMemoryRecord,
  IdentityProfileRecord,
  IdentityReceiptRecord,
  IdentitySkillRecord,
  PlannerOutcome,
  PlannerRunRecord,
  ReputationAccountRecord,
  ReputationEventKind,
} from "./identityTypes";

type OnchainAnchorClient = {
  anchorReceipt(input: {
    walletAddress: string;
    receiptId: string;
    profileHash: string;
    challengeHash: string;
    signatureHash: string;
    receiptHash: string;
    chainId: number;
    labels: string[];
    summary: string;
  }): Promise<{ txHash: string; receiptPda: string }>;
};

export interface IdentityServiceOptions {
  domain: string;
  uri: string;
  chainId: number;
  statement: string;
  programId?: string;
  onchain?: OnchainAnchorClient;
}

const TITLE_MAX = 96;
const KIND_MAX = 40;
const HASH_MAX = 128;
const SUMMARY_MAX = 256;
const TAGS_MAX = 20;

function ensureLen(value: string | undefined, max: number, field: string) {
  if (!value) return;
  if (value.length > max) {
    throw new Error(`${field} exceeds max length ${max}`);
  }
}

function normalizedBps(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(10_000, Math.floor(value)));
}

function bpsFromRatio(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.min(10_000, Math.floor((numerator * 10_000) / denominator));
}

function trustScoreFromSignal(input: {
  successCount: number;
  failureCount: number;
  verifiedAuthorshipCount: number;
  deploymentCount: number;
}) {
  const total = input.successCount + input.failureCount;
  const successBps = bpsFromRatio(input.successCount, Math.max(total, 1));
  const authComponent = Math.min(25, input.verifiedAuthorshipCount) * 120;
  const deployComponent = Math.min(25, input.deploymentCount) * 80;
  return Math.min(10_000, Math.floor(successBps / 2 + authComponent + deployComponent));
}

function discoveryScoreFromSignal(input: {
  trustScoreBps: number;
  usageCount: number;
  successCount: number;
  versionCount: number;
  publishedSkillCount: number;
  verifiedAuthorshipCount: number;
  avgReflectionQualityBps: number;
  signalCount: number;
}) {
  const usageComponent = Math.min(1000, input.usageCount) * 3;
  const successRatio = bpsFromRatio(input.successCount, Math.max(input.usageCount, 1));
  const versionComponent = Math.min(20, input.versionCount) * 40;
  const publishComponent = Math.min(50, input.publishedSkillCount) * 50;
  const authorshipComponent = Math.min(50, input.verifiedAuthorshipCount) * 30;
  const reflectionComponent = Math.floor(input.avgReflectionQualityBps / 2);
  const signalComponent = Math.min(400, input.signalCount) * 2;
  return Math.min(
    10_000,
    Math.floor(
      input.trustScoreBps / 2 +
        usageComponent +
        successRatio / 2 +
        versionComponent +
        publishComponent +
        authorshipComponent +
        reflectionComponent +
        signalComponent
    )
  );
}

export class SolanaIdentityService {
  constructor(
    private readonly store: IdentityStore,
    private readonly opts: IdentityServiceOptions
  ) {}

  async createChallenge(walletAddress: string, requestId: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const challenge = createChallengeRecord({
      walletAddress: normalizedWallet,
      domain: this.opts.domain,
      uri: this.opts.uri,
      statement: this.opts.statement,
      chainId: this.opts.chainId,
      requestId,
    });
    challenge.accounts = {
      programId: this.opts.programId,
      configPda: deriveConfigPda(this.opts.programId),
      profilePda: deriveProfilePda(normalizedWallet, this.opts.programId),
    };

    await this.store.saveChallenge(challenge);
    return challenge;
  }

  async verifySignature(input: {
    walletAddress: string;
    challengeId: string;
    signatureBase58: string;
    message: string;
  }) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    const challenge = await this.store.getChallenge(input.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.walletAddress !== normalizedWallet) throw new Error("Challenge wallet mismatch");
    if (isChallengeExpired(challenge)) throw new Error("Challenge expired");
    if (challenge.chainId !== this.opts.chainId) throw new Error("Unsupported chain id");
    if (challenge.message !== input.message) throw new Error("Message mismatch");

    const messageBytes = new TextEncoder().encode(input.message);
    const publicKey = new PublicKey(normalizedWallet);
    const signature = bs58.decode(input.signatureBase58);
    const ok = nacl.sign.detached.verify(messageBytes, signature, publicKey.toBytes());
    if (!ok) throw new Error("Signature verification failed");

    challenge.signature = input.signatureBase58;
    challenge.status = "verified";
    challenge.verifiedAt = Date.now();
    challenge.accounts = {
      ...challenge.accounts,
      programId: this.opts.programId,
      configPda: deriveConfigPda(this.opts.programId),
      profilePda: deriveProfilePda(normalizedWallet, this.opts.programId),
    };
    await this.store.saveChallenge(challenge);

    await this.publishSeedData(normalizedWallet);
    let profile = await this.upsertProfile(normalizedWallet);

    await this.createReceipt({
      walletAddress: normalizedWallet,
      challenge,
      signatureBase58: input.signatureBase58,
      profile,
    });

    profile = await this.upsertProfile(normalizedWallet);
    const bundle = await this.bundle(normalizedWallet, challenge.id);

    return {
      challenge,
      profile,
      receipts: bundle?.receipts || [],
      skills: bundle?.skills || [],
      memories: bundle?.memories || [],
      plannerRuns: bundle?.plannerRuns || [],
      deployments: bundle?.deployments || [],
      reputation: bundle?.reputation,
    };
  }

  async getIdentity(walletAddress: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const bundle = await this.bundle(normalizedWallet);
    if (!bundle) throw new Error("Identity not found");
    return bundle;
  }

  async getProfile(walletAddress: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const profile = await this.store.getProfile(normalizedWallet);
    if (!profile) throw new Error("Profile not found");
    return profile;
  }

  async getSkills(walletAddress: string) {
    return this.store.listSkills(normalizeWalletAddress(walletAddress));
  }

  async getMemories(walletAddress: string) {
    return this.store.listMemories(normalizeWalletAddress(walletAddress));
  }

  async getReceipts(walletAddress: string) {
    return this.store.listReceipts(normalizeWalletAddress(walletAddress));
  }

  async getPlannerRuns(walletAddress: string) {
    return this.store.listPlannerRuns(normalizeWalletAddress(walletAddress));
  }

  async getDeployments(walletAddress: string) {
    return this.store.listDeployments(normalizeWalletAddress(walletAddress));
  }

  async getReputation(walletAddress: string) {
    return this.store.getReputation(normalizeWalletAddress(walletAddress));
  }

  async listDiscoveryProfiles() {
    const profiles = await this.store.listProfiles();
    const rows = await Promise.all(
      profiles.map(async profile => {
        const rep = await this.store.getReputation(profile.walletAddress);
        if (rep) {
          return {
            walletAddress: rep.walletAddress,
            profileAddress: profile.accounts?.profilePda || "",
            usageCount: rep.usageCount,
            successCount: rep.successCount,
            failureCount: rep.failureCount,
            memoryAnchorCount: rep.memoryAnchorCount,
            plannerRunCount: rep.plannerRunCount,
            deploymentCount: rep.deploymentCount,
            publishedSkillCount: rep.publishedSkillCount,
            publishedVersionCount: rep.publishedVersionCount,
            verifiedAuthorshipCount: rep.verifiedAuthorshipCount,
            trustScoreBps: rep.trustScoreBps,
            discoveryScoreBps: rep.discoveryScoreBps,
            avgReflectionQualityBps: rep.avgReflectionQualityBps,
            totalRewardPoints: rep.totalRewardPoints,
            lastEventKind: rep.lastEventKind,
            lastEventRef: rep.lastEventRef,
            lastEventAt: rep.lastEventAt,
          } satisfies DiscoveryProfileRecord;
        }

        const hydrated = await this.buildWalletReputation(profile.walletAddress);
        return {
          walletAddress: hydrated.walletAddress,
          profileAddress: profile.accounts?.profilePda || "",
          usageCount: hydrated.usageCount,
          successCount: hydrated.successCount,
          failureCount: hydrated.failureCount,
          memoryAnchorCount: hydrated.memoryAnchorCount,
          plannerRunCount: hydrated.plannerRunCount,
          deploymentCount: hydrated.deploymentCount,
          publishedSkillCount: hydrated.publishedSkillCount,
          publishedVersionCount: hydrated.publishedVersionCount,
          verifiedAuthorshipCount: hydrated.verifiedAuthorshipCount,
          trustScoreBps: hydrated.trustScoreBps,
          discoveryScoreBps: hydrated.discoveryScoreBps,
          avgReflectionQualityBps: hydrated.avgReflectionQualityBps,
          totalRewardPoints: hydrated.totalRewardPoints,
          lastEventKind: hydrated.lastEventKind,
          lastEventRef: hydrated.lastEventRef,
          lastEventAt: hydrated.lastEventAt,
        } satisfies DiscoveryProfileRecord;
      })
    );

    return rows.sort((a, b) => b.discoveryScoreBps - a.discoveryScoreBps);
  }

  async listDiscoverySkills(filter?: {
    query?: string;
    tag?: string;
    category?: string;
    language?: string;
    minTrustBps?: number;
    minDiscoveryBps?: number;
    minUsage?: number;
    verifiedOnly?: boolean;
  }) {
    const skills = await this.store.listAllSkills();
    const rows: DiscoverySkillRowRecord[] = await Promise.all(
      skills.map(async skill => {
        const profile = await this.store.getProfile(skill.walletAddress);
        const rep = await this.buildWalletReputation(skill.walletAddress);
        const usageCount = skill.usageCount || 0;
        const successCount = skill.successCount ?? Math.floor(usageCount * 0.82);
        const failureCount = skill.failureCount ?? Math.max(0, usageCount - successCount);
        const avgReflectionQualityBps = skill.avgReflectionQualityBps ?? rep.avgReflectionQualityBps;
        const versionCount = Math.max(
          1,
          skill.versionCount || skill.publishedVersionCount || skill.versions?.length || 1
        );
        const trustScoreBps = trustScoreFromSignal({
          successCount,
          failureCount,
          verifiedAuthorshipCount: skill.verifiedAuthorshipCount ?? rep.verifiedAuthorshipCount,
          deploymentCount: rep.deploymentCount,
        });
        const signalCount =
          usageCount + versionCount + Math.max(0, skill.verifiedAuthorshipCount ?? rep.verifiedAuthorshipCount);
        const discoveryScoreBps = discoveryScoreFromSignal({
          trustScoreBps,
          usageCount,
          successCount,
          versionCount,
          publishedSkillCount: rep.publishedSkillCount,
          verifiedAuthorshipCount: skill.verifiedAuthorshipCount ?? rep.verifiedAuthorshipCount,
          avgReflectionQualityBps,
          signalCount,
        });

        return {
          skillAddress: skill.id,
          owner: skill.walletAddress,
          profile: profile?.accounts?.profilePda || "",
          slug: skill.slug,
          name: skill.name,
          category: skill.category || "general",
          language: skill.language || "ts",
          tags: skill.tags || [],
          contentHash: skill.accounts?.skillPda,
          versionCount,
          latestVersionIndex: Math.max(0, versionCount - 1),
          usageCount,
          successCount,
          failureCount,
          avgReflectionQualityBps,
          trustScoreBps,
          discoveryScoreBps,
          signalCount,
          lastRank: 0,
          updatedAt: skill.updatedAt,
        };
      })
    );

    let filtered = rows;
    const query = filter?.query?.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(row =>
        [row.slug, row.name, row.category, row.language, ...row.tags].join(" ").toLowerCase().includes(query)
      );
    }
    if (filter?.category) filtered = filtered.filter(row => row.category === filter.category);
    if (filter?.language) filtered = filtered.filter(row => row.language === filter.language);
    if (filter?.tag) filtered = filtered.filter(row => row.tags.includes(filter.tag!));
    if (typeof filter?.minTrustBps === "number") {
      filtered = filtered.filter(row => row.trustScoreBps >= filter.minTrustBps!);
    }
    if (typeof filter?.minDiscoveryBps === "number") {
      filtered = filtered.filter(row => row.discoveryScoreBps >= filter.minDiscoveryBps!);
    }
    if (typeof filter?.minUsage === "number") {
      filtered = filtered.filter(row => row.usageCount >= filter.minUsage!);
    }
    if (filter?.verifiedOnly) {
      filtered = filtered.filter(row => row.trustScoreBps >= 5000);
    }

    return filtered
      .sort((a, b) => {
        if (b.discoveryScoreBps !== a.discoveryScoreBps) return b.discoveryScoreBps - a.discoveryScoreBps;
        if (b.trustScoreBps !== a.trustScoreBps) return b.trustScoreBps - a.trustScoreBps;
        if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
        return b.updatedAt - a.updatedAt;
      })
      .map((row, idx) => ({ ...row, lastRank: idx + 1 }));
  }

  async getDiscoveryByWallet(walletAddress: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const profile = await this.getProfile(normalizedWallet);
    const reputation = await this.buildWalletReputation(normalizedWallet);
    const skills = await this.listDiscoverySkills();
    return {
      profile,
      reputation,
      skills: skills.filter(row => row.owner === normalizedWallet),
      memories: await this.store.listMemories(normalizedWallet),
    };
  }

  async recordSkillUse(walletAddress: string, skillName: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    await this.store.bumpUsage(normalizedWallet, skillName);
    await this.recordReputationEvent({
      walletAddress: normalizedWallet,
      eventKind: "other",
      eventRef: skillName,
      weight: 1,
    });
    return this.store.listSkills(normalizedWallet);
  }

  async recordMemory(input: IdentityMemoryRecord) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    return this.recordMemoryAnchor({
      walletAddress: normalizedWallet,
      sourceTurnId: input.sourceTurnId || input.id,
      taskType: "reflection",
      kind: typeof input.kind === "string" ? input.kind : "reflection",
      result: "unknown",
      sourceHash: input.sourceHash || "",
      reflectionHash:
        input.reflectionHash ||
        crypto
          .createHash("sha256")
          .update(`${input.title}:${input.summary}`)
          .digest("hex"),
      lessonHash:
        input.lessonHash ||
        crypto.createHash("sha256").update(input.correctiveAdvice || "").digest("hex"),
      summary: input.summary,
      rootCause: input.rootCause || "",
      correctiveAdvice: input.correctiveAdvice || "",
      nextBestAction: input.nextBestAction || "",
      confidenceBps: input.confidenceBps,
      severityBps: input.severityBps,
      tags: input.tags,
      relatedMemoryIds: input.relatedMemoryIds || [],
      pinned: Boolean(input.pinned),
    });
  }

  async recordMemoryAnchor(input: {
    walletAddress: string;
    sourceTurnId: string;
    taskType: string;
    kind: string;
    result: string;
    sourceHash: string;
    reflectionHash: string;
    lessonHash: string;
    summary: string;
    rootCause: string;
    correctiveAdvice: string;
    nextBestAction: string;
    confidenceBps?: number;
    severityBps?: number;
    tags: string[];
    relatedMemoryIds: string[];
    pinned: boolean;
  }) {
    ensureLen(input.sourceTurnId, TITLE_MAX, "sourceTurnId");
    ensureLen(input.taskType, KIND_MAX, "taskType");
    ensureLen(input.kind, KIND_MAX, "kind");
    ensureLen(input.sourceHash, HASH_MAX, "sourceHash");
    ensureLen(input.reflectionHash, HASH_MAX, "reflectionHash");
    ensureLen(input.lessonHash, HASH_MAX, "lessonHash");
    ensureLen(input.summary, SUMMARY_MAX, "summary");
    ensureLen(input.rootCause, SUMMARY_MAX, "rootCause");
    ensureLen(input.correctiveAdvice, SUMMARY_MAX, "correctiveAdvice");
    ensureLen(input.nextBestAction, SUMMARY_MAX, "nextBestAction");

    const now = Date.now();
    const tags = input.tags.slice(0, TAGS_MAX).map(tag => tag.trim()).filter(Boolean);
    const memory: IdentityMemoryRecord = {
      id: `mem_${crypto.randomUUID().slice(0, 8)}`,
      walletAddress: input.walletAddress,
      kind: input.kind,
      result: input.result as IdentityMemoryRecord["result"],
      taskType: input.taskType,
      title: input.sourceTurnId,
      summary: input.summary,
      tags,
      importance: input.pinned ? 0.9 : 0.6,
      createdAt: now,
      updatedAt: now,
      pinned: input.pinned,
      sourceTurnId: input.sourceTurnId,
      sourceHash: input.sourceHash,
      reflectionHash: input.reflectionHash,
      lessonHash: input.lessonHash,
      rootCause: input.rootCause,
      correctiveAdvice: input.correctiveAdvice,
      nextBestAction: input.nextBestAction,
      confidenceBps: normalizedBps(input.confidenceBps),
      severityBps: normalizedBps(input.severityBps),
      relatedMemoryIds: input.relatedMemoryIds,
    };

    await this.store.addMemory(input.walletAddress, memory);
    await this.recordReputationEvent({
      walletAddress: input.walletAddress,
      eventKind: "memory_anchor",
      eventRef: input.sourceTurnId,
      success: input.result === "success",
      weight: input.pinned ? 5 : 2,
      reflectionQualityBps: normalizedBps(input.confidenceBps),
    });
    return memory;
  }

  async recordPlannerRun(input: {
    walletAddress: string;
    runId: string;
    taskType: string;
    goal: string;
    planHash: string;
    stepHash: string;
    outcome: PlannerOutcome;
    selectedSkill?: string;
    stepCount: number;
    completedSteps: number;
    failedSteps: number;
    rootCause?: string;
    correctiveAdvice?: string;
    nextBestAction?: string;
    confidenceBps?: number;
  }) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    ensureLen(input.runId, TITLE_MAX, "runId");
    ensureLen(input.taskType, KIND_MAX, "taskType");
    ensureLen(input.goal, SUMMARY_MAX, "goal");
    ensureLen(input.planHash, HASH_MAX, "planHash");
    ensureLen(input.stepHash, HASH_MAX, "stepHash");
    ensureLen(input.selectedSkill, TITLE_MAX, "selectedSkill");
    ensureLen(input.rootCause, SUMMARY_MAX, "rootCause");
    ensureLen(input.correctiveAdvice, SUMMARY_MAX, "correctiveAdvice");
    ensureLen(input.nextBestAction, SUMMARY_MAX, "nextBestAction");

    const now = Date.now();
    const run: PlannerRunRecord = {
      id: `plan_${crypto.randomUUID().slice(0, 8)}`,
      walletAddress: normalizedWallet,
      runId: input.runId,
      taskType: input.taskType,
      goal: input.goal,
      planHash: input.planHash,
      stepHash: input.stepHash,
      outcome: input.outcome,
      selectedSkill: input.selectedSkill,
      stepCount: Math.max(0, Math.floor(input.stepCount)),
      completedSteps: Math.max(0, Math.floor(input.completedSteps)),
      failedSteps: Math.max(0, Math.floor(input.failedSteps)),
      rootCause: input.rootCause,
      correctiveAdvice: input.correctiveAdvice,
      nextBestAction: input.nextBestAction,
      confidenceBps: normalizedBps(input.confidenceBps),
      createdAt: now,
      updatedAt: now,
      completedAt:
        input.outcome === "succeeded" || input.outcome === "failed" || input.outcome === "aborted"
          ? now
          : undefined,
    };

    await this.store.savePlannerRun(normalizedWallet, run);
    await this.recordReputationEvent({
      walletAddress: normalizedWallet,
      eventKind: "planner_run",
      eventRef: input.runId,
      success: input.outcome === "succeeded",
      weight: 3,
      reflectionQualityBps: normalizedBps(input.confidenceBps),
    });
    return run;
  }

  async recordDeployment(input: {
    walletAddress: string;
    deployId: string;
    name: string;
    version: string;
    target: string;
    bundleHash: string;
    sourceHash: string;
    storageKey: string;
    receiptHash: string;
    txHash?: string;
    explorerUrl?: string;
    status: DeploymentRecord["status"];
    artifactCount: number;
    bytes: number;
    chainId?: number;
  }) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    ensureLen(input.deployId, TITLE_MAX, "deployId");
    ensureLen(input.name, TITLE_MAX, "name");
    ensureLen(input.version, KIND_MAX, "version");
    ensureLen(input.target, KIND_MAX, "target");
    ensureLen(input.bundleHash, HASH_MAX, "bundleHash");
    ensureLen(input.sourceHash, HASH_MAX, "sourceHash");
    ensureLen(input.receiptHash, HASH_MAX, "receiptHash");

    const now = Date.now();
    const deployment: DeploymentRecord = {
      id: `dep_${crypto.randomUUID().slice(0, 8)}`,
      walletAddress: normalizedWallet,
      deployId: input.deployId,
      name: input.name,
      version: input.version,
      target: input.target,
      bundleHash: input.bundleHash,
      sourceHash: input.sourceHash,
      storageKey: input.storageKey,
      receiptHash: input.receiptHash,
      txHash: input.txHash,
      explorerUrl: input.explorerUrl,
      status: input.status,
      artifactCount: Math.max(0, Math.floor(input.artifactCount)),
      bytes: Math.max(0, Math.floor(input.bytes)),
      chainId: input.chainId || this.opts.chainId,
      createdAt: now,
      updatedAt: now,
      confirmedAt: input.status === "confirmed" || input.status === "anchored" ? now : undefined,
    };

    await this.store.saveDeployment(normalizedWallet, deployment);
    await this.recordReputationEvent({
      walletAddress: normalizedWallet,
      eventKind: "deployment",
      eventRef: input.deployId,
      success: input.status === "confirmed" || input.status === "anchored",
      weight: 4,
    });
    return deployment;
  }

  async recordReputationEvent(input: {
    walletAddress: string;
    eventKind: ReputationEventKind;
    eventRef: string;
    success?: boolean;
    weight: number;
    reflectionQualityBps?: number;
  }) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    const now = Date.now();
    const current = await this.store.getReputation(normalizedWallet);
    const reputation: ReputationAccountRecord = current || {
      walletAddress: normalizedWallet,
      usageCount: 0,
      successCount: 0,
      failureCount: 0,
      memoryAnchorCount: 0,
      plannerRunCount: 0,
      deploymentCount: 0,
      publishedSkillCount: 0,
      publishedVersionCount: 0,
      verifiedAuthorshipCount: 0,
      trustScoreBps: 0,
      discoveryScoreBps: 0,
      reflectionQualitySumBps: 0,
      avgReflectionQualityBps: 0,
      totalRewardPoints: 0,
      lastEventKind: "other",
      lastEventRef: "",
      lastEventAt: now,
      createdAt: now,
      updatedAt: now,
    };

    reputation.usageCount += 1;
    if (typeof input.success === "boolean") {
      if (input.success) reputation.successCount += 1;
      else reputation.failureCount += 1;
    }
    if (input.eventKind === "memory_anchor") reputation.memoryAnchorCount += 1;
    if (input.eventKind === "planner_run") reputation.plannerRunCount += 1;
    if (input.eventKind === "deployment") reputation.deploymentCount += 1;
    if (input.eventKind === "skill_publish") reputation.publishedSkillCount += 1;
    if (input.eventKind === "skill_version") reputation.publishedVersionCount += 1;
    if (input.eventKind === "verified_authorship") reputation.verifiedAuthorshipCount += 1;
    if (typeof input.reflectionQualityBps === "number" && input.reflectionQualityBps > 0) {
      reputation.reflectionQualitySumBps += normalizedBps(input.reflectionQualityBps);
    }

    reputation.totalRewardPoints += Math.max(0, Math.floor(input.weight));
    reputation.avgReflectionQualityBps = bpsFromRatio(
      reputation.reflectionQualitySumBps,
      Math.max(reputation.memoryAnchorCount + reputation.plannerRunCount, 1)
    );
    reputation.trustScoreBps = trustScoreFromSignal({
      successCount: reputation.successCount,
      failureCount: reputation.failureCount,
      verifiedAuthorshipCount: reputation.verifiedAuthorshipCount,
      deploymentCount: reputation.deploymentCount,
    });
    reputation.discoveryScoreBps = discoveryScoreFromSignal({
      trustScoreBps: reputation.trustScoreBps,
      usageCount: reputation.usageCount,
      successCount: reputation.successCount,
      versionCount: reputation.publishedVersionCount,
      publishedSkillCount: reputation.publishedSkillCount,
      verifiedAuthorshipCount: reputation.verifiedAuthorshipCount,
      avgReflectionQualityBps: reputation.avgReflectionQualityBps,
      signalCount:
        reputation.memoryAnchorCount +
        reputation.plannerRunCount +
        reputation.deploymentCount +
        reputation.publishedVersionCount,
    });
    reputation.lastEventKind = input.eventKind;
    reputation.lastEventRef = input.eventRef;
    reputation.lastEventAt = now;
    reputation.updatedAt = now;

    await this.store.saveReputation(normalizedWallet, reputation);
    await this.upsertProfile(normalizedWallet);
    return reputation;
  }

  async publishSeedData(walletAddress: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const existing = await this.store.listSkills(normalizedWallet);
    if (existing.length) return existing;

    const now = Date.now();
    const configPda = deriveConfigPda(this.opts.programId);
    const profilePda = deriveProfilePda(normalizedWallet, this.opts.programId);

    const plannerSlug = validateSkillSlug("planner");
    const plannerVersion = validateSkillVersion("1.0.0");
    const plannerSkillPda = deriveSkillPda(normalizedWallet, plannerSlug, this.opts.programId);
    const plannerVersionPda = deriveSkillVersionPda(
      normalizedWallet,
      plannerSlug,
      plannerVersion,
      this.opts.programId
    );

    const memorySlug = validateSkillSlug("memory-recall");
    const memoryVersion = validateSkillVersion("1.0.0");
    const memorySkillPda = deriveSkillPda(normalizedWallet, memorySlug, this.opts.programId);
    const memoryVersionPda = deriveSkillVersionPda(
      normalizedWallet,
      memorySlug,
      memoryVersion,
      this.opts.programId
    );

    const skills: IdentitySkillRecord[] = [
      {
        id: `skill_${crypto.randomUUID().slice(0, 8)}`,
        walletAddress: normalizedWallet,
        slug: plannerSlug,
        name: "Planner",
        category: "workflow",
        language: "ts",
        version: plannerVersion,
        description: "Breaks tasks into executable steps.",
        status: "active",
        usageCount: 42,
        successCount: 36,
        failureCount: 6,
        avgReflectionQualityBps: 8300,
        score: 0.91,
        tags: ["planner", "workflow", "steps"],
        versionCount: 3,
        publishedVersionCount: 3,
        verifiedAuthorshipCount: 1,
        activeVersionPda: plannerVersionPda,
        accounts: {
          programId: this.opts.programId,
          configPda,
          profilePda,
          skillPda: plannerSkillPda,
          skillVersionPda: plannerVersionPda,
        },
        versions: [
          {
            id: `ver_${crypto.randomUUID().slice(0, 8)}`,
            walletAddress: normalizedWallet,
            slug: plannerSlug,
            version: plannerVersion,
            skillPda: plannerSkillPda,
            skillVersionPda: plannerVersionPda,
            status: "active",
            usageCount: 42,
            score: 0.91,
            createdAt: now,
            updatedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `skill_${crypto.randomUUID().slice(0, 8)}`,
        walletAddress: normalizedWallet,
        slug: memorySlug,
        name: "Memory Recall",
        category: "memory",
        language: "ts",
        version: memoryVersion,
        description: "Retrieves past lessons and reflections.",
        status: "active",
        usageCount: 31,
        successCount: 29,
        failureCount: 2,
        avgReflectionQualityBps: 9100,
        score: 0.89,
        tags: ["memory", "reflection", "retrieval"],
        versionCount: 2,
        publishedVersionCount: 2,
        verifiedAuthorshipCount: 1,
        activeVersionPda: memoryVersionPda,
        accounts: {
          programId: this.opts.programId,
          configPda,
          profilePda,
          skillPda: memorySkillPda,
          skillVersionPda: memoryVersionPda,
        },
        versions: [
          {
            id: `ver_${crypto.randomUUID().slice(0, 8)}`,
            walletAddress: normalizedWallet,
            slug: memorySlug,
            version: memoryVersion,
            skillPda: memorySkillPda,
            skillVersionPda: memoryVersionPda,
            status: "active",
            usageCount: 31,
            score: 0.89,
            createdAt: now,
            updatedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];

    const memories: IdentityMemoryRecord[] = [
      {
        id: `mem_${crypto.randomUUID().slice(0, 8)}`,
        walletAddress: normalizedWallet,
        kind: "reflection",
        title: "A timeout became a docs retrieval rule",
        summary:
          "When docs browsing timed out, the agent learned to go directly to the source page first.",
        tags: ["docs", "timeout", "retrieval"],
        importance: 0.86,
        createdAt: now,
        pinned: true,
        sourceTurnId: `turn_${crypto.randomUUID().slice(0, 8)}`,
        rootCause: "Too broad a browser path.",
        correctiveAdvice: "Start with official docs and confirm the endpoint before summarizing.",
        confidenceBps: 8900,
      },
      {
        id: `mem_${crypto.randomUUID().slice(0, 8)}`,
        walletAddress: normalizedWallet,
        kind: "reflection",
        title: "Structured output needs strict schema",
        summary:
          "The agent learned to emit JSON-only reflections when downstream parsers require it.",
        tags: ["json", "schema", "reflection"],
        importance: 0.81,
        createdAt: now,
        pinned: true,
        sourceTurnId: `turn_${crypto.randomUUID().slice(0, 8)}`,
        rootCause: "Mixed prose with JSON.",
        correctiveAdvice: "Use strict schema-first output and validate before saving.",
        confidenceBps: 9200,
      },
    ];

    await this.store.saveSkills(normalizedWallet, skills);
    await this.store.saveMemories(normalizedWallet, memories);
    return skills;
  }

  private async bundle(walletAddress: string, challengeId?: string) {
    const bundle = await this.store.bundle(walletAddress, challengeId);
    if (!bundle) return undefined;
    return {
      ...bundle,
      accounts: {
        programId: this.opts.programId,
        configPda: deriveConfigPda(this.opts.programId),
        profilePda: deriveProfilePda(walletAddress, this.opts.programId),
      },
    };
  }

  private async buildWalletReputation(walletAddress: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const now = Date.now();
    const skills = await this.store.listSkills(normalizedWallet);
    const memories = await this.store.listMemories(normalizedWallet);
    const plannerRuns = await this.store.listPlannerRuns(normalizedWallet);
    const deployments = await this.store.listDeployments(normalizedWallet);
    const existing = await this.store.getReputation(normalizedWallet);

    const usageFromSkills = skills.reduce((sum, skill) => sum + (skill.usageCount || 0), 0);
    const successFromSkills = skills.reduce(
      (sum, skill) => sum + (skill.successCount ?? Math.floor((skill.usageCount || 0) * 0.82)),
      0
    );
    const failureFromSkills = skills.reduce(
      (sum, skill) =>
        sum + (skill.failureCount ?? Math.max(0, (skill.usageCount || 0) - (skill.successCount || 0))),
      0
    );
    const plannerSuccess = plannerRuns.filter(run => run.outcome === "succeeded").length;
    const plannerFailure = plannerRuns.filter(run => run.outcome === "failed" || run.outcome === "aborted").length;
    const deploySuccess = deployments.filter(
      deployment => deployment.status === "confirmed" || deployment.status === "anchored"
    ).length;
    const deployFailure = deployments.filter(deployment => deployment.status === "failed").length;
    const publishedVersionCount = skills.reduce(
      (sum, skill) => sum + Math.max(1, skill.publishedVersionCount || skill.versionCount || skill.versions?.length || 1),
      0
    );
    const verifiedAuthorshipCount = skills.reduce(
      (sum, skill) => sum + Math.max(1, skill.verifiedAuthorshipCount || 1),
      0
    );
    const reflectionQualityFromMemories = memories.reduce((sum, memory) => sum + normalizedBps(memory.confidenceBps), 0);
    const reflectionQualityFromSkills = skills.reduce(
      (sum, skill) => sum + normalizedBps(skill.avgReflectionQualityBps) * Math.max(1, skill.usageCount || 1),
      0
    );
    const reflectionSamples = Math.max(1, memories.length + usageFromSkills);
    const reflectionQualitySumBps = reflectionQualityFromMemories + reflectionQualityFromSkills;
    const avgReflectionQualityBps = bpsFromRatio(reflectionQualitySumBps, reflectionSamples);
    const usageCount = Math.max(
      usageFromSkills,
      existing?.usageCount || 0,
      memories.length + plannerRuns.length + deployments.length
    );
    const successCount = Math.max(
      existing?.successCount || 0,
      successFromSkills + plannerSuccess + deploySuccess
    );
    const failureCount = Math.max(
      existing?.failureCount || 0,
      failureFromSkills + plannerFailure + deployFailure
    );
    const publishedSkillCount = Math.max(skills.length, existing?.publishedSkillCount || 0);
    const trustScoreBps = trustScoreFromSignal({
      successCount,
      failureCount,
      verifiedAuthorshipCount,
      deploymentCount: deployments.length,
    });
    const discoveryScoreBps = discoveryScoreFromSignal({
      trustScoreBps,
      usageCount,
      successCount,
      versionCount: publishedVersionCount,
      publishedSkillCount,
      verifiedAuthorshipCount,
      avgReflectionQualityBps,
      signalCount: memories.length + plannerRuns.length + deployments.length + publishedVersionCount,
    });
    const computedRewardPoints =
      usageFromSkills +
      memories.length * 10 +
      plannerRuns.length * 4 +
      deployments.length * 5 +
      publishedVersionCount * 3;

    const reputation: ReputationAccountRecord = {
      walletAddress: normalizedWallet,
      usageCount,
      successCount,
      failureCount,
      memoryAnchorCount: memories.length,
      plannerRunCount: plannerRuns.length,
      deploymentCount: deployments.length,
      publishedSkillCount,
      publishedVersionCount,
      verifiedAuthorshipCount,
      trustScoreBps,
      discoveryScoreBps,
      reflectionQualitySumBps,
      avgReflectionQualityBps,
      totalRewardPoints: Math.max(existing?.totalRewardPoints || 0, computedRewardPoints),
      lastEventKind: existing?.lastEventKind || "other",
      lastEventRef: existing?.lastEventRef || skills[0]?.id || "",
      lastEventAt: existing?.lastEventAt || now,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await this.store.saveReputation(normalizedWallet, reputation);
    return reputation;
  }

  private async upsertProfile(walletAddress: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const existing = await this.store.getProfile(normalizedWallet);
    const now = Date.now();
    const profile: IdentityProfileRecord = existing || {
      walletAddress: normalizedWallet,
      authorityWallet: normalizedWallet,
      displayName: `Wallet ${normalizedWallet.slice(0, 4)}…${normalizedWallet.slice(-4)}`,
      status: "verified",
      reputation: 0.58,
      verifiedAt: now,
      lastSeenAt: now,
      skillCount: 0,
      memoryCount: 0,
      receiptCount: 0,
      chainId: this.opts.chainId,
      profileHash: "",
      accounts: {
        programId: this.opts.programId,
        configPda: deriveConfigPda(this.opts.programId),
        profilePda: deriveProfilePda(normalizedWallet, this.opts.programId),
      },
      metadata: {},
    };

    const skills = await this.store.listSkills(normalizedWallet);
    const memories = await this.store.listMemories(normalizedWallet);
    const receipts = await this.store.listReceipts(normalizedWallet);
    const plannerRuns = await this.store.listPlannerRuns(normalizedWallet);
    const deployments = await this.store.listDeployments(normalizedWallet);
    const reputation = await this.buildWalletReputation(normalizedWallet);

    const next: IdentityProfileRecord = {
      ...profile,
      status: "verified",
      verifiedAt: profile.verifiedAt || now,
      lastSeenAt: now,
      skillCount: skills.length,
      memoryCount: memories.length,
      plannerRunCount: plannerRuns.length,
      deploymentCount: deployments.length,
      receiptCount: receipts.length,
      reputation: Math.min(1, reputation.trustScoreBps / 10_000),
      trustScoreBps: reputation.trustScoreBps,
      chainId: this.opts.chainId,
      authorityWallet: normalizedWallet,
      accounts: {
        programId: this.opts.programId,
        configPda: deriveConfigPda(this.opts.programId),
        profilePda: deriveProfilePda(normalizedWallet, this.opts.programId),
      },
      profileHash: crypto
        .createHash("sha256")
        .update(
          JSON.stringify({
            walletAddress: normalizedWallet,
            skillCount: skills.length,
            memoryCount: memories.length,
            plannerRunCount: plannerRuns.length,
            deploymentCount: deployments.length,
            receiptCount: receipts.length,
            trustScoreBps: reputation.trustScoreBps,
            discoveryScoreBps: reputation.discoveryScoreBps,
          })
        )
        .digest("hex"),
    };

    await this.store.saveProfile(next);
    return next;
  }

  private async createReceipt(input: {
    walletAddress: string;
    challenge: IdentityChallengeRecord;
    signatureBase58: string;
    profile: IdentityProfileRecord;
  }): Promise<IdentityReceiptRecord> {
    const receiptId = `rcpt_${crypto.randomUUID().replace(/-/g, "")}`;
    const profileHash = input.profile.profileHash || "";
    const challengeHash = crypto.createHash("sha256").update(input.challenge.message).digest("hex");
    const signatureHash = crypto.createHash("sha256").update(input.signatureBase58).digest("hex");
    const receiptHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          receiptId,
          walletAddress: input.walletAddress,
          profileHash,
          challengeHash,
          signatureHash,
        })
      )
      .digest("hex");

    const receipt: IdentityReceiptRecord = {
      id: receiptId,
      walletAddress: input.walletAddress,
      profileHash,
      challengeHash,
      signatureHash,
      receiptHash,
      chainId: this.opts.chainId,
      createdAt: Date.now(),
      labels: ["wallet_connect", "identity", "verified"],
      summary: "Wallet connected, signature verified, identity bound to CLAW.",
      status: "confirmed",
      programId: this.opts.programId,
      accounts: {
        programId: this.opts.programId,
        configPda: deriveConfigPda(this.opts.programId),
        profilePda: deriveProfilePda(input.walletAddress, this.opts.programId),
      },
      metadata: { challengeId: input.challenge.id },
    };

    await this.store.saveReceipt(receipt);

    if (this.opts.onchain) {
      try {
        const anchored = await this.opts.onchain.anchorReceipt({
          walletAddress: input.walletAddress,
          receiptId,
          profileHash,
          challengeHash,
          signatureHash,
          receiptHash,
          chainId: this.opts.chainId,
          labels: receipt.labels,
          summary: receipt.summary,
        });

        receipt.txHash = anchored.txHash;
        receipt.programId = this.opts.programId;
        receipt.metadata = {
          ...(receipt.metadata || {}),
          receiptPda: anchored.receiptPda,
        };
        await this.store.saveReceipt(receipt);
      } catch {
        receipt.status = "pending";
        await this.store.saveReceipt(receipt);
      }
    }

    return receipt;
  }
}
