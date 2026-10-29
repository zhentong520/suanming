import { eq } from "drizzle-orm";
import { getDb, getSqlite } from "@/lib/db/client";
import { pointLedger, users, aiGlobalSettings, aiModuleSwitches } from "@/lib/db/schema";
import {
  costForKind,
  getBillingSettings,
  type BillingCostKind,
} from "./settings";

export class BillingError extends Error {
  constructor(
    message: string,
    public code:
      | "insufficient_points"
      | "user_disabled"
      | "user_not_found"
      | "billing"
      | "not_found"
      | "forbidden"
      | "unsupported"
      | "no_insights"
  ) {
    super(message);
    this.name = "BillingError";
  }
}

export interface PointsStatus {
  balance: number;
  unlimited: boolean;
  status: string;
  billingEnabled: boolean;
}

async function isModuleAiEnabledLocal(moduleId: string): Promise<boolean> {
  const db = getDb();
  const [global] = await db
    .select()
    .from(aiGlobalSettings)
    .where(eq(aiGlobalSettings.key, "global_ai_enabled"))
    .limit(1);
  if (global?.value !== "true") return false;
  const [sw] = await db
    .select()
    .from(aiModuleSwitches)
    .where(eq(aiModuleSwitches.moduleId, moduleId))
    .limit(1);
  return sw?.aiEnabled ?? false;
}

export async function getPointsStatus(userId: string): Promise<PointsStatus> {
  const db = getDb();
  const settings = await getBillingSettings();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return { balance: 0, unlimited: false, status: "missing", billingEnabled: settings.billingEnabled };
  }
  const unlimited = isPrivilegedAdmin(user);
  return {
    balance: user.pointsBalance ?? 0,
    unlimited,
    status: user.status ?? "active",
    billingEnabled: settings.billingEnabled,
  };
}

export async function assertUserActive(userId: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new BillingError("用户不存在", "user_not_found");
  // 前台管理员最高权限：不受停用约束
  if (user.role === "admin") return user;
  if ((user.status ?? "active") === "disabled") {
    throw new BillingError("账号已停用，请联系管理员", "user_disabled");
  }
  return user;
}

export function isPrivilegedAdmin(user: { role?: string | null }): boolean {
  return user.role === "admin";
}

/** Effective charge amount: 0 when billing off or privileged admin. */
export async function effectiveChargeAmount(
  userId: string,
  kind: BillingCostKind
): Promise<{ amount: number; billingEnabled: boolean; unlimited: boolean }> {
  const settings = await getBillingSettings();
  const status = await getPointsStatus(userId);
  if (!settings.billingEnabled || status.unlimited) {
    return { amount: 0, billingEnabled: settings.billingEnabled, unlimited: status.unlimited };
  }
  return {
    amount: costForKind(settings, kind),
    billingEnabled: true,
    unlimited: false,
  };
}

/** Estimate max cost kind before running a module. */
export async function estimateCostKind(opts: {
  moduleId: string;
  params?: Record<string, unknown>;
  skipAi?: boolean;
}): Promise<BillingCostKind> {
  const imageId = opts.params?.imageId;
  if ((opts.moduleId === "face" || opts.moduleId === "palm") && typeof imageId === "string" && imageId) {
    return "vision";
  }
  if (!opts.skipAi && (await isModuleAiEnabledLocal(opts.moduleId))) {
    return "ai";
  }
  return "calc";
}

export function resolveActualCostKind(opts: {
  moduleId: string;
  facts?: Record<string, unknown>;
  aiReport?: string | null;
}): BillingCostKind {
  if (
    (opts.moduleId === "face" || opts.moduleId === "palm") &&
    opts.facts?.source === "image"
  ) {
    return "vision";
  }
  if (opts.aiReport) return "ai";
  return "calc";
}

export async function assertCanSpend(userId: string, amount: number): Promise<PointsStatus> {
  const user = await assertUserActive(userId);
  const settings = await getBillingSettings();
  const unlimited = isPrivilegedAdmin(user);
  const status: PointsStatus = {
    balance: user.pointsBalance ?? 0,
    unlimited,
    status: user.status ?? "active",
    billingEnabled: settings.billingEnabled,
  };

  // 关闭收费：全员不校验余额、不扣分；管理员始终放行
  if (!settings.billingEnabled || unlimited || amount <= 0) return status;
  if (status.balance < amount) {
    throw new BillingError(
      `积分不足（需要 ${amount}，当前 ${status.balance}）。请充值后再测算。`,
      "insufficient_points"
    );
  }
  return status;
}

export async function grantPoints(opts: {
  userId: string;
  amount: number;
  reason: string;
  refType?: string;
  refId?: string;
  meta?: Record<string, unknown>;
}): Promise<{ balance: number }> {
  const amount = Math.floor(opts.amount);
  if (amount <= 0) throw new BillingError("赠送积分须为正数", "billing");

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, opts.userId)).limit(1);
  if (!user) throw new BillingError("用户不存在", "user_not_found");

  const balance = (user.pointsBalance ?? 0) + amount;
  const now = new Date().toISOString();
  await db.update(users).set({ pointsBalance: balance, updatedAt: now }).where(eq(users.id, opts.userId));
  await db.insert(pointLedger).values({
    id: crypto.randomUUID(),
    userId: opts.userId,
    delta: amount,
    balanceAfter: balance,
    reason: opts.reason,
    refType: opts.refType ?? null,
    refId: opts.refId ?? null,
    metaJson: opts.meta ? JSON.stringify(opts.meta) : null,
    createdAt: now,
  });
  return { balance };
}

/**
 * Atomically decrement balance when amount > 0 (WHERE balance >= amount).
 * Call only inside an open SQLite transaction when composing multi-step billing.
 */
export function spendPointsInTransaction(opts: {
  userId: string;
  amount: number;
  reason: string;
  refType?: string | null;
  refId?: string | null;
  meta?: Record<string, unknown> | null;
}): { spent: number; balance: number } {
  const amount = Math.max(0, Math.floor(opts.amount));
  const sqlite = getSqlite();
  const now = new Date().toISOString();

  if (amount <= 0) {
    const row = sqlite.prepare("SELECT points_balance FROM users WHERE id = ?").get(opts.userId) as
      | { points_balance: number }
      | undefined;
    if (!row) throw new BillingError("用户不存在", "user_not_found");
    return { spent: 0, balance: row.points_balance ?? 0 };
  }

  const upd = sqlite
    .prepare(
      `UPDATE users
       SET points_balance = points_balance - ?, updated_at = ?
       WHERE id = ? AND points_balance >= ?`
    )
    .run(amount, now, opts.userId, amount);

  if (upd.changes === 0) {
    const row = sqlite.prepare("SELECT points_balance FROM users WHERE id = ?").get(opts.userId) as
      | { points_balance: number }
      | undefined;
    if (!row) throw new BillingError("用户不存在", "user_not_found");
    throw new BillingError(
      `积分不足（需要 ${amount}，当前 ${row.points_balance ?? 0}）。请充值后再测算。`,
      "insufficient_points"
    );
  }

  const row = sqlite.prepare("SELECT points_balance FROM users WHERE id = ?").get(opts.userId) as {
    points_balance: number;
  };
  const balance = row.points_balance;
  sqlite
    .prepare(
      `INSERT INTO point_ledger
       (id, user_id, delta, balance_after, reason, ref_type, ref_id, meta_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      crypto.randomUUID(),
      opts.userId,
      -amount,
      balance,
      opts.reason,
      opts.refType ?? null,
      opts.refId ?? null,
      opts.meta ? JSON.stringify(opts.meta) : null,
      now
    );
  return { spent: amount, balance };
}

export async function spendPoints(opts: {
  userId: string;
  amount: number;
  reason: string;
  refType?: string;
  refId?: string;
  meta?: Record<string, unknown>;
}): Promise<{ spent: number; balance: number; unlimited: boolean; billingEnabled: boolean }> {
  const user = await assertUserActive(opts.userId);
  const settings = await getBillingSettings();
  const unlimited = isPrivilegedAdmin(user);
  const amount = Math.max(0, Math.floor(opts.amount));

  // 关闭收费或管理员：默认扣 0，不写扣减流水
  if (!settings.billingEnabled || unlimited || amount <= 0) {
    return {
      spent: 0,
      balance: user.pointsBalance ?? 0,
      unlimited,
      billingEnabled: settings.billingEnabled,
    };
  }

  const sqlite = getSqlite();
  const result = sqlite.transaction(() =>
    spendPointsInTransaction({
      userId: opts.userId,
      amount,
      reason: opts.reason,
      refType: opts.refType,
      refId: opts.refId,
      meta: opts.meta,
    })
  )();

  return { spent: result.spent, balance: result.balance, unlimited: false, billingEnabled: true };
}

export async function requireSpendable(userId: string, kind: BillingCostKind) {
  const charge = await effectiveChargeAmount(userId, kind);
  await assertCanSpend(userId, charge.amount);
  return {
    settings: await getBillingSettings(),
    amount: charge.amount,
    kind,
    billingEnabled: charge.billingEnabled,
    unlimited: charge.unlimited,
  };
}
