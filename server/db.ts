import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  solanaSessions,
  agents,
  clawSkills,
  onchainReceipts,
  activityLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
      values.role = 'admin';
      updateSet.role = 'admin';
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Solana Session Helpers
export async function createSolanaSession(
  userId: number,
  walletAddress: string,
  nonce: string,
  expiresAt: Date
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
  description?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(agents).values({ userId, name, role, description });
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
  description?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(clawSkills).values({ userId, name, description });
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
  transactionHash?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(onchainReceipts).values({
    userId,
    agentId,
    receiptType: receiptType as any,
    content,
    transactionHash,
  });
}

export async function getReceiptsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onchainReceipts).where(eq(onchainReceipts.userId, userId));
}

// Activity Log Helpers
export async function logActivity(
  userId: number,
  eventType: string,
  description: string,
  agentId?: number,
  metadata?: string
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
    .limit(limit);
}
