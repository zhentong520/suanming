import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getVolcEnvConfig } from "./volc-models";

export interface AiQuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  allowed: boolean;
}

function unlimitedEmails(): Set<string> {
  const raw = process.env.AI_UNLIMITED_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

function unlimitedUserIds(): Set<string> {
  const raw = process.env.AI_UNLIMITED_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export async function getAiQuotaStatus(userId: string): Promise<AiQuotaStatus> {
  const { userQuota } = getVolcEnvConfig();
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return { used: 0, limit: userQuota, remaining: 0, unlimited: false, allowed: false };
  }

  const unlimited =
    user.role === "admin" ||
    unlimitedUserIds().has(user.id) ||
    (user.email ? unlimitedEmails().has(user.email.toLowerCase()) : false);

  const used = user.aiQuotaUsed ?? 0;
  if (unlimited) {
    return { used, limit: userQuota, remaining: Number.POSITIVE_INFINITY, unlimited: true, allowed: true };
  }

  const remaining = Math.max(0, userQuota - used);
  return {
    used,
    limit: userQuota,
    remaining,
    unlimited: false,
    allowed: remaining > 0,
  };
}

/** Reserve one AI call. Returns null if blocked. Unlimited admins do not increment. */
export async function consumeAiQuota(userId: string): Promise<AiQuotaStatus | null> {
  const status = await getAiQuotaStatus(userId);
  if (!status.allowed) return null;
  if (status.unlimited) return status;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  await db
    .update(users)
    .set({
      aiQuotaUsed: (user.aiQuotaUsed ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId));

  return getAiQuotaStatus(userId);
}

export async function ensureAdminRoleByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  if (user && user.role !== "admin") {
    await db
      .update(users)
      .set({ role: "admin", updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id));
  }
}
