// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var skillStatusValues = [
  "draft",
  "published",
  "active",
  "paused",
  "deprecated",
  "archived"
];
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var solanaSessions = mysqlTable("solana_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  walletAddress: varchar("wallet_address", { length: 64 }).notNull().unique(),
  nonce: varchar("nonce", { length: 128 }).notNull(),
  signature: text("signature"),
  isVerified: int("is_verified").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "paused"]).default("inactive"),
  description: text("description"),
  onchainAddress: varchar("onchain_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var clawSkills = mysqlTable("claw_skills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  skillUid: varchar("skill_uid", { length: 64 }),
  programId: varchar("program_id", { length: 128 }).default("CLAW_SKILL_PROGRAM_V1"),
  registryAccount: varchar("registry_account", { length: 128 }),
  skillAccount: varchar("skill_account", { length: 128 }),
  currentVersionAccount: varchar("current_version_account", { length: 128 }),
  currentVersion: varchar("current_version", { length: 32 }).default("1.0.0"),
  authorWallet: varchar("author_wallet", { length: 128 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  tags: text("tags"),
  status: mysqlEnum("status", skillStatusValues).default("draft").notNull(),
  usageCount: int("usage_count").default(0).notNull(),
  successCount: int("success_count").default(0).notNull(),
  failureCount: int("failure_count").default(0).notNull(),
  reputationScore: int("reputation_score").default(0).notNull(),
  contentHash: varchar("content_hash", { length: 128 }),
  latestVersionHash: varchar("latest_version_hash", { length: 128 }),
  previousVersionAccount: varchar("previous_version_account", { length: 128 }),
  previousVersionHash: varchar("previous_version_hash", { length: 128 }),
  canonicalUri: text("canonical_uri"),
  metadataUri: text("metadata_uri"),
  storageRef: text("storage_ref"),
  proofRef: text("proof_ref"),
  notes: text("notes"),
  flags: text("flags"),
  chainId: int("chain_id").default(101).notNull(),
  explorerTxHash: varchar("explorer_tx_hash", { length: 128 }),
  explorerUrl: text("explorer_url"),
  publishedAt: timestamp("published_at"),
  lastUsedAt: timestamp("last_used_at"),
  lastResolvedAt: timestamp("last_resolved_at"),
  lastVerifiedAt: timestamp("last_verified_at"),
  syncState: mysqlEnum("sync_state", ["ok", "degraded", "offline"]).default("ok").notNull(),
  openClawCompatible: int("openclaw_compatible").default(0),
  manifestUrl: text("manifest_url"),
  onchainMetadata: text("onchain_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var clawSkillVersions = mysqlTable("claw_skill_versions", {
  id: int("id").autoincrement().primaryKey(),
  skillUid: varchar("skill_uid", { length: 64 }).notNull(),
  version: varchar("version", { length: 32 }).notNull(),
  versionAccount: varchar("version_account", { length: 128 }).notNull(),
  previousVersionAccount: varchar("previous_version_account", { length: 128 }),
  contentHash: varchar("content_hash", { length: 128 }).notNull(),
  authorWallet: varchar("author_wallet", { length: 128 }).notNull(),
  status: mysqlEnum("status", skillStatusValues).default("published").notNull(),
  description: text("description"),
  tags: text("tags"),
  changelog: text("changelog"),
  payload: text("payload"),
  canonicalUri: text("canonical_uri"),
  metadataUri: text("metadata_uri"),
  txHash: varchar("tx_hash", { length: 128 }),
  explorerUrl: text("explorer_url"),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var onchainReceipts = mysqlTable("onchain_receipts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id"),
  receiptType: mysqlEnum("receipt_type", [
    "plan",
    "execution",
    "reflection",
    "memory",
    "decision"
  ]),
  content: text("content"),
  autonomyLevel: mysqlEnum("autonomy_level", [
    "automation_only",
    "assisted",
    "guided",
    "policy_gated",
    "meaningful_agency",
    "near_autonomous",
    "fully_autonomous"
  ]),
  policyStatus: mysqlEnum("policy_status", [
    "not_required",
    "approved",
    "blocked",
    "overridden",
    "needs_review"
  ]),
  proofType: mysqlEnum("proof_type", [
    "plan",
    "decision",
    "execution",
    "reflection",
    "memory"
  ]),
  proofHash: varchar("proof_hash", { length: 128 }),
  referenceId: varchar("reference_id", { length: 128 }),
  transactionHash: varchar("transaction_hash", { length: 128 }),
  onchainAddress: varchar("onchain_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var autonomyConfigs = mysqlTable("autonomy_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  mode: mysqlEnum("mode", ["automation", "meaningful_agency", "full_autonomy"]).default("meaningful_agency").notNull(),
  level: mysqlEnum("level", [
    "automation_only",
    "assisted",
    "guided",
    "policy_gated",
    "meaningful_agency",
    "near_autonomous",
    "fully_autonomous"
  ]).default("meaningful_agency").notNull(),
  preferences: text("preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var autonomyRunSummaries = mysqlTable("autonomy_run_summaries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id"),
  runId: varchar("run_id", { length: 128 }).notNull().unique(),
  autonomyLevel: mysqlEnum("autonomy_level", [
    "automation_only",
    "assisted",
    "guided",
    "policy_gated",
    "meaningful_agency",
    "near_autonomous",
    "fully_autonomous"
  ]).notNull(),
  score: int("score").notNull(),
  trend: mysqlEnum("trend", ["rising", "stable", "falling"]).default("stable").notNull(),
  status: mysqlEnum("status", ["queued", "running", "blocked", "completed", "failed"]).default("queued").notNull(),
  policyStatus: mysqlEnum("policy_status", [
    "not_required",
    "approved",
    "blocked",
    "overridden",
    "needs_review"
  ]).default("not_required"),
  humanInterventionRate: int("human_intervention_rate").default(0).notNull(),
  proofCompleteness: int("proof_completeness").default(0).notNull(),
  confidenceAvg: int("confidence_avg").default(0).notNull(),
  memoryInfluenceAvg: int("memory_influence_avg").default(0).notNull(),
  reflectionReuseRate: int("reflection_reuse_rate").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});
var agentDecisionRecords = mysqlTable("agent_decision_records", {
  id: int("id").autoincrement().primaryKey(),
  decisionId: varchar("decision_id", { length: 128 }).notNull().unique(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id"),
  runId: varchar("run_id", { length: 128 }),
  skillId: varchar("skill_id", { length: 128 }),
  planId: varchar("plan_id", { length: 128 }),
  turnId: varchar("turn_id", { length: 128 }),
  decisionType: mysqlEnum("decision_type", [
    "skill_selection",
    "plan_selection",
    "tool_selection",
    "retry_strategy",
    "reflection_strategy",
    "memory_injection",
    "proof_anchor_strategy"
  ]).notNull(),
  autonomyLevel: mysqlEnum("autonomy_level", [
    "automation_only",
    "assisted",
    "guided",
    "policy_gated",
    "meaningful_agency",
    "near_autonomous",
    "fully_autonomous"
  ]).notNull(),
  decisionScope: varchar("decision_scope", { length: 255 }).notNull(),
  optionsConsidered: text("options_considered"),
  selectedOptionId: varchar("selected_option_id", { length: 128 }).notNull(),
  rationale: text("rationale").notNull(),
  confidence: int("confidence").notNull(),
  policyStatus: mysqlEnum("policy_status", [
    "not_required",
    "approved",
    "blocked",
    "overridden",
    "needs_review"
  ]).default("not_required").notNull(),
  humanOverride: int("human_override").default(0).notNull(),
  memoryUsed: text("memory_used"),
  proofReceiptId: varchar("proof_receipt_id", { length: 128 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var decisionNarratives = mysqlTable("decision_narratives", {
  id: int("id").autoincrement().primaryKey(),
  narrativeId: varchar("narrative_id", { length: 128 }).notNull().unique(),
  decisionId: varchar("decision_id", { length: 128 }).notNull(),
  userId: int("user_id").notNull(),
  fullText: text("full_text").notNull(),
  summary: text("summary").notNull(),
  optionsConsidered: text("options_considered"),
  confidenceNotes: text("confidence_notes"),
  policyNotes: text("policy_notes"),
  memoryNotes: text("memory_notes"),
  storageRef: varchar("storage_ref", { length: 255 }),
  checksum: varchar("checksum", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var policyGateEvents = mysqlTable("policy_gate_events", {
  id: int("id").autoincrement().primaryKey(),
  gateId: varchar("gate_id", { length: 128 }).notNull().unique(),
  userId: int("user_id").notNull(),
  runId: varchar("run_id", { length: 128 }),
  decisionId: varchar("decision_id", { length: 128 }),
  agentId: int("agent_id"),
  status: mysqlEnum("status", [
    "approved",
    "blocked",
    "review_required",
    "signature_required",
    "auto_allowed"
  ]).notNull(),
  reason: text("reason").notNull(),
  policyId: varchar("policy_id", { length: 128 }),
  policyName: varchar("policy_name", { length: 128 }),
  riskLevel: mysqlEnum("risk_level", ["low", "medium", "high", "critical"]).notNull(),
  requiredAction: mysqlEnum("required_action", [
    "none",
    "confirm",
    "sign",
    "review",
    "adjust_plan"
  ]).default("none").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var memoryUsageRecords = mysqlTable("memory_usage_records", {
  id: int("id").autoincrement().primaryKey(),
  usageId: varchar("usage_id", { length: 128 }).notNull().unique(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id"),
  runId: varchar("run_id", { length: 128 }),
  turnId: varchar("turn_id", { length: 128 }).notNull(),
  memoryIds: text("memory_ids"),
  usedFor: mysqlEnum("used_for", [
    "skill_selection",
    "plan_selection",
    "retry_strategy",
    "reflection",
    "tool_choice",
    "proof_strategy"
  ]).notNull(),
  influence: int("influence").notNull(),
  result: mysqlEnum("result", ["ignored", "used", "critical"]).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var reflectionRecords = mysqlTable("reflection_records", {
  id: int("id").autoincrement().primaryKey(),
  reflectionId: varchar("reflection_id", { length: 128 }).notNull().unique(),
  userId: int("user_id").notNull(),
  runId: varchar("run_id", { length: 128 }).notNull(),
  agentId: int("agent_id"),
  autonomyLevel: mysqlEnum("autonomy_level", [
    "automation_only",
    "assisted",
    "guided",
    "policy_gated",
    "meaningful_agency",
    "near_autonomous",
    "fully_autonomous"
  ]).notNull(),
  rootCause: text("root_cause").notNull(),
  correctiveAction: text("corrective_action").notNull(),
  nextAction: text("next_action").notNull(),
  neededHumanInput: int("needed_human_input").default(0).notNull(),
  blockedByPolicy: int("blocked_by_policy").default(0).notNull(),
  improvedLaterRuns: int("improved_later_runs").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id"),
  eventType: varchar("event_type", { length: 128 }).notNull(),
  description: text("description"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/db.ts
import { nanoid } from "nanoid";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
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
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
function safeParseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
function asJson(value) {
  return JSON.stringify(value ?? {});
}
var DEFAULT_AUTONOMY_CONFIG = {
  mode: "meaningful_agency",
  level: "meaningful_agency",
  preferences: {
    allowAutomaticSkillSelection: true,
    allowAutomaticRetries: true,
    requireHumanApprovalHighRisk: true,
    requireProofBeforeMemoryPromotion: false,
    requirePolicyBeforeExecution: true,
    safeTaskOnlyForFullAutonomy: true
  }
};
async function getAutonomyConfigByUser(userId) {
  const db = await getDb();
  if (!db) return DEFAULT_AUTONOMY_CONFIG;
  const result = await db.select().from(autonomyConfigs).where(eq(autonomyConfigs.userId, userId)).limit(1);
  const row = result[0];
  if (!row) return DEFAULT_AUTONOMY_CONFIG;
  return {
    mode: row.mode ?? DEFAULT_AUTONOMY_CONFIG.mode,
    level: row.level ?? DEFAULT_AUTONOMY_CONFIG.level,
    preferences: safeParseJson(row.preferences, {})
  };
}
async function upsertAutonomyConfig(userId, config) {
  const db = await getDb();
  if (!db) {
    return {
      ...DEFAULT_AUTONOMY_CONFIG,
      ...config,
      preferences: {
        ...DEFAULT_AUTONOMY_CONFIG.preferences,
        ...config.preferences ?? {}
      }
    };
  }
  const current = await getAutonomyConfigByUser(userId);
  const next = {
    mode: config.mode ?? current.mode,
    level: config.level ?? current.level,
    preferences: {
      ...current.preferences,
      ...config.preferences ?? {}
    }
  };
  const values = {
    userId,
    mode: next.mode,
    level: next.level,
    preferences: asJson(next.preferences)
  };
  await db.insert(autonomyConfigs).values(values).onDuplicateKeyUpdate({
    set: {
      mode: values.mode,
      level: values.level,
      preferences: values.preferences,
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
  return next;
}
async function createSolanaSession(userId, walletAddress, nonce, expiresAt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(solanaSessions).values({ userId, walletAddress, nonce, expiresAt });
  return result;
}
async function getSolanaSessionByWallet(walletAddress) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(solanaSessions).where(eq(solanaSessions.walletAddress, walletAddress)).limit(1);
  return result[0];
}
async function createAgent(userId, name, role, description) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agents).values({ userId, name, role, description });
  await logActivity(userId, "agent_created", `Created agent "${name}" with role "${role}".`);
}
async function getAgentsByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.userId, userId));
}
async function createReceipt(userId, receiptType, content, agentId, transactionHash, options) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const syntheticTx = transactionHash ?? `SIM_${nanoid(24)}`;
  await db.insert(onchainReceipts).values({
    userId,
    agentId,
    receiptType,
    content,
    transactionHash: syntheticTx,
    autonomyLevel: options?.autonomyLevel,
    policyStatus: options?.policyStatus,
    proofType: options?.proofType,
    proofHash: options?.proofHash,
    referenceId: options?.referenceId
  });
  await logActivity(
    userId,
    "receipt_anchored",
    `Anchored ${receiptType} receipt${options?.referenceId ? ` for ${options.referenceId}` : ""}.`,
    agentId
  );
  return { transactionHash: syntheticTx };
}
async function getReceiptsByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onchainReceipts).where(eq(onchainReceipts.userId, userId)).orderBy(desc(onchainReceipts.createdAt));
}
async function createDecisionRecord(userId, payload) {
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
    metadata: asJson(payload.metadata)
  });
  await logActivity(
    userId,
    "decision_recorded",
    `Decision ${payload.decisionType} recorded at ${payload.autonomyLevel}.`,
    payload.agentId ? Number(payload.agentId) : void 0,
    asJson({ confidence: payload.confidence, policyStatus: payload.policyStatus })
  );
}
async function listDecisionRecordsByUser(userId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(agentDecisionRecords).where(eq(agentDecisionRecords.userId, userId)).orderBy(desc(agentDecisionRecords.createdAt)).limit(limit);
  return rows.map((row) => ({
    id: row.decisionId,
    agentId: String(row.agentId ?? ""),
    skillId: row.skillId ?? void 0,
    planId: row.planId ?? void 0,
    turnId: row.turnId ?? void 0,
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
    proofReceiptId: row.proofReceiptId ?? void 0,
    metadata: safeParseJson(row.metadata, {})
  }));
}
async function createDecisionNarrativeRecord(userId, narrative) {
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
    checksum: narrative.checksum
  });
}
async function getDecisionNarrativeByDecisionId(userId, decisionId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(decisionNarratives).where(and(eq(decisionNarratives.userId, userId), eq(decisionNarratives.decisionId, decisionId))).limit(1);
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
    storageRef: row.storageRef ?? void 0,
    checksum: row.checksum ?? void 0
  };
}
async function createPolicyGateEventRecord(userId, payload) {
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
    metadata: asJson(payload.metadata)
  });
  return { gateId };
}
async function listPolicyGateEventsByUser(userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(policyGateEvents).where(eq(policyGateEvents.userId, userId)).orderBy(desc(policyGateEvents.createdAt)).limit(limit);
}
async function createMemoryUsageRecord(userId, payload) {
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
    metadata: asJson(payload.metadata)
  });
}
async function listMemoryUsageByUser(userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memoryUsageRecords).where(eq(memoryUsageRecords.userId, userId)).orderBy(desc(memoryUsageRecords.createdAt)).limit(limit);
}
async function createReflectionRecord(userId, payload) {
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
    metadata: asJson(payload.metadata)
  });
}
async function listReflectionsByUser(userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reflectionRecords).where(eq(reflectionRecords.userId, userId)).orderBy(desc(reflectionRecords.createdAt)).limit(limit);
}
async function createOrUpdateRunSummary(userId, payload) {
  const db = await getDb();
  if (!db) return;
  await db.insert(autonomyRunSummaries).values({ ...payload, userId }).onDuplicateKeyUpdate({
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
      updatedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function listRunSummariesByUser(userId, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(autonomyRunSummaries).where(eq(autonomyRunSummaries.userId, userId)).orderBy(desc(autonomyRunSummaries.createdAt)).limit(limit);
}
async function getAutonomyMetrics(userId) {
  const [decisions, reflections, memory, receipts, runs, policyEvents] = await Promise.all([
    listDecisionRecordsByUser(userId, 500),
    listReflectionsByUser(userId, 500),
    listMemoryUsageByUser(userId, 500),
    getReceiptsByUser(userId),
    listRunSummariesByUser(userId, 200),
    listPolicyGateEventsByUser(userId, 500)
  ]);
  const totalDecisions = decisions.length;
  const manualOverrideCount = decisions.filter((x) => x.humanOverride).length;
  const blockedPolicies = policyEvents.filter((x) => x.status === "blocked").length;
  const retrySuccessRate = reflections.length === 0 ? 0 : Math.round(
    reflections.filter((x) => x.improvedLaterRuns === 1).length / reflections.length * 100
  );
  const memoryReuseRate = memory.length === 0 ? 0 : Math.round(memory.filter((x) => x.result !== "ignored").length / memory.length * 100);
  const reflectionReuseRate = reflections.length === 0 ? 0 : Math.round(
    reflections.filter((x) => x.improvedLaterRuns === 1).length / reflections.length * 100
  );
  const proofCompletionRate = receipts.length === 0 ? 0 : Math.round(receipts.filter((x) => x.transactionHash).length / receipts.length * 100);
  const successRate2 = runs.length === 0 ? 0 : Math.round(runs.filter((x) => x.status === "completed").length / runs.length * 100);
  return {
    decisionCoverage: totalDecisions,
    manualOverrideRate: totalDecisions === 0 ? 0 : Math.round(manualOverrideCount / totalDecisions * 100),
    policyBlockRate: policyEvents.length === 0 ? 0 : Math.round(blockedPolicies / policyEvents.length * 100),
    retrySuccessRate,
    memoryReuseRate,
    reflectionReuseRate,
    proofCompletionRate,
    skillAutonomyScore: runs.length === 0 ? 0 : Math.round(runs.reduce((acc, r) => acc + r.score, 0) / runs.length),
    executionAutonomyScore: decisions.length === 0 ? 0 : Math.round(decisions.reduce((acc, r) => acc + r.confidence, 0) / decisions.length),
    reputationTrend: runs.length < 2 ? "stable" : runs[0].score > runs[1].score ? "rising" : runs[0].score < runs[1].score ? "falling" : "stable",
    currentAutonomyLevel: runs[0]?.autonomyLevel ?? "meaningful_agency",
    runCount: runs.length,
    receiptCount: receipts.length
  };
}
async function logActivity(userId, eventType, description, agentId, metadata) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(activityLog).values({
    userId,
    agentId,
    eventType,
    description,
    metadata
  });
}
async function getActivityByUser(userId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLog).where(eq(activityLog.userId, userId)).orderBy(desc(activityLog.createdAt)).limit(limit);
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url || typeof url !== "string") {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// shared/autonomy.ts
var AUTONOMY_MODE_PRESETS = [
  {
    mode: "automation",
    label: "Automation only",
    defaultLevel: "automation_only",
    description: "Predictable workflows with explicit human approvals for most actions."
  },
  {
    mode: "meaningful_agency",
    label: "Meaningful agency",
    defaultLevel: "meaningful_agency",
    description: "Agent selects skills and plans while policy gates and risk thresholds remain active."
  },
  {
    mode: "full_autonomy",
    label: "Full autonomy",
    defaultLevel: "fully_autonomous",
    description: "Agent manages end-to-end execution and requests approvals only for high-risk steps."
  }
];
var AUTONOMY_PROFILES = {
  automation_only: {
    level: "automation_only",
    score: 10,
    canDecideSkill: false,
    canDecidePlan: false,
    canChooseTools: false,
    canRetryOnFailure: false,
    canWriteMemory: false,
    canAnchorProof: true,
    requiresHumanApproval: true,
    requiresPolicyCheck: true,
    requiresWalletSignature: true,
    decisionScope: "Execution-only automation of user-selected actions",
    explanation: "Agent executes deterministic steps and waits for manual steering.",
    badgeVariant: "outline",
    backendEnforcement: "manual"
  },
  assisted: {
    level: "assisted",
    score: 25,
    canDecideSkill: false,
    canDecidePlan: true,
    canChooseTools: false,
    canRetryOnFailure: false,
    canWriteMemory: false,
    canAnchorProof: true,
    requiresHumanApproval: true,
    requiresPolicyCheck: true,
    requiresWalletSignature: true,
    decisionScope: "Plan suggestions with mandatory user confirmation",
    explanation: "Agent assists with planning but does not act independently.",
    badgeVariant: "outline",
    backendEnforcement: "manual"
  },
  guided: {
    level: "guided",
    score: 40,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: false,
    canRetryOnFailure: false,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: true,
    requiresPolicyCheck: true,
    requiresWalletSignature: false,
    decisionScope: "Skill and plan decisions under user supervision",
    explanation: "Agent proposes and revises decisions while user remains in loop.",
    badgeVariant: "secondary",
    backendEnforcement: "guarded"
  },
  policy_gated: {
    level: "policy_gated",
    score: 55,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: true,
    canRetryOnFailure: true,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: false,
    requiresPolicyCheck: true,
    requiresWalletSignature: false,
    decisionScope: "Autonomous decisions constrained by policy outcomes",
    explanation: "Agent can act independently when policy permits the step.",
    badgeVariant: "secondary",
    backendEnforcement: "guarded"
  },
  meaningful_agency: {
    level: "meaningful_agency",
    score: 70,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: true,
    canRetryOnFailure: true,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: false,
    requiresPolicyCheck: true,
    requiresWalletSignature: false,
    decisionScope: "Independent planning and execution with selective approvals",
    explanation: "Agent self-directs most work and escalates risk-sensitive actions.",
    badgeVariant: "default",
    backendEnforcement: "guarded"
  },
  near_autonomous: {
    level: "near_autonomous",
    score: 85,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: true,
    canRetryOnFailure: true,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: false,
    requiresPolicyCheck: true,
    requiresWalletSignature: false,
    decisionScope: "End-to-end operation with rare review checkpoints",
    explanation: "Agent handles almost all decisions and self-heals through reflection.",
    badgeVariant: "default",
    backendEnforcement: "autonomous"
  },
  fully_autonomous: {
    level: "fully_autonomous",
    score: 100,
    canDecideSkill: true,
    canDecidePlan: true,
    canChooseTools: true,
    canRetryOnFailure: true,
    canWriteMemory: true,
    canAnchorProof: true,
    requiresHumanApproval: false,
    requiresPolicyCheck: false,
    requiresWalletSignature: false,
    decisionScope: "Agent-owned orchestration with continuous proof output",
    explanation: "Agent manages the complete workflow and emits auditable receipts.",
    badgeVariant: "default",
    backendEnforcement: "autonomous"
  }
};
var AUTONOMY_SPECTRUM = [
  "automation_only",
  "assisted",
  "guided",
  "policy_gated",
  "meaningful_agency",
  "near_autonomous",
  "fully_autonomous"
];

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/autonomy.ts
import { nanoid as nanoid2 } from "nanoid";
function policyActionFromRisk(riskLevel) {
  switch (riskLevel) {
    case "critical":
      return "review";
    case "high":
      return "confirm";
    case "medium":
      return "adjust_plan";
    case "low":
    default:
      return "none";
  }
}
function evaluatePolicyGate(input) {
  const profile = AUTONOMY_PROFILES[input.autonomyLevel];
  const requireSignature = typeof input.userPreference?.requireSignatureAboveValue === "number" && (input.valueAtRisk ?? 0) >= input.userPreference.requireSignatureAboveValue;
  if (input.userPreference?.forceManualReview) {
    return {
      allowed: false,
      status: "review_required",
      reason: "Workspace preference requires manual review.",
      policyId: "workspace.manual_review",
      policyName: "Workspace Manual Review",
      riskLevel: input.riskLevel,
      requiredAction: "review",
      metadata: { forcedByUserPreference: true }
    };
  }
  if (requireSignature || profile.requiresWalletSignature) {
    return {
      allowed: false,
      status: "signature_required",
      reason: "Action requires a wallet signature before execution.",
      policyId: "wallet.signature.required",
      policyName: "Signature Gate",
      riskLevel: input.riskLevel,
      requiredAction: "sign",
      metadata: { valueAtRisk: input.valueAtRisk ?? 0 }
    };
  }
  if (input.riskLevel === "critical" && input.confidence < 80) {
    return {
      allowed: false,
      status: "blocked",
      reason: "Critical-risk action blocked due to low confidence.",
      policyId: "risk.critical.confidence",
      policyName: "Critical Confidence Gate",
      riskLevel: "critical",
      requiredAction: "review",
      metadata: { confidence: input.confidence }
    };
  }
  if (profile.requiresHumanApproval && input.riskLevel !== "low") {
    return {
      allowed: false,
      status: "review_required",
      reason: "Human approval is required for this autonomy level.",
      policyId: "autonomy.human_approval",
      policyName: "Autonomy Human Gate",
      riskLevel: input.riskLevel,
      requiredAction: policyActionFromRisk(input.riskLevel),
      metadata: { autonomyLevel: input.autonomyLevel }
    };
  }
  if (profile.requiresPolicyCheck) {
    return {
      allowed: true,
      status: input.riskLevel === "low" ? "auto_allowed" : "approved",
      reason: "Policy check passed.",
      policyId: "policy.default",
      policyName: "Default Runtime Policy",
      riskLevel: input.riskLevel,
      requiredAction: "none",
      metadata: { confidence: input.confidence }
    };
  }
  return {
    allowed: true,
    status: "auto_allowed",
    reason: "Execution is fully autonomous.",
    policyId: "autonomy.full",
    policyName: "Full Autonomy",
    riskLevel: input.riskLevel,
    requiredAction: "none",
    metadata: { confidence: input.confidence }
  };
}
function clamp100(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function calculateAutonomyScore(inputs) {
  const score = clamp100(
    inputs.independentDecisionRate * 0.2 + (100 - inputs.manualInterventionRate) * 0.16 + inputs.memoryUseRate * 0.12 + inputs.reflectionReuseRate * 0.12 + inputs.policyPassRate * 0.1 + inputs.proofCompleteness * 0.1 + inputs.successRate * 0.1 + inputs.confidenceCalibration * 0.1
  );
  const label = score < 35 ? "automation" : score < 55 ? "assisted" : score < 80 ? "agency" : "autonomous";
  return {
    score,
    label,
    trend: "stable",
    explanation: label === "autonomous" ? "The runtime is operating with minimal intervention and complete proof trails." : label === "agency" ? "The runtime makes meaningful choices while staying policy-governed." : label === "assisted" ? "The runtime contributes planning decisions but still needs regular supervision." : "The runtime mostly automates user-selected steps."
  };
}
function resolveAutonomyLevelForMode(mode) {
  return AUTONOMY_MODE_PRESETS.find((preset) => preset.mode === mode)?.defaultLevel ?? "meaningful_agency";
}
function nextAutonomyLevel(level) {
  const index = AUTONOMY_SPECTRUM.indexOf(level);
  if (index < 0 || index === AUTONOMY_SPECTRUM.length - 1) return level;
  return AUTONOMY_SPECTRUM[index + 1];
}
function createDecisionDraft(input) {
  return {
    id: nanoid2(16),
    agentId: input.agentId,
    decisionType: input.decisionType,
    autonomyLevel: input.autonomyLevel,
    decisionScope: input.decisionScope,
    optionsConsidered: input.options,
    selectedOptionId: input.selectedOptionId,
    rationale: input.rationale,
    confidence: clamp100(input.confidence),
    policyStatus: input.policyStatus,
    humanOverride: input.humanOverride,
    memoryUsed: input.memoryUsed ?? [],
    metadata: input.metadata ?? {}
  };
}
function createDecisionNarrative(decisionId, rationale, options, confidenceNotes, policyNotes, memoryNotes) {
  return {
    id: nanoid2(16),
    decisionId,
    fullText: rationale,
    summary: rationale.slice(0, 180),
    optionsConsidered: options.map((option) => ({
      id: option.id,
      label: option.label,
      pros: option.reason ? [option.reason] : [],
      cons: []
    })),
    confidenceNotes,
    policyNotes,
    memoryNotes,
    checksum: `chk_${nanoid2(24)}`
  };
}
function createMemoryUsageDraft(input) {
  return {
    id: nanoid2(16),
    agentId: input.agentId,
    turnId: input.turnId,
    memoryIds: input.memoryIds,
    usedFor: input.usedFor,
    influence: clamp100(input.influence),
    result: input.result,
    metadata: {
      runId: input.runId,
      source: "runtime"
    }
  };
}
function createReflectionDraft(input) {
  return {
    id: nanoid2(16),
    agentId: input.agentId,
    runId: input.runId,
    autonomyLevel: input.autonomyLevel,
    rootCause: input.rootCause,
    correctiveAction: input.correctiveAction,
    nextAction: input.nextAction,
    neededHumanInput: input.neededHumanInput,
    blockedByPolicy: input.blockedByPolicy,
    improvedLaterRuns: input.improvedLaterRuns,
    metadata: { source: "reflection_engine" }
  };
}

// server/skills/skillRegistryService.ts
import crypto2 from "crypto";
import { and as and2, desc as desc2, eq as eq2 } from "drizzle-orm";
import { nanoid as nanoid3 } from "nanoid";
var DEFAULT_PROGRAM_ID = "CLAW_SKILL_PROGRAM_V1";
var DEFAULT_REGISTRY_ACCOUNT = "CLAW_REGISTRY_DEVNET";
var DEFAULT_CHAIN_ID = Number(process.env.SOLANA_CHAIN_ID || 101);
var statusTransitions = {
  draft: ["published"],
  published: ["active", "paused", "deprecated", "archived"],
  active: ["paused", "deprecated", "archived"],
  paused: ["active", "deprecated", "archived"],
  deprecated: ["archived"],
  archived: []
};
function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
function shortHash(value) {
  return crypto2.createHash("sha256").update(value).digest("hex");
}
function contentHash(input) {
  return shortHash(
    JSON.stringify({
      name: input.name,
      description: input.description,
      tags: [...input.tags].sort(),
      version: input.version,
      authorWallet: input.authorWallet,
      payload: input.payload ?? {},
      canonicalUri: input.canonicalUri ?? "",
      metadataUri: input.metadataUri ?? ""
    })
  );
}
function successRate(successCount, failureCount) {
  const total = successCount + failureCount;
  if (total === 0) return 0;
  return Number((successCount / total * 100).toFixed(2));
}
function calcReputation(usageCount, skillSuccessRate, lastUsedAt) {
  const usageWeight = Math.min(60, usageCount * 1.2);
  const successWeight = skillSuccessRate * 0.35;
  const recencyPenalty = lastUsedAt ? Math.max(0, (Date.now() - lastUsedAt.getTime()) / (1e3 * 60 * 60 * 24 * 30)) : 8;
  const recencyWeight = Math.max(0, 20 - recencyPenalty);
  return Number(Math.max(0, Math.min(100, usageWeight + successWeight + recencyWeight)).toFixed(2));
}
function bumpVersion(currentVersion, bump = "patch") {
  const [major, minor, patch] = currentVersion.split(".").map((part) => Number.parseInt(part, 10)).map((part) => Number.isFinite(part) ? part : 0);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}
function shouldFailChain() {
  return process.env.SKILL_CHAIN_FORCE_FAIL === "1";
}
async function mockChainPublish(skillUid, versionAccount, hash2) {
  if (shouldFailChain()) throw new Error("chain_unavailable");
  const txHash = shortHash(`${skillUid}:${versionAccount}:${hash2}`).slice(0, 64);
  return {
    txHash,
    explorerUrl: `https://explorer.solana.com/tx/${txHash}?cluster=devnet`
  };
}
function rowToAsset(row) {
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
    status: row.status,
    usageCount: row.usageCount,
    successCount: row.successCount,
    failureCount: row.failureCount,
    successRate: skillSuccessRate,
    reputationScore: row.reputationScore,
    contentHash: row.contentHash || "",
    canonicalUri: row.canonicalUri || void 0,
    metadataUri: row.metadataUri || void 0,
    publishedAt: (row.publishedAt || row.createdAt).toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastUsedAt: row.lastUsedAt?.toISOString(),
    lastResolvedAt: row.lastResolvedAt?.toISOString(),
    latestVersionHash: row.latestVersionHash || row.contentHash || "",
    previousVersionAccount: row.previousVersionAccount || void 0,
    previousVersionHash: row.previousVersionHash || void 0,
    chainId: row.chainId || DEFAULT_CHAIN_ID,
    explorerTxHash: row.explorerTxHash || void 0,
    explorerUrl: row.explorerUrl || void 0,
    storageRef: row.storageRef || void 0,
    proofRef: row.proofRef || void 0,
    notes: row.notes || void 0,
    flags: parseJsonArray(row.flags)
  };
}
var SkillRegistryService = class {
  constructor(userId) {
    this.userId = userId;
  }
  async migrateLegacySkills() {
    const db = await getDb();
    if (!db) return;
    const rows = await db.select().from(clawSkills).where(eq2(clawSkills.userId, this.userId));
    const legacyRows = rows.filter((row) => !row.skillUid);
    for (const row of legacyRows) {
      const skillUid = `skill_${nanoid3(12)}`;
      const version = "1.0.0";
      const authorWallet = row.authorWallet || `legacy_wallet_${this.userId}`;
      const tags = parseJsonArray(row.tags);
      const hash2 = contentHash({
        name: row.name,
        description: row.description || "",
        tags,
        version,
        authorWallet
      });
      const versionAccount = `ver_${shortHash(`${skillUid}:${version}`).slice(0, 32)}`;
      const skillAccount = `skillacc_${shortHash(skillUid).slice(0, 32)}`;
      await db.insert(clawSkillVersions).values({
        skillUid,
        version,
        versionAccount,
        contentHash: hash2,
        authorWallet,
        status: "published",
        description: row.description || "",
        tags: JSON.stringify(tags),
        payload: JSON.stringify({ migratedFromLegacy: true, legacyId: row.id }),
        publishedAt: row.createdAt
      });
      await db.update(clawSkills).set({
        skillUid,
        programId: row.programId || DEFAULT_PROGRAM_ID,
        registryAccount: row.registryAccount || DEFAULT_REGISTRY_ACCOUNT,
        skillAccount,
        currentVersionAccount: versionAccount,
        currentVersion: row.currentVersion || version,
        authorWallet,
        status: row.status || "published",
        contentHash: hash2,
        latestVersionHash: hash2,
        chainId: row.chainId || DEFAULT_CHAIN_ID,
        publishedAt: row.publishedAt || row.createdAt
      }).where(eq2(clawSkills.id, row.id));
    }
  }
  async health() {
    const db = await getDb();
    return {
      ok: true,
      mode: db ? "database" : "fallback",
      chain: shouldFailChain() ? "degraded" : "healthy",
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  async list(query) {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) return [];
    let skills = (await db.select().from(clawSkills).where(eq2(clawSkills.userId, this.userId))).map(rowToAsset);
    const search = query?.search?.trim().toLowerCase();
    if (search) {
      skills = skills.filter(
        (skill) => skill.name.toLowerCase().includes(search) || skill.description.toLowerCase().includes(search) || skill.tags.some((tag) => tag.toLowerCase().includes(search)) || skill.authorWallet.toLowerCase().includes(search) || skill.contentHash.toLowerCase().includes(search)
      );
    }
    if (query?.status && query.status !== "all") {
      skills = skills.filter((skill) => skill.status === query.status);
    }
    if (query?.authorWallet) {
      skills = skills.filter((skill) => skill.authorWallet === query.authorWallet);
    }
    if (query?.tag) {
      skills = skills.filter((skill) => skill.tags.includes(query.tag));
    }
    const minReputation = query?.minReputation;
    if (minReputation !== void 0) {
      skills = skills.filter((skill) => skill.reputationScore >= minReputation);
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
  async getById(skillId) {
    const skills = await this.list();
    return skills.find((skill) => skill.id === skillId) || null;
  }
  async versions(skillId) {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(clawSkillVersions).where(eq2(clawSkillVersions.skillUid, skillId)).orderBy(desc2(clawSkillVersions.publishedAt));
    return rows.map((row) => ({
      id: `${row.skillUid}:${row.version}`,
      skillId: row.skillUid,
      version: row.version,
      versionAccount: row.versionAccount,
      previousVersionAccount: row.previousVersionAccount || void 0,
      hash: row.contentHash,
      authorWallet: row.authorWallet,
      description: row.description || "",
      tags: parseJsonArray(row.tags),
      changelog: row.changelog || void 0,
      payload: row.payload ? JSON.parse(row.payload) : void 0,
      status: row.status,
      canonicalUri: row.canonicalUri || void 0,
      metadataUri: row.metadataUri || void 0,
      publishedAt: row.publishedAt.toISOString(),
      txHash: row.txHash || void 0,
      explorerUrl: row.explorerUrl || void 0
    }));
  }
  async publish(input) {
    const db = await getDb();
    if (!db) throw new Error("Skill publish requires database mode");
    const skillUid = `skill_${nanoid3(12)}`;
    const version = "1.0.0";
    const versionAccount = `ver_${shortHash(`${skillUid}:${version}`).slice(0, 32)}`;
    const skillAccount = `skillacc_${shortHash(skillUid).slice(0, 32)}`;
    const tags = (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
    const hash2 = contentHash({
      name: input.name,
      description: input.description || "",
      tags,
      version,
      authorWallet: input.authorWallet,
      payload: input.payload,
      canonicalUri: input.canonicalUri,
      metadataUri: input.metadataUri
    });
    let txHash;
    let explorerUrl;
    let chainConfirmed = true;
    try {
      const chain = await mockChainPublish(skillUid, versionAccount, hash2);
      txHash = chain.txHash;
      explorerUrl = chain.explorerUrl;
    } catch {
      chainConfirmed = false;
    }
    const now5 = /* @__PURE__ */ new Date();
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
      contentHash: hash2,
      latestVersionHash: hash2,
      canonicalUri: input.canonicalUri,
      metadataUri: input.metadataUri,
      storageRef: input.storageRef,
      notes: input.notes,
      chainId: DEFAULT_CHAIN_ID,
      explorerTxHash: txHash,
      explorerUrl,
      publishedAt: now5,
      syncState: chainConfirmed ? "ok" : "degraded",
      flags: JSON.stringify(chainConfirmed ? [] : ["chain_degraded"])
    });
    await db.insert(clawSkillVersions).values({
      skillUid,
      version,
      versionAccount,
      contentHash: hash2,
      authorWallet: input.authorWallet,
      status: input.status || "published",
      description: input.description || "",
      tags: JSON.stringify(tags),
      payload: JSON.stringify(input.payload ?? {}),
      canonicalUri: input.canonicalUri,
      metadataUri: input.metadataUri,
      txHash,
      explorerUrl,
      publishedAt: now5
    });
    return {
      skillId: skillUid,
      version,
      versionAccount,
      contentHash: hash2,
      txHash,
      explorerUrl,
      chainConfirmed,
      duplicateContent: false,
      requestId: `req_${nanoid3(8)}`
    };
  }
  async update(input) {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) throw new Error("Skill update requires database mode");
    const row = (await db.select().from(clawSkills).where(and2(eq2(clawSkills.userId, this.userId), eq2(clawSkills.skillUid, input.skillId))).limit(1))[0];
    if (!row) throw new Error("Skill not found");
    const nextVersion = input.version || bumpVersion(row.currentVersion || "1.0.0", input.versionBump);
    const nextDescription = input.description ?? row.description ?? "";
    const nextTags = input.tags ?? parseJsonArray(row.tags);
    const nextVersionAccount = `ver_${shortHash(`${input.skillId}:${nextVersion}`).slice(0, 32)}`;
    const hash2 = contentHash({
      name: row.name,
      description: nextDescription,
      tags: nextTags,
      version: nextVersion,
      authorWallet: row.authorWallet || "",
      payload: input.payload,
      canonicalUri: input.canonicalUri ?? row.canonicalUri ?? void 0,
      metadataUri: input.metadataUri ?? row.metadataUri ?? void 0
    });
    const dup = (await db.select().from(clawSkillVersions).where(
      and2(eq2(clawSkillVersions.skillUid, input.skillId), eq2(clawSkillVersions.contentHash, hash2))
    ).limit(1))[0];
    if (dup) {
      return {
        skillId: input.skillId,
        version: dup.version,
        versionAccount: dup.versionAccount,
        contentHash: hash2,
        txHash: dup.txHash || void 0,
        explorerUrl: dup.explorerUrl || void 0,
        chainConfirmed: Boolean(dup.txHash),
        duplicateContent: true,
        requestId: `req_${nanoid3(8)}`
      };
    }
    let txHash;
    let explorerUrl;
    let chainConfirmed = true;
    try {
      const chain = await mockChainPublish(input.skillId, nextVersionAccount, hash2);
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
      contentHash: hash2,
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
      publishedAt: /* @__PURE__ */ new Date()
    });
    const nextSuccessRate = successRate(row.successCount, row.failureCount);
    await db.update(clawSkills).set({
      description: nextDescription,
      tags: JSON.stringify(nextTags),
      currentVersion: nextVersion,
      previousVersionAccount: row.currentVersionAccount,
      previousVersionHash: row.latestVersionHash || row.contentHash || null,
      currentVersionAccount: nextVersionAccount,
      contentHash: hash2,
      latestVersionHash: hash2,
      canonicalUri: input.canonicalUri ?? row.canonicalUri,
      metadataUri: input.metadataUri ?? row.metadataUri,
      storageRef: input.storageRef ?? row.storageRef,
      notes: input.notes ?? row.notes,
      explorerTxHash: txHash,
      explorerUrl,
      syncState: chainConfirmed ? "ok" : "degraded",
      reputationScore: calcReputation(row.usageCount, nextSuccessRate, row.lastUsedAt),
      flags: JSON.stringify(chainConfirmed ? [] : ["chain_degraded"])
    }).where(eq2(clawSkills.id, row.id));
    return {
      skillId: input.skillId,
      version: nextVersion,
      versionAccount: nextVersionAccount,
      contentHash: hash2,
      txHash,
      explorerUrl,
      chainConfirmed,
      duplicateContent: false,
      requestId: `req_${nanoid3(8)}`
    };
  }
  async setStatus(skillId, status) {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) throw new Error("Status transition requires database mode");
    const row = (await db.select().from(clawSkills).where(and2(eq2(clawSkills.userId, this.userId), eq2(clawSkills.skillUid, skillId))).limit(1))[0];
    if (!row) throw new Error("Skill not found");
    if (!statusTransitions[row.status].includes(status)) {
      throw new Error(`Invalid status transition: ${row.status} -> ${status}`);
    }
    await db.update(clawSkills).set({ status }).where(eq2(clawSkills.id, row.id));
    await db.update(clawSkillVersions).set({ status }).where(and2(eq2(clawSkillVersions.skillUid, skillId), eq2(clawSkillVersions.versionAccount, row.currentVersionAccount)));
    return { ok: true };
  }
  async recordUsage(input) {
    await this.migrateLegacySkills();
    const db = await getDb();
    if (!db) throw new Error("Usage update requires database mode");
    const row = (await db.select().from(clawSkills).where(and2(eq2(clawSkills.userId, this.userId), eq2(clawSkills.skillUid, input.skillId))).limit(1))[0];
    if (!row) throw new Error("Skill not found");
    const usageCount = row.usageCount + 1;
    const successCount = row.successCount + (input.success ? 1 : 0);
    const failureCount = row.failureCount + (input.success ? 0 : 1);
    const skillSuccessRate = successRate(successCount, failureCount);
    const lastResolvedAt = input.resolvedAt ? new Date(input.resolvedAt) : /* @__PURE__ */ new Date();
    await db.update(clawSkills).set({
      usageCount,
      successCount,
      failureCount,
      lastUsedAt: /* @__PURE__ */ new Date(),
      lastResolvedAt,
      reputationScore: calcReputation(usageCount, skillSuccessRate, /* @__PURE__ */ new Date())
    }).where(eq2(clawSkills.id, row.id));
    return {
      skillId: input.skillId,
      usageCount,
      successCount,
      failureCount,
      successRate: skillSuccessRate,
      lastUsedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastResolvedAt: lastResolvedAt.toISOString()
    };
  }
  async reputation(skillId) {
    const skill = await this.getById(skillId);
    if (!skill) throw new Error("Skill not found");
    return {
      skillId,
      reputationScore: skill.reputationScore,
      calculatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      factors: {
        usageWeight: Math.min(60, skill.usageCount * 1.2),
        successWeight: skill.successRate * 0.35,
        recencyWeight: skill.lastUsedAt ? 20 : 5
      }
    };
  }
  async verify(skillId) {
    const skill = await this.getById(skillId);
    if (!skill) throw new Error("Skill not found");
    const versions = await this.versions(skillId);
    const current = versions.find((version) => version.version === skill.currentVersion) || versions[0];
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
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};

// server/memory/runtime.ts
import path2 from "path";

// server/memory/service.ts
import { nanoid as nanoid4 } from "nanoid";

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash2 = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash2}`;
  return `${relKey.slice(0, lastDot)}_${hash2}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/memory/hash.ts
import crypto3 from "crypto";
function normalizeValue(input) {
  if (input === null || typeof input === "boolean" || typeof input === "number" || typeof input === "string") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => normalizeValue(item));
  }
  if (input && typeof input === "object") {
    const sorted = {};
    for (const key of Object.keys(input).sort()) {
      const value = input[key];
      if (typeof value === "undefined") continue;
      sorted[key] = normalizeValue(value);
    }
    return sorted;
  }
  return String(input);
}
function canonicalize(input) {
  return JSON.stringify(normalizeValue(input));
}
function sha256Hex(input) {
  return crypto3.createHash("sha256").update(input).digest("hex");
}
function hashCanonical(input) {
  return sha256Hex(canonicalize(input));
}
function hashText(input) {
  return sha256Hex(input.trim());
}

// server/memory/service.ts
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function unixNow() {
  return Math.floor(Date.now() / 1e3);
}
function buildStructuredReflection(input) {
  return {
    rootCause: input.rootCause,
    failureMode: input.kind === "failure" ? "execution_failure" : void 0,
    correctiveAdvice: input.correctiveAdvice,
    nextTurnInjection: input.nextAction,
    lessonSummary: input.summary,
    confidence: Math.max(0, Math.min(1, input.structured?.confidence ?? 0.75)),
    reusable: input.structured?.reusable ?? true,
    priority: input.structured?.priority ?? (input.kind === "failure" ? "high" : "normal")
  };
}
function toStoragePayload(record) {
  return {
    id: record.id,
    version: record.version,
    agentId: record.agentId,
    conversationId: record.conversationId,
    sourceTurnId: record.sourceTurnId,
    parentReceiptId: record.parentReceiptId,
    kind: record.kind,
    title: record.title,
    summary: record.summary,
    fullText: record.fullText,
    rootCause: record.rootCause,
    correctiveAdvice: record.correctiveAdvice,
    nextAction: record.nextAction,
    tags: record.tags,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    payloadHash: record.payloadHash,
    sourceContextHash: record.sourceContextHash,
    visibility: record.visibility,
    structured: record.structured
  };
}
var MemoryReceiptService = class {
  constructor(store, options) {
    this.store = store;
    this.options = options;
  }
  async createReflection(input) {
    const now5 = nowIso();
    const id = `refl_${nanoid4(14)}`;
    const structured = buildStructuredReflection(input);
    const payloadHash = hashCanonical({
      kind: input.kind,
      summary: input.summary,
      fullText: input.fullText,
      rootCause: input.rootCause,
      correctiveAdvice: input.correctiveAdvice,
      nextAction: input.nextAction,
      structured
    });
    const sourceContextHash = hashCanonical({
      sourceTurnId: input.sourceTurnId,
      agentId: input.agentId,
      conversationId: input.conversationId || null,
      parentReceiptId: input.parentReceiptId || null
    });
    const baseRecord = {
      id,
      version: 1,
      agentId: input.agentId,
      conversationId: input.conversationId,
      sourceTurnId: input.sourceTurnId,
      parentReceiptId: input.parentReceiptId,
      kind: input.kind,
      title: input.title,
      summary: input.summary,
      fullText: input.fullText,
      rootCause: input.rootCause,
      correctiveAdvice: input.correctiveAdvice,
      nextAction: input.nextAction,
      tags: input.tags?.slice(0, 20) || [],
      createdAt: now5,
      updatedAt: now5,
      payloadHash,
      sourceContextHash,
      visibility: input.visibility ?? this.options.defaultVisibility ?? "workspace",
      structured
    };
    let storageRef = `app://memory/reflections/${id}.json`;
    let storageChecksum = hashCanonical(toStoragePayload(baseRecord));
    let degraded = false;
    try {
      const upload = await storagePut(
        `memory-reflections/${id}.json`,
        JSON.stringify(toStoragePayload(baseRecord), null, 2),
        "application/json"
      );
      storageRef = upload.url;
      storageChecksum = hashText(upload.key);
    } catch {
      degraded = true;
    }
    const reflection = {
      ...baseRecord,
      storageRef,
      storageChecksum
    };
    await this.store.saveReflection(reflection);
    await this.pushEvent({
      reflectionId: reflection.id,
      kind: "reflection_created",
      message: "Reflection captured off-chain.",
      data: {
        agentId: reflection.agentId,
        sourceTurnId: reflection.sourceTurnId
      }
    });
    await this.pushEvent({
      reflectionId: reflection.id,
      kind: "reflection_stored",
      message: degraded ? "Reflection stored in local app storage (degraded remote storage)." : "Reflection stored in app storage.",
      data: {
        storageRef: reflection.storageRef,
        storageChecksum: reflection.storageChecksum,
        degraded
      }
    });
    return {
      reflection,
      status: {
        reflectionId: reflection.id,
        status: degraded ? "degraded" : "stored",
        message: degraded ? "Stored locally; remote storage unavailable." : "Full reflection persisted off-chain."
      }
    };
  }
  async anchorReflection(reflectionId, wallet) {
    const reflection = await this.store.getReflection(reflectionId);
    if (!reflection) throw new Error("reflection_not_found");
    const existing = await this.store.getReceiptByReflectionId(reflectionId);
    if (existing) return existing;
    const sourceTurnIdHash = hashText(reflection.sourceTurnId);
    const parentReceiptIdHash = reflection.parentReceiptId ? hashText(reflection.parentReceiptId) : void 0;
    const summaryHash = hashText(reflection.summary);
    const nextActionHash = hashText(reflection.nextAction);
    const storageRefHash = hashText(reflection.storageRef || "");
    const receipt = {
      id: `mr_${nanoid4(14)}`,
      version: 1,
      agentId: reflection.agentId,
      wallet: wallet || this.options.defaultWallet,
      sourceTurnIdHash,
      parentReceiptIdHash,
      reflectionHash: reflection.payloadHash,
      summaryHash,
      nextActionHash,
      storageRefHash,
      createdAtUnix: unixNow(),
      status: "anchored",
      chainId: this.options.chainId,
      verified: false,
      sourceMemoryIdHash: hashText(reflection.id),
      tags: reflection.tags
    };
    try {
      if (this.options.onchain) {
        const anchored = await this.options.onchain.createMemoryReceipt({
          receiptId: receipt.id,
          wallet: receipt.wallet,
          reflectionHash: receipt.reflectionHash,
          summaryHash: receipt.summaryHash,
          nextActionHash: receipt.nextActionHash,
          storageRefHash: receipt.storageRefHash,
          sourceTurnIdHash: receipt.sourceTurnIdHash,
          parentReceiptIdHash: receipt.parentReceiptIdHash,
          chainId: receipt.chainId
        });
        receipt.solanaTxSig = anchored.txSig;
        receipt.solanaAccount = anchored.receiptAccount;
      } else {
        const synthetic = hashCanonical({
          receiptId: receipt.id,
          reflectionHash: receipt.reflectionHash,
          sourceTurnIdHash,
          createdAtUnix: receipt.createdAtUnix
        }).slice(0, 44);
        receipt.solanaTxSig = `SIM_${synthetic}`;
        receipt.solanaAccount = `pda_${hashText(receipt.id).slice(0, 32)}`;
      }
    } catch (error) {
      receipt.status = "degraded";
      receipt.note = error instanceof Error ? error.message : "onchain_anchor_failed";
    }
    await this.store.saveReceipt(reflection.id, receipt);
    await this.pushEvent({
      reflectionId: reflection.id,
      receiptId: receipt.id,
      kind: receipt.status === "degraded" ? "receipt_degraded" : "receipt_anchored",
      message: receipt.status === "degraded" ? "Receipt degraded: on-chain anchor failed, proof kept in app ledger." : "Compact proof anchored on Solana.",
      data: {
        txSig: receipt.solanaTxSig,
        account: receipt.solanaAccount,
        status: receipt.status
      }
    });
    return receipt;
  }
  async linkReceiptToNextTurn(reflectionId, input) {
    const reflection = await this.store.getReflection(reflectionId);
    if (!reflection) throw new Error("reflection_not_found");
    const receipt = await this.store.getReceiptByReflectionId(reflectionId);
    if (!receipt) throw new Error("receipt_not_found");
    const nextTurnIdHash = hashText(input.nextTurnId);
    const link = {
      id: `lnk_${nanoid4(12)}`,
      receiptId: receipt.id,
      sourceTurnIdHash: receipt.sourceTurnIdHash,
      nextTurnIdHash,
      agentId: reflection.agentId,
      wallet: receipt.wallet,
      createdAt: nowIso(),
      reason: input.reason
    };
    receipt.nextTurnIdHash = nextTurnIdHash;
    receipt.status = "linked";
    await this.store.saveLink(link);
    await this.store.saveReceipt(reflection.id, receipt);
    await this.pushEvent({
      reflectionId,
      receiptId: receipt.id,
      kind: "receipt_linked",
      message: "Receipt linked to the next turn.",
      data: { nextTurnIdHash, reason: input.reason }
    });
    return { receipt, link };
  }
  async verifyReflection(reflectionId) {
    const reflection = await this.store.getReflection(reflectionId);
    if (!reflection) throw new Error("reflection_not_found");
    const receipt = await this.store.getReceiptByReflectionId(reflectionId);
    if (!receipt) throw new Error("receipt_not_found");
    const checks = {
      reflectionPresent: Boolean(reflection),
      storagePresent: Boolean(reflection.storageRef),
      reflectionHashMatch: receipt.reflectionHash === reflection.payloadHash,
      summaryHashMatch: receipt.summaryHash === hashText(reflection.summary),
      nextActionHashMatch: receipt.nextActionHash === hashText(reflection.nextAction),
      sourceTurnHashMatch: receipt.sourceTurnIdHash === hashText(reflection.sourceTurnId)
    };
    const issues = [];
    for (const [name, ok5] of Object.entries(checks)) {
      if (!ok5) issues.push(name);
    }
    const verified = issues.length === 0;
    const status = verified ? "verified" : checks.reflectionPresent ? "partial" : "missing";
    receipt.verified = verified;
    receipt.verifiedAt = nowIso();
    receipt.status = verified ? "verified" : "degraded";
    await this.store.saveReceipt(reflection.id, receipt);
    await this.pushEvent({
      reflectionId,
      receiptId: receipt.id,
      kind: verified ? "receipt_verified" : "receipt_degraded",
      message: verified ? "Receipt verified against off-chain reflection." : "Receipt verification is partial.",
      data: { issues }
    });
    return {
      receiptId: receipt.id,
      reflectionId: reflection.id,
      status,
      verified,
      checks,
      issues,
      verifiedAt: receipt.verifiedAt
    };
  }
  async getReflection(reflectionId) {
    const reflection = await this.store.getReflection(reflectionId);
    if (!reflection) throw new Error("reflection_not_found");
    return reflection;
  }
  async getReceipt(reflectionId) {
    return this.store.getReceiptByReflectionId(reflectionId);
  }
  async listReflections(query = {}) {
    const reflections = await this.store.listReflections();
    const receipts = await this.store.listReceipts();
    const receiptByReflection = /* @__PURE__ */ new Map();
    for (const reflection of reflections) {
      const receipt = await this.store.getReceiptByReflectionId(reflection.id);
      if (receipt) receiptByReflection.set(reflection.id, receipt);
    }
    let rows = reflections.filter((reflection) => {
      const receipt = receiptByReflection.get(reflection.id);
      if (query.agentId && reflection.agentId !== query.agentId) return false;
      if (query.conversationId && reflection.conversationId !== query.conversationId) return false;
      if (query.sourceTurnId && reflection.sourceTurnId !== query.sourceTurnId) return false;
      if (query.storageRef && reflection.storageRef !== query.storageRef) return false;
      if (query.wallet && receipt?.wallet !== query.wallet) return false;
      if (query.status && receipt?.status !== query.status) return false;
      if (typeof query.verified === "boolean" && receipt?.verified !== query.verified) return false;
      if (query.txSig && receipt?.solanaTxSig !== query.txSig) return false;
      if (query.nextTurnId) {
        if (!receipt?.nextTurnIdHash) return false;
        if (receipt.nextTurnIdHash !== hashText(query.nextTurnId)) return false;
      }
      return true;
    });
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    rows = rows.slice(offset, offset + limit);
    return {
      items: rows.map((reflection) => ({
        reflection,
        receipt: receiptByReflection.get(reflection.id) || null
      })),
      totalReflections: reflections.length,
      totalReceipts: receipts.length
    };
  }
  async getChain(reflectionId) {
    const reflection = await this.getReflection(reflectionId);
    const receipt = await this.store.getReceiptByReflectionId(reflectionId);
    const links = receipt ? await this.store.listLinksByReceipt(receipt.id) : [];
    let parent = null;
    if (reflection.parentReceiptId) {
      parent = await this.store.getReceipt(reflection.parentReceiptId) || null;
    }
    return {
      reflection,
      receipt: receipt || null,
      parentReceipt: parent,
      links
    };
  }
  async getTimeline(reflectionId) {
    return this.store.listEventsForReflection(reflectionId);
  }
  async buildInjectionBundle(input) {
    const { items } = await this.listReflections({
      agentId: input.agentId,
      conversationId: input.conversationId,
      wallet: input.wallet,
      limit: 200
    });
    const candidates = items.filter((x) => x.receipt && (x.receipt.verified || x.receipt.status === "anchored" || x.receipt.status === "linked")).sort((a, b) => {
      const aScore = (a.reflection.structured.priority === "critical" ? 4 : a.reflection.structured.priority === "high" ? 3 : a.reflection.structured.priority === "normal" ? 2 : 1) + (a.receipt?.verified ? 1 : 0);
      const bScore = (b.reflection.structured.priority === "critical" ? 4 : b.reflection.structured.priority === "high" ? 3 : b.reflection.structured.priority === "normal" ? 2 : 1) + (b.receipt?.verified ? 1 : 0);
      if (aScore === bScore) return b.reflection.createdAt.localeCompare(a.reflection.createdAt);
      return bScore - aScore;
    });
    const seenAdvice = /* @__PURE__ */ new Set();
    const limit = input.maxItems ?? 3;
    const selected = candidates.filter((item) => {
      const key = item.reflection.correctiveAdvice.toLowerCase().trim();
      if (seenAdvice.has(key)) return false;
      seenAdvice.add(key);
      return true;
    }).slice(0, limit);
    const injectionItems = selected.map(({ reflection, receipt }) => ({
      receiptId: receipt.id,
      reflectionId: reflection.id,
      summary: reflection.summary,
      rootCause: reflection.rootCause,
      correctiveAdvice: reflection.correctiveAdvice,
      nextAction: reflection.nextAction,
      confidence: reflection.structured.confidence,
      priority: reflection.structured.priority,
      createdAt: reflection.createdAt,
      verified: receipt.verified,
      txSig: receipt.solanaTxSig
    }));
    const injectedPrompt = injectionItems.length ? [
      "Memory injection from prior verified lessons:",
      ...injectionItems.map(
        (item, index) => `${index + 1}. [${item.priority}] ${item.summary} | Root cause: ${item.rootCause} | Corrective advice: ${item.correctiveAdvice} | Next action: ${item.nextAction}`
      )
    ].join("\n") : "No prior verified lessons available for injection.";
    const bundle = {
      bundleId: `inj_${nanoid4(12)}`,
      agentId: input.agentId,
      conversationId: input.conversationId,
      nextTurnId: input.nextTurnId,
      createdAt: nowIso(),
      items: injectionItems,
      injectedPrompt
    };
    await this.store.saveInjection(bundle);
    await Promise.all(
      selected.map(async ({ reflection }) => {
        await this.linkReceiptToNextTurn(reflection.id, {
          nextTurnId: input.nextTurnId,
          reason: "Injected into next turn prompt context."
        });
      })
    );
    for (const item of injectionItems) {
      const reflection = await this.store.getReflection(item.reflectionId);
      const receipt = await this.store.getReceipt(item.receiptId);
      if (!reflection || !receipt) continue;
      receipt.status = "injected";
      await this.store.saveReceipt(reflection.id, receipt);
    }
    await this.pushEvent({
      reflectionId: injectionItems[0]?.reflectionId || "none",
      receiptId: injectionItems[0]?.receiptId,
      kind: "injection_built",
      message: "Injection bundle assembled for next turn.",
      data: {
        bundleId: bundle.bundleId,
        nextTurnId: input.nextTurnId,
        itemCount: injectionItems.length
      }
    });
    return bundle;
  }
  async runDemoFlow(input) {
    const failure = await this.createReflection({
      agentId: input.agentId,
      conversationId: input.conversationId,
      wallet: input.wallet,
      sourceTurnId: `turn_fail_${nanoid4(6)}`,
      kind: "failure",
      title: "Tool call failed due to missing schema context",
      summary: "Agent used a tool call with incomplete schema assumptions.",
      fullText: "The agent attempted a tool call without validating schema constraints. This caused a downstream parse failure and wasted one retry cycle.",
      rootCause: "Schema assumptions were inferred instead of checked.",
      correctiveAdvice: "Read and hash canonical tool descriptors before calling the tool.",
      nextAction: "Inject schema-first checklist into the next turn.",
      tags: ["failure", "schema", "tooling"],
      structured: {
        confidence: 0.93,
        priority: "high",
        reusable: true
      }
    });
    await this.anchorReflection(failure.reflection.id, input.wallet);
    await this.verifyReflection(failure.reflection.id);
    const nextTurnId = `turn_recover_${nanoid4(6)}`;
    const injection = await this.buildInjectionBundle({
      agentId: input.agentId,
      conversationId: input.conversationId,
      nextTurnId,
      wallet: input.wallet,
      maxItems: 2
    });
    const success = await this.createReflection({
      agentId: input.agentId,
      conversationId: input.conversationId,
      wallet: input.wallet,
      sourceTurnId: nextTurnId,
      kind: "success",
      title: "Recovery succeeded after memory injection",
      summary: "Next turn reused corrective guidance and completed the task.",
      fullText: "The next turn loaded corrective advice from the prior receipt and validated schema before invocation. The tool call succeeded on the first attempt.",
      rootCause: "Prior failure corrected by explicit prompt injection.",
      correctiveAdvice: "Keep the schema-first checklist for similar tool families.",
      nextAction: "Continue using verified memory injection for high-risk tools.",
      parentReceiptId: (await this.store.getReceiptByReflectionId(failure.reflection.id))?.id,
      tags: ["success", "injection", "recovery"],
      structured: {
        confidence: 0.9,
        priority: "normal"
      }
    });
    await this.anchorReflection(success.reflection.id, input.wallet);
    await this.verifyReflection(success.reflection.id);
    return {
      failureReflectionId: failure.reflection.id,
      successReflectionId: success.reflection.id,
      injectionBundleId: injection.bundleId,
      nextTurnId
    };
  }
  async pushEvent(input) {
    return this.store.pushEvent({
      id: `evt_${nanoid4(12)}`,
      createdAt: nowIso(),
      ...input
    });
  }
};

// server/memory/store.ts
import fs from "fs/promises";
import path from "path";
var EMPTY_STATE = {
  reflections: {},
  receipts: {},
  reflectionToReceipt: {},
  links: {},
  events: [],
  injections: []
};
var MemoryReceiptStore = class {
  constructor(filePath) {
    this.filePath = filePath;
  }
  state = structuredClone(EMPTY_STATE);
  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.state = {
        reflections: parsed.reflections || {},
        receipts: parsed.receipts || {},
        reflectionToReceipt: parsed.reflectionToReceipt || {},
        links: parsed.links || {},
        events: parsed.events || [],
        injections: parsed.injections || []
      };
    } catch {
      this.state = structuredClone(EMPTY_STATE);
    }
  }
  async persist() {
    if (!this.filePath) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }
  async saveReflection(record) {
    this.state.reflections[record.id] = record;
    await this.persist();
    return record;
  }
  async getReflection(id) {
    return this.state.reflections[id];
  }
  async listReflections() {
    return Object.values(this.state.reflections).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async saveReceipt(reflectionId, receipt) {
    this.state.receipts[receipt.id] = receipt;
    this.state.reflectionToReceipt[reflectionId] = receipt.id;
    await this.persist();
    return receipt;
  }
  async getReceipt(id) {
    return this.state.receipts[id];
  }
  async getReceiptByReflectionId(reflectionId) {
    const receiptId2 = this.state.reflectionToReceipt[reflectionId];
    return receiptId2 ? this.state.receipts[receiptId2] : void 0;
  }
  async listReceipts() {
    return Object.values(this.state.receipts).sort((a, b) => b.createdAtUnix - a.createdAtUnix);
  }
  async saveLink(link) {
    this.state.links[link.id] = link;
    await this.persist();
    return link;
  }
  async listLinks() {
    return Object.values(this.state.links).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listLinksByReceipt(receiptId2) {
    return Object.values(this.state.links).filter((link) => link.receiptId === receiptId2).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async saveInjection(bundle) {
    this.state.injections.unshift(bundle);
    this.state.injections = this.state.injections.slice(0, 500);
    await this.persist();
    return bundle;
  }
  async listInjections() {
    return [...this.state.injections];
  }
  async pushEvent(event) {
    this.state.events.unshift(event);
    this.state.events = this.state.events.slice(0, 2e3);
    await this.persist();
    return event;
  }
  async listEventsForReflection(reflectionId) {
    return this.state.events.filter((event) => event.reflectionId === reflectionId);
  }
};

// server/memory/runtime.ts
var servicePromise = null;
async function getMemoryReceiptService(input) {
  if (servicePromise) return servicePromise;
  servicePromise = (async () => {
    const store = new MemoryReceiptStore(path2.join(process.cwd(), "data", "memory-receipts.json"));
    await store.init();
    return new MemoryReceiptService(store, {
      chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
      defaultWallet: process.env.CLAW_DEFAULT_WALLET || "unknown_wallet",
      defaultVisibility: "workspace",
      onchain: input?.onchain
    });
  })();
  return servicePromise;
}

// server/zerog/orchestration.ts
import crypto10 from "crypto";

// server/zerog/artifacts.ts
import crypto4 from "crypto";
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function hashValue(value) {
  return crypto4.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function mockTxSignature(seed) {
  const base = crypto4.createHash("sha256").update(seed).digest("hex");
  return `SIM_${base.slice(0, 64)}`;
}
function randomId(prefix) {
  return `${prefix}_${crypto4.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
var ZeroGOrchestratorStore = class {
  state = {
    artifacts: [],
    computeJobs: [],
    availability: [],
    links: [],
    receipts: [],
    bridgeHistory: []
  };
  listArtifacts() {
    return [...this.state.artifacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  listComputeJobs() {
    return [...this.state.computeJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  listAvailability() {
    return [...this.state.availability].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  listLinks() {
    return [...this.state.links].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  listReceipts() {
    return [...this.state.receipts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  listBridgeHistory() {
    return [...this.state.bridgeHistory].sort(
      (a, b) => (b.lastUpdatedAt || "").localeCompare(a.lastUpdatedAt || "")
    );
  }
  putArtifact(artifact) {
    this.state.artifacts = this.state.artifacts.filter((item) => item.id !== artifact.id);
    this.state.artifacts.unshift(artifact);
    return artifact;
  }
  putComputeJob(job) {
    this.state.computeJobs = this.state.computeJobs.filter((item) => item.id !== job.id);
    this.state.computeJobs.unshift(job);
    return job;
  }
  putAvailability(record) {
    this.state.availability = this.state.availability.filter((item) => item.id !== record.id);
    this.state.availability.unshift(record);
    return record;
  }
  putLink(link) {
    this.state.links = this.state.links.filter((item) => item.id !== link.id);
    this.state.links.unshift(link);
    return link;
  }
  putReceipt(receipt) {
    this.state.receipts = this.state.receipts.filter((item) => item.id !== receipt.id);
    this.state.receipts.unshift(receipt);
    return receipt;
  }
  pushBridgeState(bridge) {
    this.state.bridgeHistory.unshift(bridge);
    this.state.bridgeHistory = this.state.bridgeHistory.slice(0, 200);
    return bridge;
  }
  getArtifactByRef(storageRef) {
    return this.state.artifacts.find((item) => item.storageRef === storageRef) || null;
  }
  getJobById(jobId) {
    return this.state.computeJobs.find((item) => item.id === jobId) || null;
  }
  getAvailabilityByRef(ref) {
    return this.state.availability.find((item) => item.availabilityRef === ref) || null;
  }
  createSolanaReceipt(input) {
    const id = randomId("solproof");
    const receipt = {
      id,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      wallet: input.wallet,
      txSignature: mockTxSignature(id),
      account: `pda_${hashValue(id).slice(0, 32)}`,
      summaryHash: input.summaryHash,
      zeroGStorageRef: input.zeroGStorageRef,
      zeroGComputeRef: input.zeroGComputeRef,
      zeroGAvailabilityRef: input.zeroGAvailabilityRef,
      createdAt: now(),
      status: "confirmed"
    };
    return this.putReceipt(receipt);
  }
  createLink(input) {
    const link = {
      id: randomId("link"),
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      solanaReceiptId: input.receipt?.id,
      solanaTxSignature: input.receipt?.txSignature,
      solanaAccount: input.receipt?.account,
      zeroGStorageRef: input.artifact?.storageRef,
      zeroGComputeRef: input.computeJob?.computeRef,
      zeroGAvailabilityRef: input.availability?.availabilityRef,
      bridgeState: input.bridgeState,
      contentHash: input.contentHash,
      summaryHash: input.summaryHash,
      createdAt: now(),
      status: input.receipt ? "verified" : "linked"
    };
    return this.putLink(link);
  }
};

// server/zerog/routes.ts
import crypto9 from "crypto";
import { z as z2 } from "zod";

// server/zerog/bridge.ts
import crypto5 from "crypto";

// shared/zerog/index.ts
var ZEROG_CHAIN_ID_DEFAULT = 16661;

// server/zerog/config.ts
function parseEnvironment(input) {
  if (input === "local" || input === "testnet" || input === "mainnet" || input === "demo") {
    return input;
  }
  if (process.env.NODE_ENV === "production") return "mainnet";
  return "demo";
}
function parseBoolean(input, fallback) {
  if (input === void 0) return fallback;
  return input === "true";
}
function getZeroGConfig() {
  const environment = parseEnvironment(process.env.ZEROG_ENV);
  const demoMode = parseBoolean(process.env.ZEROG_DEMO_MODE, environment === "demo");
  const enabled = parseBoolean(process.env.ZEROG_ENABLED, true);
  const readOnly = parseBoolean(process.env.ZEROG_READ_ONLY, demoMode);
  const ogChainId = Number(process.env.ZEROG_OG_CHAIN_ID || ZEROG_CHAIN_ID_DEFAULT);
  return {
    environment,
    storageUrl: process.env.ZEROG_STORAGE_URL || "https://storage.demo.0g.ai/v1",
    computeUrl: process.env.ZEROG_COMPUTE_URL || "https://compute.demo.0g.ai/v1",
    dataAvailabilityUrl: process.env.ZEROG_DA_URL || "https://da.demo.0g.ai/v1",
    explorerUrl: process.env.ZEROG_EXPLORER_URL || "https://explorer.demo.0g.ai",
    bridgeUrl: process.env.ZEROG_BRIDGE_URL || "https://bridge.demo.0g.ai",
    ogChainId: Number.isFinite(ogChainId) ? ogChainId : ZEROG_CHAIN_ID_DEFAULT,
    bridgeProvider: process.env.ZEROG_BRIDGE_PROVIDER || "XSwap (per official 0G docs)",
    tokenMetadataDisclaimer: process.env.ZEROG_TOKEN_DISCLAIMER || "Third-party exchange or tracker labels (e.g. \u201CSolana-based token\u201D) are untrusted metadata unless verified against your configured official 0G sources.",
    apiKey: process.env.ZEROG_API_KEY,
    timeoutMs: Number(process.env.ZEROG_TIMEOUT_MS || 12e3),
    enabled,
    readOnly,
    mode: !enabled ? "degraded" : demoMode ? "demo" : "live",
    version: process.env.ZEROG_VERSION || "0g-sidecar-v1"
  };
}

// server/zerog/bridge.ts
function now2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function hash(seed) {
  return crypto5.createHash("sha256").update(seed).digest("hex");
}
var ZeroGBridgeService = class {
  constructor(store) {
    this.store = store;
    const config = getZeroGConfig();
    this.latest = {
      enabled: true,
      sourceChain: "Solana",
      destinationChain: "0G",
      tokenSymbol: "0G",
      status: "idle",
      provider: config.bridgeProvider,
      notes: "Bridge-aware stub: official flows use XSwap toward 0G Chain. No live bridge API is implied unless mode is live. Treat exchange token labels as untrusted metadata.",
      mode: "mock",
      version: "bridge-v1",
      lastUpdatedAt: now2()
    };
  }
  latest;
  async getStatus() {
    return this.latest;
  }
  async simulate(input) {
    const config = getZeroGConfig();
    const txHash = `0x${hash(`${input.sourceChain}:${input.destinationChain}:${Date.now()}`).slice(0, 64)}`;
    const status = {
      enabled: config.enabled,
      sourceChain: input.sourceChain,
      destinationChain: input.destinationChain,
      tokenSymbol: input.tokenSymbol,
      status: config.enabled ? "confirmed" : "degraded",
      txHash,
      explorerUrl: `${config.explorerUrl}/bridge/${txHash}`,
      provider: config.bridgeProvider,
      notes: config.enabled ? `Simulated transfer toward 0G Chain (chainId ${config.ogChainId})${input.amount ? `; amount=${input.amount}` : ""}. Not a claim about real token custody.` : "Bridge simulated while sidecar is degraded.",
      mode: config.mode === "live" ? "live" : "mock",
      version: "bridge-v1",
      lastUpdatedAt: now2()
    };
    this.latest = status;
    this.store.pushBridgeState(status);
    return status;
  }
  async listHistory() {
    return this.store.listBridgeHistory();
  }
  async getHealth() {
    const config = getZeroGConfig();
    return {
      ok: config.enabled,
      reason: config.enabled ? void 0 : "zerog_bridge_disabled",
      latencyMs: 8,
      mode: config.mode
    };
  }
};

// server/zerog/compute.ts
function now3() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function toComputeRef(id) {
  return `zg://compute/jobs/${id}`;
}
function computeOutput(job) {
  if (job.taskType === "summarize_reflection") {
    const text2 = typeof job.input === "string" ? job.input : JSON.stringify(job.input);
    return {
      summary: text2.slice(0, 220),
      bullets: ["Root cause captured", "Corrective advice extracted", "Anchoring-ready summary generated"]
    };
  }
  if (job.taskType === "normalize_receipt") {
    return {
      normalized: true,
      digest: hashValue(job.input).slice(0, 32),
      schema: "solana-zerog-receipt-v1"
    };
  }
  return {
    status: "processed",
    digest: hashValue(job.input),
    taskType: job.taskType
  };
}
var ZeroGComputeService = class {
  constructor(store) {
    this.store = store;
  }
  async submitJob(input) {
    const config = getZeroGConfig();
    const queued = {
      ...input,
      status: config.enabled ? "running" : "degraded",
      createdAt: input.createdAt || now3(),
      updatedAt: now3(),
      metadata: {
        mode: config.mode,
        environment: config.environment,
        ...input.metadata
      },
      computeRef: input.computeRef || toComputeRef(input.id)
    };
    this.store.putComputeJob(queued);
    if (!config.enabled) {
      const degraded = {
        ...queued,
        status: "degraded",
        finishedAt: now3()
      };
      return this.store.putComputeJob(degraded);
    }
    const output = computeOutput(input);
    const completed = {
      ...queued,
      output,
      outputHash: hashValue(output),
      status: config.mode === "degraded" ? "degraded" : "completed",
      updatedAt: now3(),
      finishedAt: now3()
    };
    return this.store.putComputeJob(completed);
  }
  async getJob(jobId) {
    return this.store.getJobById(jobId);
  }
  async waitForJob(jobId) {
    const job = this.store.getJobById(jobId);
    if (!job) throw new Error("compute_job_not_found");
    if (job.status === "completed" || job.status === "failed" || job.status === "degraded") return job;
    return {
      ...job,
      status: "completed",
      output: job.output || computeOutput(job),
      outputHash: job.outputHash || hashValue(job.output || computeOutput(job)),
      updatedAt: now3(),
      finishedAt: now3()
    };
  }
  async getHealth() {
    const config = getZeroGConfig();
    return {
      ok: config.enabled,
      reason: config.enabled ? void 0 : "zerog_compute_disabled",
      latencyMs: 12,
      mode: config.mode
    };
  }
};

// server/zerog/da.ts
import crypto6 from "crypto";
function randomId2(prefix) {
  return `${prefix}_${crypto6.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function now4() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
var ZeroGDataAvailabilityService = class {
  constructor(store) {
    this.store = store;
  }
  async publish(input) {
    const config = getZeroGConfig();
    const id = randomId2("da");
    const record = {
      id,
      artifactId: input.artifactId,
      artifactKind: input.artifactKind,
      availabilityRef: `zg://da/records/${id}`,
      rootHash: input.rootHash,
      chunkCount: typeof input.sizeBytes === "number" ? Math.max(1, Math.ceil(input.sizeBytes / 4096)) : 1,
      sizeBytes: input.sizeBytes,
      createdAt: now4(),
      status: config.enabled ? config.mode === "degraded" ? "degraded" : "available" : "failed",
      metadata: {
        mode: config.mode,
        ...input.metadata
      }
    };
    return this.store.putAvailability(record);
  }
  async getByRef(availabilityRef) {
    return this.store.getAvailabilityByRef(availabilityRef);
  }
  async getHealth() {
    const config = getZeroGConfig();
    return {
      ok: config.enabled,
      reason: config.enabled ? void 0 : "zerog_da_disabled",
      latencyMs: 9,
      mode: config.mode
    };
  }
};

// server/zerog/health.ts
async function probeUrl(url, timeoutMs) {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    return { ok: res.ok || res.status >= 200 && res.status < 500, latencyMs: Date.now() - started };
  } catch {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow" });
      clearTimeout(timer);
      return { ok: res.ok || res.status >= 200 && res.status < 500, latencyMs: Date.now() - started };
    } catch {
      return { ok: false, latencyMs: Date.now() - started };
    }
  }
}
function mergeProbe(base, probe) {
  return {
    ...base,
    latencyMs: probe.latencyMs,
    remoteReachable: probe.ok,
    ok: base.ok && probe.ok,
    reason: !base.ok ? base.reason : !probe.ok ? "zerog_remote_unreachable" : void 0
  };
}
async function getZeroGHealth(input) {
  const config = getZeroGConfig();
  const skipRemote = process.env.ZEROG_SKIP_REMOTE_PROBE === "true" || !config.enabled || config.mode !== "live" && process.env.ZEROG_REMOTE_PROBE !== "true";
  const [storageBase, computeBase, daBase, bridge] = await Promise.all([
    input.storage.getHealth(),
    input.compute.getHealth(),
    input.da.getHealth(),
    input.bridge.getHealth()
  ]);
  let storage = storageBase;
  let compute = computeBase;
  let da = daBase;
  if (!skipRemote) {
    const t2 = Math.min(config.timeoutMs, 4e3);
    const [ps, pc, pd] = await Promise.all([
      probeUrl(config.storageUrl, t2),
      probeUrl(config.computeUrl, t2),
      probeUrl(config.dataAvailabilityUrl, t2)
    ]);
    storage = mergeProbe(storageBase, ps);
    compute = mergeProbe(computeBase, pc);
    da = mergeProbe(daBase, pd);
  }
  const ok5 = storage.ok && compute.ok && da.ok && bridge.ok;
  return {
    ok: ok5,
    config,
    mode: config.mode,
    storage,
    compute,
    da,
    bridge,
    remoteProbesSkipped: skipRemote,
    statusLabel: !config.enabled ? "0G unavailable" : config.mode === "demo" ? "0G demo mode" : ok5 ? "0G live" : "0G degraded"
  };
}

// server/zerog/replay.ts
function createZeroGReplayService(store) {
  return {
    getArtifact(storageRef) {
      return store.getArtifactByRef(storageRef);
    },
    getComputeJob(jobId) {
      return store.getJobById(jobId);
    },
    getAvailability(availabilityRef) {
      return store.getAvailabilityByRef(availabilityRef);
    },
    getGraph() {
      return {
        artifacts: store.listArtifacts(),
        computeJobs: store.listComputeJobs(),
        availability: store.listAvailability(),
        links: store.listLinks(),
        receipts: store.listReceipts()
      };
    }
  };
}

// server/zerog/storage.ts
function storageRefFromId(id) {
  return `zg://storage/artifacts/${id}`;
}
function sizeOf(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}
var ZeroGStorageService = class {
  constructor(store) {
    this.store = store;
  }
  async storeArtifact(input) {
    const config = getZeroGConfig();
    const contentHash2 = input.contentHash || hashValue(input.content);
    const next = {
      ...input,
      contentHash: contentHash2,
      checksum: input.checksum || hashValue({ id: input.id, contentHash: contentHash2, title: input.title }),
      sizeBytes: input.sizeBytes || sizeOf(input.content),
      storageRef: input.storageRef || storageRefFromId(input.id),
      status: config.enabled ? config.mode === "degraded" ? "degraded" : "stored" : "failed",
      createdAt: input.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      metadata: {
        mode: config.mode,
        environment: config.environment,
        ...input.metadata
      }
    };
    return this.store.putArtifact(next);
  }
  async getArtifact(storageRef) {
    return this.store.getArtifactByRef(storageRef);
  }
  async verifyArtifact(storageRef, expectedHash) {
    const artifact = this.store.getArtifactByRef(storageRef);
    if (!artifact) return false;
    const verified = artifact.contentHash === expectedHash;
    if (verified) {
      this.store.putArtifact({
        ...artifact,
        status: "verified"
      });
    }
    return verified;
  }
  async listArtifactsByKind(kind) {
    return this.store.listArtifacts().filter((item) => item.kind === kind).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getHealth() {
    const config = getZeroGConfig();
    const started = Date.now();
    const ok5 = config.enabled;
    return {
      ok: ok5,
      reason: ok5 ? void 0 : "zerog_disabled",
      latencyMs: Date.now() - started,
      mode: config.mode
    };
  }
};

// server/zerog/integrationSummary.ts
async function buildZeroGIntegrationStatus(module) {
  const cfg = getZeroGConfig();
  const [storageH, daH] = await Promise.all([module.storage.getHealth(), module.da.getHealth()]);
  const mode = cfg.mode === "live" ? "live" : cfg.mode === "degraded" ? "degraded" : "mock";
  const lastArtifact = module.store.listArtifacts()[0];
  const lastDa = module.store.listAvailability()[0];
  return {
    storage: {
      available: cfg.enabled && storageH.ok,
      connected: storageH.ok,
      lastUploadAt: lastArtifact?.createdAt,
      lastError: storageH.ok ? void 0 : storageH.reason
    },
    da: {
      available: cfg.enabled && daH.ok,
      connected: daH.ok,
      lastBatchAt: lastDa?.createdAt,
      lastRootHash: lastDa?.rootHash,
      lastError: daH.ok ? void 0 : daH.reason
    },
    mode
  };
}

// server/zerog/sidecarOrchestrator.ts
import crypto8 from "crypto";

// server/zerog/canonicalBlobAdapter.ts
async function loadBlobBytes(inner, uri) {
  const artifact = await inner.getArtifact(uri);
  if (!artifact || typeof artifact.content !== "object" || artifact.content === null) {
    throw new Error("blob_not_found");
  }
  const bytesB64 = artifact.content.bytesB64;
  if (!bytesB64) throw new Error("blob_payload_missing");
  return new Uint8Array(Buffer.from(bytesB64, "base64"));
}
function createCanonicalBlobAdapter(store) {
  const inner = new ZeroGStorageService(store);
  return {
    async putBlob(input) {
      const id = `blob_${hashValue({ ns: input.namespace, ct: input.contentType }).slice(0, 24)}`;
      const buf = Buffer.from(input.data);
      const checksum = hashValue(buf.toString("base64"));
      const artifact = await inner.storeArtifact({
        id,
        kind: "asset",
        title: input.namespace,
        summary: `Canonical blob (${input.contentType})`,
        content: {
          namespace: input.namespace,
          bytesB64: buf.toString("base64"),
          metadata: input.metadata ?? {}
        },
        contentHash: checksum,
        checksum,
        contentType: input.contentType,
        sizeBytes: buf.byteLength,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "pending",
        tags: [input.namespace, "canonical_blob"],
        metadata: input.metadata ?? {}
      });
      const ref = {
        blobId: artifact.id,
        namespace: input.namespace,
        checksum: artifact.checksum,
        sizeBytes: artifact.sizeBytes,
        contentType: input.contentType,
        uri: artifact.storageRef || `zg://storage/artifacts/${artifact.id}`,
        createdAt: artifact.createdAt
      };
      return ref;
    },
    async getBlob(uriOrId) {
      return loadBlobBytes(inner, uriOrId);
    },
    async verifyBlob(ref) {
      try {
        const data = await loadBlobBytes(inner, ref.uri);
        const checksum = hashValue(Buffer.from(data).toString("base64"));
        return checksum === ref.checksum;
      } catch {
        return false;
      }
    },
    async listBlobs(namespace) {
      const kinds = await inner.listArtifactsByKind("asset");
      return kinds.filter((a) => !namespace || a.tags.includes(namespace)).map(
        (a) => ({
          blobId: a.id,
          namespace: typeof a.content === "object" && a.content && "namespace" in a.content ? String(a.content.namespace ?? a.title) : a.title || "default",
          checksum: a.checksum,
          sizeBytes: a.sizeBytes,
          contentType: a.contentType,
          uri: a.storageRef || `zg://storage/artifacts/${a.id}`,
          createdAt: a.createdAt
        })
      );
    }
  };
}

// server/zerog/canonicalDa.ts
import crypto7 from "crypto";
function randomId3(prefix) {
  return `${prefix}_${crypto7.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function leafHash(payloadHash, subjectId, ts) {
  return crypto7.createHash("sha256").update(`${payloadHash}|${subjectId}|${ts}`).digest("hex");
}
function combineRoot(hashes) {
  return hashes.reduce((acc, h) => crypto7.createHash("sha256").update(`${acc}:${h}`).digest("hex"), "GENESIS");
}
var CanonicalDaService = class {
  records = [];
  roots = /* @__PURE__ */ new Map();
  async appendRecord(input) {
    const batchId = `batch_${input.subjectType}_${input.subjectId}`.slice(0, 64);
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const lh = leafHash(input.payloadHash, input.subjectId, createdAt);
    const rootHash = combineRoot([lh]);
    const rec = {
      id: randomId3("da"),
      batchId,
      rootHash,
      leafHash: lh,
      payloadHash: input.payloadHash,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      createdAt,
      uri: input.blobRef ? `zg://da/leaves/${lh.slice(0, 16)}` : void 0
    };
    this.records.unshift(rec);
    return rec;
  }
  async appendBatch(input) {
    const batchId = randomId3(`batch_${input.batchType}`);
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const hashes = input.records.map((r) => r.leafHash);
    const rootHash = hashes.length ? combineRoot(hashes) : crypto7.randomBytes(32).toString("hex");
    this.roots.set(rootHash, { batchId, createdAt });
    return {
      batchId,
      rootHash,
      batchUri: `zg://da/batches/${batchId}`,
      createdAt
    };
  }
  async verifyBatch(rootHash) {
    return this.roots.has(rootHash);
  }
  listRecords() {
    return [...this.records];
  }
};

// server/solana/receipts.ts
function solanaProofToReceiptRecord(proof, cluster, type, explorerBase) {
  const explorerUrl = explorerBase && proof.txSignature ? `${explorerBase.replace(/\/$/, "")}/tx/${proof.txSignature}` : void 0;
  return {
    id: proof.id,
    type,
    subjectId: proof.subjectId,
    wallet: proof.wallet,
    cluster,
    txSignature: proof.txSignature,
    account: proof.account,
    summaryHash: proof.summaryHash,
    status: proof.status,
    createdAt: proof.createdAt,
    explorerUrl,
    storageRef: proof.zeroGStorageRef,
    proofRef: proof.txSignature,
    daRoot: proof.zeroGAvailabilityRef
  };
}

// server/zerog/sidecarOrchestrator.ts
var daLane = new CanonicalDaService();
function createSidecarOrchestrator(module) {
  const blobs = createCanonicalBlobAdapter(module.store);
  return {
    async persistArtifact(input) {
      const errors = [];
      let blobRef;
      let daRecord;
      let daBatch;
      let receipt;
      try {
        blobRef = await blobs.putBlob({
          namespace: input.namespace,
          contentType: input.contentType,
          data: input.payload,
          metadata: {
            wallet: input.wallet,
            cluster: input.cluster,
            subjectId: input.subjectId
          }
        });
      } catch (e) {
        errors.push({
          code: "storage_put_failed",
          message: e instanceof Error ? e.message : "storage_put_failed",
          retryable: true
        });
      }
      const payloadHash = crypto8.createHash("sha256").update(Buffer.from(input.payload)).digest("hex");
      try {
        daRecord = await daLane.appendRecord({
          subjectType: input.receiptType,
          subjectId: input.subjectId,
          kind: "artifact_lineage",
          payloadHash,
          blobRef: blobRef?.uri,
          wallet: input.wallet,
          metadata: { namespace: input.namespace }
        });
        daBatch = await daLane.appendBatch({
          batchType: "solana_sidecar",
          subjectType: input.receiptType,
          subjectId: input.subjectId,
          records: daRecord ? [daRecord] : [],
          metadata: { wallet: input.wallet }
        });
      } catch (e) {
        errors.push({
          code: "da_append_failed",
          message: e instanceof Error ? e.message : "da_append_failed",
          retryable: true
        });
      }
      try {
        const subjectType = input.receiptType === "zerog_upload" ? "zerog_upload" : input.receiptType === "zerog_da_batch" ? "zerog_da_batch" : input.receiptType === "proof" ? "proof" : input.receiptType === "reflection" ? "reflection" : input.receiptType === "memory" ? "memory" : input.receiptType === "plan" ? "plan" : input.receiptType === "execution" ? "execution" : input.receiptType === "skill" ? "skill" : "bridge";
        const proof = module.store.createSolanaReceipt({
          subjectType,
          subjectId: input.subjectId,
          wallet: input.wallet,
          summaryHash: blobRef?.checksum || hashValue(payloadHash),
          zeroGStorageRef: blobRef?.uri,
          zeroGAvailabilityRef: daBatch?.batchUri
        });
        receipt = solanaProofToReceiptRecord(proof, input.cluster, input.receiptType, input.explorerBaseUrl);
        receipt.daRoot = daBatch?.rootHash;
      } catch (e) {
        errors.push({
          code: "receipt_mirror_failed",
          message: e instanceof Error ? e.message : "receipt_mirror_failed",
          retryable: false
        });
      }
      const status = blobRef && daRecord && receipt ? "success" : blobRef || daRecord || receipt ? "partial" : errors.length ? "failed" : "degraded";
      return { blobRef, daRecord, daBatch, receipt, status, errors: errors.length ? errors : void 0 };
    }
  };
}

// server/zerog/routes.ts
function ok(res, data) {
  res.json({ ok: true, data });
}
function fail(res, error, status = 400) {
  const message = error instanceof Error ? error.message : "zerog_route_failed";
  res.status(status).json({ ok: false, error: message });
}
function randomId4(prefix) {
  return `${prefix}_${crypto9.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function mockWallet() {
  return `demo_${crypto9.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
function createZeroGModule() {
  const store = new ZeroGOrchestratorStore();
  const storage = new ZeroGStorageService(store);
  const compute = new ZeroGComputeService(store);
  const da = new ZeroGDataAvailabilityService(store);
  const bridge = new ZeroGBridgeService(store);
  const replay = createZeroGReplayService(store);
  const services = { store, storage, compute, da, bridge, replay };
  async function runDemoFlow(input) {
    const now5 = (/* @__PURE__ */ new Date()).toISOString();
    const reflectionId = randomId4("reflection");
    const fullReflection = `Root cause: schema mismatch
Correction: enforce schema-first tool calls
Next action: replay using normalized receipt path`;
    const artifact = await storage.storeArtifact({
      id: reflectionId,
      kind: "reflection",
      title: "Runtime Reflection Artifact",
      summary: "Failure reflection stored in 0G sidecar for replay.",
      content: {
        wallet: input?.wallet || mockWallet(),
        skill: input?.skill || "planner-core",
        prompt: input?.prompt || "Demonstrate Solana + 0G proof flow",
        fullText: fullReflection,
        createdAt: now5
      },
      contentHash: hashValue(fullReflection),
      checksum: hashValue({ fullReflection, now: now5 }),
      contentType: "application/json",
      sizeBytes: Buffer.byteLength(fullReflection, "utf8"),
      createdAt: now5,
      status: "pending",
      tags: ["demo", "reflection", "memory"],
      metadata: { source: "zerog-demo" }
    });
    const computeJob = await compute.submitJob({
      id: randomId4("job"),
      taskType: "summarize_reflection",
      inputRef: artifact.storageRef,
      input: artifact.content,
      status: "queued",
      createdAt: now5,
      updatedAt: now5,
      metadata: { source: "zerog-demo", wallet: input?.wallet || null }
    });
    const availability = await da.publish({
      artifactId: artifact.id,
      artifactKind: artifact.kind,
      rootHash: artifact.contentHash,
      sizeBytes: artifact.sizeBytes,
      metadata: {
        storageRef: artifact.storageRef
      }
    });
    const bridgeState = await bridge.simulate({
      sourceChain: "Solana",
      destinationChain: "0G",
      tokenSymbol: "0G",
      amount: "42"
    });
    const receipt = store.createSolanaReceipt({
      subjectType: "reflection",
      subjectId: artifact.id,
      wallet: input?.wallet || mockWallet(),
      summaryHash: hashValue(computeJob.output || artifact.summary),
      zeroGStorageRef: artifact.storageRef,
      zeroGComputeRef: computeJob.computeRef,
      zeroGAvailabilityRef: availability.availabilityRef
    });
    const link = store.createLink({
      subjectType: "reflection",
      subjectId: artifact.id,
      contentHash: artifact.contentHash,
      summaryHash: receipt.summaryHash,
      receipt,
      artifact,
      computeJob,
      availability,
      bridgeState
    });
    return { artifact, computeJob, availability, bridgeState, receipt, link };
  }
  return {
    ...services,
    runDemoFlow
  };
}
var createArtifactSchema = z2.object({
  id: z2.string().optional(),
  kind: z2.enum(["reflection", "memory", "plan", "execution", "receipt", "proof", "skill", "bridge", "asset"]),
  title: z2.string().min(2),
  summary: z2.string().min(2),
  content: z2.unknown(),
  contentType: z2.string().default("application/json"),
  tags: z2.array(z2.string()).default([]),
  metadata: z2.record(z2.string(), z2.unknown()).optional()
});
var createComputeSchema = z2.object({
  id: z2.string().optional(),
  taskType: z2.enum([
    "summarize_reflection",
    "consolidate_memory",
    "compress_plan",
    "extract_metadata",
    "normalize_receipt",
    "generate_proof_summary",
    "multimodal_reasoning"
  ]),
  inputRef: z2.string().optional(),
  input: z2.unknown(),
  model: z2.string().optional(),
  metadata: z2.record(z2.string(), z2.unknown()).optional()
});
var publishDaSchema = z2.object({
  artifactId: z2.string().min(1),
  artifactKind: z2.string().min(1),
  rootHash: z2.string().min(8),
  sizeBytes: z2.number().optional(),
  metadata: z2.record(z2.string(), z2.unknown()).optional()
});
var bridgeSimSchema = z2.object({
  sourceChain: z2.string().default("Solana"),
  destinationChain: z2.string().default("0G"),
  tokenSymbol: z2.string().default("0G"),
  amount: z2.string().optional()
});
function registerZeroGRoutes(app, moduleParam) {
  const module = moduleParam ?? getZeroGModule();
  app.get("/api/zerog/config", (_req, res) => {
    ok(res, getZeroGConfig());
  });
  app.get("/api/zerog/network", (_req, res) => {
    const c = getZeroGConfig();
    ok(res, {
      ogChainId: c.ogChainId,
      bridgeProvider: c.bridgeProvider,
      tokenMetadataDisclaimer: c.tokenMetadataDisclaimer,
      explorerUrl: c.explorerUrl,
      bridgeUrl: c.bridgeUrl
    });
  });
  app.get("/api/zerog/health", async (_req, res) => {
    try {
      const data = await getZeroGHealth(module);
      ok(res, data);
    } catch (error) {
      fail(res, error, 500);
    }
  });
  app.get("/api/zerog/integration", async (_req, res) => {
    try {
      ok(res, await buildZeroGIntegrationStatus(module));
    } catch (error) {
      fail(res, error, 500);
    }
  });
  app.get("/api/zerog/storage/health", async (_req, res) => ok(res, await module.storage.getHealth()));
  app.get("/api/zerog/compute/health", async (_req, res) => ok(res, await module.compute.getHealth()));
  app.get("/api/zerog/da/health", async (_req, res) => ok(res, await module.da.getHealth()));
  app.get("/api/zerog/bridge/health", async (_req, res) => ok(res, await module.bridge.getHealth()));
  app.get("/api/zerog/bridge/status", async (_req, res) => ok(res, await module.bridge.getStatus()));
  app.post("/api/zerog/bridge/simulate", async (req, res) => {
    try {
      const input = bridgeSimSchema.parse(req.body ?? {});
      ok(res, await module.bridge.simulate(input));
    } catch (error) {
      fail(res, error);
    }
  });
  app.get("/api/zerog/bridge/history", async (_req, res) => ok(res, await module.bridge.listHistory()));
  app.post("/api/zerog/artifacts", async (req, res) => {
    try {
      const input = createArtifactSchema.parse(req.body);
      const id = input.id || randomId4("artifact");
      const contentHash2 = hashValue(input.content);
      const artifact = await module.storage.storeArtifact({
        id,
        kind: input.kind,
        title: input.title,
        summary: input.summary,
        content: input.content,
        contentHash: contentHash2,
        checksum: hashValue({ id, contentHash: contentHash2 }),
        contentType: input.contentType,
        sizeBytes: Buffer.byteLength(JSON.stringify(input.content), "utf8"),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "pending",
        tags: input.tags,
        metadata: input.metadata ?? {}
      });
      ok(res, artifact);
    } catch (error) {
      fail(res, error);
    }
  });
  app.get("/api/zerog/artifacts", (_req, res) => ok(res, module.store.listArtifacts()));
  app.get("/api/zerog/artifacts/kind/:kind", (req, res) => {
    const kind = String(req.params.kind);
    ok(
      res,
      module.store.listArtifacts().filter((item) => item.kind === kind)
    );
  });
  app.get("/api/zerog/artifacts/:storageRef", async (req, res) => {
    try {
      const storageRef = decodeURIComponent(String(req.params.storageRef));
      const artifact = await module.storage.getArtifact(storageRef);
      if (!artifact) return fail(res, "artifact_not_found", 404);
      ok(res, artifact);
    } catch (error) {
      fail(res, error);
    }
  });
  app.post("/api/zerog/artifacts/:storageRef/verify", async (req, res) => {
    try {
      const storageRef = decodeURIComponent(String(req.params.storageRef));
      const expectedHash = String(req.body?.expectedHash || "");
      if (!expectedHash) throw new Error("expectedHash_required");
      const verified = await module.storage.verifyArtifact(storageRef, expectedHash);
      ok(res, { verified, storageRef, expectedHash });
    } catch (error) {
      fail(res, error);
    }
  });
  app.post("/api/zerog/compute/jobs", async (req, res) => {
    try {
      const input = createComputeSchema.parse(req.body);
      const now5 = (/* @__PURE__ */ new Date()).toISOString();
      const job = await module.compute.submitJob({
        id: input.id || randomId4("job"),
        taskType: input.taskType,
        inputRef: input.inputRef,
        input: input.input,
        status: "queued",
        createdAt: now5,
        updatedAt: now5,
        model: input.model,
        metadata: input.metadata ?? {}
      });
      ok(res, job);
    } catch (error) {
      fail(res, error);
    }
  });
  app.get("/api/zerog/compute/jobs", (_req, res) => ok(res, module.store.listComputeJobs()));
  app.get("/api/zerog/compute/jobs/:jobId", async (req, res) => {
    const job = await module.compute.getJob(String(req.params.jobId));
    if (!job) return fail(res, "compute_job_not_found", 404);
    ok(res, job);
  });
  app.post("/api/zerog/compute/jobs/:jobId/wait", async (req, res) => {
    try {
      const job = await module.compute.waitForJob(String(req.params.jobId));
      ok(res, job);
    } catch (error) {
      fail(res, error, 404);
    }
  });
  app.post("/api/zerog/da/publish", async (req, res) => {
    try {
      const input = publishDaSchema.parse(req.body);
      ok(res, await module.da.publish(input));
    } catch (error) {
      fail(res, error);
    }
  });
  app.get("/api/zerog/da/records", (_req, res) => ok(res, module.store.listAvailability()));
  app.get("/api/zerog/links", (_req, res) => ok(res, module.store.listLinks()));
  app.get("/api/zerog/receipts", (_req, res) => ok(res, module.store.listReceipts()));
  app.get("/api/zerog/proof-graph", (_req, res) => ok(res, module.replay.getGraph()));
  app.get("/api/zerog/replay/artifact", (req, res) => {
    const storageRef = String(req.query.storageRef || "");
    if (!storageRef) return fail(res, "storageRef_required");
    const artifact = module.replay.getArtifact(storageRef);
    if (!artifact) return fail(res, "artifact_not_found", 404);
    ok(res, artifact);
  });
  app.post("/api/zerog/demo/run", async (req, res) => {
    try {
      const body = z2.object({
        wallet: z2.string().optional(),
        skill: z2.string().optional(),
        prompt: z2.string().optional()
      }).optional().parse(req.body);
      ok(res, await module.runDemoFlow(body));
    } catch (error) {
      fail(res, error);
    }
  });
  const persistSchema = z2.object({
    wallet: z2.string().min(32),
    cluster: z2.enum(["devnet", "testnet", "mainnet-beta", "localnet"]).default("devnet"),
    namespace: z2.string().min(1).default("claw_sidecar"),
    receiptType: z2.enum([
      "skill",
      "plan",
      "execution",
      "reflection",
      "memory",
      "proof",
      "zerog_upload",
      "zerog_da_batch"
    ]),
    subjectId: z2.string().min(1),
    contentType: z2.string().default("application/json"),
    payloadB64: z2.string().min(1),
    explorerBaseUrl: z2.string().optional()
  });
  app.post("/api/zerog/orchestrate/persist", async (req, res) => {
    try {
      const input = persistSchema.parse(req.body ?? {});
      const orchestrator = createSidecarOrchestrator(module);
      const payload = new Uint8Array(Buffer.from(input.payloadB64, "base64"));
      ok(
        res,
        await orchestrator.persistArtifact({
          wallet: input.wallet,
          cluster: input.cluster,
          namespace: input.namespace,
          receiptType: input.receiptType,
          subjectId: input.subjectId,
          contentType: input.contentType,
          payload,
          explorerBaseUrl: input.explorerBaseUrl
        })
      );
    } catch (error) {
      fail(res, error);
    }
  });
}
var zeroGSingleton = null;
function getZeroGModule() {
  if (!zeroGSingleton) zeroGSingleton = createZeroGModule();
  return zeroGSingleton;
}

// server/zerog/orchestration.ts
async function orchestrateReflectionSidecar(input) {
  const module = getZeroGModule();
  const now5 = (/* @__PURE__ */ new Date()).toISOString();
  const fullText = input.fullText;
  const artifact = await module.storage.storeArtifact({
    id: input.reflectionId,
    kind: "reflection",
    title: `Reflection ${input.reflectionId}`,
    summary: input.correctiveAction.slice(0, 280),
    content: {
      agentId: input.agentId,
      runId: input.runId,
      wallet: input.wallet,
      kind: input.kind,
      autonomyLevel: input.autonomyLevel,
      rootCause: input.rootCause,
      correctiveAction: input.correctiveAction,
      nextAction: input.nextAction,
      fullText,
      createdAt: now5
    },
    contentHash: hashValue(fullText),
    checksum: hashValue({ id: input.reflectionId, fullText, wallet: input.wallet }),
    contentType: "application/json",
    sizeBytes: Buffer.byteLength(fullText, "utf8"),
    createdAt: now5,
    status: "pending",
    tags: ["reflection", "autonomy", input.autonomyLevel],
    metadata: { source: "autonomy.reflection", runId: input.runId }
  });
  const computeJob = await module.compute.submitJob({
    id: `job_${crypto10.randomUUID().replace(/-/g, "").slice(0, 20)}`,
    taskType: "summarize_reflection",
    inputRef: artifact.storageRef,
    input: { summary: input.correctiveAction, fullTextLen: fullText.length, kind: input.kind },
    status: "queued",
    createdAt: now5,
    updatedAt: now5,
    metadata: { reflectionId: input.reflectionId }
  });
  const availability = await module.da.publish({
    artifactId: artifact.id,
    artifactKind: artifact.kind,
    rootHash: artifact.contentHash,
    sizeBytes: artifact.sizeBytes,
    metadata: { storageRef: artifact.storageRef }
  });
  const summaryHash = hashValue(computeJob.output ?? { summary: artifact.summary });
  const receipt = module.store.createSolanaReceipt({
    subjectType: "reflection",
    subjectId: input.reflectionId,
    wallet: input.wallet,
    summaryHash,
    zeroGStorageRef: artifact.storageRef,
    zeroGComputeRef: computeJob.computeRef,
    zeroGAvailabilityRef: availability.availabilityRef
  });
  const bridgeState = await module.bridge.getStatus();
  const link = module.store.createLink({
    subjectType: "reflection",
    subjectId: input.reflectionId,
    contentHash: artifact.contentHash,
    summaryHash: receipt.summaryHash,
    receipt,
    artifact,
    computeJob,
    availability,
    bridgeState
  });
  return {
    artifactId: artifact.id,
    zeroGStorageRef: artifact.storageRef,
    zeroGComputeRef: computeJob.computeRef,
    zeroGAvailabilityRef: availability.availabilityRef,
    solanaProofReceiptId: receipt.id,
    solanaTxSignature: receipt.txSignature,
    linkId: link.id,
    summaryHash
  };
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { nanoid as nanoid5 } from "nanoid";
import { z as z3 } from "zod";
var autonomyLevelSchema = z3.enum([
  "automation_only",
  "assisted",
  "guided",
  "policy_gated",
  "meaningful_agency",
  "near_autonomous",
  "fully_autonomous"
]);
var receiptTypeSchema = z3.enum([
  "plan",
  "execution",
  "reflection",
  "memory",
  "decision"
]);
var policyStatusSchema = z3.enum([
  "not_required",
  "approved",
  "blocked",
  "overridden",
  "needs_review"
]);
var skillStatusSchema = z3.enum([
  "draft",
  "published",
  "active",
  "paused",
  "deprecated",
  "archived"
]);
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // Solana Session Router
  solana: router({
    createSession: publicProcedure.input(
      z3.object({
        walletAddress: z3.string().min(32),
        expiresIn: z3.number().min(60).max(3600 * 24).default(3600)
      })
    ).mutation(async ({ input, ctx }) => {
      const nonce = Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + input.expiresIn * 1e3);
      const userId = ctx.user?.id || 0;
      try {
        await createSolanaSession(
          userId,
          input.walletAddress,
          nonce,
          expiresAt
        );
        return { nonce, expiresAt };
      } catch (err) {
        console.error("Failed to create session:", err);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Session creation failed",
          cause: err
        });
      }
    }),
    getSession: publicProcedure.input(
      z3.object({
        walletAddress: z3.string().min(32)
      })
    ).query(async ({ input }) => {
      try {
        const session = await getSolanaSessionByWallet(input.walletAddress);
        return session || null;
      } catch (err) {
        console.error("Failed to load Solana session:", err);
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to load session",
          cause: err
        });
      }
    })
  }),
  // Agent Router
  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAgentsByUser(ctx.user.id);
    }),
    create: protectedProcedure.input(
      z3.object({
        name: z3.string().min(2).max(255),
        role: z3.string().min(2).max(128),
        description: z3.string().max(4e3).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      await createAgent(ctx.user.id, input.name, input.role, input.description);
      return { ok: true };
    })
  }),
  // Skills Router
  skills: router({
    list: protectedProcedure.input(
      z3.object({
        search: z3.string().optional(),
        status: z3.union([skillStatusSchema, z3.literal("all")]).optional(),
        authorWallet: z3.string().optional(),
        tag: z3.string().optional(),
        minReputation: z3.number().min(0).max(100).optional(),
        sortBy: z3.enum([
          "latest_published",
          "most_used",
          "highest_reputation",
          "success_rate",
          "alphabetical"
        ]).optional(),
        order: z3.enum(["asc", "desc"]).optional(),
        limit: z3.number().min(1).max(200).optional(),
        offset: z3.number().min(0).optional()
      }).optional()
    ).query(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.list(input);
    }),
    publish: protectedProcedure.input(
      z3.object({
        name: z3.string().min(2).max(255),
        description: z3.string().max(4e3).optional(),
        tags: z3.array(z3.string().min(1).max(64)).optional(),
        authorWallet: z3.string().min(8).max(128),
        status: skillStatusSchema.optional(),
        canonicalUri: z3.string().url().optional(),
        metadataUri: z3.string().url().optional(),
        storageRef: z3.string().optional(),
        notes: z3.string().max(2e3).optional(),
        payload: z3.record(z3.string(), z3.unknown()).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.publish(input);
    }),
    create: protectedProcedure.input(
      z3.object({
        name: z3.string().min(2).max(255),
        description: z3.string().max(4e3).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const service = new SkillRegistryService(ctx.user.id);
      const receipt = await service.publish({
        ...input,
        authorWallet: `legacy_wallet_${ctx.user.id}`,
        status: "published"
      });
      return { ok: true, receipt };
    }),
    update: protectedProcedure.input(
      z3.object({
        skillId: z3.string().min(4),
        description: z3.string().max(4e3).optional(),
        tags: z3.array(z3.string().min(1).max(64)).optional(),
        changelog: z3.string().max(4e3).optional(),
        payload: z3.record(z3.string(), z3.unknown()).optional(),
        version: z3.string().regex(/^\d+\.\d+\.\d+$/).optional(),
        versionBump: z3.enum(["major", "minor", "patch"]).optional(),
        canonicalUri: z3.string().url().optional(),
        metadataUri: z3.string().url().optional(),
        storageRef: z3.string().optional(),
        notes: z3.string().max(2e3).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.update(input);
    }),
    byId: protectedProcedure.input(
      z3.object({
        id: z3.string().min(4)
      })
    ).query(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.getById(input.id);
    }),
    versions: protectedProcedure.input(
      z3.object({
        id: z3.string().min(4)
      })
    ).query(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.versions(input.id);
    }),
    history: protectedProcedure.input(
      z3.object({
        id: z3.string().min(4)
      })
    ).query(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.versions(input.id);
    }),
    usage: protectedProcedure.input(
      z3.object({
        skillId: z3.string().min(4),
        success: z3.boolean(),
        resolvedAt: z3.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.recordUsage(input);
    }),
    reputation: protectedProcedure.input(
      z3.object({
        id: z3.string().min(4)
      })
    ).query(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.reputation(input.id);
    }),
    verify: protectedProcedure.input(
      z3.object({
        id: z3.string().min(4)
      })
    ).mutation(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.verify(input.id);
    }),
    activate: protectedProcedure.input(
      z3.object({
        id: z3.string().min(4)
      })
    ).mutation(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.setStatus(input.id, "active");
    }),
    pause: protectedProcedure.input(
      z3.object({
        id: z3.string().min(4)
      })
    ).mutation(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.setStatus(input.id, "paused");
    }),
    deprecate: protectedProcedure.input(
      z3.object({
        id: z3.string().min(4)
      })
    ).mutation(async ({ ctx, input }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.setStatus(input.id, "deprecated");
    }),
    health: protectedProcedure.query(async ({ ctx }) => {
      const service = new SkillRegistryService(ctx.user.id);
      return service.health();
    })
  }),
  // Activity Router
  activity: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getActivityByUser(ctx.user.id, 100);
    })
  }),
  // Receipts Router
  receipts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getReceiptsByUser(ctx.user.id);
    }),
    create: protectedProcedure.input(
      z3.object({
        receiptType: receiptTypeSchema,
        content: z3.string().min(1),
        agentId: z3.number().optional(),
        autonomyLevel: autonomyLevelSchema.optional(),
        policyStatus: policyStatusSchema.optional(),
        proofType: z3.enum(["plan", "decision", "execution", "reflection", "memory"]).optional(),
        proofHash: z3.string().optional(),
        referenceId: z3.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      return createReceipt(
        ctx.user.id,
        input.receiptType,
        input.content,
        input.agentId,
        void 0,
        {
          autonomyLevel: input.autonomyLevel,
          policyStatus: input.policyStatus,
          proofType: input.proofType,
          proofHash: input.proofHash,
          referenceId: input.referenceId
        }
      );
    })
  }),
  autonomy: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const config = await getAutonomyConfigByUser(ctx.user.id);
      const profile = AUTONOMY_PROFILES[config.level];
      return {
        config,
        profile
      };
    }),
    configure: protectedProcedure.input(
      z3.object({
        mode: z3.enum(["automation", "meaningful_agency", "full_autonomy"]).optional(),
        level: autonomyLevelSchema.optional(),
        preferences: z3.record(z3.string(), z3.unknown()).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const modeLevel = input.mode ? resolveAutonomyLevelForMode(input.mode) : void 0;
      const next = await upsertAutonomyConfig(ctx.user.id, {
        mode: input.mode,
        level: input.level ?? modeLevel,
        preferences: input.preferences
      });
      return {
        config: next,
        profile: AUTONOMY_PROFILES[next.level]
      };
    }),
    evaluate: protectedProcedure.input(
      z3.object({
        autonomyLevel: autonomyLevelSchema.optional(),
        confidence: z3.number().min(0).max(100),
        riskLevel: z3.enum(["low", "medium", "high", "critical"]),
        valueAtRisk: z3.number().min(0).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const config = await getAutonomyConfigByUser(ctx.user.id);
      const result = evaluatePolicyGate({
        autonomyLevel: input.autonomyLevel ?? config.level,
        confidence: input.confidence,
        riskLevel: input.riskLevel,
        valueAtRisk: input.valueAtRisk,
        userPreference: {
          forceManualReview: Boolean(config.preferences.forceManualReview),
          requireSignatureAboveValue: typeof config.preferences.requireSignatureAboveValue === "number" ? Number(config.preferences.requireSignatureAboveValue) : void 0
        }
      });
      const gate = await createPolicyGateEventRecord(ctx.user.id, result);
      return { ...result, gateId: gate.gateId };
    }),
    approve: protectedProcedure.input(
      z3.object({
        gateId: z3.string().min(4),
        note: z3.string().optional()
      })
    ).mutation(async ({ input }) => {
      return {
        ok: true,
        gateId: input.gateId,
        policyStatus: "overridden",
        note: input.note ?? "Approved by operator"
      };
    }),
    decision: protectedProcedure.input(
      z3.object({
        runId: z3.string().optional(),
        agentId: z3.string().min(1),
        skillId: z3.string().optional(),
        planId: z3.string().optional(),
        turnId: z3.string().optional(),
        decisionType: z3.enum([
          "skill_selection",
          "plan_selection",
          "tool_selection",
          "retry_strategy",
          "reflection_strategy",
          "memory_injection",
          "proof_anchor_strategy"
        ]),
        autonomyLevel: autonomyLevelSchema,
        decisionScope: z3.string().min(3).max(255),
        optionsConsidered: z3.array(
          z3.object({
            id: z3.string().min(1),
            label: z3.string().min(1),
            reason: z3.string().optional()
          })
        ).min(1),
        selectedOptionId: z3.string().min(1),
        rationale: z3.string().min(4),
        confidence: z3.number().min(0).max(100),
        riskLevel: z3.enum(["low", "medium", "high", "critical"]).default("low"),
        memoryUsed: z3.array(z3.string()).optional(),
        metadata: z3.record(z3.string(), z3.unknown()).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const policy = evaluatePolicyGate({
        autonomyLevel: input.autonomyLevel,
        confidence: input.confidence,
        riskLevel: input.riskLevel
      });
      const decision = createDecisionDraft({
        agentId: input.agentId,
        decisionType: input.decisionType,
        autonomyLevel: input.autonomyLevel,
        decisionScope: input.decisionScope,
        options: input.optionsConsidered,
        selectedOptionId: input.selectedOptionId,
        rationale: input.rationale,
        confidence: input.confidence,
        policyStatus: policy.status === "auto_allowed" ? "approved" : policy.allowed ? "approved" : "needs_review",
        memoryUsed: input.memoryUsed,
        metadata: {
          ...input.metadata ?? {},
          runId: input.runId,
          riskLevel: input.riskLevel
        }
      });
      await createDecisionRecord(ctx.user.id, {
        ...decision,
        skillId: input.skillId,
        planId: input.planId,
        turnId: input.turnId
      });
      await createPolicyGateEventRecord(ctx.user.id, {
        ...policy,
        decisionId: decision.id,
        runId: input.runId,
        agentId: Number.isFinite(Number(input.agentId)) ? Number(input.agentId) : void 0
      });
      const narrative = createDecisionNarrative(
        decision.id,
        input.rationale,
        input.optionsConsidered,
        `Model confidence calibrated at ${input.confidence}.`,
        policy.reason,
        input.memoryUsed?.length ? `Memory influenced decision with ${input.memoryUsed.length} references.` : "No memory references were required."
      );
      await createDecisionNarrativeRecord(ctx.user.id, narrative);
      const receipt = await createReceipt(
        ctx.user.id,
        "decision",
        JSON.stringify({
          decisionId: decision.id,
          decisionType: decision.decisionType,
          selectedOptionId: decision.selectedOptionId,
          rationaleHash: `hash_${nanoid5(24)}`,
          confidence: decision.confidence
        }),
        Number.isFinite(Number(input.agentId)) ? Number(input.agentId) : void 0,
        void 0,
        {
          autonomyLevel: decision.autonomyLevel,
          policyStatus: decision.policyStatus,
          proofType: "decision",
          proofHash: `proof_${nanoid5(24)}`,
          referenceId: decision.id
        }
      );
      const memoryUsage = input.memoryUsed && input.memoryUsed.length > 0 ? createMemoryUsageDraft({
        agentId: input.agentId,
        turnId: input.turnId ?? `turn_${nanoid5(8)}`,
        memoryIds: input.memoryUsed,
        usedFor: "tool_choice",
        influence: Math.max(35, Math.min(95, input.confidence - 5)),
        result: input.memoryUsed.length > 2 ? "critical" : "used",
        runId: input.runId
      }) : null;
      if (memoryUsage) {
        await createMemoryUsageRecord(ctx.user.id, memoryUsage);
      }
      return {
        decision,
        narrativeId: narrative.id,
        policy,
        transactionHash: receipt.transactionHash
      };
    }),
    reflection: protectedProcedure.input(
      z3.object({
        runId: z3.string().min(4),
        agentId: z3.string().min(1),
        /** Canonical Solana wallet for proof linkage (optional; falls back to internal user id). */
        walletAddress: z3.string().min(32).max(64).optional(),
        autonomyLevel: autonomyLevelSchema,
        rootCause: z3.string().min(3),
        correctiveAction: z3.string().min(3),
        nextAction: z3.string().min(3),
        neededHumanInput: z3.boolean().default(false),
        blockedByPolicy: z3.boolean().default(false),
        improvedLaterRuns: z3.boolean().default(false),
        confidenceAvg: z3.number().min(0).max(100).default(70),
        memoryInfluenceAvg: z3.number().min(0).max(100).default(50)
      })
    ).mutation(async ({ input, ctx }) => {
      const reflection = createReflectionDraft(input);
      await createReflectionRecord(ctx.user.id, reflection);
      await createReceipt(
        ctx.user.id,
        "reflection",
        JSON.stringify({
          reflectionId: reflection.id,
          rootCause: reflection.rootCause,
          nextAction: reflection.nextAction
        }),
        Number.isFinite(Number(input.agentId)) ? Number(input.agentId) : void 0,
        void 0,
        {
          autonomyLevel: input.autonomyLevel,
          policyStatus: input.blockedByPolicy ? "blocked" : "approved",
          proofType: "reflection",
          proofHash: `proof_${nanoid5(24)}`,
          referenceId: reflection.id
        }
      );
      const fullText = `Root cause: ${input.rootCause}
Corrective action: ${input.correctiveAction}
Next action: ${input.nextAction}`;
      const proofWallet = input.walletAddress || `user_${ctx.user.id}`;
      const reflectionKind = input.blockedByPolicy ? "failure" : input.improvedLaterRuns ? "success" : "lesson";
      let memoryReflectionId;
      try {
        const memoryService = await getMemoryReceiptService();
        const created = await memoryService.createReflection({
          agentId: input.agentId,
          conversationId: input.runId,
          wallet: proofWallet,
          sourceTurnId: input.runId,
          kind: reflectionKind,
          title: `Reflection for run ${input.runId}`,
          summary: input.correctiveAction,
          fullText,
          rootCause: input.rootCause,
          correctiveAdvice: input.correctiveAction,
          nextAction: input.nextAction,
          tags: ["autonomy", "reflection", input.autonomyLevel]
        });
        memoryReflectionId = created.reflection.id;
        await memoryService.anchorReflection(created.reflection.id, proofWallet);
      } catch (error) {
        console.warn("[MemoryReceiptService] reflection mirror failed:", error);
      }
      let zeroG = null;
      if (memoryReflectionId) {
        try {
          zeroG = await orchestrateReflectionSidecar({
            reflectionId: memoryReflectionId,
            agentId: input.agentId,
            runId: input.runId,
            wallet: proofWallet,
            rootCause: input.rootCause,
            correctiveAction: input.correctiveAction,
            nextAction: input.nextAction,
            fullText,
            kind: reflectionKind,
            autonomyLevel: input.autonomyLevel
          });
        } catch (error) {
          console.warn("[ZeroG] reflection sidecar failed:", error);
        }
      }
      return { reflectionId: reflection.id, memoryReflectionId, zeroG };
    }),
    receipt: protectedProcedure.input(
      z3.object({
        receiptType: receiptTypeSchema,
        content: z3.string().min(1),
        agentId: z3.number().optional(),
        autonomyLevel: autonomyLevelSchema,
        policyStatus: policyStatusSchema.default("approved"),
        proofType: z3.enum(["plan", "decision", "execution", "reflection", "memory"]),
        referenceId: z3.string().optional()
      })
    ).mutation(async ({ input, ctx }) => {
      return createReceipt(
        ctx.user.id,
        input.receiptType,
        input.content,
        input.agentId,
        void 0,
        {
          autonomyLevel: input.autonomyLevel,
          policyStatus: input.policyStatus,
          proofType: input.proofType,
          proofHash: `proof_${nanoid5(24)}`,
          referenceId: input.referenceId
        }
      );
    }),
    history: protectedProcedure.input(
      z3.object({
        limit: z3.number().min(5).max(200).default(50),
        decisionId: z3.string().optional()
      }).optional()
    ).query(async ({ input, ctx }) => {
      const limit = input?.limit ?? 50;
      const [decisions, policies, runs, reflections, receipts] = await Promise.all([
        listDecisionRecordsByUser(ctx.user.id, limit),
        listPolicyGateEventsByUser(ctx.user.id, limit),
        listRunSummariesByUser(ctx.user.id, limit),
        listReflectionsByUser(ctx.user.id, limit),
        getReceiptsByUser(ctx.user.id)
      ]);
      const narrative = input?.decisionId ? await getDecisionNarrativeByDecisionId(ctx.user.id, input.decisionId) : null;
      return {
        decisions,
        policies,
        runs,
        reflections,
        receipts: receipts.slice(0, limit),
        narrative
      };
    }),
    metrics: protectedProcedure.query(async ({ ctx }) => {
      const metrics = await getAutonomyMetrics(ctx.user.id);
      const score = calculateAutonomyScore({
        independentDecisionRate: metrics.decisionCoverage > 0 ? 75 : 20,
        manualInterventionRate: metrics.manualOverrideRate,
        memoryUseRate: metrics.memoryReuseRate,
        reflectionReuseRate: metrics.reflectionReuseRate,
        policyPassRate: 100 - metrics.policyBlockRate,
        proofCompleteness: metrics.proofCompletionRate,
        successRate: metrics.retrySuccessRate,
        confidenceCalibration: metrics.executionAutonomyScore
      });
      return { ...metrics, score };
    }),
    health: protectedProcedure.query(async ({ ctx }) => {
      const [profile, metrics] = await Promise.all([
        getAutonomyConfigByUser(ctx.user.id),
        getAutonomyMetrics(ctx.user.id)
      ]);
      return {
        ok: true,
        level: profile.level,
        mode: profile.mode,
        policyState: profile.level === "fully_autonomous" ? "minimal_guardrails" : "policy_enforced",
        proofState: metrics.proofCompletionRate > 85 ? "complete" : metrics.proofCompletionRate > 45 ? "partial" : "degraded",
        memoryLinkage: metrics.memoryReuseRate > 60 ? "adaptive" : metrics.memoryReuseRate > 30 ? "limited" : "cold_start"
      };
    }),
    demoRun: protectedProcedure.input(
      z3.object({
        agentId: z3.string().default("1"),
        goal: z3.string().default("Demonstrate progressive autonomy.")
      })
    ).mutation(async ({ input, ctx }) => {
      const config = await getAutonomyConfigByUser(ctx.user.id);
      const runId = `run_${nanoid5(12)}`;
      const nextLevel = nextAutonomyLevel(config.level);
      const score = AUTONOMY_PROFILES[nextLevel].score;
      await createOrUpdateRunSummary(ctx.user.id, {
        runId,
        agentId: Number.isFinite(Number(input.agentId)) ? Number(input.agentId) : null,
        autonomyLevel: nextLevel,
        score,
        trend: "rising",
        status: "completed",
        policyStatus: "approved",
        humanInterventionRate: Math.max(5, 100 - score),
        proofCompleteness: Math.min(100, score + 5),
        confidenceAvg: Math.max(50, score - 5),
        memoryInfluenceAvg: Math.max(30, score - 10),
        reflectionReuseRate: Math.max(25, score - 15),
        metadata: JSON.stringify({
          goal: input.goal,
          timeline: [
            "goal_received",
            "skills_considered",
            "skill_selected",
            "plan_built",
            "policy_check",
            "tool_selection",
            "execution",
            "reflection",
            "memory_write",
            "proof_anchor"
          ]
        })
      });
      await upsertAutonomyConfig(ctx.user.id, {
        level: nextLevel,
        mode: nextLevel === "fully_autonomous" || nextLevel === "near_autonomous" ? "full_autonomy" : nextLevel === "automation_only" || nextLevel === "assisted" ? "automation" : "meaningful_agency"
      });
      return {
        runId,
        level: nextLevel,
        score,
        message: `Autonomy advanced to ${nextLevel}.`
      };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs3 from "fs";
import { nanoid as nanoid6 } from "nanoid";
import path4 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs2 from "node:fs";
import path3 from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path3.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs2.existsSync(LOG_DIR)) {
    fs2.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs2.existsSync(logPath) || fs2.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs2.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs2.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path3.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs2.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path3.resolve(import.meta.dirname),
  root: path3.resolve(import.meta.dirname, "client"),
  publicDir: path3.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid6()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path4.resolve(import.meta.dirname, "../..", "dist", "public") : path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/solana/identityStore.ts
import fs4 from "fs/promises";
import path5 from "path";
var EMPTY_STATE2 = {
  challenges: {},
  profiles: {},
  receipts: {},
  skills: {},
  memories: {},
  plannerRuns: {},
  deployments: {},
  reputations: {}
};
var IdentityStore = class {
  constructor(filePath) {
    this.filePath = filePath;
  }
  state = structuredClone(EMPTY_STATE2);
  async ensureLoaded() {
    if (!this.filePath) return;
    try {
      const raw = await fs4.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.state = {
        challenges: parsed.challenges || {},
        profiles: parsed.profiles || {},
        receipts: parsed.receipts || {},
        skills: parsed.skills || {},
        memories: parsed.memories || {},
        plannerRuns: parsed.plannerRuns || {},
        deployments: parsed.deployments || {},
        reputations: parsed.reputations || {}
      };
    } catch {
      this.state = structuredClone(EMPTY_STATE2);
    }
  }
  async persist() {
    if (!this.filePath) return;
    await fs4.mkdir(path5.dirname(this.filePath), { recursive: true });
    await fs4.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }
  async init() {
    await this.ensureLoaded();
  }
  async saveChallenge(record) {
    this.state.challenges[record.id] = record;
    await this.persist();
    return record;
  }
  async getChallenge(id) {
    return this.state.challenges[id];
  }
  async latestChallenge(walletAddress) {
    return Object.values(this.state.challenges).filter((challenge) => challenge.walletAddress === walletAddress).sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt))[0];
  }
  async saveProfile(record) {
    this.state.profiles[record.walletAddress] = record;
    await this.persist();
    return record;
  }
  async getProfile(walletAddress) {
    return this.state.profiles[walletAddress];
  }
  async listProfiles() {
    return Object.values(this.state.profiles);
  }
  async saveReceipt(record) {
    const list = this.state.receipts[record.walletAddress] || [];
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    this.state.receipts[record.walletAddress] = list;
    await this.persist();
    return record;
  }
  async listReceipts(walletAddress) {
    return this.state.receipts[walletAddress] || [];
  }
  async saveSkills(walletAddress, skills) {
    this.state.skills[walletAddress] = skills;
    await this.persist();
    return skills;
  }
  async listSkills(walletAddress) {
    return this.state.skills[walletAddress] || [];
  }
  async listAllSkills() {
    return Object.values(this.state.skills).flat();
  }
  async saveMemories(walletAddress, memories) {
    this.state.memories[walletAddress] = memories;
    await this.persist();
    return memories;
  }
  async listMemories(walletAddress) {
    return this.state.memories[walletAddress] || [];
  }
  async bundle(walletAddress, challengeId) {
    const profile = this.state.profiles[walletAddress];
    if (!profile) return void 0;
    const challenge = challengeId && this.state.challenges[challengeId] || await this.latestChallenge(walletAddress);
    if (!challenge) return void 0;
    return {
      challenge,
      profile,
      receipts: this.state.receipts[walletAddress] || [],
      skills: this.state.skills[walletAddress] || [],
      memories: this.state.memories[walletAddress] || [],
      plannerRuns: this.state.plannerRuns[walletAddress] || [],
      deployments: this.state.deployments[walletAddress] || [],
      reputation: this.state.reputations[walletAddress]
    };
  }
  async bumpUsage(walletAddress, skillRef) {
    const skills = this.state.skills[walletAddress] || [];
    const normalizedRef = skillRef.trim().toLowerCase();
    const idx = skills.findIndex(
      (skill) => skill.name.toLowerCase() === normalizedRef || skill.slug.toLowerCase() === normalizedRef || skill.id.toLowerCase() === normalizedRef
    );
    if (idx >= 0) {
      const activeVersion = skills[idx].versions?.find((version) => version.version === skills[idx].version);
      skills[idx] = {
        ...skills[idx],
        usageCount: skills[idx].usageCount + 1,
        score: Math.min(1, skills[idx].score + 0.03),
        versions: skills[idx].versions?.map(
          (version) => version.id === activeVersion?.id ? {
            ...version,
            usageCount: version.usageCount + 1,
            score: Math.min(1, version.score + 0.03),
            updatedAt: Date.now()
          } : version
        ) || skills[idx].versions,
        updatedAt: Date.now()
      };
      this.state.skills[walletAddress] = skills;
      await this.persist();
    }
  }
  async addMemory(walletAddress, memory) {
    const memories = this.state.memories[walletAddress] || [];
    memories.unshift(memory);
    this.state.memories[walletAddress] = memories.slice(0, 100);
    await this.persist();
    return memory;
  }
  async savePlannerRun(walletAddress, run) {
    const runs = this.state.plannerRuns[walletAddress] || [];
    runs.unshift(run);
    this.state.plannerRuns[walletAddress] = runs.slice(0, 200);
    await this.persist();
    return run;
  }
  async listPlannerRuns(walletAddress) {
    return this.state.plannerRuns[walletAddress] || [];
  }
  async saveDeployment(walletAddress, deployment) {
    const deployments = this.state.deployments[walletAddress] || [];
    deployments.unshift(deployment);
    this.state.deployments[walletAddress] = deployments.slice(0, 200);
    await this.persist();
    return deployment;
  }
  async listDeployments(walletAddress) {
    return this.state.deployments[walletAddress] || [];
  }
  async getReputation(walletAddress) {
    return this.state.reputations[walletAddress];
  }
  async saveReputation(walletAddress, reputation) {
    this.state.reputations[walletAddress] = reputation;
    await this.persist();
    return reputation;
  }
};

// server/solana/challengeService.ts
import crypto11 from "crypto";
function buildNonce() {
  return `claw_${crypto11.randomUUID().replace(/-/g, "").slice(0, 22)}`;
}
function buildChallengeMessage(input) {
  return [
    `${input.domain} wants you to sign in with your Solana account:`,
    input.walletAddress,
    "",
    input.statement,
    "",
    `URI: ${input.uri}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt}`,
    `Expiration Time: ${input.expirationTime}`,
    `Request ID: ${input.requestId}`
  ].join("\n");
}
function createChallengeRecord(input) {
  const now5 = Date.now();
  const ttl = input.ttlMs ?? 1e3 * 60 * 10;
  const nonce = buildNonce();
  const issuedAt = new Date(now5).toISOString();
  const expirationTime = new Date(now5 + ttl).toISOString();
  const record = {
    id: `chal_${crypto11.randomUUID().replace(/-/g, "")}`,
    walletAddress: input.walletAddress,
    domain: input.domain,
    uri: input.uri,
    statement: input.statement,
    nonce,
    issuedAt,
    expirationTime,
    chainId: input.chainId,
    requestId: input.requestId,
    message: buildChallengeMessage({
      domain: input.domain,
      uri: input.uri,
      walletAddress: input.walletAddress,
      chainId: input.chainId,
      statement: input.statement,
      nonce,
      issuedAt,
      expirationTime,
      requestId: input.requestId
    }),
    status: "challenge_issued"
  };
  return record;
}
function isChallengeExpired(challenge) {
  return Date.parse(challenge.expirationTime) < Date.now();
}

// server/solana/pda.ts
import { PublicKey } from "@solana/web3.js";
var CONFIG_SEED = "config";
var PROFILE_SEED = "profile";
var SKILL_SEED = "skill";
var SKILL_VERSION_SEED = "skill_version";
var MAX_SLUG_LEN = 64;
var MAX_VERSION_LEN = 24;
var DEFAULT_PROGRAM_ID2 = "11111111111111111111111111111111";
function toProgramId(programId) {
  const value = (programId || process.env.SOLANA_PROGRAM_ID || DEFAULT_PROGRAM_ID2).trim();
  try {
    return new PublicKey(value);
  } catch {
    throw new Error("Invalid Solana program id");
  }
}
function normalizeWalletAddress(input) {
  const value = String(input || "").trim();
  if (!value) throw new Error("walletAddress required");
  try {
    return new PublicKey(value).toBase58();
  } catch {
    throw new Error("Invalid wallet address");
  }
}
function validateSkillSlug(slug) {
  const value = String(slug || "").trim().toLowerCase();
  if (!value) throw new Error("skill slug required");
  if (value.length > MAX_SLUG_LEN) throw new Error("skill slug too long");
  if (!/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/.test(value)) {
    throw new Error("skill slug must be lowercase alphanumeric with - or _");
  }
  return value;
}
function validateSkillVersion(version) {
  const value = String(version || "").trim();
  if (!value) throw new Error("version required");
  if (value.length > MAX_VERSION_LEN) throw new Error("version too long");
  if (!/^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value)) {
    throw new Error("version must use semver format");
  }
  return value;
}
function deriveConfigPda(programId) {
  const pid = toProgramId(programId);
  const [address] = PublicKey.findProgramAddressSync([Buffer.from(CONFIG_SEED)], pid);
  return address.toBase58();
}
function deriveProfilePda(walletAddress, programId) {
  const pid = toProgramId(programId);
  const owner = new PublicKey(normalizeWalletAddress(walletAddress));
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(PROFILE_SEED), owner.toBuffer()],
    pid
  );
  return address.toBase58();
}
function deriveSkillPda(walletAddress, slug, programId) {
  const pid = toProgramId(programId);
  const owner = new PublicKey(normalizeWalletAddress(walletAddress));
  const normalizedSlug = validateSkillSlug(slug);
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(SKILL_SEED), owner.toBuffer(), Buffer.from(normalizedSlug)],
    pid
  );
  return address.toBase58();
}
function deriveSkillVersionPda(walletAddress, slug, version, programId) {
  const pid = toProgramId(programId);
  const skillPda = new PublicKey(deriveSkillPda(walletAddress, slug, programId));
  const normalizedVersion = validateSkillVersion(version);
  const [address] = PublicKey.findProgramAddressSync(
    [Buffer.from(SKILL_VERSION_SEED), skillPda.toBuffer(), Buffer.from(normalizedVersion)],
    pid
  );
  return address.toBase58();
}

// server/solana/identityService.ts
import bs58 from "bs58";
import crypto12 from "crypto";
import nacl from "tweetnacl";
import { PublicKey as PublicKey2 } from "@solana/web3.js";
var TITLE_MAX = 96;
var KIND_MAX = 40;
var HASH_MAX = 128;
var SUMMARY_MAX = 256;
var TAGS_MAX = 20;
function ensureLen(value, max, field) {
  if (!value) return;
  if (value.length > max) {
    throw new Error(`${field} exceeds max length ${max}`);
  }
}
function normalizedBps(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1e4, Math.floor(value)));
}
function bpsFromRatio(numerator, denominator) {
  if (denominator <= 0) return 0;
  return Math.min(1e4, Math.floor(numerator * 1e4 / denominator));
}
function trustScoreFromSignal(input) {
  const total = input.successCount + input.failureCount;
  const successBps = bpsFromRatio(input.successCount, Math.max(total, 1));
  const authComponent = Math.min(25, input.verifiedAuthorshipCount) * 120;
  const deployComponent = Math.min(25, input.deploymentCount) * 80;
  return Math.min(1e4, Math.floor(successBps / 2 + authComponent + deployComponent));
}
function discoveryScoreFromSignal(input) {
  const usageComponent = Math.min(1e3, input.usageCount) * 3;
  const successRatio = bpsFromRatio(input.successCount, Math.max(input.usageCount, 1));
  const versionComponent = Math.min(20, input.versionCount) * 40;
  const publishComponent = Math.min(50, input.publishedSkillCount) * 50;
  const authorshipComponent = Math.min(50, input.verifiedAuthorshipCount) * 30;
  const reflectionComponent = Math.floor(input.avgReflectionQualityBps / 2);
  const signalComponent = Math.min(400, input.signalCount) * 2;
  return Math.min(
    1e4,
    Math.floor(
      input.trustScoreBps / 2 + usageComponent + successRatio / 2 + versionComponent + publishComponent + authorshipComponent + reflectionComponent + signalComponent
    )
  );
}
var SolanaIdentityService = class {
  constructor(store, opts) {
    this.store = store;
    this.opts = opts;
  }
  async createChallenge(walletAddress, requestId6) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const challenge = createChallengeRecord({
      walletAddress: normalizedWallet,
      domain: this.opts.domain,
      uri: this.opts.uri,
      statement: this.opts.statement,
      chainId: this.opts.chainId,
      requestId: requestId6
    });
    challenge.accounts = {
      programId: this.opts.programId,
      configPda: deriveConfigPda(this.opts.programId),
      profilePda: deriveProfilePda(normalizedWallet, this.opts.programId)
    };
    await this.store.saveChallenge(challenge);
    return challenge;
  }
  async verifySignature(input) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    const challenge = await this.store.getChallenge(input.challengeId);
    if (!challenge) throw new Error("Challenge not found");
    if (challenge.walletAddress !== normalizedWallet) throw new Error("Challenge wallet mismatch");
    if (isChallengeExpired(challenge)) throw new Error("Challenge expired");
    if (challenge.chainId !== this.opts.chainId) throw new Error("Unsupported chain id");
    if (challenge.message !== input.message) throw new Error("Message mismatch");
    const messageBytes = new TextEncoder().encode(input.message);
    const publicKey = new PublicKey2(normalizedWallet);
    const signature = bs58.decode(input.signatureBase58);
    const ok5 = nacl.sign.detached.verify(messageBytes, signature, publicKey.toBytes());
    if (!ok5) throw new Error("Signature verification failed");
    challenge.signature = input.signatureBase58;
    challenge.status = "verified";
    challenge.verifiedAt = Date.now();
    challenge.accounts = {
      ...challenge.accounts,
      programId: this.opts.programId,
      configPda: deriveConfigPda(this.opts.programId),
      profilePda: deriveProfilePda(normalizedWallet, this.opts.programId)
    };
    await this.store.saveChallenge(challenge);
    await this.publishSeedData(normalizedWallet);
    let profile = await this.upsertProfile(normalizedWallet);
    await this.createReceipt({
      walletAddress: normalizedWallet,
      challenge,
      signatureBase58: input.signatureBase58,
      profile
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
      reputation: bundle?.reputation
    };
  }
  async getIdentity(walletAddress) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const bundle = await this.bundle(normalizedWallet);
    if (!bundle) throw new Error("Identity not found");
    return bundle;
  }
  async getProfile(walletAddress) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const profile = await this.store.getProfile(normalizedWallet);
    if (!profile) throw new Error("Profile not found");
    return profile;
  }
  async getSkills(walletAddress) {
    return this.store.listSkills(normalizeWalletAddress(walletAddress));
  }
  async getMemories(walletAddress) {
    return this.store.listMemories(normalizeWalletAddress(walletAddress));
  }
  async getReceipts(walletAddress) {
    return this.store.listReceipts(normalizeWalletAddress(walletAddress));
  }
  async getPlannerRuns(walletAddress) {
    return this.store.listPlannerRuns(normalizeWalletAddress(walletAddress));
  }
  async getDeployments(walletAddress) {
    return this.store.listDeployments(normalizeWalletAddress(walletAddress));
  }
  async getReputation(walletAddress) {
    return this.store.getReputation(normalizeWalletAddress(walletAddress));
  }
  async listDiscoveryProfiles() {
    const profiles = await this.store.listProfiles();
    const rows = await Promise.all(
      profiles.map(async (profile) => {
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
            lastEventAt: rep.lastEventAt
          };
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
          lastEventAt: hydrated.lastEventAt
        };
      })
    );
    return rows.sort((a, b) => b.discoveryScoreBps - a.discoveryScoreBps);
  }
  async listDiscoverySkills(filter) {
    const skills = await this.store.listAllSkills();
    const rows = await Promise.all(
      skills.map(async (skill) => {
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
          deploymentCount: rep.deploymentCount
        });
        const signalCount = usageCount + versionCount + Math.max(0, skill.verifiedAuthorshipCount ?? rep.verifiedAuthorshipCount);
        const discoveryScoreBps = discoveryScoreFromSignal({
          trustScoreBps,
          usageCount,
          successCount,
          versionCount,
          publishedSkillCount: rep.publishedSkillCount,
          verifiedAuthorshipCount: skill.verifiedAuthorshipCount ?? rep.verifiedAuthorshipCount,
          avgReflectionQualityBps,
          signalCount
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
          updatedAt: skill.updatedAt
        };
      })
    );
    let filtered = rows;
    const query = filter?.query?.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (row) => [row.slug, row.name, row.category, row.language, ...row.tags].join(" ").toLowerCase().includes(query)
      );
    }
    if (filter?.category) filtered = filtered.filter((row) => row.category === filter.category);
    if (filter?.language) filtered = filtered.filter((row) => row.language === filter.language);
    if (filter?.tag) filtered = filtered.filter((row) => row.tags.includes(filter.tag));
    if (typeof filter?.minTrustBps === "number") {
      filtered = filtered.filter((row) => row.trustScoreBps >= filter.minTrustBps);
    }
    if (typeof filter?.minDiscoveryBps === "number") {
      filtered = filtered.filter((row) => row.discoveryScoreBps >= filter.minDiscoveryBps);
    }
    if (typeof filter?.minUsage === "number") {
      filtered = filtered.filter((row) => row.usageCount >= filter.minUsage);
    }
    if (filter?.verifiedOnly) {
      filtered = filtered.filter((row) => row.trustScoreBps >= 5e3);
    }
    return filtered.sort((a, b) => {
      if (b.discoveryScoreBps !== a.discoveryScoreBps) return b.discoveryScoreBps - a.discoveryScoreBps;
      if (b.trustScoreBps !== a.trustScoreBps) return b.trustScoreBps - a.trustScoreBps;
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return b.updatedAt - a.updatedAt;
    }).map((row, idx) => ({ ...row, lastRank: idx + 1 }));
  }
  async getDiscoveryByWallet(walletAddress) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const profile = await this.getProfile(normalizedWallet);
    const reputation = await this.buildWalletReputation(normalizedWallet);
    const skills = await this.listDiscoverySkills();
    return {
      profile,
      reputation,
      skills: skills.filter((row) => row.owner === normalizedWallet),
      memories: await this.store.listMemories(normalizedWallet)
    };
  }
  async recordSkillUse(walletAddress, skillName) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    await this.store.bumpUsage(normalizedWallet, skillName);
    await this.recordReputationEvent({
      walletAddress: normalizedWallet,
      eventKind: "other",
      eventRef: skillName,
      weight: 1
    });
    return this.store.listSkills(normalizedWallet);
  }
  async recordMemory(input) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    return this.recordMemoryAnchor({
      walletAddress: normalizedWallet,
      sourceTurnId: input.sourceTurnId || input.id,
      taskType: "reflection",
      kind: typeof input.kind === "string" ? input.kind : "reflection",
      result: "unknown",
      sourceHash: input.sourceHash || "",
      reflectionHash: input.reflectionHash || crypto12.createHash("sha256").update(`${input.title}:${input.summary}`).digest("hex"),
      lessonHash: input.lessonHash || crypto12.createHash("sha256").update(input.correctiveAdvice || "").digest("hex"),
      summary: input.summary,
      rootCause: input.rootCause || "",
      correctiveAdvice: input.correctiveAdvice || "",
      nextBestAction: input.nextBestAction || "",
      confidenceBps: input.confidenceBps,
      severityBps: input.severityBps,
      tags: input.tags,
      relatedMemoryIds: input.relatedMemoryIds || [],
      pinned: Boolean(input.pinned)
    });
  }
  async recordMemoryAnchor(input) {
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
    const now5 = Date.now();
    const tags = input.tags.slice(0, TAGS_MAX).map((tag) => tag.trim()).filter(Boolean);
    const memory = {
      id: `mem_${crypto12.randomUUID().slice(0, 8)}`,
      walletAddress: input.walletAddress,
      kind: input.kind,
      result: input.result,
      taskType: input.taskType,
      title: input.sourceTurnId,
      summary: input.summary,
      tags,
      importance: input.pinned ? 0.9 : 0.6,
      createdAt: now5,
      updatedAt: now5,
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
      relatedMemoryIds: input.relatedMemoryIds
    };
    await this.store.addMemory(input.walletAddress, memory);
    await this.recordReputationEvent({
      walletAddress: input.walletAddress,
      eventKind: "memory_anchor",
      eventRef: input.sourceTurnId,
      success: input.result === "success",
      weight: input.pinned ? 5 : 2,
      reflectionQualityBps: normalizedBps(input.confidenceBps)
    });
    return memory;
  }
  async recordPlannerRun(input) {
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
    const now5 = Date.now();
    const run = {
      id: `plan_${crypto12.randomUUID().slice(0, 8)}`,
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
      createdAt: now5,
      updatedAt: now5,
      completedAt: input.outcome === "succeeded" || input.outcome === "failed" || input.outcome === "aborted" ? now5 : void 0
    };
    await this.store.savePlannerRun(normalizedWallet, run);
    await this.recordReputationEvent({
      walletAddress: normalizedWallet,
      eventKind: "planner_run",
      eventRef: input.runId,
      success: input.outcome === "succeeded",
      weight: 3,
      reflectionQualityBps: normalizedBps(input.confidenceBps)
    });
    return run;
  }
  async recordDeployment(input) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    ensureLen(input.deployId, TITLE_MAX, "deployId");
    ensureLen(input.name, TITLE_MAX, "name");
    ensureLen(input.version, KIND_MAX, "version");
    ensureLen(input.target, KIND_MAX, "target");
    ensureLen(input.bundleHash, HASH_MAX, "bundleHash");
    ensureLen(input.sourceHash, HASH_MAX, "sourceHash");
    ensureLen(input.receiptHash, HASH_MAX, "receiptHash");
    const now5 = Date.now();
    const deployment = {
      id: `dep_${crypto12.randomUUID().slice(0, 8)}`,
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
      createdAt: now5,
      updatedAt: now5,
      confirmedAt: input.status === "confirmed" || input.status === "anchored" ? now5 : void 0
    };
    await this.store.saveDeployment(normalizedWallet, deployment);
    await this.recordReputationEvent({
      walletAddress: normalizedWallet,
      eventKind: "deployment",
      eventRef: input.deployId,
      success: input.status === "confirmed" || input.status === "anchored",
      weight: 4
    });
    return deployment;
  }
  async recordReputationEvent(input) {
    const normalizedWallet = normalizeWalletAddress(input.walletAddress);
    const now5 = Date.now();
    const current = await this.store.getReputation(normalizedWallet);
    const reputation = current || {
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
      lastEventAt: now5,
      createdAt: now5,
      updatedAt: now5
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
      deploymentCount: reputation.deploymentCount
    });
    reputation.discoveryScoreBps = discoveryScoreFromSignal({
      trustScoreBps: reputation.trustScoreBps,
      usageCount: reputation.usageCount,
      successCount: reputation.successCount,
      versionCount: reputation.publishedVersionCount,
      publishedSkillCount: reputation.publishedSkillCount,
      verifiedAuthorshipCount: reputation.verifiedAuthorshipCount,
      avgReflectionQualityBps: reputation.avgReflectionQualityBps,
      signalCount: reputation.memoryAnchorCount + reputation.plannerRunCount + reputation.deploymentCount + reputation.publishedVersionCount
    });
    reputation.lastEventKind = input.eventKind;
    reputation.lastEventRef = input.eventRef;
    reputation.lastEventAt = now5;
    reputation.updatedAt = now5;
    await this.store.saveReputation(normalizedWallet, reputation);
    await this.upsertProfile(normalizedWallet);
    return reputation;
  }
  async publishSeedData(walletAddress) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const existing = await this.store.listSkills(normalizedWallet);
    if (existing.length) return existing;
    const now5 = Date.now();
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
    const skills = [
      {
        id: `skill_${crypto12.randomUUID().slice(0, 8)}`,
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
          skillVersionPda: plannerVersionPda
        },
        versions: [
          {
            id: `ver_${crypto12.randomUUID().slice(0, 8)}`,
            walletAddress: normalizedWallet,
            slug: plannerSlug,
            version: plannerVersion,
            skillPda: plannerSkillPda,
            skillVersionPda: plannerVersionPda,
            status: "active",
            usageCount: 42,
            score: 0.91,
            createdAt: now5,
            updatedAt: now5
          }
        ],
        createdAt: now5,
        updatedAt: now5
      },
      {
        id: `skill_${crypto12.randomUUID().slice(0, 8)}`,
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
          skillVersionPda: memoryVersionPda
        },
        versions: [
          {
            id: `ver_${crypto12.randomUUID().slice(0, 8)}`,
            walletAddress: normalizedWallet,
            slug: memorySlug,
            version: memoryVersion,
            skillPda: memorySkillPda,
            skillVersionPda: memoryVersionPda,
            status: "active",
            usageCount: 31,
            score: 0.89,
            createdAt: now5,
            updatedAt: now5
          }
        ],
        createdAt: now5,
        updatedAt: now5
      }
    ];
    const memories = [
      {
        id: `mem_${crypto12.randomUUID().slice(0, 8)}`,
        walletAddress: normalizedWallet,
        kind: "reflection",
        title: "A timeout became a docs retrieval rule",
        summary: "When docs browsing timed out, the agent learned to go directly to the source page first.",
        tags: ["docs", "timeout", "retrieval"],
        importance: 0.86,
        createdAt: now5,
        pinned: true,
        sourceTurnId: `turn_${crypto12.randomUUID().slice(0, 8)}`,
        rootCause: "Too broad a browser path.",
        correctiveAdvice: "Start with official docs and confirm the endpoint before summarizing.",
        confidenceBps: 8900
      },
      {
        id: `mem_${crypto12.randomUUID().slice(0, 8)}`,
        walletAddress: normalizedWallet,
        kind: "reflection",
        title: "Structured output needs strict schema",
        summary: "The agent learned to emit JSON-only reflections when downstream parsers require it.",
        tags: ["json", "schema", "reflection"],
        importance: 0.81,
        createdAt: now5,
        pinned: true,
        sourceTurnId: `turn_${crypto12.randomUUID().slice(0, 8)}`,
        rootCause: "Mixed prose with JSON.",
        correctiveAdvice: "Use strict schema-first output and validate before saving.",
        confidenceBps: 9200
      }
    ];
    await this.store.saveSkills(normalizedWallet, skills);
    await this.store.saveMemories(normalizedWallet, memories);
    return skills;
  }
  async bundle(walletAddress, challengeId) {
    const bundle = await this.store.bundle(walletAddress, challengeId);
    if (!bundle) return void 0;
    return {
      ...bundle,
      accounts: {
        programId: this.opts.programId,
        configPda: deriveConfigPda(this.opts.programId),
        profilePda: deriveProfilePda(walletAddress, this.opts.programId)
      }
    };
  }
  async buildWalletReputation(walletAddress) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const now5 = Date.now();
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
      (sum, skill) => sum + (skill.failureCount ?? Math.max(0, (skill.usageCount || 0) - (skill.successCount || 0))),
      0
    );
    const plannerSuccess = plannerRuns.filter((run) => run.outcome === "succeeded").length;
    const plannerFailure = plannerRuns.filter((run) => run.outcome === "failed" || run.outcome === "aborted").length;
    const deploySuccess = deployments.filter(
      (deployment) => deployment.status === "confirmed" || deployment.status === "anchored"
    ).length;
    const deployFailure = deployments.filter((deployment) => deployment.status === "failed").length;
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
      deploymentCount: deployments.length
    });
    const discoveryScoreBps = discoveryScoreFromSignal({
      trustScoreBps,
      usageCount,
      successCount,
      versionCount: publishedVersionCount,
      publishedSkillCount,
      verifiedAuthorshipCount,
      avgReflectionQualityBps,
      signalCount: memories.length + plannerRuns.length + deployments.length + publishedVersionCount
    });
    const computedRewardPoints = usageFromSkills + memories.length * 10 + plannerRuns.length * 4 + deployments.length * 5 + publishedVersionCount * 3;
    const reputation = {
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
      lastEventAt: existing?.lastEventAt || now5,
      createdAt: existing?.createdAt || now5,
      updatedAt: now5
    };
    await this.store.saveReputation(normalizedWallet, reputation);
    return reputation;
  }
  async upsertProfile(walletAddress) {
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const existing = await this.store.getProfile(normalizedWallet);
    const now5 = Date.now();
    const profile = existing || {
      walletAddress: normalizedWallet,
      authorityWallet: normalizedWallet,
      displayName: `Wallet ${normalizedWallet.slice(0, 4)}\u2026${normalizedWallet.slice(-4)}`,
      status: "verified",
      reputation: 0.58,
      verifiedAt: now5,
      lastSeenAt: now5,
      skillCount: 0,
      memoryCount: 0,
      receiptCount: 0,
      chainId: this.opts.chainId,
      profileHash: "",
      accounts: {
        programId: this.opts.programId,
        configPda: deriveConfigPda(this.opts.programId),
        profilePda: deriveProfilePda(normalizedWallet, this.opts.programId)
      },
      metadata: {}
    };
    const skills = await this.store.listSkills(normalizedWallet);
    const memories = await this.store.listMemories(normalizedWallet);
    const receipts = await this.store.listReceipts(normalizedWallet);
    const plannerRuns = await this.store.listPlannerRuns(normalizedWallet);
    const deployments = await this.store.listDeployments(normalizedWallet);
    const reputation = await this.buildWalletReputation(normalizedWallet);
    const next = {
      ...profile,
      status: "verified",
      verifiedAt: profile.verifiedAt || now5,
      lastSeenAt: now5,
      skillCount: skills.length,
      memoryCount: memories.length,
      plannerRunCount: plannerRuns.length,
      deploymentCount: deployments.length,
      receiptCount: receipts.length,
      reputation: Math.min(1, reputation.trustScoreBps / 1e4),
      trustScoreBps: reputation.trustScoreBps,
      chainId: this.opts.chainId,
      authorityWallet: normalizedWallet,
      accounts: {
        programId: this.opts.programId,
        configPda: deriveConfigPda(this.opts.programId),
        profilePda: deriveProfilePda(normalizedWallet, this.opts.programId)
      },
      profileHash: crypto12.createHash("sha256").update(
        JSON.stringify({
          walletAddress: normalizedWallet,
          skillCount: skills.length,
          memoryCount: memories.length,
          plannerRunCount: plannerRuns.length,
          deploymentCount: deployments.length,
          receiptCount: receipts.length,
          trustScoreBps: reputation.trustScoreBps,
          discoveryScoreBps: reputation.discoveryScoreBps
        })
      ).digest("hex")
    };
    await this.store.saveProfile(next);
    return next;
  }
  async createReceipt(input) {
    const receiptId2 = `rcpt_${crypto12.randomUUID().replace(/-/g, "")}`;
    const profileHash = input.profile.profileHash || "";
    const challengeHash = crypto12.createHash("sha256").update(input.challenge.message).digest("hex");
    const signatureHash = crypto12.createHash("sha256").update(input.signatureBase58).digest("hex");
    const receiptHash = crypto12.createHash("sha256").update(
      JSON.stringify({
        receiptId: receiptId2,
        walletAddress: input.walletAddress,
        profileHash,
        challengeHash,
        signatureHash
      })
    ).digest("hex");
    const receipt = {
      id: receiptId2,
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
        profilePda: deriveProfilePda(input.walletAddress, this.opts.programId)
      },
      metadata: { challengeId: input.challenge.id }
    };
    await this.store.saveReceipt(receipt);
    if (this.opts.onchain) {
      try {
        const anchored = await this.opts.onchain.anchorReceipt({
          walletAddress: input.walletAddress,
          receiptId: receiptId2,
          profileHash,
          challengeHash,
          signatureHash,
          receiptHash,
          chainId: this.opts.chainId,
          labels: receipt.labels,
          summary: receipt.summary
        });
        receipt.txHash = anchored.txHash;
        receipt.programId = this.opts.programId;
        receipt.metadata = {
          ...receipt.metadata || {},
          receiptPda: anchored.receiptPda
        };
        await this.store.saveReceipt(receipt);
      } catch {
        receipt.status = "pending";
        await this.store.saveReceipt(receipt);
      }
    }
    return receipt;
  }
};

// server/solana/routes.ts
function requestId(req) {
  return req.headers["x-request-id"] || `req_${Date.now()}`;
}
function toNumber(v, fallback) {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function readBearerToken(req) {
  const auth = String(req.headers.authorization || "");
  if (!auth.startsWith("Bearer ")) return void 0;
  return auth.slice("Bearer ".length).trim();
}
function registerSolanaIdentityRoutes(app, service, sessionService) {
  app.post("/api/solana/session/nonce", async (req, res) => {
    try {
      const walletAddress = String(req.body.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress required");
      const data = sessionService.issueNonce(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "session_nonce_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/session/verify", async (req, res) => {
    try {
      const walletAddress = String(req.body.walletAddress || "").trim();
      const nonceId = String(req.body.nonceId || "").trim();
      const signature = String(req.body.signature || "").trim();
      if (!walletAddress || !nonceId || !signature) {
        throw new Error("walletAddress, nonceId, and signature are required");
      }
      const data = sessionService.verifySession({
        walletAddress: normalizeWalletAddress(walletAddress),
        nonceId,
        signature
      });
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "session_verify_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/session", async (req, res) => {
    try {
      const queryWallet = String(req.query.walletAddress || "").trim();
      const token = readBearerToken(req);
      const profile = sessionService.getSessionFromToken(token);
      if (profile) {
        res.json({ ok: true, data: { token, profile } });
        return;
      }
      if (queryWallet) {
        res.json({
          ok: true,
          data: {
            token: null,
            profile: null,
            walletAddress: normalizeWalletAddress(queryWallet),
            active: false
          }
        });
        return;
      }
      res.status(401).json({ ok: false, error: "session_not_found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "session_fetch_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/session/refresh", async (req, res) => {
    try {
      const token = String(req.body.token || readBearerToken(req) || "").trim();
      if (!token) throw new Error("session_token_required");
      const data = sessionService.refreshSession(token);
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "session_refresh_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/session/logout", async (req, res) => {
    try {
      const token = String(req.body.token || readBearerToken(req) || "").trim();
      if (!token) throw new Error("session_token_required");
      const data = sessionService.logoutSession(token);
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "session_logout_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/status", async (_req, res) => {
    try {
      const data = sessionService.getStatus();
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "status_failed";
      res.status(500).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/reputation/profiles", async (_req, res) => {
    try {
      const data = await service.listDiscoveryProfiles();
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "discovery_profiles_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/discovery/skills", async (req, res) => {
    try {
      const data = await service.listDiscoverySkills({
        query: req.query.q ? String(req.query.q) : void 0,
        category: req.query.category ? String(req.query.category) : void 0,
        tag: req.query.tag ? String(req.query.tag) : void 0,
        language: req.query.language ? String(req.query.language) : void 0,
        minTrustBps: toNumber(req.query.minTrustBps),
        minDiscoveryBps: toNumber(req.query.minDiscoveryBps),
        minUsage: toNumber(req.query.minUsage),
        verifiedOnly: req.query.verifiedOnly === "true"
      });
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "discovery_skills_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/discovery/wallet/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getDiscoveryByWallet(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "discovery_wallet_failed";
      res.status(404).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/identity/challenge", async (req, res) => {
    try {
      const walletAddress = String(req.body.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress required");
      const challenge = await service.createChallenge(normalizeWalletAddress(walletAddress), requestId(req));
      res.json({ ok: true, data: challenge });
    } catch (error) {
      const message = error instanceof Error ? error.message : "challenge_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/identity/verify", async (req, res) => {
    try {
      const walletAddress = String(req.body.walletAddress || "").trim();
      const challengeId = String(req.body.challengeId || "").trim();
      const signature = String(req.body.signature || "").trim();
      const message = String(req.body.message || "").trim();
      if (!walletAddress || !challengeId || !signature || !message) {
        throw new Error("walletAddress, challengeId, signature, and message are required");
      }
      const data = await service.verifySignature({
        walletAddress: normalizeWalletAddress(walletAddress),
        challengeId,
        signatureBase58: signature,
        message
      });
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "verify_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/identity/:walletAddress", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getIdentity(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "identity_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/identity/:walletAddress/profile", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getProfile(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "profile_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/identity/:walletAddress/skills", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getSkills(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "skills_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/identity/:walletAddress/memories", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getMemories(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "memories_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/identity/:walletAddress/receipts", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getReceipts(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "receipts_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/identity/:walletAddress/skill-use", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const skillRef = String(req.body.skillSlug || req.body.skillName || req.body.skillId || "").trim();
      if (!skillRef) throw new Error("skillSlug, skillName, or skillId required");
      const data = await service.recordSkillUse(normalizedWallet, skillRef);
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "skill_use_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/identity/:walletAddress/memory", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const memory = await service.recordMemory({
        id: `mem_${Date.now()}`,
        walletAddress: normalizedWallet,
        kind: String(req.body.kind || "reflection"),
        title: String(req.body.title || "Untitled memory"),
        summary: String(req.body.summary || ""),
        tags: Array.isArray(req.body.tags) ? req.body.tags.map(String) : [],
        importance: Number(req.body.importance || 0.5),
        createdAt: Date.now(),
        pinned: Boolean(req.body.pinned),
        sourceTurnId: req.body.sourceTurnId ? String(req.body.sourceTurnId) : void 0,
        rootCause: req.body.rootCause ? String(req.body.rootCause) : void 0,
        correctiveAdvice: req.body.correctiveAdvice ? String(req.body.correctiveAdvice) : void 0
      });
      res.json({ ok: true, data: memory });
    } catch (error) {
      const message = error instanceof Error ? error.message : "memory_store_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/identity/:walletAddress/memory-anchor", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const data = await service.recordMemoryAnchor({
        walletAddress: normalizedWallet,
        sourceTurnId: String(req.body.sourceTurnId || `turn_${Date.now()}`),
        taskType: String(req.body.taskType || "general"),
        kind: String(req.body.kind || "reflection"),
        result: String(req.body.result || "unknown"),
        sourceHash: String(req.body.sourceHash || ""),
        reflectionHash: String(req.body.reflectionHash || ""),
        lessonHash: String(req.body.lessonHash || ""),
        summary: String(req.body.summary || ""),
        rootCause: String(req.body.rootCause || ""),
        correctiveAdvice: String(req.body.correctiveAdvice || ""),
        nextBestAction: String(req.body.nextBestAction || ""),
        confidenceBps: Number(req.body.confidenceBps || 0),
        severityBps: Number(req.body.severityBps || 0),
        tags: Array.isArray(req.body.tags) ? req.body.tags.map(String) : [],
        relatedMemoryIds: Array.isArray(req.body.relatedMemoryIds) ? req.body.relatedMemoryIds.map(String) : [],
        pinned: Boolean(req.body.pinned)
      });
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "memory_anchor_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/identity/:walletAddress/planner-run", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const data = await service.recordPlannerRun({
        walletAddress: normalizedWallet,
        runId: String(req.body.runId || `run_${Date.now()}`),
        taskType: String(req.body.taskType || "general"),
        goal: String(req.body.goal || ""),
        planHash: String(req.body.planHash || ""),
        stepHash: String(req.body.stepHash || ""),
        outcome: String(req.body.outcome || "planned"),
        selectedSkill: req.body.selectedSkill ? String(req.body.selectedSkill) : void 0,
        stepCount: Number(req.body.stepCount || 0),
        completedSteps: Number(req.body.completedSteps || 0),
        failedSteps: Number(req.body.failedSteps || 0),
        rootCause: req.body.rootCause ? String(req.body.rootCause) : void 0,
        correctiveAdvice: req.body.correctiveAdvice ? String(req.body.correctiveAdvice) : void 0,
        nextBestAction: req.body.nextBestAction ? String(req.body.nextBestAction) : void 0,
        confidenceBps: Number(req.body.confidenceBps || 0)
      });
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "planner_run_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/identity/:walletAddress/deployment", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const data = await service.recordDeployment({
        walletAddress: normalizedWallet,
        deployId: String(req.body.deployId || `deploy_${Date.now()}`),
        name: String(req.body.name || "Unnamed deployment"),
        version: String(req.body.version || "0.0.1"),
        target: String(req.body.target || "solana"),
        bundleHash: String(req.body.bundleHash || ""),
        sourceHash: String(req.body.sourceHash || ""),
        storageKey: String(req.body.storageKey || ""),
        receiptHash: String(req.body.receiptHash || ""),
        txHash: req.body.txHash ? String(req.body.txHash) : void 0,
        explorerUrl: req.body.explorerUrl ? String(req.body.explorerUrl) : void 0,
        status: String(req.body.status || "pending"),
        artifactCount: Number(req.body.artifactCount || 0),
        bytes: Number(req.body.bytes || 0),
        chainId: Number(req.body.chainId || 0) || void 0
      });
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "deployment_record_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/solana/identity/:walletAddress/reputation", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const normalizedWallet = normalizeWalletAddress(walletAddress);
      const data = await service.recordReputationEvent({
        walletAddress: normalizedWallet,
        eventKind: String(req.body.eventKind || "other"),
        eventRef: String(req.body.eventRef || ""),
        success: Boolean(req.body.success),
        weight: Number(req.body.weight || 0)
      });
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "reputation_update_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/identity/:walletAddress/planner-runs", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getPlannerRuns(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "planner_runs_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/identity/:walletAddress/deployments", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getDeployments(normalizeWalletAddress(walletAddress));
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "deployments_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
  app.get("/api/solana/identity/:walletAddress/reputation", async (req, res) => {
    try {
      const walletAddress = String(req.params.walletAddress);
      const data = await service.getReputation(normalizeWalletAddress(walletAddress));
      if (!data) {
        res.status(404).json({ ok: false, error: "reputation_not_found" });
        return;
      }
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "reputation_not_found";
      res.status(404).json({ ok: false, error: message });
    }
  });
}

// server/solana/mount.ts
import path6 from "path";

// server/solana/session.ts
import crypto13 from "crypto";
import bs582 from "bs58";
import nacl2 from "tweetnacl";
import { PublicKey as PublicKey3 } from "@solana/web3.js";
function nowMs() {
  return Date.now();
}
function randomId5(prefix, size = 12) {
  return `${prefix}_${crypto13.randomBytes(size).toString("hex")}`;
}
function defaultPermissions() {
  return {
    canPublishSkill: true,
    canExecuteTask: true,
    canAnchorReceipt: true,
    canSignSession: true,
    canViewChainData: true
  };
}
function deriveDisplayName(walletAddress) {
  return `Agent ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
}
var SolanaSessionService = class {
  nonceStore = /* @__PURE__ */ new Map();
  sessionStore = /* @__PURE__ */ new Map();
  walletSessionIndex = /* @__PURE__ */ new Map();
  cluster;
  productName;
  constructor(opts) {
    this.cluster = opts?.cluster || "devnet";
    this.productName = opts?.productName || "CLAW MACHINE";
  }
  issueNonce(walletAddress) {
    const normalizedWallet = walletAddress.trim();
    const issuedAt = nowMs();
    const expiresAt = issuedAt + 5 * 60 * 1e3;
    const nonceId = randomId5("nonce");
    const nonce = crypto13.randomBytes(16).toString("hex");
    const issuedAtIso = new Date(issuedAt).toISOString();
    const message = [
      `${this.productName.toUpperCase()} Solana session verification`,
      `Wallet: ${normalizedWallet}`,
      `Cluster: ${this.cluster}`,
      "Purpose: authorize skill publishing, agent execution, and receipt anchoring",
      `Nonce: ${nonce}`,
      `Timestamp: ${issuedAtIso}`
    ].join("\n");
    this.nonceStore.set(nonceId, {
      nonceId,
      nonce,
      walletAddress: normalizedWallet,
      issuedAt,
      expiresAt,
      cluster: this.cluster,
      message,
      used: false
    });
    return {
      nonceId,
      nonce,
      message,
      expiresAt,
      cluster: this.cluster
    };
  }
  verifySession(input) {
    const normalizedWallet = input.walletAddress.trim();
    const nonce = this.nonceStore.get(input.nonceId);
    if (!nonce) throw new Error("session_nonce_not_found");
    if (nonce.used) throw new Error("session_nonce_already_used");
    if (nonce.walletAddress !== normalizedWallet) throw new Error("session_wallet_mismatch");
    if (nonce.expiresAt < nowMs()) throw new Error("session_nonce_expired");
    const messageBytes = new TextEncoder().encode(nonce.message);
    const signatureBytes = bs582.decode(input.signature);
    const walletBytes = new PublicKey3(normalizedWallet).toBytes();
    const valid = nacl2.sign.detached.verify(messageBytes, signatureBytes, walletBytes);
    if (!valid) throw new Error("session_signature_invalid");
    nonce.used = true;
    this.nonceStore.set(nonce.nonceId, nonce);
    const token = randomId5("solsess", 24);
    const sessionId = randomId5("session");
    const verifiedAt = nowMs();
    const expiresAt = verifiedAt + 60 * 60 * 1e3;
    const profile = {
      walletAddress: normalizedWallet,
      cluster: nonce.cluster,
      displayName: deriveDisplayName(normalizedWallet),
      verifiedAt,
      expiresAt,
      nonceId: nonce.nonceId,
      sessionId,
      permissions: defaultPermissions()
    };
    const record = {
      token,
      profile,
      createdAt: verifiedAt,
      updatedAt: verifiedAt
    };
    const previousToken = this.walletSessionIndex.get(normalizedWallet);
    if (previousToken) this.sessionStore.delete(previousToken);
    this.walletSessionIndex.set(normalizedWallet, token);
    this.sessionStore.set(token, record);
    return { token, profile };
  }
  getSessionFromToken(token) {
    if (!token) return null;
    const value = token.trim();
    if (!value) return null;
    const record = this.sessionStore.get(value);
    if (!record) return null;
    if (record.profile.expiresAt < nowMs()) {
      this.sessionStore.delete(value);
      this.walletSessionIndex.delete(record.profile.walletAddress);
      return null;
    }
    return record.profile;
  }
  refreshSession(token) {
    const record = this.sessionStore.get(token);
    if (!record) throw new Error("session_not_found");
    if (record.profile.expiresAt < nowMs()) throw new Error("session_expired");
    const refreshed = {
      ...record,
      profile: {
        ...record.profile,
        expiresAt: nowMs() + 60 * 60 * 1e3
      },
      updatedAt: nowMs()
    };
    this.sessionStore.set(token, refreshed);
    return {
      token,
      profile: refreshed.profile
    };
  }
  logoutSession(token) {
    const record = this.sessionStore.get(token);
    if (!record) return { ok: true };
    this.walletSessionIndex.delete(record.profile.walletAddress);
    this.sessionStore.delete(token);
    return { ok: true };
  }
  getStatus() {
    const activeSessions = Array.from(this.sessionStore.values()).filter(
      (row) => row.profile.expiresAt > nowMs()
    ).length;
    return {
      cluster: this.cluster,
      product: this.productName,
      activeSessions,
      outstandingNonces: Array.from(this.nonceStore.values()).filter(
        (row) => !row.used && row.expiresAt > nowMs()
      ).length
    };
  }
};

// server/solana/config.ts
function clusterFromEnv() {
  const c = (process.env.SOLANA_CLUSTER || process.env.CLAW_SOLANA_CLUSTER || "devnet").toLowerCase();
  if (c === "mainnet" || c === "mainnet-beta") return "mainnet-beta";
  if (c === "testnet") return "testnet";
  if (c === "localnet" || c === "localhost") return "localnet";
  return "devnet";
}
function getServerSolanaCluster() {
  return clusterFromEnv();
}

// server/solana/mount.ts
async function mountSolanaIdentity(app, options) {
  const store = new IdentityStore(path6.join(process.cwd(), "data", "solana-identity.json"));
  await store.init();
  const service = new SolanaIdentityService(store, {
    domain: process.env.CLAW_IDENTITY_DOMAIN || "localhost",
    uri: process.env.CLAW_IDENTITY_URI || "http://localhost:3000",
    chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
    programId: process.env.SOLANA_PROGRAM_ID || process.env.CLAW_IDENTITY_PROGRAM_ID || void 0,
    statement: process.env.CLAW_IDENTITY_STATEMENT || "Sign this message to bind your Solana wallet to CLAW MACHINE.",
    onchain: options?.solanaBridge ? {
      anchorReceipt: async (input) => {
        const tx = await options.solanaBridge.sendInstruction({
          walletAddress: input.walletAddress,
          action: "anchor_receipt",
          subjectId: input.receiptId,
          payloadHash: input.receiptHash,
          receiptId: input.receiptId,
          metadata: {
            profileHash: input.profileHash,
            challengeHash: input.challengeHash,
            signatureHash: input.signatureHash,
            chainId: input.chainId,
            labels: input.labels,
            summary: input.summary
          }
        });
        if (tx.status === "failed" || !tx.txSignature) {
          throw new Error(tx.error || "solana_bridge_anchor_failed");
        }
        return {
          txHash: tx.txSignature,
          receiptPda: tx.accountAddress
        };
      }
    } : void 0
  });
  const sessionService = new SolanaSessionService({
    cluster: getServerSolanaCluster(),
    productName: process.env.CLAW_IDENTITY_APP_NAME || "CLAW MACHINE"
  });
  registerSolanaIdentityRoutes(app, service, sessionService);
  return { store, service, sessionService };
}

// server/solana/indexerStore.ts
import fs5 from "fs/promises";
import path7 from "path";
var EMPTY_STATE3 = {
  accounts: {},
  history: []
};
var SolanaIndexerStore = class {
  constructor(filePath) {
    this.filePath = filePath;
  }
  state = structuredClone(EMPTY_STATE3);
  async init() {
    try {
      const raw = await fs5.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.state = {
        accounts: parsed.accounts || {},
        history: parsed.history || []
      };
    } catch {
      this.state = structuredClone(EMPTY_STATE3);
    }
  }
  async persist() {
    await fs5.mkdir(path7.dirname(this.filePath), { recursive: true });
    await fs5.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }
  async saveAccount(account) {
    this.state.accounts[account.address] = account;
    await this.persist();
    return account;
  }
  async saveHistory(item) {
    this.state.history = this.state.history.filter((existing) => existing.id !== item.id);
    this.state.history.unshift(item);
    this.state.history = this.state.history.slice(0, 5e3);
    await this.persist();
    return item;
  }
  async listAccounts(filter) {
    let rows = Object.values(this.state.accounts).sort((a, b) => b.updatedAt - a.updatedAt);
    if (filter?.wallet) rows = rows.filter((row) => row.ownerWallet === filter.wallet);
    if (filter?.kind) rows = rows.filter((row) => row.kind === filter.kind);
    if (filter?.status) rows = rows.filter((row) => row.status === filter.status);
    return rows;
  }
  async getAccount(address) {
    return this.state.accounts[address];
  }
  async listHistory(filter) {
    let rows = [...this.state.history];
    if (filter?.wallet) rows = rows.filter((row) => row.walletAddress === filter.wallet);
    if (filter?.account) rows = rows.filter((row) => row.accountAddress === filter.account);
    if (filter?.status) rows = rows.filter((row) => row.status === filter.status);
    return rows.slice(0, filter?.limit || 250);
  }
};

// server/solana/bridgeService.ts
import crypto14 from "crypto";
import { nanoid as nanoid7 } from "nanoid";
import bs583 from "bs58";
import {
  Connection,
  Keypair,
  PublicKey as PublicKey4,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
var MEMO_PROGRAM_ID = new PublicKey4("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
var DEFAULT_PROGRAM_ID3 = "11111111111111111111111111111111";
function loadRelayerSigner() {
  const secret = process.env.SOLANA_BACKEND_SIGNER || process.env.SOLANA_RELAYER_SECRET_KEY;
  if (!secret) return void 0;
  const trimmed = secret.trim();
  if (!trimmed) return void 0;
  try {
    if (trimmed.startsWith("[")) {
      const values = JSON.parse(trimmed);
      return Keypair.fromSecretKey(Uint8Array.from(values));
    }
    return Keypair.fromSecretKey(bs583.decode(trimmed));
  } catch (error) {
    throw new Error(
      `invalid_backend_signer: ${error instanceof Error ? error.message : "unable to decode SOLANA_BACKEND_SIGNER"}`
    );
  }
}
function isValidHash(hash2) {
  return /^[0-9a-f]{32,128}$/i.test(hash2);
}
function shortHash2(value) {
  return crypto14.createHash("sha256").update(value).digest("hex").slice(0, 32);
}
function seedFromSubject(subjectId) {
  return Buffer.from(shortHash2(subjectId), "hex");
}
var SolanaBridgeService = class {
  constructor(store) {
    this.store = store;
    const endpoint = process.env.SOLANA_RPC_URL || process.env.SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";
    this.connection = new Connection(endpoint, "confirmed");
    this.relayer = loadRelayerSigner();
    this.programId = new PublicKey4(
      (process.env.SOLANA_PROGRAM_ID || process.env.CLAW_IDENTITY_PROGRAM_ID || DEFAULT_PROGRAM_ID3).trim()
    );
    this.cluster = process.env.SOLANA_CLUSTER || "devnet";
    this.explorerBase = process.env.SOLANA_EXPLORER_BASE || "https://explorer.solana.com";
    this.commitment = process.env.SOLANA_COMMITMENT || "confirmed";
  }
  connection;
  relayer;
  programId;
  explorerBase;
  cluster;
  commitment;
  getProgramId() {
    return this.programId.toBase58();
  }
  getCluster() {
    return this.cluster;
  }
  buildExplorerUrl(kind, value) {
    const path16 = kind === "tx" ? `tx/${value}` : `address/${value}`;
    return `${this.explorerBase}/${path16}?cluster=${this.cluster}`;
  }
  async getNetwork() {
    const [latestBlockhash, epochInfo, slot] = await Promise.all([
      this.connection.getLatestBlockhash(this.commitment),
      this.connection.getEpochInfo(this.commitment),
      this.connection.getSlot(this.commitment)
    ]);
    return {
      cluster: this.cluster,
      rpcUrl: this.connection.rpcEndpoint,
      programId: this.programId.toBase58(),
      relayerWallet: this.relayer?.publicKey.toBase58(),
      latestBlockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      epoch: epochInfo.epoch,
      slot,
      commitment: this.commitment
    };
  }
  async getSession(walletAddress) {
    const wallet = normalizeWalletAddress(walletAddress);
    const row = await getSolanaSessionByWallet(wallet);
    const now5 = /* @__PURE__ */ new Date();
    const expiresAt = row?.expiresAt ? new Date(row.expiresAt) : void 0;
    const active = Boolean(row && row.isVerified === 1 && expiresAt && expiresAt > now5);
    return {
      walletAddress: wallet,
      cluster: this.cluster,
      programId: this.programId.toBase58(),
      isActive: active,
      isVerified: row?.isVerified === 1,
      hasSignature: Boolean(row?.signature),
      nonce: row?.nonce,
      expiresAt: expiresAt?.toISOString(),
      sessionId: row?.id,
      userId: row?.userId
    };
  }
  deriveAccount(action, walletAddress, subjectId) {
    const wallet = new PublicKey4(walletAddress);
    const subjectSeed = seedFromSubject(subjectId);
    const configPda = deriveConfigPda(this.programId.toBase58());
    const profilePda = deriveProfilePda(walletAddress, this.programId.toBase58());
    const [planReceiptPda] = PublicKey4.findProgramAddressSync(
      [Buffer.from("plan_receipt"), wallet.toBuffer(), subjectSeed],
      this.programId
    );
    const [memoryReceiptPda] = PublicKey4.findProgramAddressSync(
      [Buffer.from("memory_receipt"), wallet.toBuffer(), subjectSeed],
      this.programId
    );
    const [proofReceiptPda] = PublicKey4.findProgramAddressSync(
      [Buffer.from("proof_receipt"), wallet.toBuffer(), subjectSeed],
      this.programId
    );
    switch (action) {
      case "initialize_registry":
        return { address: configPda, kind: "registry" };
      case "create_skill": {
        const skillPda = deriveSkillPda(walletAddress, subjectId, this.programId.toBase58());
        return { address: skillPda, kind: "skill" };
      }
      case "update_skill_version": {
        const [skillVersionPda] = PublicKey4.findProgramAddressSync(
          [Buffer.from("skill_version"), wallet.toBuffer(), subjectSeed],
          this.programId
        );
        return { address: skillVersionPda.toBase58(), kind: "skill_version" };
      }
      case "create_plan_receipt":
      case "complete_plan_receipt":
        return { address: planReceiptPda.toBase58(), kind: "plan_receipt" };
      case "create_memory_receipt":
      case "create_reflection_receipt":
        return { address: memoryReceiptPda.toBase58(), kind: "memory_receipt" };
      case "create_proof_receipt":
      case "anchor_receipt":
      case "verify_receipt":
      case "record_queue_event":
      case "record_deployment_receipt":
        return { address: proofReceiptPda.toBase58(), kind: "proof_receipt" };
      default:
        return { address: profilePda, kind: "unknown" };
    }
  }
  async buildInstruction(input) {
    const walletAddress = normalizeWalletAddress(input.walletAddress);
    if (!input.subjectId.trim()) throw new Error("subject_id_required");
    if (!isValidHash(input.payloadHash)) throw new Error("payload_hash_invalid");
    const derived = this.deriveAccount(input.action, walletAddress, input.subjectId);
    const requestId6 = `sol_${nanoid7(12)}`;
    await this.store.saveHistory({
      id: requestId6,
      action: input.action,
      walletAddress,
      cluster: this.cluster,
      accountAddress: derived.address,
      accountKind: derived.kind,
      programId: this.programId.toBase58(),
      payloadHash: input.payloadHash,
      status: "building",
      receiptId: input.receiptId,
      requestId: requestId6,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return {
      requestId: requestId6,
      cluster: this.cluster,
      programId: this.programId.toBase58(),
      walletAddress,
      action: input.action,
      subjectId: input.subjectId,
      payloadHash: input.payloadHash,
      accountAddress: derived.address,
      accountKind: derived.kind,
      explorerAccountUrl: this.buildExplorerUrl("address", derived.address),
      explorerProgramUrl: this.buildExplorerUrl("address", this.programId.toBase58()),
      status: "building"
    };
  }
  buildMemoInstruction(build, metadata) {
    const body = {
      requestId: build.requestId,
      action: build.action,
      subjectId: build.subjectId,
      payloadHash: build.payloadHash,
      account: build.accountAddress,
      wallet: build.walletAddress,
      cluster: build.cluster,
      metadata: metadata || {}
    };
    const memo = `CLAW_SOLANA_BRIDGE::${JSON.stringify(body)}`;
    return new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [],
      data: Buffer.from(memo, "utf8")
    });
  }
  async sendInstruction(input) {
    const build = await this.buildInstruction(input);
    if (!this.relayer) {
      const failed = {
        ...build,
        status: "failed",
        error: "backend_signer_missing"
      };
      await this.updateHistory(build.requestId, {
        status: "failed",
        error: failed.error
      });
      return failed;
    }
    try {
      const blockhash = await this.connection.getLatestBlockhash(this.commitment);
      const tx = new Transaction({
        feePayer: this.relayer.publicKey,
        blockhash: blockhash.blockhash,
        lastValidBlockHeight: blockhash.lastValidBlockHeight
      }).add(this.buildMemoInstruction(build, input.metadata));
      const signature = await this.connection.sendTransaction(tx, [this.relayer], {
        preflightCommitment: this.commitment
      });
      const explorerTxUrl = this.buildExplorerUrl("tx", signature);
      await this.updateHistory(build.requestId, {
        status: "submitted",
        txSignature: signature
      });
      await this.store.saveAccount({
        address: build.accountAddress,
        kind: build.accountKind,
        ownerWallet: build.walletAddress,
        programId: this.programId.toBase58(),
        subjectId: build.subjectId,
        action: build.action,
        payloadHash: build.payloadHash,
        status: "pending",
        txSignature: signature,
        explorerUrl: explorerTxUrl,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      return {
        ...build,
        txSignature: signature,
        explorerTxUrl,
        status: "submitted"
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "tx_send_failed";
      await this.updateHistory(build.requestId, { status: "failed", error: message });
      return {
        ...build,
        status: "failed",
        error: message
      };
    }
  }
  async confirmInstruction(input) {
    const txSignature = String(input.txSignature || "").trim();
    if (!txSignature) throw new Error("tx_signature_required");
    const confirmation = await this.connection.confirmTransaction(txSignature, this.commitment);
    const failed = Boolean(confirmation.value.err);
    const status = failed ? "failed" : "confirmed";
    if (input.requestId) {
      await this.updateHistory(input.requestId, {
        status,
        txSignature,
        error: failed ? JSON.stringify(confirmation.value.err) : void 0
      });
    }
    if (input.accountAddress) {
      const account = await this.store.getAccount(input.accountAddress);
      if (account) {
        await this.store.saveAccount({
          ...account,
          status: failed ? "failed" : "confirmed",
          txSignature,
          explorerUrl: this.buildExplorerUrl("tx", txSignature),
          updatedAt: Date.now()
        });
      }
    }
    return {
      txSignature,
      status,
      confirmationError: confirmation.value.err || null,
      explorerTxUrl: this.buildExplorerUrl("tx", txSignature)
    };
  }
  async listMirrorAccounts(filter) {
    return this.store.listAccounts(filter);
  }
  async getMirrorAccount(address) {
    return this.store.getAccount(address);
  }
  async listHistory(filter) {
    return this.store.listHistory(filter);
  }
  async updateHistory(id, updates) {
    const history = await this.store.listHistory({ limit: 5e3 });
    const existing = history.find((row) => row.id === id);
    if (!existing) return;
    await this.store.saveHistory({
      ...existing,
      status: updates.status || existing.status,
      txSignature: updates.txSignature || existing.txSignature,
      error: updates.error,
      updatedAt: Date.now()
    });
  }
};

// server/solana/bridgeRoutes.ts
import crypto15 from "crypto";
import { z as z4 } from "zod";
function hashPayload(payload) {
  return crypto15.createHash("sha256").update(JSON.stringify(payload ?? {})).digest("hex");
}
function requestId2() {
  return `req_${Date.now()}`;
}
function fail2(error) {
  return { ok: false, error: error instanceof Error ? error.message : "solana_bridge_failed" };
}
var buildSchema = z4.object({
  walletAddress: z4.string().min(20),
  action: z4.enum([
    "initialize_registry",
    "create_skill",
    "update_skill_version",
    "create_plan_receipt",
    "complete_plan_receipt",
    "create_memory_receipt",
    "create_reflection_receipt",
    "create_proof_receipt",
    "anchor_receipt",
    "verify_receipt",
    "record_queue_event",
    "record_deployment_receipt"
  ]),
  subjectId: z4.string().min(1).max(96),
  payloadHash: z4.string().regex(/^[0-9a-f]{32,128}$/i),
  receiptId: z4.string().optional(),
  metadata: z4.record(z4.string(), z4.unknown()).optional()
});
var sendSchema = buildSchema;
var confirmSchema = z4.object({
  requestId: z4.string().optional(),
  txSignature: z4.string().min(20),
  accountAddress: z4.string().optional()
});
var publishSkillSchema = z4.object({
  walletAddress: z4.string().min(20),
  skillId: z4.string().min(1),
  skillSlug: z4.string().min(1),
  version: z4.string().optional(),
  contentHash: z4.string().min(12),
  tags: z4.array(z4.string()).default([]),
  summary: z4.string().optional()
});
var postPlanSchema = z4.object({
  walletAddress: z4.string().min(20),
  planId: z4.string().min(1),
  taskType: z4.string().min(1),
  goal: z4.string().min(1),
  stepCount: z4.number().int().nonnegative().default(0),
  planHash: z4.string().min(12),
  stepHash: z4.string().min(12),
  outcome: z4.enum(["planned", "running", "succeeded", "failed", "aborted"]).default("planned")
});
var postMemorySchema = z4.object({
  walletAddress: z4.string().min(20),
  sourceTurnId: z4.string().min(1),
  kind: z4.string().default("reflection"),
  summary: z4.string().min(1),
  reflectionHash: z4.string().min(12),
  nextAction: z4.string().default(""),
  tags: z4.array(z4.string()).default([])
});
var postReflectionSchema = z4.object({
  walletAddress: z4.string().min(20),
  agentId: z4.string().min(1),
  sourceTurnId: z4.string().min(1),
  kind: z4.enum(["success", "failure", "retry", "correction", "lesson"]).default("lesson"),
  title: z4.string().min(2),
  summary: z4.string().min(2),
  fullText: z4.string().min(2),
  rootCause: z4.string().min(2),
  correctiveAdvice: z4.string().min(2),
  nextAction: z4.string().min(2),
  tags: z4.array(z4.string()).default([])
});
var postReceiptSchema = z4.object({
  walletAddress: z4.string().min(20),
  receiptId: z4.string().min(1),
  subjectId: z4.string().min(1),
  subjectType: z4.string().default("generic"),
  payloadHash: z4.string().min(12),
  summary: z4.string().default(""),
  metadata: z4.record(z4.string(), z4.unknown()).optional()
});
function registerSolanaBridgeRoutes(app, deps) {
  app.get("/api/solana/session", async (req, res) => {
    try {
      const walletAddress = String(req.query.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress query is required");
      const data = await deps.bridge.getSession(walletAddress);
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.get("/api/solana/network", async (_req, res) => {
    try {
      const data = await deps.bridge.getNetwork();
      res.json({ ok: true, data });
    } catch (error) {
      res.status(500).json(fail2(error));
    }
  });
  app.post("/api/solana/transaction/build", async (req, res) => {
    try {
      const body = buildSchema.parse(req.body);
      const data = await deps.bridge.buildInstruction({
        ...body,
        walletAddress: normalizeWalletAddress(body.walletAddress)
      });
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.post("/api/solana/transaction/send", async (req, res) => {
    try {
      const body = sendSchema.parse(req.body);
      const data = await deps.bridge.sendInstruction({
        ...body,
        walletAddress: normalizeWalletAddress(body.walletAddress)
      });
      res.status(data.status === "failed" ? 400 : 200).json({ ok: data.status !== "failed", data });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.post("/api/solana/transaction/confirm", async (req, res) => {
    try {
      const body = confirmSchema.parse(req.body);
      const data = await deps.bridge.confirmInstruction(body);
      res.status(data.status === "failed" ? 400 : 200).json({ ok: data.status !== "failed", data });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.get("/api/solana/accounts", async (req, res) => {
    try {
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : void 0;
      const kind = req.query.kind ? String(req.query.kind) : void 0;
      const status = req.query.status ? String(req.query.status) : void 0;
      const data = await deps.bridge.listMirrorAccounts({
        wallet,
        kind,
        status
      });
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.get("/api/solana/accounts/:address", async (req, res) => {
    try {
      const data = await deps.bridge.getMirrorAccount(String(req.params.address));
      if (!data) {
        res.status(404).json({ ok: false, error: "account_not_found" });
        return;
      }
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.get("/api/solana/program", async (_req, res) => {
    const programId = deps.bridge.getProgramId();
    res.json({
      ok: true,
      data: {
        cluster: deps.bridge.getCluster(),
        programId,
        explorerProgramUrl: deps.bridge.buildExplorerUrl("address", programId)
      }
    });
  });
  app.get("/api/solana/skills", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const data = await deps.identityService.listDiscoverySkills({
        query: req.query.q ? String(req.query.q) : void 0,
        category: req.query.category ? String(req.query.category) : void 0,
        tag: req.query.tag ? String(req.query.tag) : void 0
      });
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.post("/api/solana/skills/publish", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const body = publishSkillSchema.parse(req.body);
      const payload = {
        skillId: body.skillId,
        skillSlug: body.skillSlug,
        version: body.version || "1.0.0",
        contentHash: body.contentHash,
        tags: body.tags,
        summary: body.summary || ""
      };
      const send = await deps.bridge.sendInstruction({
        walletAddress: normalizeWalletAddress(body.walletAddress),
        action: "create_skill",
        subjectId: body.skillSlug,
        payloadHash: hashPayload(payload),
        metadata: payload
      });
      if (send.status === "failed") {
        res.status(400).json({ ok: false, error: send.error || "skill_publish_failed", data: send });
        return;
      }
      await deps.identityService.recordReputationEvent({
        walletAddress: normalizeWalletAddress(body.walletAddress),
        eventKind: "skill_publish",
        eventRef: body.skillId,
        success: true,
        weight: 3
      });
      res.json({ ok: true, data: send });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.post("/api/solana/skills/:id/update", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const body = publishSkillSchema.parse({
        ...req.body,
        skillId: String(req.params.id)
      });
      const payload = {
        skillId: body.skillId,
        skillSlug: body.skillSlug,
        version: body.version || "1.0.0",
        contentHash: body.contentHash,
        tags: body.tags,
        summary: body.summary || ""
      };
      const send = await deps.bridge.sendInstruction({
        walletAddress: normalizeWalletAddress(body.walletAddress),
        action: "update_skill_version",
        subjectId: `${body.skillSlug}:${payload.version}`,
        payloadHash: hashPayload(payload),
        metadata: payload
      });
      if (send.status === "failed") {
        res.status(400).json({ ok: false, error: send.error || "skill_update_failed", data: send });
        return;
      }
      await deps.identityService.recordReputationEvent({
        walletAddress: normalizeWalletAddress(body.walletAddress),
        eventKind: "skill_version",
        eventRef: body.skillId,
        success: true,
        weight: 2
      });
      res.json({ ok: true, data: send });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.post("/api/solana/plans", async (req, res) => {
    try {
      const body = postPlanSchema.parse(req.body);
      const walletAddress = normalizeWalletAddress(body.walletAddress);
      const payloadHash = hashPayload({
        planId: body.planId,
        taskType: body.taskType,
        goal: body.goal,
        stepCount: body.stepCount,
        planHash: body.planHash,
        stepHash: body.stepHash,
        outcome: body.outcome
      });
      const tx = await deps.bridge.sendInstruction({
        walletAddress,
        action: "create_plan_receipt",
        subjectId: body.planId,
        payloadHash,
        metadata: body
      });
      if (deps.identityService) {
        await deps.identityService.recordPlannerRun({
          walletAddress,
          runId: body.planId,
          taskType: body.taskType,
          goal: body.goal,
          planHash: body.planHash,
          stepHash: body.stepHash,
          outcome: body.outcome,
          stepCount: body.stepCount,
          completedSteps: body.outcome === "succeeded" ? body.stepCount : 0,
          failedSteps: body.outcome === "failed" ? body.stepCount : 0
        });
      }
      if (tx.status === "failed") {
        res.status(400).json({ ok: false, error: tx.error || "plan_tx_failed", data: tx });
        return;
      }
      res.json({ ok: true, data: tx });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.post("/api/solana/memory", async (req, res) => {
    try {
      const body = postMemorySchema.parse(req.body);
      const walletAddress = normalizeWalletAddress(body.walletAddress);
      const payloadHash = hashPayload({
        sourceTurnId: body.sourceTurnId,
        kind: body.kind,
        summary: body.summary,
        reflectionHash: body.reflectionHash,
        nextAction: body.nextAction,
        tags: body.tags
      });
      const tx = await deps.bridge.sendInstruction({
        walletAddress,
        action: "create_memory_receipt",
        subjectId: body.sourceTurnId,
        payloadHash,
        metadata: body
      });
      if (deps.identityService) {
        await deps.identityService.recordMemoryAnchor({
          walletAddress,
          sourceTurnId: body.sourceTurnId,
          taskType: "memory",
          kind: body.kind,
          result: "success",
          sourceHash: body.reflectionHash,
          reflectionHash: body.reflectionHash,
          lessonHash: body.reflectionHash,
          summary: body.summary,
          rootCause: "",
          correctiveAdvice: "",
          nextBestAction: body.nextAction,
          confidenceBps: 7e3,
          severityBps: 2e3,
          tags: body.tags,
          relatedMemoryIds: [],
          pinned: false
        });
      }
      if (tx.status === "failed") {
        res.status(400).json({ ok: false, error: tx.error || "memory_tx_failed", data: tx });
        return;
      }
      res.json({ ok: true, data: tx });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.post("/api/solana/reflections", async (req, res) => {
    try {
      const body = postReflectionSchema.parse(req.body);
      const walletAddress = normalizeWalletAddress(body.walletAddress);
      const reflectionPayload = {
        agentId: body.agentId,
        sourceTurnId: body.sourceTurnId,
        kind: body.kind,
        title: body.title,
        summary: body.summary,
        fullText: body.fullText,
        rootCause: body.rootCause,
        correctiveAdvice: body.correctiveAdvice,
        nextAction: body.nextAction,
        tags: body.tags
      };
      const tx = await deps.bridge.sendInstruction({
        walletAddress,
        action: "create_reflection_receipt",
        subjectId: body.sourceTurnId,
        payloadHash: hashPayload(reflectionPayload),
        metadata: reflectionPayload
      });
      let reflectionId;
      if (deps.memoryService) {
        const created = await deps.memoryService.createReflection({
          ...reflectionPayload,
          wallet: walletAddress,
          conversationId: void 0
        });
        reflectionId = created.reflection.id;
      }
      if (tx.status === "failed") {
        res.status(400).json({ ok: false, error: tx.error || "reflection_tx_failed", data: { ...tx, reflectionId } });
        return;
      }
      res.json({ ok: true, data: { ...tx, reflectionId } });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.post("/api/solana/receipts", async (req, res) => {
    try {
      const body = postReceiptSchema.parse(req.body);
      const walletAddress = normalizeWalletAddress(body.walletAddress);
      const tx = await deps.bridge.sendInstruction({
        walletAddress,
        action: "anchor_receipt",
        subjectId: body.subjectId,
        payloadHash: body.payloadHash,
        receiptId: body.receiptId,
        metadata: {
          subjectType: body.subjectType,
          summary: body.summary,
          ...body.metadata
        }
      });
      res.status(tx.status === "failed" ? 400 : 200).json({
        ok: tx.status !== "failed",
        data: {
          ...tx,
          receiptId: body.receiptId,
          verificationState: tx.status === "submitted" ? "pending" : "failed"
        }
      });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.get("/api/solana/receipts/:id", async (req, res) => {
    try {
      const account = await deps.bridge.getMirrorAccount(String(req.params.id));
      if (!account) {
        res.status(404).json({ ok: false, error: "receipt_not_found" });
        return;
      }
      res.json({ ok: true, data: account });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.get("/api/solana/history", async (req, res) => {
    try {
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : void 0;
      const account = req.query.account ? String(req.query.account) : void 0;
      const status = req.query.status ? String(req.query.status) : void 0;
      const limit = req.query.limit ? Number(req.query.limit) : void 0;
      const data = await deps.bridge.listHistory({
        wallet,
        account,
        status,
        limit
      });
      res.json({ ok: true, data });
    } catch (error) {
      res.status(400).json(fail2(error));
    }
  });
  app.get("/api/solana/health", async (_req, res) => {
    try {
      const network = await deps.bridge.getNetwork();
      const history = await deps.bridge.listHistory({ limit: 20 });
      res.json({
        ok: true,
        data: {
          requestId: requestId2(),
          module: "solana_bridge",
          cluster: network.cluster,
          programId: network.programId,
          rpcUrl: network.rpcUrl,
          recentEvents: history.length,
          relayerWallet: network.relayerWallet || null
        }
      });
    } catch (error) {
      res.status(500).json(fail2(error));
    }
  });
}

// server/solana/bridgeMount.ts
import path8 from "path";
async function createSolanaBridge() {
  const store = new SolanaIndexerStore(path8.join(process.cwd(), "data", "solana-indexer.json"));
  await store.init();
  const bridge = new SolanaBridgeService(store);
  return { store, bridge };
}
async function mountSolanaBridge(app, deps) {
  const created = deps.bridge ? void 0 : await createSolanaBridge();
  const bridge = deps.bridge || created.bridge;
  const store = created?.store;
  registerSolanaBridgeRoutes(app, {
    bridge,
    identityService: deps.identityService,
    memoryService: deps.memoryService,
    planReceiptService: deps.planReceiptService
  });
  return { store, bridge };
}

// server/memory/routes.ts
import { z as z5 } from "zod";
function ok2(res, data) {
  res.json({ ok: true, data });
}
function fail3(res, error, status = 400) {
  const message = error instanceof Error ? error.message : "memory_route_failed";
  res.status(status).json({ ok: false, error: message });
}
function requestId3(req) {
  return String(req.headers["x-request-id"] || `req_${Date.now()}`);
}
var createReflectionSchema = z5.object({
  agentId: z5.string().min(1),
  conversationId: z5.string().optional(),
  wallet: z5.string().optional(),
  sourceTurnId: z5.string().min(1),
  parentReceiptId: z5.string().optional(),
  kind: z5.enum(["success", "failure", "retry", "correction", "lesson"]),
  title: z5.string().min(3).max(160),
  summary: z5.string().min(3).max(400),
  fullText: z5.string().min(5),
  rootCause: z5.string().min(3).max(800),
  correctiveAdvice: z5.string().min(3).max(800),
  nextAction: z5.string().min(3).max(400),
  tags: z5.array(z5.string().min(1).max(40)).optional(),
  visibility: z5.enum(["private", "workspace", "public"]).optional(),
  structured: z5.object({
    confidence: z5.number().min(0).max(1).optional(),
    reusable: z5.boolean().optional(),
    priority: z5.enum(["low", "normal", "high", "critical"]).optional(),
    failureMode: z5.string().optional()
  }).optional(),
  autoAnchor: z5.boolean().default(true),
  autoVerify: z5.boolean().default(false)
});
var listQuerySchema = z5.object({
  agentId: z5.string().optional(),
  wallet: z5.string().optional(),
  conversationId: z5.string().optional(),
  sourceTurnId: z5.string().optional(),
  nextTurnId: z5.string().optional(),
  status: z5.enum(["captured", "stored", "anchored", "linked", "injected", "verified", "failed", "degraded"]).optional(),
  verified: z5.string().optional().transform((v) => v === "true" ? true : v === "false" ? false : void 0),
  receiptHash: z5.string().optional(),
  storageRef: z5.string().optional(),
  txSig: z5.string().optional(),
  limit: z5.string().optional().transform((v) => v ? Number(v) : void 0),
  offset: z5.string().optional().transform((v) => v ? Number(v) : void 0)
});
function registerMemoryRoutes(app, service) {
  app.get("/api/memory/reflections", async (req, res) => {
    try {
      const query = listQuerySchema.parse(req.query);
      const data = await service.listReflections(query);
      ok2(res, data);
    } catch (error) {
      fail3(res, error);
    }
  });
  app.get("/api/memory/reflections/agent/:agentId", async (req, res) => {
    try {
      const data = await service.listReflections({
        ...listQuerySchema.parse(req.query),
        agentId: String(req.params.agentId)
      });
      ok2(res, data);
    } catch (error) {
      fail3(res, error);
    }
  });
  app.get("/api/memory/reflections/conversation/:conversationId", async (req, res) => {
    try {
      const data = await service.listReflections({
        ...listQuerySchema.parse(req.query),
        conversationId: String(req.params.conversationId)
      });
      ok2(res, data);
    } catch (error) {
      fail3(res, error);
    }
  });
  app.post("/api/memory/reflections", async (req, res) => {
    try {
      const body = createReflectionSchema.parse(req.body);
      const created = await service.createReflection({
        agentId: body.agentId,
        conversationId: body.conversationId,
        wallet: body.wallet,
        sourceTurnId: body.sourceTurnId,
        parentReceiptId: body.parentReceiptId,
        kind: body.kind,
        title: body.title,
        summary: body.summary,
        fullText: body.fullText,
        rootCause: body.rootCause,
        correctiveAdvice: body.correctiveAdvice,
        nextAction: body.nextAction,
        tags: body.tags,
        visibility: body.visibility,
        structured: body.structured
      });
      let receipt = null;
      if (body.autoAnchor) {
        receipt = await service.anchorReflection(created.reflection.id, body.wallet);
      }
      let verification = null;
      if (body.autoVerify) {
        verification = await service.verifyReflection(created.reflection.id);
      }
      ok2(res, {
        requestId: requestId3(req),
        reflection: created.reflection,
        status: created.status,
        receipt,
        verification
      });
    } catch (error) {
      fail3(res, error);
    }
  });
  app.post("/api/memory/reflections/:id/store", async (req, res) => {
    try {
      const reflection = await service.getReflection(String(req.params.id));
      ok2(res, {
        reflection,
        status: reflection.storageRef ? "stored" : "captured"
      });
    } catch (error) {
      fail3(res, error, 404);
    }
  });
  app.post("/api/memory/reflections/:id/anchor", async (req, res) => {
    try {
      const receipt = await service.anchorReflection(String(req.params.id), req.body?.wallet);
      ok2(res, receipt);
    } catch (error) {
      fail3(res, error, 404);
    }
  });
  app.post("/api/memory/reflections/:id/link-next-turn", async (req, res) => {
    try {
      const nextTurnId = String(req.body?.nextTurnId || "").trim();
      if (!nextTurnId) throw new Error("nextTurnId_required");
      const data = await service.linkReceiptToNextTurn(String(req.params.id), {
        nextTurnId,
        reason: req.body?.reason ? String(req.body.reason) : void 0
      });
      ok2(res, data);
    } catch (error) {
      fail3(res, error);
    }
  });
  app.post("/api/memory/reflections/:id/verify", async (req, res) => {
    try {
      const result = await service.verifyReflection(String(req.params.id));
      ok2(res, result);
    } catch (error) {
      fail3(res, error, 404);
    }
  });
  app.get("/api/memory/reflections/:id/chain", async (req, res) => {
    try {
      const data = await service.getChain(String(req.params.id));
      ok2(res, data);
    } catch (error) {
      fail3(res, error, 404);
    }
  });
  app.get("/api/memory/reflections/:id/timeline", async (req, res) => {
    try {
      const data = await service.getTimeline(String(req.params.id));
      ok2(res, data);
    } catch (error) {
      fail3(res, error, 404);
    }
  });
  app.get("/api/memory/reflections/:id/receipt", async (req, res) => {
    try {
      const data = await service.getReceipt(String(req.params.id));
      ok2(res, data);
    } catch (error) {
      fail3(res, error, 404);
    }
  });
  app.get("/api/memory/reflections/:id", async (req, res) => {
    try {
      const data = await service.getReflection(String(req.params.id));
      ok2(res, data);
    } catch (error) {
      fail3(res, error, 404);
    }
  });
  app.post("/api/memory/injection-bundle", async (req, res) => {
    try {
      const body = z5.object({
        agentId: z5.string().min(1),
        conversationId: z5.string().optional(),
        nextTurnId: z5.string().min(1),
        wallet: z5.string().optional(),
        maxItems: z5.number().min(1).max(10).optional()
      }).parse(req.body);
      const bundle = await service.buildInjectionBundle(body);
      ok2(res, bundle);
    } catch (error) {
      fail3(res, error);
    }
  });
  app.post("/api/memory/demo/run", async (req, res) => {
    try {
      const body = z5.object({
        agentId: z5.string().default("agent_demo"),
        wallet: z5.string().optional(),
        conversationId: z5.string().optional()
      }).parse(req.body ?? {});
      const data = await service.runDemoFlow(body);
      ok2(res, data);
    } catch (error) {
      fail3(res, error);
    }
  });
}

// server/memory/mount.ts
async function mountMemoryReceipts(app, options) {
  const service = await getMemoryReceiptService({ onchain: options?.onchain });
  registerMemoryRoutes(app, service);
  return { service };
}

// server/plans/normalize.ts
import { nanoid as nanoid8 } from "nanoid";
function nowIso2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function normalizeDate(input) {
  if (!input) return nowIso2();
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return nowIso2();
  return date.toISOString();
}
function normalizePlanId(planId) {
  return planId?.trim() || `plan_${nanoid8(12)}`;
}
function normalizeSteps(input) {
  return input.map((step, index) => ({
    ...step,
    id: step.id || `step_${index + 1}`,
    index,
    dependencies: [...step.dependencies || []],
    chosenSkills: [...step.chosenSkills || []],
    status: step.status ?? "pending"
  }));
}
function normalizeTags(tags) {
  return (tags || []).map((tag) => tag.trim()).filter(Boolean).slice(0, 32);
}
function normalizeMetadata(metadata) {
  return metadata ? { ...metadata } : {};
}

// server/plans/canonicalize.ts
function normalizeValue2(input) {
  if (input === null || typeof input === "boolean" || typeof input === "number" || typeof input === "string") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => normalizeValue2(item));
  }
  if (input && typeof input === "object") {
    const sorted = {};
    for (const key of Object.keys(input).sort()) {
      const value = input[key];
      if (typeof value === "undefined") continue;
      sorted[key] = normalizeValue2(value);
    }
    return sorted;
  }
  return String(input);
}
function canonicalize2(input) {
  return JSON.stringify(normalizeValue2(input));
}
function canonicalPlanSummaryPayload(plan) {
  return {
    version: plan.version,
    planId: plan.planId,
    taskType: plan.taskType,
    title: plan.title,
    summary: plan.summary,
    goal: plan.goal,
    stepCount: plan.stepCount,
    steps: plan.steps.map((step) => ({
      id: step.id,
      index: step.index,
      title: step.title,
      description: step.description,
      dependencies: step.dependencies,
      chosenSkills: step.chosenSkills,
      expectedResult: step.expectedResult ?? null
    })),
    dependencies: plan.dependencies.map((dep) => ({
      id: dep.id,
      type: dep.type,
      ref: dep.ref,
      required: dep.required,
      label: dep.label ?? null
    })),
    chosenSkills: plan.chosenSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      version: skill.version ?? null,
      hash: skill.hash ?? null,
      active: skill.active ?? null
    })),
    expectedOutcome: plan.expectedOutcome,
    agentId: plan.agentId,
    wallet: plan.wallet ?? null
  };
}
function canonicalPlanPayload(plan) {
  return {
    ...canonicalPlanSummaryPayload(plan),
    id: plan.id,
    status: plan.status,
    outcomeStatus: plan.outcomeStatus,
    actualOutcome: plan.actualOutcome ?? null,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    conversationId: plan.conversationId ?? null,
    turnId: plan.turnId ?? null,
    sessionId: plan.sessionId ?? null,
    storage: plan.storage ?? null,
    solana: plan.solana ?? null,
    reflection: plan.reflection ?? null,
    memory: plan.memory ?? null,
    tags: plan.tags,
    metadata: plan.metadata
  };
}
function canonicalExecutionPayload(execution) {
  return {
    id: execution.id,
    planReceiptId: execution.planReceiptId,
    planId: execution.planId,
    status: execution.status,
    startTime: execution.startTime,
    endTime: execution.endTime ?? null,
    worker: execution.worker,
    toolCalls: execution.toolCalls,
    stepProgress: execution.stepProgress,
    failedSteps: execution.failedSteps,
    finalResult: execution.finalResult ?? null,
    outputHash: execution.outputHash ?? null
  };
}
function canonicalResultPayload(result) {
  return {
    id: result.id,
    planReceiptId: result.planReceiptId,
    planId: result.planId,
    status: result.status,
    actualOutcome: result.actualOutcome,
    resultSummary: result.resultSummary,
    resultHash: result.resultHash,
    sourceExecutionReceiptId: result.sourceExecutionReceiptId ?? null,
    reflection: result.reflection ?? null,
    memory: result.memory ?? null,
    storage: result.storage ?? null,
    solana: result.solana ?? null,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  };
}

// server/plans/hash.ts
import crypto16 from "crypto";
function sha256Hex2(input) {
  return crypto16.createHash("sha256").update(input).digest("hex");
}
function hashCanonical2(input) {
  return sha256Hex2(canonicalize2(input));
}
function hashPlanSummary(plan) {
  return hashCanonical2(canonicalPlanSummaryPayload(plan));
}
function hashPlan(plan) {
  return hashCanonical2(canonicalPlanPayload(plan));
}
function hashExecution(execution) {
  return hashCanonical2(canonicalExecutionPayload(execution));
}
function hashResult(result) {
  return hashCanonical2(canonicalResultPayload(result));
}
function compactAnchorHash(input) {
  return sha256Hex2(input).slice(0, 64);
}

// server/plans/store.ts
import fs6 from "fs/promises";
import path9 from "path";
var EMPTY_STATE4 = {
  receipts: {},
  latestReceiptByPlanId: {},
  executions: {},
  latestExecutionByPlanId: {},
  results: {},
  latestResultByPlanId: {},
  timeline: []
};
var PlanStore = class {
  constructor(filePath) {
    this.filePath = filePath;
  }
  state = structuredClone(EMPTY_STATE4);
  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs6.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.state = {
        receipts: parsed.receipts || {},
        latestReceiptByPlanId: parsed.latestReceiptByPlanId || {},
        executions: parsed.executions || {},
        latestExecutionByPlanId: parsed.latestExecutionByPlanId || {},
        results: parsed.results || {},
        latestResultByPlanId: parsed.latestResultByPlanId || {},
        timeline: parsed.timeline || []
      };
    } catch {
      this.state = structuredClone(EMPTY_STATE4);
    }
  }
  async persist() {
    if (!this.filePath) return;
    await fs6.mkdir(path9.dirname(this.filePath), { recursive: true });
    await fs6.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }
  async saveReceipt(receipt) {
    this.state.receipts[receipt.id] = receipt;
    this.state.latestReceiptByPlanId[receipt.planId] = receipt.id;
    await this.persist();
    return receipt;
  }
  async listReceipts() {
    return Object.values(this.state.receipts).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listLatestReceipts() {
    const ids = Object.values(this.state.latestReceiptByPlanId);
    return ids.map((id) => this.state.receipts[id]).filter((value) => Boolean(value)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getReceiptById(receiptId2) {
    return this.state.receipts[receiptId2];
  }
  async getLatestReceiptByPlanId(planId) {
    const latestId = this.state.latestReceiptByPlanId[planId];
    return latestId ? this.state.receipts[latestId] : void 0;
  }
  async listReceiptsByPlanId(planId) {
    return Object.values(this.state.receipts).filter((receipt) => receipt.planId === planId).sort((a, b) => b.version - a.version);
  }
  async saveExecution(execution) {
    this.state.executions[execution.id] = execution;
    this.state.latestExecutionByPlanId[execution.planId] = execution.id;
    await this.persist();
    return execution;
  }
  async getExecutionById(executionId) {
    return this.state.executions[executionId];
  }
  async getLatestExecutionByPlanId(planId) {
    const latestId = this.state.latestExecutionByPlanId[planId];
    return latestId ? this.state.executions[latestId] : void 0;
  }
  async saveResult(result) {
    this.state.results[result.id] = result;
    this.state.latestResultByPlanId[result.planId] = result.id;
    await this.persist();
    return result;
  }
  async getResultById(resultId) {
    return this.state.results[resultId];
  }
  async getLatestResultByPlanId(planId) {
    const latestId = this.state.latestResultByPlanId[planId];
    return latestId ? this.state.results[latestId] : void 0;
  }
  async pushTimelineEvent(event) {
    this.state.timeline.unshift(event);
    this.state.timeline = this.state.timeline.slice(0, 5e3);
    await this.persist();
    return event;
  }
  async listTimelineForPlan(planId) {
    return this.state.timeline.filter((event) => event.planId === planId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
};

// server/plans/PlanStorageService.ts
var PlanStorageService = class {
  async store(namespace, id, payload) {
    const localRef = `app://${namespace}/${id}.json`;
    const checksum = hashCanonical2(payload);
    try {
      const upload = await storagePut(
        `${namespace}/${id}.json`,
        JSON.stringify(payload, null, 2),
        "application/json"
      );
      return {
        ref: upload.url,
        checksum: hashCanonical2({ key: upload.key, checksum }),
        namespace,
        degraded: false
      };
    } catch {
      return {
        ref: localRef,
        checksum,
        namespace,
        degraded: true
      };
    }
  }
};

// server/plans/PlanAnchorService.ts
var PlanAnchorService = class {
  constructor(options) {
    this.options = options;
  }
  async anchorReceipt(receipt) {
    const anchorHash = compactAnchorHash(
      hashCanonical2({
        planReceiptId: receipt.id,
        planId: receipt.planId,
        taskType: receipt.taskType,
        stepCount: receipt.stepCount,
        summaryHash: receipt.summaryHash,
        planHash: receipt.planHash,
        createdAt: receipt.createdAt
      })
    );
    if (!receipt.wallet) {
      return {
        chainId: this.options.chainId,
        programId: this.options.programId,
        anchorHash,
        verified: false,
        degraded: true,
        note: "wallet_missing_for_anchor"
      };
    }
    try {
      const anchored = this.options.anchorClient ? await this.options.anchorClient.anchorPlan({
        wallet: receipt.wallet,
        planId: receipt.planId,
        taskType: receipt.taskType,
        goal: receipt.goal,
        planHash: receipt.planHash,
        stepHash: receipt.summaryHash,
        stepCount: receipt.stepCount,
        outcome: "planned"
      }) : {
        txSignature: `SIM_${anchorHash.slice(0, 44)}`,
        account: `pda_${receipt.planId.slice(0, 24)}`,
        chainId: this.options.chainId,
        programId: this.options.programId
      };
      return {
        chainId: anchored.chainId ?? this.options.chainId,
        txSignature: anchored.txSignature,
        account: anchored.account,
        programId: anchored.programId ?? this.options.programId,
        anchorHash,
        verified: Boolean(anchored.txSignature),
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
        degraded: false
      };
    } catch (error) {
      return {
        chainId: this.options.chainId,
        programId: this.options.programId,
        anchorHash,
        verified: false,
        degraded: true,
        note: error instanceof Error ? error.message : "anchor_failed"
      };
    }
  }
  async anchorResult(receipt, result) {
    const anchorHash = compactAnchorHash(
      hashCanonical2({
        planReceiptId: receipt.id,
        planId: receipt.planId,
        resultId: result.id,
        resultHash: result.resultHash,
        status: result.status
      })
    );
    if (!receipt.wallet || !this.options.anchorClient) {
      return {
        chainId: this.options.chainId,
        programId: this.options.programId,
        anchorHash,
        verified: Boolean(receipt.wallet),
        degraded: !receipt.wallet
      };
    }
    try {
      const anchored = await this.options.anchorClient.anchorPlan({
        wallet: receipt.wallet,
        planId: receipt.planId,
        taskType: receipt.taskType,
        goal: receipt.goal,
        planHash: receipt.planHash,
        stepHash: result.resultHash,
        stepCount: receipt.stepCount,
        outcome: result.status === "success" ? "succeeded" : result.status === "failed" ? "failed" : "running"
      });
      return {
        chainId: anchored.chainId ?? this.options.chainId,
        txSignature: anchored.txSignature,
        account: anchored.account,
        programId: anchored.programId ?? this.options.programId,
        anchorHash,
        verified: Boolean(anchored.txSignature),
        verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
        degraded: false
      };
    } catch (error) {
      return {
        chainId: this.options.chainId,
        programId: this.options.programId,
        anchorHash,
        verified: false,
        degraded: true,
        note: error instanceof Error ? error.message : "result_anchor_failed"
      };
    }
  }
};

// server/plans/PlanReceiptService.ts
import { nanoid as nanoid9 } from "nanoid";
var PlanReceiptService = class {
  constructor(store, storage, anchor, pushEvent) {
    this.store = store;
    this.storage = storage;
    this.anchor = anchor;
    this.pushEvent = pushEvent;
  }
  async create(input) {
    if (!input.goal.trim()) throw new Error("goal_required");
    if (!input.steps?.length) throw new Error("steps_required");
    const planId = normalizePlanId(input.planId);
    const now5 = nowIso2();
    const existingVersions = await this.store.listReceiptsByPlanId(planId);
    const version = (existingVersions[0]?.version || 0) + 1;
    const base = {
      id: `prc_${nanoid9(12)}`,
      version,
      planId,
      taskType: input.taskType,
      title: input.title,
      summary: input.summary,
      goal: input.goal,
      stepCount: input.steps.length,
      steps: normalizeSteps(input.steps),
      dependencies: [...input.dependencies || []],
      chosenSkills: [...input.chosenSkills || []],
      expectedOutcome: input.expectedOutcome,
      actualOutcome: void 0,
      outcomeStatus: "pending",
      summaryHash: "",
      planHash: "",
      createdAt: now5,
      updatedAt: now5,
      agentId: input.agentId,
      conversationId: input.conversationId,
      turnId: input.turnId,
      sessionId: input.sessionId,
      wallet: input.wallet,
      status: "generated",
      storage: void 0,
      solana: void 0,
      reflection: void 0,
      memory: void 0,
      metadata: normalizeMetadata(input.metadata),
      tags: normalizeTags(input.tags)
    };
    base.summaryHash = hashPlanSummary(base);
    base.planHash = hashPlan(base);
    await this.store.saveReceipt(base);
    await this.pushEvent({
      planId,
      planReceiptId: base.id,
      type: "plan_created",
      status: base.status,
      summary: "Plan generated with canonical hashes.",
      data: {
        taskType: base.taskType,
        stepCount: base.stepCount,
        summaryHash: base.summaryHash,
        planHash: base.planHash
      }
    });
    let stored = await this.storeReceipt(base.id);
    if (input.anchorOnCreate) {
      stored = await this.anchorReceipt({ planId });
    }
    return stored;
  }
  async storeReceipt(receiptId2) {
    const receipt = await this.store.getReceiptById(receiptId2);
    if (!receipt) throw new Error("plan_receipt_not_found");
    const stored = await this.storage.store("plans", receipt.id, receipt);
    const next = await this.cloneWithChanges(receipt, {
      status: stored.degraded ? "degraded" : "stored",
      storage: {
        ref: stored.ref,
        checksum: stored.checksum,
        namespace: stored.namespace
      }
    });
    await this.pushEvent({
      planId: receipt.planId,
      planReceiptId: next.id,
      type: "plan_stored",
      status: next.status,
      summary: stored.degraded ? "Plan stored locally; remote storage unavailable." : "Plan stored off-chain.",
      data: {
        storageRef: stored.ref,
        hash: next.planHash
      }
    });
    return next;
  }
  async anchorReceipt(input) {
    const latest = await this.store.getLatestReceiptByPlanId(input.planId);
    if (!latest) throw new Error("plan_not_found");
    const anchored = await this.anchor.anchorReceipt({
      ...latest,
      wallet: input.wallet || latest.wallet
    });
    const status = anchored.degraded ? "degraded" : "anchored";
    const next = await this.cloneWithChanges(latest, {
      status,
      wallet: input.wallet || latest.wallet,
      solana: {
        chainId: anchored.chainId,
        txSignature: anchored.txSignature,
        account: anchored.account,
        programId: anchored.programId,
        anchorHash: anchored.anchorHash,
        verified: anchored.verified,
        verifiedAt: anchored.verifiedAt
      }
    });
    await this.pushEvent({
      planId: next.planId,
      planReceiptId: next.id,
      type: anchored.degraded ? "plan_anchor_degraded" : "plan_anchored",
      status: next.status,
      summary: anchored.degraded ? "Plan anchor failed; degraded proof mode active." : "Plan anchored on Solana.",
      data: {
        txSignature: anchored.txSignature,
        hash: anchored.anchorHash
      }
    });
    return next;
  }
  async execute(input) {
    const plan = await this.store.getLatestReceiptByPlanId(input.planId);
    if (!plan) throw new Error("plan_not_found");
    const now5 = nowIso2();
    const execution = {
      id: `pex_${nanoid9(12)}`,
      planReceiptId: plan.id,
      planId: plan.planId,
      status: input.status ?? "running",
      startTime: normalizeDate(input.startTime),
      endTime: input.status && input.status !== "running" ? now5 : void 0,
      worker: input.worker,
      toolCalls: [...input.toolCalls || []],
      stepProgress: input.stepProgress || plan.steps.map((step) => ({
        stepId: step.id,
        status: "pending"
      })),
      failedSteps: [...input.failedSteps || []],
      finalResult: input.finalResult,
      outputHash: input.outputHash,
      memoryWrite: void 0,
      reflectionWrite: void 0,
      solana: void 0,
      metadata: normalizeMetadata(input.metadata),
      createdAt: now5,
      updatedAt: now5
    };
    if (!execution.outputHash && execution.finalResult) {
      execution.outputHash = hashExecution({
        ...execution,
        outputHash: void 0
      });
    }
    await this.store.saveExecution(execution);
    await this.pushEvent({
      planId: plan.planId,
      planReceiptId: plan.id,
      executionReceiptId: execution.id,
      type: "plan_execution_recorded",
      status: execution.status,
      summary: execution.finalResult || "Execution receipt recorded.",
      data: {
        hash: execution.outputHash
      }
    });
    return execution;
  }
  async list(query = {}) {
    let plans = await this.store.listLatestReceipts();
    plans = plans.filter((plan) => {
      if (query.taskType && plan.taskType !== query.taskType) return false;
      if (query.status && plan.status !== query.status) return false;
      if (query.outcomeStatus && plan.outcomeStatus !== query.outcomeStatus) return false;
      if (query.agentId && plan.agentId !== query.agentId) return false;
      if (query.wallet && plan.wallet !== query.wallet) return false;
      if (query.conversationId && plan.conversationId !== query.conversationId) return false;
      if (typeof query.verified === "boolean" && Boolean(plan.solana?.verified) !== query.verified) return false;
      return true;
    });
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    return plans.slice(offset, offset + limit);
  }
  async get(planId) {
    const plan = await this.store.getLatestReceiptByPlanId(planId);
    if (!plan) throw new Error("plan_not_found");
    return plan;
  }
  async getByReceiptId(receiptId2) {
    const receipt = await this.store.getReceiptById(receiptId2);
    if (!receipt) throw new Error("plan_receipt_not_found");
    return receipt;
  }
  async applyResult(result) {
    const latest = await this.store.getLatestReceiptByPlanId(result.planId);
    if (!latest) throw new Error("plan_not_found");
    const status = result.status === "success" ? "completed" : result.status === "partial" ? "partially_completed" : result.status === "failed" ? "failed" : "degraded";
    return this.cloneWithChanges(latest, {
      actualOutcome: result.actualOutcome,
      outcomeStatus: result.status,
      status,
      reflection: result.reflection ?? latest.reflection,
      memory: result.memory ?? latest.memory
    });
  }
  async cloneWithChanges(receipt, changes) {
    const next = {
      ...receipt,
      ...changes,
      id: `prc_${nanoid9(12)}`,
      version: receipt.version + 1,
      createdAt: receipt.createdAt,
      updatedAt: nowIso2(),
      metadata: {
        ...receipt.metadata,
        previousReceiptId: receipt.id
      }
    };
    next.summaryHash = hashPlanSummary(next);
    next.planHash = hashPlan(next);
    await this.store.saveReceipt(next);
    return next;
  }
};

// server/plans/PlanResultService.ts
import { nanoid as nanoid10 } from "nanoid";
var PlanResultService = class {
  constructor(store, storage, anchor, pushEvent) {
    this.store = store;
    this.storage = storage;
    this.anchor = anchor;
    this.pushEvent = pushEvent;
  }
  async createResult(input) {
    const receipt = await this.store.getLatestReceiptByPlanId(input.planId);
    if (!receipt) throw new Error("plan_not_found");
    const now5 = nowIso2();
    const result = {
      id: `pres_${nanoid10(12)}`,
      planReceiptId: receipt.id,
      planId: receipt.planId,
      actualOutcome: input.actualOutcome,
      status: input.status,
      resultSummary: input.resultSummary,
      resultHash: "",
      sourceExecutionReceiptId: input.sourceExecutionReceiptId,
      reflection: input.reflection,
      memory: input.memory,
      storage: void 0,
      solana: void 0,
      createdAt: now5,
      updatedAt: now5,
      metadata: { ...input.metadata || {} }
    };
    result.resultHash = hashResult(result);
    const storage = await this.storage.store("plan-results", result.id, result);
    result.storage = {
      ref: storage.ref,
      checksum: storage.checksum,
      namespace: storage.namespace
    };
    const anchored = await this.anchor.anchorResult(receipt, result);
    result.solana = {
      chainId: anchored.chainId,
      txSignature: anchored.txSignature,
      account: anchored.account,
      programId: anchored.programId,
      anchorHash: anchored.anchorHash,
      verified: anchored.verified,
      verifiedAt: anchored.verifiedAt
    };
    await this.store.saveResult(result);
    await this.pushEvent({
      planId: input.planId,
      planReceiptId: receipt.id,
      resultReceiptId: result.id,
      type: "plan_result_recorded",
      status: input.status,
      summary: input.resultSummary,
      data: {
        resultHash: result.resultHash,
        storageRef: storage.ref,
        txSignature: result.solana?.txSignature
      }
    });
    return { result, degraded: storage.degraded };
  }
  async linkReflection(planId, reflectionId, reflectionReceiptId) {
    const result = await this.store.getLatestResultByPlanId(planId);
    if (!result) throw new Error("plan_result_not_found");
    const linked = {
      ...result,
      reflection: {
        reflectionId,
        reflectionReceiptId,
        linked: true
      },
      updatedAt: nowIso2()
    };
    await this.store.saveResult(linked);
    await this.pushEvent({
      planId,
      planReceiptId: linked.planReceiptId,
      resultReceiptId: linked.id,
      type: "plan_reflection_linked",
      status: "reflected",
      summary: "Reflection linked to plan result.",
      data: { reflectionId, reflectionReceiptId }
    });
    return linked;
  }
  async linkMemory(planId, memoryId) {
    const result = await this.store.getLatestResultByPlanId(planId);
    if (!result) throw new Error("plan_result_not_found");
    const linked = {
      ...result,
      memory: {
        memoryId,
        linked: true
      },
      updatedAt: nowIso2()
    };
    await this.store.saveResult(linked);
    await this.pushEvent({
      planId,
      planReceiptId: linked.planReceiptId,
      resultReceiptId: linked.id,
      type: "plan_memory_linked",
      status: "linked_to_memory",
      summary: "Plan result linked to memory.",
      data: { memoryId }
    });
    return linked;
  }
};

// server/plans/PlanVerificationService.ts
var PlanVerificationService = class {
  constructor(store) {
    this.store = store;
  }
  async verify(planId) {
    const receipt = await this.store.getLatestReceiptByPlanId(planId);
    if (!receipt) throw new Error("plan_not_found");
    const result = await this.store.getLatestResultByPlanId(planId);
    const canonicalPlanHashMatch = hashPlan(receipt) === receipt.planHash;
    const canonicalSummaryHashMatch = hashPlanSummary(receipt) === receipt.summaryHash;
    const resultHashMatch = result ? hashResult(result) === result.resultHash : true;
    const anchorPresent = Boolean(receipt.solana?.anchorHash || receipt.solana?.txSignature);
    const reflectionLinked = Boolean(result?.reflection?.linked || receipt.reflection?.linked);
    const memoryLinked = Boolean(result?.memory?.linked || receipt.memory?.linked);
    const checks = {
      canonicalPlanHashMatch,
      canonicalSummaryHashMatch,
      resultHashMatch,
      anchorPresent,
      reflectionLinked,
      memoryLinked
    };
    const issues = Object.entries(checks).filter(([, ok5]) => !ok5).map(([name]) => name);
    const verified = issues.length === 0;
    const status = verified ? "verified" : anchorPresent && (canonicalPlanHashMatch || canonicalSummaryHashMatch) ? "partially_verified" : anchorPresent ? "anchored_only" : receipt.storage?.ref ? "stored_only" : "degraded";
    return {
      planId,
      planReceiptId: receipt.id,
      verified,
      status,
      checks,
      issues,
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
};

// server/plans/PlanTimelineService.ts
var PlanTimelineService = class {
  toTimelineEvents(events) {
    return events.map((event) => ({
      id: event.id,
      planId: event.planId,
      planReceiptId: event.planReceiptId,
      executionReceiptId: event.executionReceiptId,
      resultReceiptId: event.resultReceiptId,
      stage: this.stageForType(event.type),
      status: event.status,
      title: this.titleForType(event.type),
      summary: event.summary,
      timestamp: event.createdAt,
      refs: {
        storage: this.stringRef(event.data, "storageRef"),
        txSignature: this.stringRef(event.data, "txSignature"),
        reflectionId: this.stringRef(event.data, "reflectionId"),
        memoryId: this.stringRef(event.data, "memoryId"),
        hash: this.stringRef(event.data, "hash")
      },
      metadata: event.data
    }));
  }
  stageForType(type) {
    if (type.includes("created") || type.includes("stored")) return "breakdown";
    if (type.includes("anchor") || type.includes("verified")) return "proof";
    if (type.includes("execut")) return "execution";
    if (type.includes("result")) return "result";
    if (type.includes("reflection")) return "reflection";
    if (type.includes("memory")) return "memory";
    return "goal";
  }
  titleForType(type) {
    switch (type) {
      case "plan_created":
        return "Plan receipt created";
      case "plan_stored":
        return "Plan stored";
      case "plan_anchored":
        return "Plan anchored";
      case "plan_anchor_degraded":
        return "Plan anchor degraded";
      case "plan_executing":
        return "Execution started";
      case "plan_execution_recorded":
        return "Execution receipt recorded";
      case "plan_result_recorded":
        return "Result receipt recorded";
      case "plan_reflection_linked":
        return "Reflection linked";
      case "plan_memory_linked":
        return "Memory linked";
      case "plan_verified":
        return "Plan verified";
      case "plan_verification_failed":
        return "Verification failed";
      default:
        return "Plan event";
    }
  }
  stringRef(data, key) {
    const value = data?.[key];
    return typeof value === "string" ? value : void 0;
  }
};

// server/plans/routes.ts
import { z as z6 } from "zod";
function ok3(res, data) {
  res.json({ ok: true, data });
}
function fail4(res, error, status = 400) {
  const message = error instanceof Error ? error.message : "plan_route_failed";
  res.status(status).json({ ok: false, error: message });
}
function requestId4(req) {
  return String(req.headers["x-request-id"] || `req_${Date.now()}`);
}
var taskTypes = [
  "support",
  "research",
  "coding",
  "deployment",
  "governance",
  "analysis",
  "planning",
  "execution",
  "retrieval",
  "multimodal",
  "queue_processing",
  "proof_generation",
  "skill_usage"
];
var createReceiptSchema = z6.object({
  planId: z6.string().optional(),
  taskType: z6.enum(taskTypes),
  title: z6.string().min(2).max(180),
  summary: z6.string().min(2).max(2e3),
  goal: z6.string().min(2).max(4e3),
  steps: z6.array(
    z6.object({
      id: z6.string().optional(),
      index: z6.number().min(0).optional(),
      title: z6.string().min(1),
      description: z6.string().min(1),
      dependencies: z6.array(z6.string()).default([]),
      chosenSkills: z6.array(z6.string()).default([]),
      expectedResult: z6.string().optional(),
      status: z6.enum(["pending", "running", "done", "failed", "skipped"]).default("pending"),
      resultSummary: z6.string().optional(),
      resultHash: z6.string().optional()
    })
  ).min(1),
  dependencies: z6.array(
    z6.object({
      id: z6.string().min(1),
      type: z6.enum(["skill", "memory", "artifact", "queue", "contract", "tool"]),
      ref: z6.string().min(1),
      label: z6.string().optional(),
      required: z6.boolean()
    })
  ).optional(),
  chosenSkills: z6.array(
    z6.object({
      id: z6.string().min(1),
      name: z6.string().min(1),
      version: z6.string().optional(),
      hash: z6.string().optional(),
      active: z6.boolean().optional()
    })
  ).optional(),
  expectedOutcome: z6.string().min(2).max(2e3),
  agentId: z6.string().min(1),
  conversationId: z6.string().optional(),
  turnId: z6.string().optional(),
  sessionId: z6.string().optional(),
  wallet: z6.string().optional(),
  tags: z6.array(z6.string()).optional(),
  metadata: z6.record(z6.string(), z6.unknown()).optional(),
  anchorOnCreate: z6.boolean().optional()
});
var planQuerySchema = z6.object({
  taskType: z6.enum(taskTypes).optional(),
  status: z6.enum([
    "draft",
    "generated",
    "stored",
    "anchored",
    "executing",
    "completed",
    "failed",
    "partially_completed",
    "reflected",
    "linked_to_memory",
    "verified",
    "degraded"
  ]).optional(),
  outcomeStatus: z6.enum(["pending", "success", "partial", "failed", "degraded"]).optional(),
  agentId: z6.string().optional(),
  wallet: z6.string().optional(),
  conversationId: z6.string().optional(),
  verified: z6.string().optional().transform((v) => v === "true" ? true : v === "false" ? false : void 0),
  limit: z6.string().optional().transform((v) => v ? Number(v) : void 0),
  offset: z6.string().optional().transform((v) => v ? Number(v) : void 0)
});
var executeSchema = z6.object({
  planId: z6.string().min(1),
  worker: z6.string().min(1),
  startTime: z6.string().optional(),
  toolCalls: z6.array(
    z6.object({
      id: z6.string().min(1),
      tool: z6.string().min(1),
      status: z6.enum(["success", "failed"]),
      summary: z6.string().optional()
    })
  ).optional(),
  stepProgress: z6.array(
    z6.object({
      stepId: z6.string().min(1),
      status: z6.enum(["pending", "running", "done", "failed", "skipped"])
    })
  ).optional(),
  failedSteps: z6.array(z6.string()).optional(),
  finalResult: z6.string().optional(),
  status: z6.enum(["pending", "running", "success", "partial", "failed", "degraded"]).optional(),
  outputHash: z6.string().optional(),
  metadata: z6.record(z6.string(), z6.unknown()).optional()
});
var resultSchema = z6.object({
  planId: z6.string().min(1),
  actualOutcome: z6.string().min(1),
  status: z6.enum(["pending", "success", "partial", "failed", "degraded"]),
  resultSummary: z6.string().min(1),
  sourceExecutionReceiptId: z6.string().optional(),
  reflection: z6.object({
    reflectionId: z6.string().optional(),
    reflectionReceiptId: z6.string().optional(),
    linked: z6.boolean().optional()
  }).optional(),
  memory: z6.object({
    memoryId: z6.string().optional(),
    linked: z6.boolean().optional()
  }).optional(),
  metadata: z6.record(z6.string(), z6.unknown()).optional()
});
var anchorSchema = z6.object({
  planId: z6.string().min(1),
  wallet: z6.string().optional()
});
var storeSchema = z6.object({
  receiptId: z6.string().min(1)
});
var verifySchema = z6.object({
  planId: z6.string().min(1)
});
var reflectionLinkSchema = z6.object({
  planId: z6.string().min(1),
  reflectionId: z6.string().min(1),
  reflectionReceiptId: z6.string().optional()
});
var memoryLinkSchema = z6.object({
  planId: z6.string().min(1),
  memoryId: z6.string().min(1)
});
var demoSchema = z6.object({
  agentId: z6.string().default("agent_demo"),
  wallet: z6.string().optional(),
  goal: z6.string().default("Ship Solana planner receipts with timeline proof.")
});
function registerPlanRoutes(app, services) {
  app.post("/api/plans/receipt", async (req, res) => {
    try {
      const body = createReceiptSchema.parse(req.body);
      const receipt = await services.receiptService.create({
        ...body,
        steps: body.steps.map((step, index) => ({
          id: step.id || `step_${index + 1}`,
          index,
          title: step.title,
          description: step.description,
          dependencies: step.dependencies,
          chosenSkills: step.chosenSkills,
          expectedResult: step.expectedResult,
          status: step.status,
          resultSummary: step.resultSummary,
          resultHash: step.resultHash
        }))
      });
      ok3(res, { requestId: requestId4(req), receipt });
    } catch (error) {
      fail4(res, error);
    }
  });
  app.post("/api/plans/receipt/store", async (req, res) => {
    try {
      const body = storeSchema.parse(req.body);
      const receipt = await services.receiptService.storeReceipt(body.receiptId);
      ok3(res, receipt);
    } catch (error) {
      fail4(res, error);
    }
  });
  app.post("/api/plans/receipt/anchor", async (req, res) => {
    try {
      const body = anchorSchema.parse(req.body);
      const receipt = await services.receiptService.anchorReceipt(body);
      ok3(res, receipt);
    } catch (error) {
      fail4(res, error);
    }
  });
  app.post("/api/plans/receipt/verify", async (req, res) => {
    try {
      const body = verifySchema.parse(req.body);
      const verification = await services.verificationService.verify(body.planId);
      ok3(res, verification);
    } catch (error) {
      fail4(res, error);
    }
  });
  app.post("/api/plans/execute", async (req, res) => {
    try {
      const body = executeSchema.parse(req.body);
      const execution = await services.receiptService.execute(body);
      ok3(res, execution);
    } catch (error) {
      fail4(res, error);
    }
  });
  app.post("/api/plans/result", async (req, res) => {
    try {
      const body = resultSchema.parse(req.body);
      const created = await services.resultService.createResult(body);
      const planReceipt = await services.receiptService.applyResult(created.result);
      ok3(res, {
        result: created.result,
        planReceipt,
        degraded: created.degraded
      });
    } catch (error) {
      fail4(res, error);
    }
  });
  app.post("/api/plans/result/reflection-link", async (req, res) => {
    try {
      const body = reflectionLinkSchema.parse(req.body);
      const result = await services.resultService.linkReflection(
        body.planId,
        body.reflectionId,
        body.reflectionReceiptId
      );
      const planReceipt = await services.receiptService.applyResult(result);
      ok3(res, { result, planReceipt });
    } catch (error) {
      fail4(res, error);
    }
  });
  app.post("/api/plans/result/memory-link", async (req, res) => {
    try {
      const body = memoryLinkSchema.parse(req.body);
      const result = await services.resultService.linkMemory(body.planId, body.memoryId);
      const planReceipt = await services.receiptService.applyResult(result);
      ok3(res, { result, planReceipt });
    } catch (error) {
      fail4(res, error);
    }
  });
  app.post("/api/plans/demo/run", async (req, res) => {
    try {
      const body = demoSchema.parse(req.body ?? {});
      const created = await services.receiptService.create({
        taskType: "planning",
        title: "Planner receipt demo",
        summary: "Generate, execute, result, reflect, and link to memory.",
        goal: body.goal,
        steps: [
          {
            id: "step_goal",
            index: 0,
            title: "Goal intake",
            description: "Capture user goal and acceptance criteria.",
            dependencies: [],
            chosenSkills: ["goal-parser"],
            status: "pending"
          },
          {
            id: "step_breakdown",
            index: 1,
            title: "Breakdown",
            description: "Generate step sequence and dependencies.",
            dependencies: ["step_goal"],
            chosenSkills: ["planner-core"],
            status: "pending"
          }
        ],
        dependencies: [{ id: "dep_skill", type: "skill", ref: "planner-core@1.0.0", required: true }],
        chosenSkills: [
          { id: "goal-parser", name: "Goal parser", version: "1.0.0", active: true },
          { id: "planner-core", name: "Planner core", version: "1.0.0", active: true }
        ],
        expectedOutcome: "A verifiable plan lifecycle",
        agentId: body.agentId,
        wallet: body.wallet,
        tags: ["demo", "timeline", "proof"],
        anchorOnCreate: true
      });
      const execution = await services.receiptService.execute({
        planId: created.planId,
        worker: "demo_worker",
        status: "success",
        finalResult: "Execution completed in demo mode."
      });
      const { result } = await services.resultService.createResult({
        planId: created.planId,
        actualOutcome: "Plan completed and linked to memory.",
        status: "success",
        resultSummary: "Demo run completed full lifecycle.",
        sourceExecutionReceiptId: execution.id,
        reflection: {
          reflectionId: `refl_demo_${Date.now()}`,
          linked: true
        },
        memory: {
          memoryId: `mem_demo_${Date.now()}`,
          linked: true
        }
      });
      const finalPlan = await services.receiptService.applyResult(result);
      const verification = await services.verificationService.verify(created.planId);
      ok3(res, {
        plan: finalPlan,
        execution,
        result,
        verification
      });
    } catch (error) {
      fail4(res, error);
    }
  });
  app.get("/api/plans", async (req, res) => {
    try {
      const query = planQuerySchema.parse(req.query);
      const plans = await services.receiptService.list(query);
      ok3(res, plans);
    } catch (error) {
      fail4(res, error);
    }
  });
  app.get("/api/plans/health", async (_req, res) => {
    try {
      const plans = await services.receiptService.list({ limit: 5 });
      ok3(res, {
        ok: true,
        module: "plans",
        planCountPreview: plans.length
      });
    } catch (error) {
      fail4(res, error, 500);
    }
  });
  app.get("/api/plans/:id", async (req, res) => {
    try {
      const plan = await services.receiptService.get(String(req.params.id));
      ok3(res, plan);
    } catch (error) {
      fail4(res, error, 404);
    }
  });
  app.get("/api/plans/:id/timeline", async (req, res) => {
    try {
      const raw = await services.store.listTimelineForPlan(String(req.params.id));
      const timeline = services.timelineService.toTimelineEvents(raw);
      ok3(res, timeline);
    } catch (error) {
      fail4(res, error, 404);
    }
  });
  app.get("/api/plans/:id/result", async (req, res) => {
    try {
      const result = await services.store.getLatestResultByPlanId(String(req.params.id));
      ok3(res, result || null);
    } catch (error) {
      fail4(res, error, 404);
    }
  });
  app.get("/api/plans/:id/reflection", async (req, res) => {
    try {
      const result = await services.store.getLatestResultByPlanId(String(req.params.id));
      ok3(res, result?.reflection || null);
    } catch (error) {
      fail4(res, error, 404);
    }
  });
  app.get("/api/plans/:id/verify", async (req, res) => {
    try {
      const verification = await services.verificationService.verify(String(req.params.id));
      ok3(res, verification);
    } catch (error) {
      fail4(res, error, 404);
    }
  });
}

// server/plans/mount.ts
import path10 from "path";
import crypto17 from "crypto";
import { nanoid as nanoid11 } from "nanoid";
async function mountPlanReceipts(app, options) {
  const store = new PlanStore(path10.join(process.cwd(), "data", "plan-receipts.json"));
  await store.init();
  const storage = new PlanStorageService();
  const anchor = new PlanAnchorService({
    chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
    programId: process.env.SOLANA_PROGRAM_ID || process.env.CLAW_IDENTITY_PROGRAM_ID,
    anchorClient: options?.solanaIdentityService ? {
      anchorPlan: async (input) => {
        const payloadHash = crypto17.createHash("sha256").update(
          JSON.stringify({
            planId: input.planId,
            taskType: input.taskType,
            goal: input.goal,
            planHash: input.planHash,
            stepHash: input.stepHash,
            stepCount: input.stepCount,
            outcome: input.outcome
          })
        ).digest("hex");
        const bridgeTx = options.solanaBridge ? await options.solanaBridge.sendInstruction({
          walletAddress: input.wallet,
          action: input.outcome === "planned" || input.outcome === "running" ? "create_plan_receipt" : "complete_plan_receipt",
          subjectId: input.planId,
          payloadHash,
          metadata: {
            taskType: input.taskType,
            goal: input.goal,
            stepCount: input.stepCount,
            outcome: input.outcome
          }
        }) : void 0;
        const plannerRun = await options.solanaIdentityService.recordPlannerRun({
          walletAddress: input.wallet,
          runId: input.planId,
          taskType: input.taskType,
          goal: input.goal,
          planHash: input.planHash,
          stepHash: input.stepHash,
          outcome: input.outcome,
          stepCount: input.stepCount,
          completedSteps: input.outcome === "succeeded" ? input.stepCount : 0,
          failedSteps: input.outcome === "failed" ? input.stepCount : 0
        });
        return {
          chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
          programId: process.env.SOLANA_PROGRAM_ID || process.env.CLAW_IDENTITY_PROGRAM_ID,
          account: plannerRun.id,
          txSignature: bridgeTx?.txSignature
        };
      }
    } : void 0
  });
  async function pushEvent(event) {
    await store.pushTimelineEvent({
      ...event,
      id: `pevt_${nanoid11(10)}`,
      createdAt: nowIso2()
    });
  }
  const receiptService = new PlanReceiptService(store, storage, anchor, pushEvent);
  const resultService = new PlanResultService(store, storage, anchor, pushEvent);
  const timelineService = new PlanTimelineService();
  const verificationService = new PlanVerificationService(store);
  registerPlanRoutes(app, {
    store,
    receiptService,
    resultService,
    timelineService,
    verificationService
  });
  return {
    store,
    receiptService,
    resultService,
    timelineService,
    verificationService
  };
}

// server/openclaw/bridge.ts
import crypto18 from "crypto";
function hashJson(value) {
  return crypto18.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function receiptId() {
  return `bridge_${crypto18.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
var OpenClawBridgeService = class {
  state = {
    tier: "verified",
    mode: "idle",
    connected: true,
    manifests: [],
    receipts: []
  };
  listManifests() {
    return [...this.state.manifests];
  }
  listReceipts() {
    return [...this.state.receipts].sort((a, b) => b.timestamp - a.timestamp);
  }
  /** Compact counters for health checks */
  getStatus() {
    return {
      tier: this.state.tier,
      mode: this.state.mode,
      connected: this.state.connected,
      manifestCount: this.state.manifests.length,
      receiptCount: this.state.receipts.length,
      lastSyncAt: this.state.lastSyncAt,
      lastError: this.state.lastError
    };
  }
  /** Command-center bridge panel */
  getBridgeSession() {
    const imported = this.state.receipts.filter((r) => r.direction === "import").length;
    const exported = this.state.receipts.filter((r) => r.direction === "export").length;
    return {
      connected: this.state.connected && this.state.tier !== "unavailable",
      mode: this.state.mode,
      lastSyncAt: this.state.lastSyncAt ? new Date(this.state.lastSyncAt).toISOString() : void 0,
      lastError: this.state.lastError,
      importedCount: imported,
      exportedCount: exported
    };
  }
  importManifest(manifest, wallet) {
    this.state.mode = "import";
    this.state.lastError = void 0;
    const manifestHash = hashJson(manifest);
    const next = {
      ...manifest,
      contentHash: manifest.contentHash || manifestHash,
      provenanceHash: manifest.provenanceHash || manifestHash
    };
    const exists = this.state.manifests.findIndex((item) => item.skillId === next.skillId && item.version === next.version);
    if (exists >= 0) this.state.manifests[exists] = next;
    else this.state.manifests.unshift(next);
    const receipt = {
      id: receiptId(),
      direction: "import",
      bridgeStatus: this.state.tier,
      sourceFormat: "openclaw",
      targetFormat: "claw",
      skillId: next.skillId,
      wallet,
      manifestHash,
      timestamp: Date.now()
    };
    this.state.receipts.unshift(receipt);
    this.state.lastSyncAt = Date.now();
    this.state.mode = "idle";
    return { manifest: next, receipt };
  }
  exportSkill(skill) {
    this.state.mode = "export";
    this.state.lastError = void 0;
    const manifest = {
      manifestVersion: "1.0",
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description,
      authorWallet: skill.authorWallet,
      version: skill.version,
      tags: skill.tags,
      tools: [],
      contentHash: skill.contentHash,
      provenanceHash: hashJson(skill),
      createdAt: Date.now()
    };
    const manifestHash = hashJson(manifest);
    this.state.manifests.unshift(manifest);
    const receipt = {
      id: receiptId(),
      direction: "export",
      bridgeStatus: this.state.tier,
      sourceFormat: "claw",
      targetFormat: "openclaw",
      skillId: skill.skillId,
      wallet: skill.authorWallet,
      manifestHash,
      timestamp: Date.now()
    };
    this.state.receipts.unshift(receipt);
    this.state.lastSyncAt = Date.now();
    this.state.mode = "idle";
    return { manifest, receipt };
  }
  /** Demo / degraded simulation */
  setBridgeHealth(input) {
    if (input.tier !== void 0) this.state.tier = input.tier;
    if (input.connected !== void 0) this.state.connected = input.connected;
    if (input.mode !== void 0) this.state.mode = input.mode;
    if (input.lastError !== void 0) this.state.lastError = input.lastError;
  }
};
function registerOpenClawBridgeRoutes(app, service) {
  app.get("/api/openclaw/status", (_req, res) => {
    res.json({ ok: true, data: service.getStatus() });
  });
  app.get("/api/openclaw/bridge", (_req, res) => {
    res.json({ ok: true, data: service.getBridgeSession() });
  });
  app.get("/api/openclaw/manifests", (_req, res) => {
    res.json({ ok: true, data: service.listManifests() });
  });
  app.get("/api/openclaw/receipts", (_req, res) => {
    res.json({ ok: true, data: service.listReceipts() });
  });
  app.post("/api/openclaw/import", (req, res) => {
    try {
      const wallet = String(req.body.wallet || "").trim();
      const manifest = req.body.manifest;
      if (!wallet || !manifest?.skillId) throw new Error("wallet and manifest are required");
      const data = service.importManifest(manifest, wallet);
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "openclaw_import_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/openclaw/export", (req, res) => {
    try {
      const skill = req.body.skill;
      if (!skill?.skillId || !skill.authorWallet) throw new Error("skill payload is required");
      const data = service.exportSkill(skill);
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "openclaw_export_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
}

// server/nft/mount.ts
import path12 from "path";

// server/nft/nftRoutes.ts
function registerNftRoutes(app, nftService) {
  app.post("/api/nft/collection/create", async (req, res) => {
    try {
      const data = await nftService.createCollection(req.body);
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "create_collection_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/nft/collection", (_req, res) => {
    res.json({ ok: true, data: nftService.getCollection() });
  });
  app.post("/api/nft/mint", async (req, res) => {
    try {
      const data = await nftService.mint(req.body);
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "mint_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/nft/mints", (_req, res) => {
    res.json({ ok: true, data: nftService.listMints() });
  });
  app.get("/api/nft/mints/:owner", (req, res) => {
    res.json({ ok: true, data: nftService.listMintsByOwner(req.params.owner) });
  });
  app.get("/api/nft/mint/:mint", (req, res) => {
    const data = nftService.getMint(req.params.mint);
    if (!data) return res.status(404).json({ ok: false, error: "mint_not_found" });
    res.json({ ok: true, data });
  });
  app.post("/api/nft/freeze", async (_req, res) => {
    try {
      const data = await nftService.freezeCollection();
      res.json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "freeze_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
}

// server/nft/nftService.ts
import { Keypair as Keypair2 } from "@solana/web3.js";
var NftService = class {
  constructor(store) {
    this.store = store;
  }
  getCollection() {
    return this.store.getCollection() ?? null;
  }
  async createCollection(input) {
    const now5 = Date.now();
    const collectionMint = Keypair2.generate().publicKey;
    const collection = {
      ...input,
      totalMinted: 0,
      frozen: false,
      createdAt: now5,
      updatedAt: now5,
      collectionMint: collectionMint.toBase58()
    };
    await this.store.setCollection(collection);
    return collection;
  }
  async mint(input) {
    const collection = this.store.getCollection();
    if (!collection) throw new Error("Collection not initialized");
    if (collection.frozen) throw new Error("Collection is frozen");
    if (collection.totalMinted >= collection.maxSupply) throw new Error("Max supply reached");
    const now5 = Date.now();
    const mint = Keypair2.generate().publicKey.toBase58();
    const record = {
      mint,
      owner: input.owner,
      collectionMint: collection.collectionMint || "",
      nftType: input.nftType,
      name: input.name,
      symbol: input.symbol,
      uri: input.uri,
      description: input.description,
      tags: input.tags,
      createdAt: now5
    };
    await this.store.addMint(record);
    return record;
  }
  async freezeCollection() {
    const collection = this.store.getCollection();
    if (!collection) throw new Error("Collection not initialized");
    const next = { ...collection, frozen: true, updatedAt: Date.now() };
    await this.store.setCollection(next);
    return next;
  }
  listMints() {
    return this.store.listMints();
  }
  listMintsByOwner(owner) {
    return this.store.listMintsByOwner(owner);
  }
  getMint(mint) {
    return this.store.getByMint(mint);
  }
};

// server/nft/nftStore.ts
import fs7 from "fs/promises";
import path11 from "path";
var EMPTY = { mints: [] };
var NftStore = class {
  constructor(filePath) {
    this.filePath = filePath;
  }
  state = structuredClone(EMPTY);
  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs7.readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw);
    } catch {
      this.state = structuredClone(EMPTY);
    }
  }
  async persist() {
    if (!this.filePath) return;
    await fs7.mkdir(path11.dirname(this.filePath), { recursive: true });
    await fs7.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }
  async setCollection(collection) {
    this.state.collection = collection;
    await this.persist();
    return collection;
  }
  getCollection() {
    return this.state.collection;
  }
  async addMint(record) {
    this.state.mints.unshift(record);
    this.state.collection = this.state.collection ? {
      ...this.state.collection,
      totalMinted: this.state.collection.totalMinted + 1,
      updatedAt: Date.now()
    } : this.state.collection;
    await this.persist();
    return record;
  }
  listMints() {
    return [...this.state.mints];
  }
  listMintsByOwner(owner) {
    return this.state.mints.filter((m) => m.owner === owner);
  }
  getByMint(mint) {
    return this.state.mints.find((m) => m.mint === mint);
  }
};

// server/nft/mount.ts
async function mountNft(app) {
  const store = new NftStore(path12.join(process.cwd(), "data", "claw-nft.json"));
  await store.init();
  const service = new NftService(store);
  registerNftRoutes(app, service);
  return { store, service };
}

// server/dao/mount.ts
import path14 from "path";

// server/dao/daoStore.ts
import fs8 from "fs/promises";
import path13 from "path";
var EMPTY2 = { members: [], proposals: [], discovery: [] };
var DaoStore = class {
  constructor(filePath) {
    this.filePath = filePath;
  }
  state = structuredClone(EMPTY2);
  async init() {
    if (!this.filePath) return;
    try {
      const raw = await fs8.readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw);
    } catch {
      this.state = structuredClone(EMPTY2);
    }
  }
  async persist() {
    if (!this.filePath) return;
    await fs8.mkdir(path13.dirname(this.filePath), { recursive: true });
    await fs8.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }
  async setConfig(config) {
    this.state.config = config;
    await this.persist();
    return config;
  }
  async patchConfig(patch) {
    if (!this.state.config) return;
    this.state.config = { ...this.state.config, ...patch };
    await this.persist();
    return this.state.config;
  }
  getConfig() {
    return this.state.config;
  }
  async upsertMember(member) {
    const idx = this.state.members.findIndex((m) => m.wallet === member.wallet);
    if (idx >= 0) this.state.members[idx] = member;
    else this.state.members.unshift(member);
    await this.persist();
    return member;
  }
  async upsertProposal(proposal) {
    const idx = this.state.proposals.findIndex((p) => p.proposalId === proposal.proposalId);
    if (idx >= 0) this.state.proposals[idx] = proposal;
    else this.state.proposals.unshift(proposal);
    await this.persist();
    return proposal;
  }
  async upsertDiscovery(row) {
    const idx = this.state.discovery.findIndex((d) => d.proposalId === row.proposalId);
    if (idx >= 0) this.state.discovery[idx] = row;
    else this.state.discovery.unshift(row);
    await this.persist();
    return row;
  }
  listMembers() {
    return [...this.state.members];
  }
  listProposals() {
    return [...this.state.proposals];
  }
  listDiscovery() {
    return [...this.state.discovery].sort((a, b) => b.rankScoreBps - a.rankScoreBps);
  }
  getMember(wallet) {
    return this.state.members.find((m) => m.wallet === wallet);
  }
  getProposal(proposalId) {
    return this.state.proposals.find((p) => p.proposalId === proposalId);
  }
};

// server/dao/daoService.ts
import crypto19 from "crypto";
function rankScore(proposal) {
  const total = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const participation = total > 0 ? Math.floor(proposal.totalVotes / (total + 1) * 1e4) : 0;
  const approval = proposal.yesVotes + proposal.noVotes > 0 ? Math.floor(proposal.yesVotes / (proposal.yesVotes + proposal.noVotes + 1) * 1e4) : 0;
  return Math.min(
    1e4,
    Math.floor(
      proposal.quorumBps / 2 + proposal.approvalThresholdBps / 2 + participation / 2 + approval / 2
    )
  );
}
var DaoService = class {
  constructor(store) {
    this.store = store;
  }
  async bootstrap() {
    if (!this.store.getConfig()) {
      await this.store.setConfig({
        name: "CLAW DAO",
        symbol: "CLAW",
        uri: "https://claw.machine",
        chainId: 101,
        paused: false,
        quorumBps: 4e3,
        proposalThresholdBps: 5e3,
        voteDurationSlots: 20,
        minStakeLamports: 1e6,
        spendLimitLamports: 5e9,
        treasury: "DAO_TREASURY",
        totalMembers: 0,
        totalProposals: 0,
        totalVotes: 0,
        totalExecuted: 0,
        totalTreasurySpend: 0
      });
    }
  }
  getConfig() {
    const cfg = this.store.getConfig();
    if (!cfg) return null;
    const members = this.store.listMembers();
    const proposals = this.store.listProposals();
    return {
      ...cfg,
      spendLimitLamports: cfg.spendLimitLamports ?? 0,
      totalMembers: members.length,
      totalProposals: proposals.length,
      totalVotes: proposals.reduce((acc, p) => acc + p.voterCount, 0),
      totalExecuted: proposals.filter((p) => p.status === "executed").length,
      totalTreasurySpend: cfg.totalTreasurySpend ?? 0
    };
  }
  async registerMember(wallet, delegate, stakeLamports, reputationPoints) {
    const cfg = this.store.getConfig();
    if (!cfg) throw new Error("dao_not_bootstrapped");
    if (stakeLamports < cfg.minStakeLamports) throw new Error("stake_below_min");
    const now5 = Date.now();
    const member = {
      wallet,
      delegate,
      stakeLamports,
      votingPower: stakeLamports + reputationPoints * 10,
      reputationPoints,
      active: true,
      joinedAt: now5,
      updatedAt: now5
    };
    await this.store.upsertMember(member);
    return member;
  }
  async updateMember(wallet, patch) {
    const current = this.store.getMember(wallet);
    if (!current) throw new Error("member_not_found");
    const stake = patch.stakeLamports ?? current.stakeLamports;
    const rep = patch.reputationPoints ?? current.reputationPoints;
    const next = {
      ...current,
      ...patch,
      votingPower: stake + rep * 10,
      updatedAt: Date.now()
    };
    return this.store.upsertMember(next);
  }
  async createProposal(input) {
    const now5 = Date.now();
    const proposal = {
      proposalId: input.proposalId,
      proposer: input.proposer,
      kind: input.kind,
      status: "active",
      title: input.title,
      description: input.description,
      skillKey: input.skillKey,
      recipient: input.recipient,
      amountLamports: input.amountLamports,
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0,
      totalVotes: 0,
      voterCount: 0,
      startSlot: input.startSlot,
      endSlot: input.endSlot,
      quorumBps: input.quorumBps,
      approvalThresholdBps: input.approvalThresholdBps,
      executionHash: "",
      resultHash: "",
      createdAt: now5,
      updatedAt: now5,
      executedAt: 0
    };
    await this.store.upsertProposal(proposal);
    return proposal;
  }
  async castVote(proposalId, wallet, choice, reason) {
    const proposal = this.store.getProposal(proposalId);
    const member = this.store.getMember(wallet);
    if (!proposal) throw new Error("proposal_not_found");
    if (!member) throw new Error("member_not_found");
    if (proposal.status !== "active") throw new Error("proposal_not_active");
    const weight = member.votingPower;
    const next = { ...proposal };
    if (choice === "yes") next.yesVotes += weight;
    if (choice === "no") next.noVotes += weight;
    if (choice === "abstain") next.abstainVotes += weight;
    next.totalVotes += weight;
    next.voterCount += 1;
    next.updatedAt = Date.now();
    await this.store.upsertProposal(next);
    return {
      proposal: next,
      vote: {
        voter: wallet,
        delegate: member.delegate,
        choice,
        weight,
        reason,
        createdAt: Date.now()
      }
    };
  }
  async finalizeProposal(proposalId) {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error("proposal_not_found");
    const cfg = this.store.getConfig();
    if (!cfg) throw new Error("dao_not_bootstrapped");
    const members = this.store.listMembers().length;
    const participationBps = members > 0 ? Math.floor(proposal.voterCount / members * 1e4) : 0;
    const approvalBps = proposal.yesVotes + proposal.noVotes > 0 ? Math.floor(proposal.yesVotes / (proposal.yesVotes + proposal.noVotes) * 1e4) : 0;
    const passed = participationBps >= cfg.quorumBps && approvalBps >= cfg.proposalThresholdBps;
    const next = {
      ...proposal,
      status: passed ? "succeeded" : "defeated",
      updatedAt: Date.now()
    };
    await this.store.upsertProposal(next);
    const row = {
      proposalId: next.proposalId,
      kind: next.kind,
      title: next.title,
      status: next.status,
      yesVotes: next.yesVotes,
      noVotes: next.noVotes,
      abstainVotes: next.abstainVotes,
      totalVotes: next.totalVotes,
      rankScoreBps: rankScore(next),
      updatedAt: Date.now()
    };
    await this.store.upsertDiscovery(row);
    return { proposal: next, passed, discovery: row };
  }
  async executeProposal(proposalId) {
    const proposal = this.store.getProposal(proposalId);
    if (!proposal) throw new Error("proposal_not_found");
    if (proposal.status !== "succeeded") throw new Error("proposal_not_passed");
    if (proposal.executedAt) throw new Error("already_executed");
    const next = {
      ...proposal,
      status: "executed",
      executedAt: Date.now(),
      updatedAt: Date.now(),
      resultHash: crypto19.createHash("sha256").update(`${proposal.kind}:${proposal.proposalId}:${proposal.title}`).digest("hex")
    };
    await this.store.upsertProposal(next);
    const cfg = this.store.getConfig();
    if (cfg && proposal.kind === "treasury_spend" && proposal.amountLamports > 0) {
      await this.store.patchConfig({
        totalTreasurySpend: cfg.totalTreasurySpend + proposal.amountLamports
      });
    }
    return next;
  }
  listProposals() {
    return this.store.listProposals();
  }
  listDiscovery() {
    return this.store.listDiscovery();
  }
  listMembers() {
    return this.store.listMembers();
  }
  getProposal(proposalId) {
    return this.store.getProposal(proposalId);
  }
  getMember(wallet) {
    return this.store.getMember(wallet);
  }
};

// server/dao/daoRoutes.ts
function registerDaoRoutes(app, daoService) {
  app.get("/api/dao/config", (_req, res) => {
    res.json({ ok: true, data: daoService.getConfig() });
  });
  app.get("/api/dao/members", (_req, res) => {
    res.json({ ok: true, data: daoService.listMembers() });
  });
  app.get("/api/dao/members/:wallet", (req, res) => {
    const data = daoService.getMember(req.params.wallet);
    if (!data) return res.status(404).json({ ok: false, error: "member_not_found" });
    res.json({ ok: true, data });
  });
  app.post("/api/dao/members/register", async (req, res) => {
    try {
      const { wallet, delegate, stakeLamports, reputationPoints } = req.body;
      const data = await daoService.registerMember(
        String(wallet),
        String(delegate || wallet),
        Number(stakeLamports || 0),
        Number(reputationPoints || 0)
      );
      res.json({ ok: true, data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "register_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/dao/proposals", async (req, res) => {
    try {
      const data = await daoService.createProposal({
        proposalId: Number(req.body.proposalId),
        proposer: String(req.body.proposer),
        title: String(req.body.title),
        description: String(req.body.description),
        kind: String(req.body.kind),
        skillKey: String(req.body.skillKey || ""),
        recipient: String(req.body.recipient || req.body.proposer),
        amountLamports: Number(req.body.amountLamports || 0),
        startSlot: Number(req.body.startSlot || 0),
        endSlot: Number(req.body.endSlot || 0),
        quorumBps: Number(req.body.quorumBps || 4e3),
        approvalThresholdBps: Number(req.body.approvalThresholdBps || 5e3)
      });
      res.json({ ok: true, data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "proposal_create_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/dao/proposals", (_req, res) => {
    res.json({ ok: true, data: daoService.listProposals() });
  });
  app.get("/api/dao/proposals/:proposalId", (req, res) => {
    const data = daoService.getProposal(Number(req.params.proposalId));
    if (!data) return res.status(404).json({ ok: false, error: "proposal_not_found" });
    res.json({ ok: true, data });
  });
  app.post("/api/dao/proposals/:proposalId/vote", async (req, res) => {
    try {
      const data = await daoService.castVote(
        Number(req.params.proposalId),
        String(req.body.wallet),
        String(req.body.choice),
        String(req.body.reason || "")
      );
      res.json({ ok: true, data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "vote_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/dao/proposals/:proposalId/finalize", async (req, res) => {
    try {
      const data = await daoService.finalizeProposal(Number(req.params.proposalId));
      res.json({ ok: true, data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "finalize_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.post("/api/dao/proposals/:proposalId/execute", async (req, res) => {
    try {
      const data = await daoService.executeProposal(Number(req.params.proposalId));
      res.json({ ok: true, data });
    } catch (e) {
      const message = e instanceof Error ? e.message : "execute_failed";
      res.status(400).json({ ok: false, error: message });
    }
  });
  app.get("/api/dao/discovery", (_req, res) => {
    res.json({ ok: true, data: daoService.listDiscovery() });
  });
}

// server/dao/mount.ts
async function mountDao(app) {
  const store = new DaoStore(path14.join(process.cwd(), "data", "claw-dao.json"));
  await store.init();
  const service = new DaoService(store);
  await service.bootstrap();
  registerDaoRoutes(app, service);
  return { store, service };
}

// server/orchestration/registerSwarmApiRoutes.ts
import { z as z7 } from "zod";

// server/orchestration/ExecutionOrchestratorService.ts
import crypto20 from "crypto";
import { nanoid as nanoid12 } from "nanoid";
function sha256Hex3(value) {
  return crypto20.createHash("sha256").update(value).digest("hex");
}
function nowIso3() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function hashPayload2(payload) {
  return sha256Hex3(JSON.stringify(payload ?? {}));
}
var AGENT_ROLES = [
  "planner",
  "researcher",
  "operator",
  "critic",
  "support",
  "coordinator"
];
var ExecutionOrchestratorService = class {
  constructor(deps) {
    this.deps = deps;
  }
  log(requestId6, msg, ctx) {
    console.log(
      `[orchestrator][${requestId6}] ${msg}`,
      JSON.stringify({
        ...ctx,
        ts: nowIso3()
      })
    );
  }
  async runSwarmExecute(input) {
    const wallet = normalizeWalletAddress(input.wallet);
    const requestId6 = input.requestId;
    const executionId = `ex_${nanoid12(12)}`;
    const sourceTurnId = `turn_${nanoid12(10)}`;
    const chainId = Number(process.env.SOLANA_CHAIN_ID || 101);
    const errors = [];
    let degraded = false;
    const session = await this.deps.bridge.getSession(wallet);
    if (!session.isActive) {
      errors.push("wallet_session_inactive");
      degraded = true;
    }
    const orchestration = AGENT_ROLES.map((role) => ({
      role,
      label: role === "planner" ? "Decompose goal & bind skill context" : role === "researcher" ? "Gather constraints & precedents" : role === "operator" ? "Execute tool path" : role === "critic" ? "Validate output & policy" : role === "support" ? "Retry / fallback lane" : "Merge lanes & handoff",
      status: "pending"
    }));
    let status = "planning";
    const execution = {
      id: executionId,
      agentId: input.agentId,
      wallet,
      skillId: input.skillId,
      taskType: input.taskType || "swarm_orchestration",
      goal: input.goal,
      status,
      createdAt: nowIso3(),
      updatedAt: nowIso3(),
      metadata: {
        skillName: input.skillName ?? input.skillId,
        requestId: requestId6,
        sessionActive: session.isActive
      },
      orchestration
    };
    await this.deps.mirror.upsertExecution(execution);
    this.log(requestId6, "execution_created", { executionId, wallet, skillId: input.skillId });
    const receipts = [];
    const pushReceipt = async (r) => {
      receipts.push(r);
      await this.deps.mirror.appendReceipt(r);
    };
    const planId = `plan_${nanoid12(10)}`;
    let planReceiptId;
    try {
      orchestration[0].status = "active";
      orchestration[0].at = nowIso3();
      orchestration[0].detail = `Selected skill: ${input.skillName || input.skillId}`;
      if (this.deps.planReceiptService) {
        const steps = AGENT_ROLES.map((role, i) => ({
          id: `step_${role}_${i}`,
          index: i,
          title: `${role} phase`,
          description: orchestration[i].label,
          dependencies: i ? [`step_${AGENT_ROLES[i - 1]}_${i - 1}`] : [],
          chosenSkills: [input.skillId],
          status: "pending"
        }));
        const created = await this.deps.planReceiptService.create({
          planId,
          taskType: "research",
          title: `SWARM run: ${input.skillName || input.skillId}`,
          summary: input.goal.slice(0, 240),
          goal: input.goal,
          steps,
          chosenSkills: [{ id: input.skillId, name: input.skillName || input.skillId }],
          expectedOutcome: "Structured output with reflection and anchored receipt.",
          agentId: input.agentId,
          wallet,
          turnId: sourceTurnId,
          tags: ["swarm", "command-center"],
          metadata: { executionId, requestId: requestId6 },
          anchorOnCreate: true
        });
        planReceiptId = created.id;
        execution.planReceiptId = planReceiptId;
        execution.planId = planId;
        await this.deps.planReceiptService.execute({
          planId,
          worker: "operator_swarm",
          status: "success",
          finalResult: `Completed mission for skill ${input.skillId}: ${input.goal.slice(0, 120)}`,
          stepProgress: steps.map((s) => ({ stepId: s.id, status: "done" })),
          metadata: { executionId }
        });
      } else {
        const planHash = hashPayload2({ planId, goal: input.goal, skillId: input.skillId });
        const stepHash = hashPayload2({ steps: AGENT_ROLES });
        const planTx = await this.deps.bridge.sendInstruction({
          walletAddress: wallet,
          action: "create_plan_receipt",
          subjectId: planId,
          payloadHash: planHash,
          metadata: { goal: input.goal, skillId: input.skillId, stepCount: AGENT_ROLES.length }
        });
        planReceiptId = planTx.requestId;
        execution.planReceiptId = planReceiptId;
        execution.planId = planId;
        if (planTx.status === "failed") {
          errors.push(planTx.error || "plan_anchor_failed");
          degraded = true;
        }
        await pushReceipt({
          id: `rcpt_plan_${nanoid12(8)}`,
          type: "plan",
          subjectId: planId,
          subjectType: "plan_receipt",
          wallet,
          chainId,
          txSignature: planTx.txSignature,
          accountAddress: planTx.accountAddress,
          summaryHash: planHash,
          status: planTx.status === "failed" ? "failed" : "submitted",
          createdAt: nowIso3(),
          updatedAt: nowIso3(),
          explorerUrl: planTx.explorerTxUrl,
          metadata: { executionId, requestId: requestId6 }
        });
      }
      orchestration[0].status = "done";
      for (let i = 1; i < orchestration.length; i++) {
        orchestration[i].status = "done";
        orchestration[i].at = nowIso3();
        orchestration[i].detail = "Lane completed";
      }
      status = "running";
      execution.status = status;
      execution.updatedAt = nowIso3();
      await this.deps.mirror.upsertExecution(execution);
      this.log(requestId6, "plan_completed", { planId, planReceiptId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "plan_failed";
      errors.push(msg);
      degraded = true;
      status = "failed";
      execution.status = status;
      execution.updatedAt = nowIso3();
      await this.deps.mirror.upsertExecution(execution);
    }
    const outcome = status === "failed" ? "Execution halted during planning; reflection captures recovery path." : `Task succeeded using skill ${input.skillName || input.skillId}. Output verified by critic lane.`;
    execution.outcome = outcome;
    execution.status = status === "failed" ? "failed" : "succeeded";
    execution.updatedAt = nowIso3();
    await this.deps.mirror.upsertExecution(execution);
    let reflection;
    let memoryReflectionId;
    let memoryCanonical;
    try {
      const rootCause = status === "failed" ? "Planning or anchor path degraded while wallet session was inactive." : "Operator completed primary path; critic requested explicit lesson for chain continuity.";
      const corrective = status === "failed" ? "Refresh wallet session, retry with verified signer, and re-anchor plan receipt." : "Keep skill-scoped checklists and reuse this memory on the next turn.";
      const nextAction = status === "failed" ? "Reconnect wallet \u2192 re-run command center loop." : "Next turn: inject this reflection via /api/memory/injection-bundle.";
      const fullText = `Goal: ${input.goal}
Outcome: ${outcome}
${rootCause}
${corrective}
${nextAction}`;
      const created = await this.deps.memoryService.createReflection({
        agentId: input.agentId,
        conversationId: executionId,
        wallet,
        sourceTurnId,
        kind: status === "failed" ? "failure" : "lesson",
        title: `SWARM lesson \xB7 ${input.skillName || input.skillId}`,
        summary: corrective,
        fullText,
        rootCause,
        correctiveAdvice: corrective,
        nextAction,
        tags: ["swarm", "command-center", input.skillId]
      });
      memoryReflectionId = created.reflection.id;
      reflection = {
        id: created.reflection.id,
        agentId: input.agentId,
        skillId: input.skillId,
        sourceTurnId,
        rootCause,
        correctiveAdvice: corrective,
        nextAction,
        summary: corrective,
        fullText,
        createdAt: created.reflection.createdAt,
        updatedAt: created.reflection.updatedAt,
        offchainStorageRef: created.reflection.storageRef,
        status: "stored"
      };
      execution.reflectionId = reflection.id;
      execution.status = "reflected";
      execution.updatedAt = nowIso3();
      await this.deps.mirror.upsertExecution(execution);
      this.log(requestId6, "reflection_stored", { reflectionId: reflection.id });
      let anchorTxSig;
      let receiptAccount;
      try {
        const anchored = await this.deps.memoryService.anchorReflection(reflection.id, wallet);
        anchorTxSig = anchored.solanaTxSig;
        receiptAccount = anchored.solanaAccount;
        reflection.status = "anchored";
        reflection.onchainReceiptId = receiptAccount;
        reflection.proofHash = created.reflection.payloadHash;
      } catch (anchorErr) {
        const m = anchorErr instanceof Error ? anchorErr.message : "anchor_failed";
        errors.push(m);
        degraded = true;
        reflection.status = "degraded";
      }
      memoryCanonical = {
        id: `mem_${reflection.id}`,
        agentId: input.agentId,
        sourceTurnId,
        sourceExecutionId: executionId,
        kind: "reflection",
        title: reflection.summary,
        summary: reflection.summary,
        content: fullText,
        tags: ["reflection", "swarm"],
        storageRef: created.reflection.storageRef,
        checksum: created.reflection.payloadHash,
        proofReceiptId: receiptAccount,
        createdAt: reflection.createdAt,
        updatedAt: reflection.updatedAt
      };
      execution.memoryId = memoryCanonical.id;
      execution.status = "stored";
      execution.txSignature = anchorTxSig;
      execution.explorerUrl = anchorTxSig ? this.deps.bridge.buildExplorerUrl("tx", anchorTxSig) : void 0;
      execution.updatedAt = nowIso3();
      await this.deps.mirror.upsertExecution(execution);
      await pushReceipt({
        id: `rcpt_refl_${nanoid12(8)}`,
        type: "reflection",
        subjectId: reflection.id,
        subjectType: "reflection",
        wallet,
        chainId,
        txSignature: anchorTxSig,
        accountAddress: receiptAccount,
        storageRef: created.reflection.storageRef,
        summaryHash: created.reflection.payloadHash,
        status: anchorTxSig ? "submitted" : "degraded",
        createdAt: nowIso3(),
        updatedAt: nowIso3(),
        explorerUrl: anchorTxSig ? this.deps.bridge.buildExplorerUrl("tx", anchorTxSig) : void 0,
        metadata: { executionId, requestId: requestId6 }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "reflection_failed";
      errors.push(msg);
      degraded = true;
      execution.status = "degraded";
      execution.updatedAt = nowIso3();
      await this.deps.mirror.upsertExecution(execution);
    }
    try {
      const proofSubject = `${executionId}:${memoryReflectionId || "no_memory"}`;
      const proofHash = hashPayload2({
        executionId,
        reflectionId: memoryReflectionId,
        skillId: input.skillId,
        goal: input.goal
      });
      const proofTx = await this.deps.bridge.sendInstruction({
        walletAddress: wallet,
        action: "create_proof_receipt",
        subjectId: proofSubject,
        payloadHash: proofHash,
        receiptId: executionId,
        metadata: {
          executionId,
          reflectionId: memoryReflectionId,
          skillId: input.skillId
        }
      });
      execution.proofReceiptId = proofTx.requestId;
      if (proofTx.txSignature) {
        execution.txSignature = proofTx.txSignature;
        execution.explorerUrl = proofTx.explorerTxUrl;
      }
      execution.status = proofTx.status === "failed" ? "degraded" : "anchored";
      if (proofTx.status === "failed") {
        errors.push(proofTx.error || "proof_receipt_failed");
        degraded = true;
      } else {
        execution.status = "verified";
      }
      execution.updatedAt = nowIso3();
      await this.deps.mirror.upsertExecution(execution);
      await pushReceipt({
        id: `rcpt_proof_${nanoid12(8)}`,
        type: "proof",
        subjectId: proofSubject,
        subjectType: "execution_proof",
        wallet,
        chainId,
        txSignature: proofTx.txSignature,
        accountAddress: proofTx.accountAddress,
        summaryHash: proofHash,
        status: proofTx.status === "failed" ? "failed" : "submitted",
        createdAt: nowIso3(),
        updatedAt: nowIso3(),
        explorerUrl: proofTx.explorerTxUrl,
        metadata: { executionId, requestId: requestId6 }
      });
      this.log(requestId6, "proof_receipt", { tx: proofTx.txSignature });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "proof_failed";
      errors.push(msg);
      degraded = true;
      execution.status = "degraded";
      execution.updatedAt = nowIso3();
      await this.deps.mirror.upsertExecution(execution);
    }
    try {
      if (this.deps.identityService) {
        await this.deps.identityService.recordSkillUse(wallet, input.skillName || input.skillId);
      }
    } catch {
    }
    if (typeof input.userId === "number" && input.userId > 0) {
      try {
        const skills = new SkillRegistryService(input.userId);
        await skills.recordUsage({
          skillId: input.skillId,
          success: execution.status === "verified"
        });
      } catch {
      }
    }
    return {
      execution,
      reflection,
      memoryReflectionId,
      receipts,
      planReceiptId,
      planId,
      degraded,
      errors
    };
  }
};

// server/orchestration/swarmMirrorStore.ts
import { readFile, writeFile, mkdir } from "fs/promises";
import path15 from "path";
var emptySnapshot = () => ({
  version: 1,
  selectedSkillByWallet: {},
  executions: [],
  receipts: []
});
var SwarmMirrorStore = class {
  data = emptySnapshot();
  filePath;
  writeChain = Promise.resolve();
  constructor(filePath) {
    this.filePath = filePath || path15.join(process.cwd(), "data", "swarm-mirror.json");
  }
  async init() {
    await mkdir(path15.dirname(this.filePath), { recursive: true });
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed?.version === 1 && Array.isArray(parsed.executions)) {
        this.data = {
          ...emptySnapshot(),
          ...parsed,
          executions: parsed.executions,
          receipts: Array.isArray(parsed.receipts) ? parsed.receipts : [],
          selectedSkillByWallet: parsed.selectedSkillByWallet || {}
        };
      }
    } catch {
      this.data = emptySnapshot();
      await this.persist();
    }
  }
  persist() {
    this.writeChain = this.writeChain.then(
      () => writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf8")
    );
    return this.writeChain;
  }
  async setSelectedSkill(wallet, skillId) {
    this.data.selectedSkillByWallet[wallet] = {
      skillId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.persist();
  }
  getSelectedSkill(wallet) {
    return this.data.selectedSkillByWallet[wallet]?.skillId ?? null;
  }
  async upsertExecution(record) {
    const idx = this.data.executions.findIndex((e) => e.id === record.id);
    if (idx >= 0) this.data.executions[idx] = record;
    else this.data.executions.unshift(record);
    this.data.executions = this.data.executions.slice(0, 500);
    await this.persist();
  }
  getExecution(id) {
    return this.data.executions.find((e) => e.id === id) ?? null;
  }
  listExecutions(filter) {
    let rows = [...this.data.executions];
    if (filter?.wallet) rows = rows.filter((e) => e.wallet === filter.wallet);
    const limit = filter?.limit ?? 50;
    return rows.slice(0, limit);
  }
  async appendReceipt(record) {
    this.data.receipts.unshift(record);
    this.data.receipts = this.data.receipts.slice(0, 2e3);
    await this.persist();
  }
  listReceipts(filter) {
    let rows = [...this.data.receipts];
    if (filter?.wallet) rows = rows.filter((r) => r.wallet === filter.wallet);
    return rows.slice(0, filter?.limit ?? 100);
  }
};

// server/orchestration/registerSwarmApiRoutes.ts
function ok4(res, data) {
  res.json({ ok: true, data });
}
function fail5(res, error, status = 400) {
  const message = error instanceof Error ? error.message : "swarm_api_error";
  res.status(status).json({ ok: false, error: message });
}
function requestId5(req) {
  return String(req.headers["x-request-id"] || `req_${Date.now()}`);
}
function discoveryToSkillIdentity(row) {
  const total = row.successCount + row.failureCount;
  const successRate2 = total > 0 ? Number((row.successCount / total * 100).toFixed(2)) : 0;
  return {
    id: row.skillAddress || row.slug,
    name: row.name,
    description: `${row.category} \xB7 discovery rank ${row.discoveryScoreBps} bps`,
    tags: row.tags?.length ? row.tags : [row.category],
    version: `${row.versionCount}.0.0`,
    authorWallet: row.owner,
    contentHash: row.contentHash || row.skillAddress,
    status: "published",
    usageCount: row.usageCount,
    reputationScore: Number((row.trustScoreBps / 100).toFixed(2)),
    successRate: successRate2,
    lastUpdatedAt: new Date(row.updatedAt).toISOString(),
    currentVersionAccount: row.skillAddress,
    historyCount: row.versionCount,
    explorerUrl: void 0,
    storageRef: void 0
  };
}
var selectSkillBody = z7.object({
  walletAddress: z7.string().min(32)
});
var executeBody = z7.object({
  walletAddress: z7.string().min(32),
  goal: z7.string().min(4).max(8e3),
  skillId: z7.string().min(1),
  skillName: z7.string().optional(),
  agentId: z7.string().min(1).default("agent_swarm")
});
var demoBody = z7.object({
  walletAddress: z7.string().min(32).optional(),
  agentId: z7.string().default("agent_demo")
});
var memoryPostBody = z7.object({
  agentId: z7.string().min(1),
  wallet: z7.string().min(32).optional(),
  sourceTurnId: z7.string().min(1),
  kind: z7.enum(["success", "failure", "retry", "correction", "lesson"]).default("lesson"),
  title: z7.string().min(2),
  summary: z7.string().min(2),
  fullText: z7.string().min(4),
  rootCause: z7.string().min(2),
  correctiveAdvice: z7.string().min(2),
  nextAction: z7.string().min(2),
  tags: z7.array(z7.string()).optional(),
  autoAnchor: z7.boolean().default(true)
});
async function registerSwarmApiRoutes(app, deps) {
  const mirror = new SwarmMirrorStore();
  await mirror.init();
  const orchestrator = new ExecutionOrchestratorService({
    bridge: deps.bridge,
    memoryService: deps.memoryService,
    mirror,
    planReceiptService: deps.planReceiptService,
    identityService: deps.identityService
  });
  app.get("/api/health", (_req, res) => {
    ok4(res, {
      requestId: `health_${Date.now()}`,
      status: "ok",
      module: "swarm_orchestration",
      time: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/session", async (req, res) => {
    try {
      const walletAddress = String(req.query.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress_required");
      const normalized = normalizeWalletAddress(walletAddress);
      const [session, network] = await Promise.all([
        deps.bridge.getSession(normalized),
        deps.bridge.getNetwork()
      ]);
      ok4(res, {
        walletAddress: normalized,
        cluster: session.cluster,
        programId: session.programId,
        sessionActive: session.isActive,
        sessionVerified: session.isVerified,
        hasSignature: session.hasSignature,
        expiresAt: session.expiresAt,
        canPublish: session.isActive && session.isVerified,
        canAnchor: session.isActive,
        canRun: true,
        staleReason: session.isActive ? void 0 : "session_inactive_or_unsigned",
        network: {
          rpcUrl: network.rpcUrl,
          slot: network.slot,
          relayerWallet: network.relayerWallet
        }
      });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/solana/status", async (_req, res) => {
    try {
      const network = await deps.bridge.getNetwork();
      ok4(res, {
        cluster: network.cluster,
        programId: network.programId,
        rpcUrl: network.rpcUrl,
        slot: network.slot,
        epoch: network.epoch,
        commitment: network.commitment,
        relayerConfigured: Boolean(network.relayerWallet),
        relayerWallet: network.relayerWallet,
        healthy: true
      });
    } catch (error) {
      fail5(res, error, 500);
    }
  });
  app.get("/api/skills", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const rows = await deps.identityService.listDiscoverySkills({
        query: req.query.q ? String(req.query.q) : void 0,
        category: req.query.category ? String(req.query.category) : void 0,
        tag: req.query.tag ? String(req.query.tag) : void 0,
        minTrustBps: req.query.minTrustBps ? Number(req.query.minTrustBps) : void 0,
        minUsage: req.query.minUsage ? Number(req.query.minUsage) : void 0
      });
      let mapped = rows.map(discoveryToSkillIdentity);
      if (req.query.minReputation) {
        const min = Number(req.query.minReputation);
        mapped = mapped.filter((s) => s.reputationScore >= min);
      }
      const sort = req.query.sort;
      if (sort === "success_rate") mapped.sort((a, b) => b.successRate - a.successRate);
      else if (sort === "most_used") mapped.sort((a, b) => b.usageCount - a.usageCount);
      else mapped.sort((a, b) => b.reputationScore - a.reputationScore);
      ok4(res, { skills: mapped, total: mapped.length });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/skills/session/current", async (req, res) => {
    try {
      const walletAddress = String(req.query.walletAddress || "").trim();
      if (!walletAddress) throw new Error("walletAddress_required");
      const wallet = normalizeWalletAddress(walletAddress);
      const skillId = mirror.getSelectedSkill(wallet);
      ok4(res, { walletAddress: wallet, skillId });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/skills/:id", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const id = String(req.params.id);
      if (id === "session") {
        res.status(404).json({ ok: false, error: "skill_not_found" });
        return;
      }
      const rows = await deps.identityService.listDiscoverySkills();
      const row = rows.find((r) => r.skillAddress === id || r.slug === id || r.name === id);
      if (!row) {
        res.status(404).json({ ok: false, error: "skill_not_found" });
        return;
      }
      ok4(res, discoveryToSkillIdentity(row));
    } catch (error) {
      fail5(res, error);
    }
  });
  app.post("/api/skills/:id/select", async (req, res) => {
    try {
      const body = selectSkillBody.parse(req.body);
      const wallet = normalizeWalletAddress(body.walletAddress);
      const skillId = String(req.params.id);
      await mirror.setSelectedSkill(wallet, skillId);
      console.log(`[${requestId5(req)}] skill_selected`, wallet, skillId);
      ok4(res, { walletAddress: wallet, skillId, selectedAt: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.post("/api/execute/:id/reflect", async (req, res) => {
    try {
      const executionId = String(req.params.id);
      const body = z7.object({
        walletAddress: z7.string().min(32),
        rootCause: z7.string().min(2),
        correctiveAdvice: z7.string().min(2),
        nextAction: z7.string().min(2),
        agentId: z7.string().default("agent_swarm")
      }).parse(req.body);
      const wallet = normalizeWalletAddress(body.walletAddress);
      const execution = mirror.getExecution(executionId);
      const sourceTurnId = execution?.id || `turn_${Date.now()}`;
      const created = await deps.memoryService.createReflection({
        agentId: body.agentId,
        wallet,
        conversationId: executionId,
        sourceTurnId,
        kind: "lesson",
        title: `Reflection for ${executionId}`,
        summary: body.correctiveAdvice,
        fullText: `${body.rootCause}
${body.correctiveAdvice}
${body.nextAction}`,
        rootCause: body.rootCause,
        correctiveAdvice: body.correctiveAdvice,
        nextAction: body.nextAction,
        tags: ["manual", "reflect"]
      });
      const receipt = await deps.memoryService.anchorReflection(created.reflection.id, wallet);
      ok4(res, { executionId, reflection: created.reflection, receipt });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.post("/api/execute", async (req, res) => {
    try {
      const body = executeBody.parse(req.body);
      const wallet = normalizeWalletAddress(body.walletAddress);
      let userId = null;
      try {
        const user = await sdk.authenticateRequest(req);
        userId = user?.id ?? null;
      } catch {
        userId = null;
      }
      const result = await orchestrator.runSwarmExecute({
        wallet,
        goal: body.goal,
        skillId: body.skillId,
        skillName: body.skillName,
        agentId: body.agentId,
        userId,
        requestId: requestId5(req)
      });
      console.log(
        `[${requestId5(req)}] execute_complete`,
        result.execution.id,
        result.execution.status,
        result.errors.join(";")
      );
      res.status(result.degraded ? 207 : 200).json({ ok: !result.degraded || result.execution.status === "verified", data: result });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.post("/api/demo/story", async (req, res) => {
    try {
      const body = demoBody.parse(req.body ?? {});
      let wallet = body.walletAddress?.trim();
      if (!wallet) {
        wallet = process.env.SWARM_DEMO_WALLET || "";
      }
      if (!wallet || wallet.length < 32) {
        throw new Error("walletAddress_required_for_demo");
      }
      wallet = normalizeWalletAddress(wallet);
      const skills = deps.identityService ? await deps.identityService.listDiscoverySkills() : [];
      const first = skills[0];
      const skillId = first?.skillAddress || first?.slug || "skill_demo";
      const skillName = first?.name || "SWARM discovery skill";
      const result = await orchestrator.runSwarmExecute({
        wallet,
        goal: "Demo: full SWARM loop \u2014 discover, coordinate, reflect, anchor proof, compound reputation.",
        skillId,
        skillName,
        agentId: body.agentId,
        userId: null,
        requestId: requestId5(req)
      });
      res.status(200).json({ ok: true, data: result });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/memory", async (req, res) => {
    try {
      const agentId = req.query.agentId ? String(req.query.agentId) : void 0;
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : void 0;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const data = await deps.memoryService.listReflections({
        agentId,
        wallet,
        limit
      });
      ok4(res, data);
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/memory/:id", async (req, res) => {
    try {
      const data = await deps.memoryService.getReflection(String(req.params.id));
      ok4(res, data);
    } catch (error) {
      fail5(res, error, 404);
    }
  });
  app.post("/api/memory", async (req, res) => {
    try {
      const body = memoryPostBody.parse(req.body);
      const created = await deps.memoryService.createReflection({
        agentId: body.agentId,
        wallet: body.wallet,
        sourceTurnId: body.sourceTurnId,
        kind: body.kind,
        title: body.title,
        summary: body.summary,
        fullText: body.fullText,
        rootCause: body.rootCause,
        correctiveAdvice: body.correctiveAdvice,
        nextAction: body.nextAction,
        tags: body.tags
      });
      let receipt = null;
      if (body.autoAnchor && body.wallet) {
        receipt = await deps.memoryService.anchorReflection(created.reflection.id, body.wallet);
      }
      ok4(res, { reflection: created.reflection, receipt });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/receipts", async (req, res) => {
    try {
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : void 0;
      const mirrorReceipts = mirror.listReceipts({ wallet, limit: 100 });
      const chainAccounts = await deps.bridge.listMirrorAccounts({ wallet });
      ok4(res, {
        mirror: mirrorReceipts,
        chain: chainAccounts.slice(0, 50)
      });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/receipts/:id", async (req, res) => {
    try {
      const id = String(req.params.id);
      const fromBridge = await deps.bridge.getMirrorAccount(id);
      if (fromBridge) {
        ok4(res, fromBridge);
        return;
      }
      const fromMirror = mirror.listReceipts({ limit: 2e3 }).find((r) => r.id === id);
      if (fromMirror) {
        ok4(res, fromMirror);
        return;
      }
      res.status(404).json({ ok: false, error: "receipt_not_found" });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.post("/api/receipts", async (req, res) => {
    try {
      const body = z7.object({
        walletAddress: z7.string().min(32),
        type: z7.enum(["skill.publish", "skill.update", "plan", "execution", "reflection", "memory", "proof", "dao", "queue", "wallet"]),
        subjectId: z7.string().min(1),
        subjectType: z7.string().min(1),
        summaryHash: z7.string().min(32),
        metadata: z7.record(z7.string(), z7.unknown()).optional()
      }).parse(req.body);
      const wallet = normalizeWalletAddress(body.walletAddress);
      const record = {
        id: `rcpt_manual_${Date.now()}`,
        type: body.type,
        subjectId: body.subjectId,
        subjectType: body.subjectType,
        wallet,
        chainId: Number(process.env.SOLANA_CHAIN_ID || 101),
        summaryHash: body.summaryHash,
        status: "draft",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        metadata: body.metadata || {}
      };
      await mirror.appendReceipt(record);
      ok4(res, record);
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/proofs", async (req, res) => {
    try {
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : void 0;
      const accounts = await deps.bridge.listMirrorAccounts({
        wallet,
        kind: "proof_receipt"
      });
      ok4(res, accounts);
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/proofs/:id", async (req, res) => {
    try {
      const data = await deps.bridge.getMirrorAccount(String(req.params.id));
      if (!data) {
        res.status(404).json({ ok: false, error: "proof_not_found" });
        return;
      }
      ok4(res, data);
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/reputation", async (_req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const profiles = await deps.identityService.listDiscoveryProfiles();
      ok4(res, { profiles });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/reputation/:skillId", async (req, res) => {
    try {
      if (!deps.identityService) throw new Error("identity_service_unavailable");
      const skillId = String(req.params.skillId);
      const rows = await deps.identityService.listDiscoverySkills();
      const row = rows.find((r) => r.skillAddress === skillId || r.slug === skillId);
      if (!row) {
        res.status(404).json({ ok: false, error: "skill_not_found" });
        return;
      }
      ok4(res, {
        skill: discoveryToSkillIdentity(row),
        signals: {
          trustScoreBps: row.trustScoreBps,
          discoveryScoreBps: row.discoveryScoreBps,
          usageCount: row.usageCount,
          successCount: row.successCount,
          failureCount: row.failureCount
        }
      });
    } catch (error) {
      fail5(res, error);
    }
  });
  app.get("/api/history", async (req, res) => {
    try {
      const wallet = req.query.wallet ? normalizeWalletAddress(String(req.query.wallet)) : void 0;
      const limit = req.query.limit ? Number(req.query.limit) : 40;
      const [executions, bridgeHistory] = await Promise.all([
        Promise.resolve(mirror.listExecutions({ wallet, limit })),
        deps.bridge.listHistory({ wallet, limit })
      ]);
      ok4(res, { executions, bridgeHistory });
    } catch (error) {
      fail5(res, error);
    }
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  const { bridge } = await createSolanaBridge();
  const solana = await mountSolanaIdentity(app, { solanaBridge: bridge });
  const memory = await mountMemoryReceipts(app, {
    onchain: {
      createMemoryReceipt: async (input) => {
        const tx = await bridge.sendInstruction({
          walletAddress: input.wallet,
          action: "create_memory_receipt",
          subjectId: input.receiptId,
          payloadHash: input.reflectionHash,
          receiptId: input.receiptId,
          metadata: {
            summaryHash: input.summaryHash,
            nextActionHash: input.nextActionHash,
            storageRefHash: input.storageRefHash,
            sourceTurnIdHash: input.sourceTurnIdHash,
            parentReceiptIdHash: input.parentReceiptIdHash
          }
        });
        if (tx.status === "failed" || !tx.txSignature) {
          throw new Error(tx.error || "memory_anchor_bridge_failed");
        }
        return { txSig: tx.txSignature, receiptAccount: tx.accountAddress };
      }
    }
  });
  const plans = await mountPlanReceipts(app, { solanaIdentityService: solana.service, solanaBridge: bridge });
  registerZeroGRoutes(app);
  await mountDao(app);
  await mountNft(app);
  const openClawBridge = new OpenClawBridgeService();
  registerOpenClawBridgeRoutes(app, openClawBridge);
  await mountSolanaBridge(app, {
    bridge,
    identityService: solana.service,
    memoryService: memory.service,
    planReceiptService: plans.receiptService
  });
  await registerSwarmApiRoutes(app, {
    bridge,
    memoryService: memory.service,
    identityService: solana.service,
    planReceiptService: plans.receiptService
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      resolve();
    });
  });
  console.log(`Server running on http://localhost:${port}/`);
}
function logFatalStartupError(err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[startup] Server failed to start:", message);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
}
startServer().catch((err) => {
  logFatalStartupError(err);
  process.exitCode = 1;
});
