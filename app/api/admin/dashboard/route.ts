import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { moduleStats, userOperations } from "@/lib/db/schema";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";
import { reconcileTodayCounts, shanghaiDateKey } from "@/lib/admin/module-stats";
import { getModuleDefinition } from "@/lib/hub/module-registry";

export async function GET(request: Request) {
  await ensureSeeded();
  const token = getTokenFromRequest(request);
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  await reconcileTodayCounts();

  const db = getDb();
  const stats = await db.select().from(moduleStats);
  const totalCalls = stats.reduce((a, s) => a + s.callCount, 0);
  const todayCalls = stats.reduce((a, s) => a + s.todayCount, 0);

  const ranked = [...stats]
    .filter((s) => s.callCount > 0)
    .sort((a, b) => b.callCount - a.callCount)
    .map((s) => ({
      moduleId: s.moduleId,
      moduleName: getModuleDefinition(s.moduleId)?.name ?? s.moduleId,
      callCount: s.callCount,
      todayCount: s.todayCount,
      lastCalledAt: s.lastCalledAt,
    }));

  const days = 14;
  // 聚合下推 SQL：按上海时区分天计数，避免全量拉行到 JS；不再 LIMIT 截断漏计
  const day13 = shanghaiDateKey(new Date(Date.now() - 13 * 86_400_000));
  const cutoffIso = new Date(`${day13}T00:00:00+08:00`).toISOString();
  const dayExpr = sql<string>`substr(datetime(${userOperations.createdAt}, '+8 hours'), 1, 10)`;
  const grouped = await db
    .select({ day: dayExpr.as("day"), count: sql<number>`count(*)`.as("count") })
    .from(userOperations)
    .where(and(eq(userOperations.action, "module_calc"), gte(userOperations.createdAt, cutoffIso)))
    .groupBy(dayExpr);

  const dayMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(shanghaiDateKey(d), 0);
  }
  for (const row of grouped) {
    if (dayMap.has(row.day)) {
      dayMap.set(row.day, dayMap.get(row.day)! + Number(row.count));
    }
  }
  const dailyTrend = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    stats: ranked,
    totalCalls,
    todayCalls,
    dailyTrend,
    timezone: "Asia/Shanghai",
    todayKey: shanghaiDateKey(),
  });
}
