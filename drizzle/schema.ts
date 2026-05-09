import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

const skillStatusValues = [
  "draft",
  "published",
  "active",
  "paused",
  "deprecated",
  "archived",
] as const;

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Solana Session Management
export const solanaSessions = mysqlTable("solana_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  walletAddress: varchar("wallet_address", { length: 64 }).notNull().unique(),
  nonce: varchar("nonce", { length: 128 }).notNull(),
  signature: text("signature"),
  isVerified: int("is_verified").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Agent Registry
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "paused"]).default(
    "inactive",
  ),
  description: text("description"),
  onchainAddress: varchar("onchain_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// CLAW Skills Registry
export const clawSkills = mysqlTable("claw_skills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  skillUid: varchar("skill_uid", { length: 64 }),
  programId: varchar("program_id", { length: 128 }).default(
    "CLAW_SKILL_PROGRAM_V1",
  ),
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
  syncState: mysqlEnum("sync_state", ["ok", "degraded", "offline"])
    .default("ok")
    .notNull(),
  openClawCompatible: int("openclaw_compatible").default(0),
  manifestUrl: text("manifest_url"),
  onchainMetadata: text("onchain_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const clawSkillVersions = mysqlTable("claw_skill_versions", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// On-Chain Receipts
export const onchainReceipts = mysqlTable("onchain_receipts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id"),
  receiptType: mysqlEnum("receipt_type", [
    "plan",
    "execution",
    "reflection",
    "memory",
    "decision",
  ]),
  content: text("content"),
  autonomyLevel: mysqlEnum("autonomy_level", [
    "automation_only",
    "assisted",
    "guided",
    "policy_gated",
    "meaningful_agency",
    "near_autonomous",
    "fully_autonomous",
  ]),
  policyStatus: mysqlEnum("policy_status", [
    "not_required",
    "approved",
    "blocked",
    "overridden",
    "needs_review",
  ]),
  proofType: mysqlEnum("proof_type", [
    "plan",
    "decision",
    "execution",
    "reflection",
    "memory",
  ]),
  proofHash: varchar("proof_hash", { length: 128 }),
  referenceId: varchar("reference_id", { length: 128 }),
  transactionHash: varchar("transaction_hash", { length: 128 }),
  onchainAddress: varchar("onchain_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const autonomyConfigs = mysqlTable("autonomy_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  mode: mysqlEnum("mode", ["automation", "meaningful_agency", "full_autonomy"])
    .default("meaningful_agency")
    .notNull(),
  level: mysqlEnum("level", [
    "automation_only",
    "assisted",
    "guided",
    "policy_gated",
    "meaningful_agency",
    "near_autonomous",
    "fully_autonomous",
  ])
    .default("meaningful_agency")
    .notNull(),
  preferences: text("preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const autonomyRunSummaries = mysqlTable("autonomy_run_summaries", {
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
    "fully_autonomous",
  ]).notNull(),
  score: int("score").notNull(),
  trend: mysqlEnum("trend", ["rising", "stable", "falling"])
    .default("stable")
    .notNull(),
  status: mysqlEnum("status", [
    "queued",
    "running",
    "blocked",
    "completed",
    "failed",
  ])
    .default("queued")
    .notNull(),
  policyStatus: mysqlEnum("policy_status", [
    "not_required",
    "approved",
    "blocked",
    "overridden",
    "needs_review",
  ]).default("not_required"),
  humanInterventionRate: int("human_intervention_rate").default(0).notNull(),
  proofCompleteness: int("proof_completeness").default(0).notNull(),
  confidenceAvg: int("confidence_avg").default(0).notNull(),
  memoryInfluenceAvg: int("memory_influence_avg").default(0).notNull(),
  reflectionReuseRate: int("reflection_reuse_rate").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const agentDecisionRecords = mysqlTable("agent_decision_records", {
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
    "proof_anchor_strategy",
  ]).notNull(),
  autonomyLevel: mysqlEnum("autonomy_level", [
    "automation_only",
    "assisted",
    "guided",
    "policy_gated",
    "meaningful_agency",
    "near_autonomous",
    "fully_autonomous",
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
    "needs_review",
  ])
    .default("not_required")
    .notNull(),
  humanOverride: int("human_override").default(0).notNull(),
  memoryUsed: text("memory_used"),
  proofReceiptId: varchar("proof_receipt_id", { length: 128 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const decisionNarratives = mysqlTable("decision_narratives", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const policyGateEvents = mysqlTable("policy_gate_events", {
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
    "auto_allowed",
  ]).notNull(),
  reason: text("reason").notNull(),
  policyId: varchar("policy_id", { length: 128 }),
  policyName: varchar("policy_name", { length: 128 }),
  riskLevel: mysqlEnum("risk_level", [
    "low",
    "medium",
    "high",
    "critical",
  ]).notNull(),
  requiredAction: mysqlEnum("required_action", [
    "none",
    "confirm",
    "sign",
    "review",
    "adjust_plan",
  ])
    .default("none")
    .notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memoryUsageRecords = mysqlTable("memory_usage_records", {
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
    "proof_strategy",
  ]).notNull(),
  influence: int("influence").notNull(),
  result: mysqlEnum("result", ["ignored", "used", "critical"]).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reflectionRecords = mysqlTable("reflection_records", {
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
    "fully_autonomous",
  ]).notNull(),
  rootCause: text("root_cause").notNull(),
  correctiveAction: text("corrective_action").notNull(),
  nextAction: text("next_action").notNull(),
  neededHumanInput: int("needed_human_input").default(0).notNull(),
  blockedByPolicy: int("blocked_by_policy").default(0).notNull(),
  improvedLaterRuns: int("improved_later_runs").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity Feed
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id"),
  eventType: varchar("event_type", { length: 128 }).notNull(),
  description: text("description"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type SolanaSession = typeof solanaSessions.$inferSelect;
export type InsertSolanaSession = typeof solanaSessions.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
export type ClawSkill = typeof clawSkills.$inferSelect;
export type InsertClawSkill = typeof clawSkills.$inferInsert;
export type ClawSkillVersion = typeof clawSkillVersions.$inferSelect;
export type InsertClawSkillVersion = typeof clawSkillVersions.$inferInsert;
export type OnchainReceipt = typeof onchainReceipts.$inferSelect;
export type InsertOnchainReceipt = typeof onchainReceipts.$inferInsert;
export type AutonomyConfig = typeof autonomyConfigs.$inferSelect;
export type InsertAutonomyConfig = typeof autonomyConfigs.$inferInsert;
export type AutonomyRunSummary = typeof autonomyRunSummaries.$inferSelect;
export type InsertAutonomyRunSummary = typeof autonomyRunSummaries.$inferInsert;
export type AgentDecisionRecordRow = typeof agentDecisionRecords.$inferSelect;
export type InsertAgentDecisionRecordRow =
  typeof agentDecisionRecords.$inferInsert;
export type DecisionNarrativeRow = typeof decisionNarratives.$inferSelect;
export type InsertDecisionNarrativeRow = typeof decisionNarratives.$inferInsert;
export type PolicyGateEvent = typeof policyGateEvents.$inferSelect;
export type InsertPolicyGateEvent = typeof policyGateEvents.$inferInsert;
export type MemoryUsageRecordRow = typeof memoryUsageRecords.$inferSelect;
export type InsertMemoryUsageRecordRow = typeof memoryUsageRecords.$inferInsert;
export type ReflectionRecordRow = typeof reflectionRecords.$inferSelect;
export type InsertReflectionRecordRow = typeof reflectionRecords.$inferInsert;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type InsertActivityLogEntry = typeof activityLog.$inferInsert;
