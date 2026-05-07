import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { clawSkills, clawSkillVersions } from "../../drizzle/schema";
import type {
  SkillAsset,
  SkillPublishReceipt,
  SkillQuery,
  SkillReputationRecord,
  SkillStatus,
  SkillUsageRecord,
  SkillVerificationResult,
  SkillVersionRecord,
} from "@shared/skills";
import { getDb } from "../db";

const DEFAULT_PROGRAM_ID = "CLAW_SKILL_PROGRAM_V1";
const DEFAULT_REGISTRY_ACCOUNT = "CLAW_REGISTRY_DEVNET";
const DEFAULT_CHAIN_ID = Number(process.env.SOLANA_CHAIN_ID || 101);

const statusTransitions: Record<SkillStatus, SkillStatus[]> = {
  draft: ["published"],
  published: ["active", "paused", "deprecated", "archived"],
  active: ["paused", "deprecated", "archived"],
  paused: ["active", "deprecated", "archived"],
  deprecated: ["archived"],
  archived: [],
};

type PublishInput = {
  name: string;
  description?: string;
  tags?: string[];
  authorWallet: string;
  status?: SkillStatus;
  canonicalUri?: string;
  metadataUri?: string;
  storageRef?: string;
  notes?: string;
  payload?: Record<string, unknown>;
};

type UpdateInput = {
  skillId: string;
  description?: string;
  tags?: string[];
  changelog?: string;
  payload?: Record<string, unknown>;
  version?: string;
  versionBump?: "major" | "minor" | "patch";
  canonicalUri?: string;
  metadataUri?: string;
  storageRef?: string;
  notes?: string;
};

type UsageInput = {
  skillId: string;
  success: boolean;
  resolvedAt?: string;
};

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function shortHash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function contentHash(input: {
  name: string;
  description: string;
  tags: string[];
  version: string;
  authorWallet: string;
  payload?: Record<string, unknown>;
  canonicalUri?: string;
  metadataUri?: string;
}) {
  return shortHash(
    JSON.stringify({
      name: input.name,
      description: input.description,
      tags: [...input.tags].sort(),
      version: input.version,
      authorWallet: input.authorWallet,
      payload: input.payload ?? {},
      canonicalUri: input.canonicalUri ?? "",
      metadataUri: input.metadataUri ?? "",
    })
  );
}

function successRate(successCount: number, failureCount: number) {
  const total = successCount + failureCount;
  if (total === 0) return 0;
  return Number(((successCount / total) * 100).toFixed(2));
}

function calcReputation(
  usageCount: number,
  skillSuccessRate: number,
  lastUsedAt?: Date | null
) {
  const usageWeight = Math.min(60, usageCount * 1.2);
  const successWeight = skillSuccessRate * 0.35;
  const recencyPenalty = lastUsedAt
    ? Math.max(0, (Date.now() - lastUsedAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 8;
  const recencyWeight = Math.max(0, 20 - recencyPenalty);
  return Number(Math.max(0, Math.min(100, usageWeight + successWeight + recencyWeight)).toFixed(2));
}

function bumpVersion(currentVersion: string, bump: "major" | "minor" | "patch" = "patch") {
  const [major, minor, patch] = currentVersion
    .split(".")
    .map(part => Number.parseInt(part, 10))
    .map(part => (Number.isFinite(part) ? part : 0));
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function shouldFailChain() {
  return process.env.SKILL_CHAIN_FORCE_FAIL === "1";
}

async function mockChainPublish(skillUid: string, versionAccount: string, hash: string) {
  if (shouldFailChain()) throw new Error("chain_unavailable");
  const txHash = shortHash(`${skillUid}:${versionAccount}:${hash}`).slice(0, 64);
  return {
    txHash,
    explorerUrl: `https://explorer.solana.com/tx/${txHash}?cluster=devnet`,
  };
}

function rowToAsset(row: typeof clawSkills.$inferSelect): SkillAsset {
  const skillSuccessRate = successRate(row.successCount, row.failureCount);
  return {
    id: row.skillUid || `legacy_${row.id}`,
    programId: row.programId || DEFAULT_PROGRAM_ID,
    skillAccount: row.skillAccount || "",
    currentVersionAccount: row.currentVersionAccount || "",
    currentVersion: row.currentVersion || "1.0.0",
    name: row.name,
    description: row.description || "",
    tags: parseJsonArray(row.tags),
    authorWallet: row.authorWallet || "",
    status: row.status as SkillStatus,
    usageCount: row.usageCount,
    successCount: row.successCount,
    failureCount: row.failureCount,
    successRate: skillSuccessRate,
    reputationScore: row.reputationScore,
    contentHash: row.contentHash || "",
    canonicalUri: row.canonicalUri || undefined,
    metadataUri: row.metadataUri || undefined,
    publishedAt: (row.publishedAt || row.createdAt).toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString(),
    lastResolvedAt: row.lastResolvedAt?.toISOString(),
    latestVersionHash: row.latestVersionHash || row.contentHash || "",
    previousVersionAccount: row.previousVersionAccount || undefined,
    previousVersionHash: row.previousVersionHash || undefined,
    chainId: row.chainId || DEFAULT_CHAIN_ID,
    explorerTxHash: row.explorerTxHash || undefined,
    explorerUrl: row.explorerUrl || undefined,
    storageRef: row.storageRef || undefined,
    proofRef: row.proofRef || undefined,
    notes: row.notes || undefined,
    flags: parseJsonArray(row.flags),
  };
}

export class SkillRegistryService {
  constructor(private readonly userId: number) {}

  private async migrateLegacySkills() {
    const db = await getDb();
    if (!db) return;
    const rows = await db.select().from(clawSkills).where(eq(clawSkills.userId, this.userId));
    const legacyRows = rows.filter(row => !row.skillUid);
    for (const row of legacyRows) {
      const skillUid = `skill_${nanoid(12)}`;
      const version = "1.0.0";
      const authorWallet = row.authorWallet || `legacy_wallet_${this.userId}`;
      const tags = parseJsonArray(row.tags);
      const hash = contentHash({
        name: row.name,
        description: row.description || "",
        tags,
        version,
        authorWallet,
      });
      const versionAccount = `ver_${shortHash(`${skillUid}:${version}`).slice(0, 32)}`;
      const skillAccount = `skillacc_${shortHash(skillUid).slice(0, 32)}`;

      await db.insert(clawSkillVersions).values({
        skillUid,
        version,
        versionAccount,
        contentHash: hash,
        authorWallet,
        status: "published",
        description: row.description || "",
        tags: JSON.stringify(tags),
        payload: JSON.stringify({ migratedFromLegacy: true, legacyId: row.id }),
        publishedAt: row.createdAt,
      });

      await db
        .update(clawSkills)
        .set({
          skillUid,
          programId: row.programId || DEFAULT_PROGRAM_ID,
          registryAccount: row.registryAccount || DEFAULT_REGISTRY_ACCOUNT,
          skillAccount,
          currentVersionAccount: versionAccount,
          currentVersion: row.currentVersion || version,
          authorWallet,
          status: row.status || "published",
          contentHash: hash,
          latestVersionHash: hash,
          chainId: row.chainId || DEFAULT_CHAIN_ID,
          publishedAt: row.publishedAt || row.createdAt,
        })
        .where(eq(clawSkills.id, row.id));
    }
  }

  async health() {
    const db = await getDb();
    return {
      ok: true,
      mode: db ? "database" : "fallback",
      chain: shouldFailChain() ? "degraded" : "healthy",
      checkedAt: new Date().toISOString(),
    };
  }

  async list(query?: SkillQuery): Promise<SkillAsset[]> {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) return [];
    let skills = (
      await db.select().from(clawSkills).where(eq(clawSkills.userId, this.userId))
    ).map(rowToAsset);

    const search = query?.search?.trim().toLowerCase();
    if (search) {
      skills = skills.filter(
        skill =>
          skill.name.toLowerCase().includes(search) ||
          skill.description.toLowerCase().includes(search) ||
          skill.tags.some(tag => tag.toLowerCase().includes(search)) ||
          skill.authorWallet.toLowerCase().includes(search) ||
          skill.contentHash.toLowerCase().includes(search)
      );
    }
    if (query?.status && query.status !== "all") {
      skills = skills.filter(skill => skill.status === query.status);
    }
    if (query?.authorWallet) {
      skills = skills.filter(skill => skill.authorWallet === query.authorWallet);
    }
    if (query?.tag) {
      skills = skills.filter(skill => skill.tags.includes(query.tag!));
    }
    const minReputation = query?.minReputation;
    if (minReputation !== undefined) {
      skills = skills.filter(skill => skill.reputationScore >= minReputation);
    }

    const sortBy = query?.sortBy || "latest_published";
    const factor = (query?.order || "desc") === "asc" ? 1 : -1;
    skills = [...skills].sort((a, b) => {
      if (sortBy === "alphabetical") return a.name.localeCompare(b.name) * factor;
      if (sortBy === "most_used") return (a.usageCount - b.usageCount) * factor;
      if (sortBy === "highest_reputation") return (a.reputationScore - b.reputationScore) * factor;
      if (sortBy === "success_rate") return (a.successRate - b.successRate) * factor;
      return (Date.parse(a.publishedAt) - Date.parse(b.publishedAt)) * factor;
    });

    const offset = query?.offset || 0;
    const limit = query?.limit ?? skills.length;
    return skills.slice(offset, offset + limit);
  }

  async getById(skillId: string) {
    const skills = await this.list();
    return skills.find(skill => skill.id === skillId) || null;
  }

  async versions(skillId: string): Promise<SkillVersionRecord[]> {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(clawSkillVersions)
      .where(eq(clawSkillVersions.skillUid, skillId))
      .orderBy(desc(clawSkillVersions.publishedAt));

    return rows.map(row => ({
      id: `${row.skillUid}:${row.version}`,
      skillId: row.skillUid,
      version: row.version,
      versionAccount: row.versionAccount,
      previousVersionAccount: row.previousVersionAccount || undefined,
      hash: row.contentHash,
      authorWallet: row.authorWallet,
      description: row.description || "",
      tags: parseJsonArray(row.tags),
      changelog: row.changelog || undefined,
      payload: row.payload ? JSON.parse(row.payload) : undefined,
      status: row.status as SkillStatus,
      canonicalUri: row.canonicalUri || undefined,
      metadataUri: row.metadataUri || undefined,
      publishedAt: row.publishedAt.toISOString(),
      txHash: row.txHash || undefined,
      explorerUrl: row.explorerUrl || undefined,
    }));
  }

  async publish(input: PublishInput): Promise<SkillPublishReceipt> {
    const db = await getDb();
    if (!db) throw new Error("Skill publish requires database mode");
    const skillUid = `skill_${nanoid(12)}`;
    const version = "1.0.0";
    const versionAccount = `ver_${shortHash(`${skillUid}:${version}`).slice(0, 32)}`;
    const skillAccount = `skillacc_${shortHash(skillUid).slice(0, 32)}`;
    const tags = (input.tags ?? []).map(tag => tag.trim()).filter(Boolean);
    const hash = contentHash({
      name: input.name,
      description: input.description || "",
      tags,
      version,
      authorWallet: input.authorWallet,
      payload: input.payload,
      canonicalUri: input.canonicalUri,
      metadataUri: input.metadataUri,
    });

    let txHash: string | undefined;
    let explorerUrl: string | undefined;
    let chainConfirmed = true;
    try {
      const chain = await mockChainPublish(skillUid, versionAccount, hash);
      txHash = chain.txHash;
      explorerUrl = chain.explorerUrl;
    } catch {
      chainConfirmed = false;
    }

    const now = new Date();
    await db.insert(clawSkills).values({
      userId: this.userId,
      skillUid,
      programId: DEFAULT_PROGRAM_ID,
      registryAccount: DEFAULT_REGISTRY_ACCOUNT,
      skillAccount,
      currentVersionAccount: versionAccount,
      currentVersion: version,
      authorWallet: input.authorWallet,
      name: input.name,
      description: input.description || "",
      tags: JSON.stringify(tags),
      status: input.status || "published",
      contentHash: hash,
      latestVersionHash: hash,
      canonicalUri: input.canonicalUri,
      metadataUri: input.metadataUri,
      storageRef: input.storageRef,
      notes: input.notes,
      chainId: DEFAULT_CHAIN_ID,
      explorerTxHash: txHash,
      explorerUrl,
      publishedAt: now,
      syncState: chainConfirmed ? "ok" : "degraded",
      flags: JSON.stringify(chainConfirmed ? [] : ["chain_degraded"]),
    });

    await db.insert(clawSkillVersions).values({
      skillUid,
      version,
      versionAccount,
      contentHash: hash,
      authorWallet: input.authorWallet,
      status: input.status || "published",
      description: input.description || "",
      tags: JSON.stringify(tags),
      payload: JSON.stringify(input.payload ?? {}),
      canonicalUri: input.canonicalUri,
      metadataUri: input.metadataUri,
      txHash,
      explorerUrl,
      publishedAt: now,
    });

    return {
      skillId: skillUid,
      version,
      versionAccount,
      contentHash: hash,
      txHash,
      explorerUrl,
      chainConfirmed,
      duplicateContent: false,
      requestId: `req_${nanoid(8)}`,
    };
  }

  async update(input: UpdateInput): Promise<SkillPublishReceipt> {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) throw new Error("Skill update requires database mode");

    const row = (
      await db
        .select()
        .from(clawSkills)
        .where(and(eq(clawSkills.userId, this.userId), eq(clawSkills.skillUid, input.skillId)))
        .limit(1)
    )[0];
    if (!row) throw new Error("Skill not found");

    const nextVersion = input.version || bumpVersion(row.currentVersion || "1.0.0", input.versionBump);
    const nextDescription = input.description ?? row.description ?? "";
    const nextTags = input.tags ?? parseJsonArray(row.tags);
    const nextVersionAccount = `ver_${shortHash(`${input.skillId}:${nextVersion}`).slice(0, 32)}`;
    const hash = contentHash({
      name: row.name,
      description: nextDescription,
      tags: nextTags,
      version: nextVersion,
      authorWallet: row.authorWallet || "",
      payload: input.payload,
      canonicalUri: input.canonicalUri ?? row.canonicalUri ?? undefined,
      metadataUri: input.metadataUri ?? row.metadataUri ?? undefined,
    });

    const dup = (
      await db
        .select()
        .from(clawSkillVersions)
        .where(
          and(eq(clawSkillVersions.skillUid, input.skillId), eq(clawSkillVersions.contentHash, hash))
        )
        .limit(1)
    )[0];
    if (dup) {
      return {
        skillId: input.skillId,
        version: dup.version,
        versionAccount: dup.versionAccount,
        contentHash: hash,
        txHash: dup.txHash || undefined,
        explorerUrl: dup.explorerUrl || undefined,
        chainConfirmed: Boolean(dup.txHash),
        duplicateContent: true,
        requestId: `req_${nanoid(8)}`,
      };
    }

    let txHash: string | undefined;
    let explorerUrl: string | undefined;
    let chainConfirmed = true;
    try {
      const chain = await mockChainPublish(input.skillId, nextVersionAccount, hash);
      txHash = chain.txHash;
      explorerUrl = chain.explorerUrl;
    } catch {
      chainConfirmed = false;
    }

    await db.insert(clawSkillVersions).values({
      skillUid: input.skillId,
      version: nextVersion,
      versionAccount: nextVersionAccount,
      previousVersionAccount: row.currentVersionAccount,
      contentHash: hash,
      authorWallet: row.authorWallet || "",
      status: row.status,
      description: nextDescription,
      tags: JSON.stringify(nextTags),
      changelog: input.changelog,
      payload: JSON.stringify(input.payload ?? {}),
      canonicalUri: input.canonicalUri ?? row.canonicalUri,
      metadataUri: input.metadataUri ?? row.metadataUri,
      txHash,
      explorerUrl,
      publishedAt: new Date(),
    });

    const nextSuccessRate = successRate(row.successCount, row.failureCount);
    await db
      .update(clawSkills)
      .set({
        description: nextDescription,
        tags: JSON.stringify(nextTags),
        currentVersion: nextVersion,
        previousVersionAccount: row.currentVersionAccount,
        previousVersionHash: row.latestVersionHash || row.contentHash || null,
        currentVersionAccount: nextVersionAccount,
        contentHash: hash,
        latestVersionHash: hash,
        canonicalUri: input.canonicalUri ?? row.canonicalUri,
        metadataUri: input.metadataUri ?? row.metadataUri,
        storageRef: input.storageRef ?? row.storageRef,
        notes: input.notes ?? row.notes,
        explorerTxHash: txHash,
        explorerUrl,
        syncState: chainConfirmed ? "ok" : "degraded",
        reputationScore: calcReputation(row.usageCount, nextSuccessRate, row.lastUsedAt),
        flags: JSON.stringify(chainConfirmed ? [] : ["chain_degraded"]),
      })
      .where(eq(clawSkills.id, row.id));

    return {
      skillId: input.skillId,
      version: nextVersion,
      versionAccount: nextVersionAccount,
      contentHash: hash,
      txHash,
      explorerUrl,
      chainConfirmed,
      duplicateContent: false,
      requestId: `req_${nanoid(8)}`,
    };
  }

  async setStatus(skillId: string, status: SkillStatus) {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) throw new Error("Status transition requires database mode");
    const row = (
      await db
        .select()
        .from(clawSkills)
        .where(and(eq(clawSkills.userId, this.userId), eq(clawSkills.skillUid, skillId)))
        .limit(1)
    )[0];
    if (!row) throw new Error("Skill not found");
    if (!statusTransitions[row.status as SkillStatus].includes(status)) {
      throw new Error(`Invalid status transition: ${row.status} -> ${status}`);
    }
    await db.update(clawSkills).set({ status }).where(eq(clawSkills.id, row.id));
    await db
      .update(clawSkillVersions)
      .set({ status })
      .where(and(eq(clawSkillVersions.skillUid, skillId), eq(clawSkillVersions.versionAccount, row.currentVersionAccount!)));
    return { ok: true };
  }

  async recordUsage(input: UsageInput): Promise<SkillUsageRecord> {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) throw new Error("Usage update requires database mode");
    const row = (
      await db
        .select()
        .from(clawSkills)
        .where(and(eq(clawSkills.userId, this.userId), eq(clawSkills.skillUid, input.skillId)))
        .limit(1)
    )[0];
    if (!row) throw new Error("Skill not found");
    const usageCount = row.usageCount + 1;
    const successCount = row.successCount + (input.success ? 1 : 0);
    const failureCount = row.failureCount + (input.success ? 0 : 1);
    const skillSuccessRate = successRate(successCount, failureCount);
    const lastResolvedAt = input.resolvedAt ? new Date(input.resolvedAt) : new Date();

    await db
      .update(clawSkills)
      .set({
        usageCount,
        successCount,
        failureCount,
        lastUsedAt: new Date(),
        lastResolvedAt,
        reputationScore: calcReputation(usageCount, skillSuccessRate, new Date()),
      })
      .where(eq(clawSkills.id, row.id));

    return {
      skillId: input.skillId,
      usageCount,
      successCount,
      failureCount,
      successRate: skillSuccessRate,
      lastUsedAt: new Date().toISOString(),
      lastResolvedAt: lastResolvedAt.toISOString(),
    };
  }

  async reputation(skillId: string): Promise<SkillReputationRecord> {
    const skill = await this.getById(skillId);
    if (!skill) throw new Error("Skill not found");
    return {
      skillId,
      reputationScore: skill.reputationScore,
      calculatedAt: new Date().toISOString(),
      factors: {
        usageWeight: Math.min(60, skill.usageCount * 1.2),
        successWeight: skill.successRate * 0.35,
        recencyWeight: skill.lastUsedAt ? 20 : 5,
      },
    };
  }

  async verify(skillId: string): Promise<SkillVerificationResult> {
    const skill = await this.getById(skillId);
    if (!skill) throw new Error("Skill not found");
    const versions = await this.versions(skillId);
    const current = versions.find(version => version.version === skill.currentVersion) || versions[0];
    const verified = Boolean(current && current.hash === skill.latestVersionHash && skill.currentVersionAccount);
    return {
      skillId,
      version: skill.currentVersion,
      verified,
      expectedHash: skill.latestVersionHash,
      onchainHash: current?.hash,
      txHash: skill.explorerTxHash,
      explorerUrl: skill.explorerUrl,
      reason: verified ? "version_hash_match" : "version_mismatch",
      checkedAt: new Date().toISOString(),
    };
  }
}
