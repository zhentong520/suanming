import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
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
  const ops = await db
    .select({
      action: userOperations.action,
      createdAt: userOperations.createdAt,
    })
    .from(userOperations)
    .where(eq(userOperations.action, "module_calc"))
    .orderBy(desc(userOperations.createdAt))
    .limit(5000);

  const dayMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayMap.set(shanghaiDateKey(d), 0);
  }
  for (const op of ops) {
    const key = shanghaiDateKey(new Date(op.createdAt));
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
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
