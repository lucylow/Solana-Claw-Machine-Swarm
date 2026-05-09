import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  type InsertAutonomyConfig,
  type InsertAutonomyRunSummary,
  type InsertUser,
  activityLog,
  agentDecisionRecords,
  agents,
  autonomyConfigs,
  autonomyRunSummaries,
  clawSkills,
  decisionNarratives,
  memoryUsageRecords,
  onchainReceipts,
  policyGateEvents,
  reflectionRecords,
  solanaSessions,
  users,
} from "../drizzle/schema";
import type {
  AgentDecisionRecord,
  AutonomyLevel,
  DecisionNarrative,
  MemoryUsageRecord,
  PolicyGateResult,
  ReflectionRecord,
} from "@shared/autonomy";
import { nanoid } from "nanoid";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function asJson(value: unknown): string {
  return JSON.stringify(value ?? {});
}

export type UserAutonomyConfig = {
  mode: "automation" | "meaningful_agency" | "full_autonomy";
  level: AutonomyLevel;
  preferences: Record<string, unknown>;
};

const DEFAULT_AUTONOMY_CONFIG: UserAutonomyConfig = {
  mode: "meaningful_agency",
  level: "meaningful_agency",
  preferences: {
    allowAutomaticSkillSelection: true,
    allowAutomaticRetries: true,
    requireHumanApprovalHighRisk: true,
    requireProofBeforeMemoryPromotion: false,
    requirePolicyBeforeExecution: true,
    safeTaskOnlyForFullAutonomy: true,
  },
};

export async function getAutonomyConfigByUser(
  userId: number,
): Promise<UserAutonomyConfig> {
  const db = await getDb();
  if (!db) return DEFAULT_AUTONOMY_CONFIG;

  const result = await db
    .select()
    .from(autonomyConfigs)
    .where(eq(autonomyConfigs.userId, userId))
    .limit(1);
  const row = result[0];
  if (!row) return DEFAULT_AUTONOMY_CONFIG;

  return {
    mode: row.mode ?? DEFAULT_AUTONOMY_CONFIG.mode,
    level: (row.level as AutonomyLevel) ?? DEFAULT_AUTONOMY_CONFIG.level,
    preferences: safeParseJson<Record<string, unknown>>(row.preferences, {}),
  };
}

export async function upsertAutonomyConfig(
  userId: number,
  config: Partial<UserAutonomyConfig>,
): Promise<UserAutonomyConfig> {
  const db = await getDb();
  if (!db) {
    return {
      ...DEFAULT_AUTONOMY_CONFIG,
      ...config,
      preferences: {
        ...DEFAULT_AUTONOMY_CONFIG.preferences,
        ...(config.preferences ?? {}),
      },
    };
  }

  const current = await getAutonomyConfigByUser(userId);
  const next: UserAutonomyConfig = {
    mode: config.mode ?? current.mode,
    level: config.level ?? current.level,
    preferences: {
      ...current.preferences,
      ...(config.preferences ?? {}),
    },
  };

  const values: InsertAutonomyConfig = {
    userId,
    mode: next.mode,
    level: next.level,
    preferences: asJson(next.preferences),
  };

  await db
    .insert(autonomyConfigs)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        mode: values.mode,
        level: values.level,
        preferences: values.preferences,
        updatedAt: new Date(),
      },
    });

  return next;
}

// Solana Session Helpers
export async function createSolanaSession(
  userId: number,
  walletAddress: string,
  nonce: string,
  expiresAt: Date,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .insert(solanaSessions)
    .values({ userId, walletAddress, nonce, expiresAt });
  return result;
}

export async function getSolanaSessionByWallet(walletAddress: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(solanaSessions)
    .where(eq(solanaSessions.walletAddress, walletAddress))
    .limit(1);
  return result[0];
}

// Agent Helpers
export async function createAgent(
  userId: number,
  name: string,
  role: string,
  description?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agents).values({ userId, name, role, description });
  await logActivity(
    userId,
    "agent_created",
    `Created agent "${name}" with role "${role}".`,
  );
}

export async function getAgentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.userId, userId));
}

// Skill Helpers
export async function createClawSkill(
  userId: number,
  name: string,
  description?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(clawSkills).values({ userId, name, description });
  await logActivity(userId, "skill_created", `Registered skill "${name}".`);
}

export async function getClawSkillsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clawSkills).where(eq(clawSkills.userId, userId));
}

// Receipt Helpers
export async function createReceipt(
  userId: number,
  receiptType: string,
  content: string,
  agentId?: number,
  transactionHash?: string,
  options?: {
    autonomyLevel?: AutonomyLevel;
    policyStatus?: AgentDecisionRecord["policyStatus"];
    proofType?: "plan" | "decision" | "execution" | "reflection" | "memory";
    proofHash?: string;
    referenceId?: string;
  },
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const syntheticTx = transactionHash ?? `SIM_${nanoid(24)}`;
  await db.insert(onchainReceipts).values({
    userId,
    agentId,
    receiptType: receiptType as any,
    content,
    transactionHash: syntheticTx,
    autonomyLevel: options?.autonomyLevel,
    policyStatus: options?.policyStatus,
    proofType: options?.proofType,
    proofHash: options?.proofHash,
    referenceId: options?.referenceId,
  });

  await logActivity(
    userId,
    "receipt_anchored",
    `Anchored ${receiptType} receipt${options?.referenceId ? ` for ${options.referenceId}` : ""}.`,
    agentId,
  );

  return { transactionHash: syntheticTx };
}

export async function getReceiptsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(onchainReceipts)
    .where(eq(onchainReceipts.userId, userId))
    .orderBy(desc(onchainReceipts.createdAt));
}

export async function createDecisionRecord(
  userId: number,
  payload: Omit<AgentDecisionRecord, "createdAt">,
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(agentDecisionRecords).values({
    decisionId: payload.id,
    userId,
    agentId: payload.agentId ? Number(payload.agentId) : null,
    runId: payload.metadata?.runId ? String(payload.metadata.runId) : null,
    skillId: payload.skillId,
    planId: payload.planId,
    turnId: payload.turnId,
    decisionType: payload.decisionType,
    autonomyLevel: payload.autonomyLevel,
    decisionScope: payload.decisionScope,
    optionsConsidered: asJson(payload.optionsConsidered),
    selectedOptionId: payload.selectedOptionId,
    rationale: payload.rationale,
    confidence: payload.confidence,
    policyStatus: payload.policyStatus,
    humanOverride: payload.humanOverride ? 1 : 0,
    memoryUsed: asJson(payload.memoryUsed ?? []),
    proofReceiptId: payload.proofReceiptId,
    metadata: asJson(payload.metadata),
  });

  await logActivity(
    userId,
    "decision_recorded",
    `Decision ${payload.decisionType} recorded at ${payload.autonomyLevel}.`,
    payload.agentId ? Number(payload.agentId) : undefined,
    asJson({
      confidence: payload.confidence,
      policyStatus: payload.policyStatus,
    }),
  );
}

export async function listDecisionRecordsByUser(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(agentDecisionRecords)
    .where(eq(agentDecisionRecords.userId, userId))
    .orderBy(desc(agentDecisionRecords.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.decisionId,
    agentId: String(row.agentId ?? ""),
    skillId: row.skillId ?? undefined,
    planId: row.planId ?? undefined,
    turnId: row.turnId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    decisionType: row.decisionType,
    autonomyLevel: row.autonomyLevel,
    decisionScope: row.decisionScope,
    optionsConsidered: safeParseJson(row.optionsConsidered, []),
    selectedOptionId: row.selectedOptionId,
    rationale: row.rationale,
    confidence: row.confidence,
    policyStatus: row.policyStatus,
    humanOverride: row.humanOverride === 1,
    memoryUsed: safeParseJson(row.memoryUsed, []),
    proofReceiptId: row.proofReceiptId ?? undefined,
    metadata: safeParseJson<Record<string, unknown>>(row.metadata, {}),
  })) satisfies AgentDecisionRecord[];
}

export async function createDecisionNarrativeRecord(
  userId: number,
  narrative: Omit<DecisionNarrative, "createdAt">,
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(decisionNarratives).values({
    narrativeId: narrative.id,
    userId,
    decisionId: narrative.decisionId,
    fullText: narrative.fullText,
    summary: narrative.summary,
    optionsConsidered: asJson(narrative.optionsConsidered),
    confidenceNotes: narrative.confidenceNotes,
    policyNotes: narrative.policyNotes,
    memoryNotes: narrative.memoryNotes,
    storageRef: narrative.storageRef,
    checksum: narrative.checksum,
  });
}

export async function getDecisionNarrativeByDecisionId(
  userId: number,
  decisionId: string,
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(decisionNarratives)
    .where(
      and(
        eq(decisionNarratives.userId, userId),
        eq(decisionNarratives.decisionId, decisionId),
      ),
    )
    .limit(1);
  const row = result[0];
  if (!row) return null;
  return {
    id: row.narrativeId,
    decisionId: row.decisionId,
    fullText: row.fullText,
    summary: row.summary,
    optionsConsidered: safeParseJson(row.optionsConsidered, []),
    confidenceNotes: row.confidenceNotes ?? "",
    policyNotes: row.policyNotes ?? "",
    memoryNotes: row.memoryNotes ?? "",
    createdAt: row.createdAt.toISOString(),
    storageRef: row.storageRef ?? undefined,
    checksum: row.checksum ?? undefined,
  } satisfies DecisionNarrative;
}

export async function createPolicyGateEventRecord(
  userId: number,
  payload: PolicyGateResult & {
    id?: string;
    runId?: string;
    decisionId?: string;
    agentId?: number;
  },
) {
  const db = await getDb();
  if (!db) return { gateId: payload.id ?? nanoid(16) };

  const gateId = payload.id ?? nanoid(16);
  await db.insert(policyGateEvents).values({
    gateId,
    userId,
    runId: payload.runId ?? null,
    decisionId: payload.decisionId ?? null,
    agentId: payload.agentId ?? null,
    status: payload.status,
    reason: payload.reason,
    policyId: payload.policyId ?? null,
    policyName: payload.policyName ?? null,
    riskLevel: payload.riskLevel,
    requiredAction: payload.requiredAction ?? "none",
    metadata: asJson(payload.metadata),
  });
  return { gateId };
}

export async function listPolicyGateEventsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(policyGateEvents)
    .where(eq(policyGateEvents.userId, userId))
    .orderBy(desc(policyGateEvents.createdAt))
    .limit(limit);
}

export async function createMemoryUsageRecord(
  userId: number,
  payload: Omit<MemoryUsageRecord, "createdAt">,
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(memoryUsageRecords).values({
    usageId: payload.id,
    userId,
    agentId: payload.agentId ? Number(payload.agentId) : null,
    runId: payload.metadata?.runId ? String(payload.metadata.runId) : null,
    turnId: payload.turnId,
    memoryIds: asJson(payload.memoryIds),
    usedFor: payload.usedFor,
    influence: payload.influence,
    result: payload.result,
    metadata: asJson(payload.metadata),
  });
}

export async function listMemoryUsageByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(memoryUsageRecords)
    .where(eq(memoryUsageRecords.userId, userId))
    .orderBy(desc(memoryUsageRecords.createdAt))
    .limit(limit);
}

export async function createReflectionRecord(
  userId: number,
  payload: Omit<ReflectionRecord, "createdAt">,
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(reflectionRecords).values({
    reflectionId: payload.id,
    userId,
    runId: payload.runId,
    agentId: payload.agentId ? Number(payload.agentId) : null,
    autonomyLevel: payload.autonomyLevel,
    rootCause: payload.rootCause,
    correctiveAction: payload.correctiveAction,
    nextAction: payload.nextAction,
    neededHumanInput: payload.neededHumanInput ? 1 : 0,
    blockedByPolicy: payload.blockedByPolicy ? 1 : 0,
    improvedLaterRuns: payload.improvedLaterRuns ? 1 : 0,
    metadata: asJson(payload.metadata),
  });
}

export async function listReflectionsByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reflectionRecords)
    .where(eq(reflectionRecords.userId, userId))
    .orderBy(desc(reflectionRecords.createdAt))
    .limit(limit);
}

export async function createOrUpdateRunSummary(
  userId: number,
  payload: Omit<InsertAutonomyRunSummary, "userId">,
) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(autonomyRunSummaries)
    .values({ ...payload, userId })
    .onDuplicateKeyUpdate({
      set: {
        autonomyLevel: payload.autonomyLevel,
        score: payload.score,
        trend: payload.trend,
        status: payload.status,
        policyStatus: payload.policyStatus,
        humanInterventionRate: payload.humanInterventionRate,
        proofCompleteness: payload.proofCompleteness,
        confidenceAvg: payload.confidenceAvg,
        memoryInfluenceAvg: payload.memoryInfluenceAvg,
        reflectionReuseRate: payload.reflectionReuseRate,
        metadata: payload.metadata,
        updatedAt: new Date(),
      },
    });
}

export async function listRunSummariesByUser(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(autonomyRunSummaries)
    .where(eq(autonomyRunSummaries.userId, userId))
    .orderBy(desc(autonomyRunSummaries.createdAt))
    .limit(limit);
}

export async function getAutonomyMetrics(userId: number) {
  const [decisions, reflections, memory, receipts, runs, policyEvents] =
    await Promise.all([
      listDecisionRecordsByUser(userId, 500),
      listReflectionsByUser(userId, 500),
      listMemoryUsageByUser(userId, 500),
      getReceiptsByUser(userId),
      listRunSummariesByUser(userId, 200),
      listPolicyGateEventsByUser(userId, 500),
    ]);

  const totalDecisions = decisions.length;
  const manualOverrideCount = decisions.filter((x) => x.humanOverride).length;
  const blockedPolicies = policyEvents.filter(
    (x) => x.status === "blocked",
  ).length;
  const retrySuccessRate =
    reflections.length === 0
      ? 0
      : Math.round(
          (reflections.filter((x) => x.improvedLaterRuns === 1).length /
            reflections.length) *
            100,
        );
  const memoryReuseRate =
    memory.length === 0
      ? 0
      : Math.round(
          (memory.filter((x) => x.result !== "ignored").length /
            memory.length) *
            100,
        );
  const reflectionReuseRate =
    reflections.length === 0
      ? 0
      : Math.round(
          (reflections.filter((x) => x.improvedLaterRuns === 1).length /
            reflections.length) *
            100,
        );
  const proofCompletionRate =
    receipts.length === 0
      ? 0
      : Math.round(
          (receipts.filter((x) => x.transactionHash).length / receipts.length) *
            100,
        );
  const successRate =
    runs.length === 0
      ? 0
      : Math.round(
          (runs.filter((x) => x.status === "completed").length / runs.length) *
            100,
        );

  return {
    decisionCoverage: totalDecisions,
    manualOverrideRate:
      totalDecisions === 0
        ? 0
        : Math.round((manualOverrideCount / totalDecisions) * 100),
    policyBlockRate:
      policyEvents.length === 0
        ? 0
        : Math.round((blockedPolicies / policyEvents.length) * 100),
    retrySuccessRate,
    memoryReuseRate,
    reflectionReuseRate,
    proofCompletionRate,
    skillAutonomyScore:
      runs.length === 0
        ? 0
        : Math.round(runs.reduce((acc, r) => acc + r.score, 0) / runs.length),
    executionAutonomyScore:
      decisions.length === 0
        ? 0
        : Math.round(
            decisions.reduce((acc, r) => acc + r.confidence, 0) /
              decisions.length,
          ),
    reputationTrend:
      runs.length < 2
        ? "stable"
        : runs[0]!.score > runs[1]!.score
          ? "rising"
          : runs[0]!.score < runs[1]!.score
            ? "falling"
            : "stable",
    currentAutonomyLevel: runs[0]?.autonomyLevel ?? "meaningful_agency",
    runCount: runs.length,
    receiptCount: receipts.length,
  };
}

// Activity Log Helpers
export async function logActivity(
  userId: number,
  eventType: string,
  description: string,
  agentId?: number,
  metadata?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(activityLog).values({
    userId,
    agentId,
    eventType,
    description,
    metadata,
  });
}

export async function getActivityByUser(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}
