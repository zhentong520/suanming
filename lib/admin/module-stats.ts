import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { moduleStats } from "@/lib/db/schema";

/** YYYY-MM-DD in Asia/Shanghai */
export function shanghaiDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function isSameShanghaiDay(iso: string | null | undefined, todayKey: string): boolean {
  if (!iso) return false;
  try {
    return shanghaiDateKey(new Date(iso)) === todayKey;
  } catch {
    return false;
  }
}

/** Increment totals; reset todayCount when crossing Shanghai midnight. */
export async function incrementModuleStats(moduleId: string) {
  const db = getDb();
  const now = new Date();
  const todayKey = shanghaiDateKey(now);
  const [stat] = await db.select().from(moduleStats).where(eq(moduleStats.moduleId, moduleId)).limit(1);
  if (!stat) return;

  const sameDay = isSameShanghaiDay(stat.lastCalledAt, todayKey);
  await db
    .update(moduleStats)
    .set({
      callCount: stat.callCount + 1,
      todayCount: sameDay ? stat.todayCount + 1 : 1,
      lastCalledAt: now.toISOString(),
    })
    .where(eq(moduleStats.moduleId, moduleId));
}

/** Before reading dashboard, zero out todayCount for modules last called on a previous day. */
export async function reconcileTodayCounts() {
  const db = getDb();
  const todayKey = shanghaiDateKey();
  const stats = await db.select().from(moduleStats);
  for (const stat of stats) {
    if (stat.todayCount > 0 && !isSameShanghaiDay(stat.lastCalledAt, todayKey)) {
      await db
        .update(moduleStats)
        .set({ todayCount: 0 })
        .where(eq(moduleStats.moduleId, stat.moduleId));
    }
  }
}
