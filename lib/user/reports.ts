import { and, desc, eq } from "drizzle-orm";
import { getDb, getSqlite } from "@/lib/db/client";
import { reports, users, profiles } from "@/lib/db/schema";
import { getModuleDefinition } from "@/lib/hub/module-registry";
import { stripAdminInsights, type AdminInsights } from "@/lib/engine/bazi/admin-insights";
import { getBillingSettings, costForKind } from "@/lib/billing/settings";
import {
  assertCanSpend,
  assertUserActive,
  BillingError,
  effectiveChargeAmount,
  isPrivilegedAdmin,
  spendPointsInTransaction,
} from "@/lib/billing/points";

const INSIGHT_MODULES = new Set(["bazi", "bazi-dayun", "face", "palm"]);

export async function listUserReports(userId: string, limit = 50) {
  const db = getDb();
  const rows = await db
    .select({
      id: reports.id,
      moduleId: reports.moduleId,
      profileId: reports.profileId,
      templateReport: reports.templateReport,
      aiReport: reports.aiReport,
      createdAt: reports.createdAt,
      profileName: profiles.name,
    })
    .from(reports)
    .leftJoin(profiles, eq(reports.profileId, profiles.id))
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const def = getModuleDefinition(r.moduleId);
    const snippet = r.templateReport.replace(/【.+?】/g, "").trim().slice(0, 80);
    return {
      id: r.id,
      moduleId: r.moduleId,
      moduleName: def?.name ?? r.moduleId,
      profileId: r.profileId,
      profileName: r.profileName,
      hasAi: Boolean(r.aiReport),
      snippet,
      createdAt: r.createdAt,
    };
  });
}

function extractAdminInsights(facts: Record<string, unknown>): AdminInsights | null {
  const raw = facts.adminInsights;
  if (!raw || typeof raw !== "object") return null;
  return raw as AdminInsights;
}

export async function getUserReport(userId: string, reportId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: reports.id,
      moduleId: reports.moduleId,
      profileId: reports.profileId,
      factsJson: reports.factsJson,
      templateReport: reports.templateReport,
      aiReport: reports.aiReport,
      lifeInsightsUnlocked: reports.lifeInsightsUnlocked,
      createdAt: reports.createdAt,
      profileName: profiles.name,
      allowLifeInsights: users.allowLifeInsights,
    })
    .from(reports)
    .leftJoin(profiles, eq(reports.profileId, profiles.id))
    .innerJoin(users, eq(reports.userId, users.id))
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
    .limit(1);

  if (!row) return null;

  const def = getModuleDefinition(row.moduleId);
  const factsRaw = JSON.parse(row.factsJson) as Record<string, unknown>;
  const insights = extractAdminInsights(factsRaw);
  const hasInsightsPayload = Boolean(insights) && INSIGHT_MODULES.has(row.moduleId);
  const unlocked = Boolean(row.lifeInsightsUnlocked);
  const allow = Boolean(row.allowLifeInsights);
  const billing = await getBillingSettings();
  const unlockCost = costForKind(billing, "life_insights");

  return {
    id: row.id,
    moduleId: row.moduleId,
    moduleName: def?.name ?? row.moduleId,
    modulePath: def?.path ?? `/${row.moduleId}`,
    profileId: row.profileId,
    profileName: row.profileName,
    facts: stripAdminInsights(factsRaw),
    templateReport: row.templateReport,
    aiReport: row.aiReport ?? undefined,
    createdAt: row.createdAt,
    lifeInsights: unlocked && insights ? insights : undefined,
    lifeInsightsMeta: {
      available: hasInsightsPayload,
      unlocked,
      canUnlock: hasInsightsPayload && allow && !unlocked,
      allowLifeInsights: allow,
      unlockCost,
      billingEnabled: billing.billingEnabled,
    },
  };
}

export async function unlockLifeInsights(userId: string, reportId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: reports.id,
      moduleId: reports.moduleId,
      factsJson: reports.factsJson,
      lifeInsightsUnlocked: reports.lifeInsightsUnlocked,
      allowLifeInsights: users.allowLifeInsights,
    })
    .from(reports)
    .innerJoin(users, eq(reports.userId, users.id))
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
    .limit(1);

  if (!row) {
    throw new BillingError("报告不存在或无权查看", "not_found");
  }
  if (!row.allowLifeInsights) {
    throw new BillingError("管理员尚未开放您的人生洞察权限", "forbidden");
  }
  if (!INSIGHT_MODULES.has(row.moduleId)) {
    throw new BillingError("该模块不支持人生洞察", "unsupported");
  }

  const factsRaw = JSON.parse(row.factsJson) as Record<string, unknown>;
  const insights = extractAdminInsights(factsRaw);
  if (!insights) {
    throw new BillingError("本报告暂无人生洞察数据，请重新测算后再试", "no_insights");
  }

  if (row.lifeInsightsUnlocked) {
    return { alreadyUnlocked: true as const, lifeInsights: insights, spent: 0, balance: null as number | null };
  }

  const user = await assertUserActive(userId);
  const charge = await effectiveChargeAmount(userId, "life_insights");
  const amount = !charge.billingEnabled || isPrivilegedAdmin(user) ? 0 : charge.amount;
  if (amount > 0) {
    await assertCanSpend(userId, amount);
  }

  const sqlite = getSqlite();
  const result = sqlite.transaction(() => {
    // CAS unlock — concurrent second caller gets alreadyUnlocked and does not spend
    const cas = sqlite
      .prepare(
        `UPDATE reports SET life_insights_unlocked = 1
         WHERE id = ? AND user_id = ? AND life_insights_unlocked = 0`
      )
      .run(reportId, userId);

    if (cas.changes === 0) {
      const bal = sqlite.prepare("SELECT points_balance FROM users WHERE id = ?").get(userId) as
        | { points_balance: number }
        | undefined;
      return {
        alreadyUnlocked: true as const,
        spent: 0,
        balance: bal?.points_balance ?? null,
      };
    }

    // Spend after CAS; failure rolls back unlock via transaction
    const spent = spendPointsInTransaction({
      userId,
      amount,
      reason: "life_insights_unlock",
      refType: "report",
      refId: reportId,
      meta: { moduleId: row.moduleId },
    });

    return {
      alreadyUnlocked: false as const,
      spent: spent.spent,
      balance: spent.balance,
    };
  })();

  return {
    alreadyUnlocked: result.alreadyUnlocked,
    lifeInsights: insights,
    spent: result.spent,
    balance: result.balance,
  };
}
