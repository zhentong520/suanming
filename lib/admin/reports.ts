import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { profiles, reports, users } from "@/lib/db/schema";
import { getModuleDefinition } from "@/lib/hub/module-registry";
import type { AdminInsights } from "@/lib/engine/bazi/admin-insights";

export async function getAdminReport(reportId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: reports.id,
      moduleId: reports.moduleId,
      userId: reports.userId,
      profileId: reports.profileId,
      factsJson: reports.factsJson,
      templateReport: reports.templateReport,
      aiReport: reports.aiReport,
      pointsSpent: reports.pointsSpent,
      createdAt: reports.createdAt,
      profileName: profiles.name,
      email: users.email,
      phone: users.phone,
      displayName: users.displayName,
    })
    .from(reports)
    .leftJoin(profiles, eq(reports.profileId, profiles.id))
    .leftJoin(users, eq(reports.userId, users.id))
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!row) return null;

  const facts = JSON.parse(row.factsJson) as Record<string, unknown>;
  const adminInsights = (facts.adminInsights as AdminInsights | undefined) ?? null;
  const def = getModuleDefinition(row.moduleId);

  return {
    id: row.id,
    moduleId: row.moduleId,
    moduleName: def?.name ?? row.moduleId,
    userId: row.userId,
    account: row.email || row.phone || row.displayName || row.userId?.slice(0, 8) || "—",
    profileId: row.profileId,
    profileName: row.profileName,
    pointsSpent: row.pointsSpent,
    createdAt: row.createdAt,
    templateReport: row.templateReport,
    aiReport: row.aiReport,
    adminInsights,
    hasAdminInsights: Boolean(adminInsights),
  };
}
