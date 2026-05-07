import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  status: mysqlEnum("status", ["active", "inactive", "paused"]).default("inactive"),
  description: text("description"),
  onchainAddress: varchar("onchain_address", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// CLAW Skills Registry
export const clawSkills = mysqlTable("claw_skills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  openClawCompatible: int("openclaw_compatible").default(0),
  manifestUrl: text("manifest_url"),
  onchainMetadata: text("onchain_metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// On-Chain Receipts
export const onchainReceipts = mysqlTable("onchain_receipts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id"),
  receiptType: mysqlEnum("receipt_type", ["plan", "execution", "reflection", "memory"]),
  content: text("content"),
  transactionHash: varchar("transaction_hash", { length: 128 }),
  onchainAddress: varchar("onchain_address", { length: 64 }),
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
export type OnchainReceipt = typeof onchainReceipts.$inferSelect;
export type InsertOnchainReceipt = typeof onchainReceipts.$inferInsert;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type InsertActivityLogEntry = typeof activityLog.$inferInsert;