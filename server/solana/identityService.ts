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

  async recordSkillUse(walletAddress: string, skillName: string) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    await this.store.bumpUsage(normalizedWallet, skillName);
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
    success: boolean;
    weight: number;
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
      trustScoreBps: 0,
      totalRewardPoints: 0,
      lastEventKind: "other",
      lastEventRef: "",
      lastEventAt: now,
      createdAt: now,
      updatedAt: now,
    };

    reputation.usageCount += 1;
    if (input.success) reputation.successCount += 1;
    else reputation.failureCount += 1;
    if (input.eventKind === "memory_anchor") reputation.memoryAnchorCount += 1;
    if (input.eventKind === "planner_run") reputation.plannerRunCount += 1;
    if (input.eventKind === "deployment") reputation.deploymentCount += 1;

    reputation.totalRewardPoints += Math.max(0, Math.floor(input.weight));
    reputation.trustScoreBps = bpsFromRatio(
      reputation.successCount,
      reputation.successCount + reputation.failureCount
    );
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
        version: plannerVersion,
        description: "Breaks tasks into executable steps.",
        status: "active",
        usageCount: 0,
        score: 0.91,
        tags: ["planner", "workflow"],
        versionCount: 1,
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
            usageCount: 0,
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
        version: memoryVersion,
        description: "Retrieves past lessons and reflections.",
        status: "active",
        usageCount: 0,
        score: 0.89,
        tags: ["memory", "reflection"],
        versionCount: 1,
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
            usageCount: 0,
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
    const reputation = await this.store.getReputation(normalizedWallet);

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
      reputation:
        typeof reputation?.trustScoreBps === "number"
          ? Math.min(1, reputation.trustScoreBps / 10_000)
          : Math.min(
              1,
              0.55 +
                skills.length * 0.04 +
                memories.length * 0.03 +
                receipts.length * 0.02 +
                plannerRuns.length * 0.01 +
                deployments.length * 0.01
            ),
      trustScoreBps: reputation?.trustScoreBps || 0,
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
            trustScoreBps: reputation?.trustScoreBps || 0,
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
