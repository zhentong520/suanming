import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { reports, userOperations, users } from "@/lib/db/schema";
import { actionLabel, CALC_ACTIONS, isCalcAction, moduleNameZh } from "./labels";

export type OpsCategory = "all" | "calc" | "non_calc";

function parseMeta(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function listAdminOperations(opts: {
  category?: OpsCategory;
  limit?: number;
  offset?: number;
}) {
  const category = opts.category ?? "all";
  const limit = Math.min(200, Math.max(1, opts.limit ?? 50));
  const offset = Math.max(0, opts.offset ?? 0);
  const db = getDb();

  const calcList = [...CALC_ACTIONS];
  const where =
    category === "calc"
      ? inArray(userOperations.action, calcList)
      : category === "non_calc"
        ? notInArray(userOperations.action, calcList)
        : undefined;

  const rows = await db
    .select({
      id: userOperations.id,
      userId: userOperations.userId,
      action: userOperations.action,
      moduleId: userOperations.moduleId,
      profileId: userOperations.profileId,
      metadataJson: userOperations.metadataJson,
      createdAt: userOperations.createdAt,
      email: users.email,
      phone: users.phone,
      displayName: users.displayName,
    })
    .from(userOperations)
    .leftJoin(users, eq(userOperations.userId, users.id))
    .where(where)
    .orderBy(desc(userOperations.createdAt))
    .limit(limit)
    .offset(offset);

  const reportIds = new Set<string>();
  for (const row of rows) {
    const meta = parseMeta(row.metadataJson);
    if (typeof meta.reportId === "string") reportIds.add(meta.reportId);
  }

  const aiByReport = new Map<string, boolean>();
  if (reportIds.size > 0) {
    const reportRows = await db
      .select({ id: reports.id, aiReport: reports.aiReport })
      .from(reports)
      .where(inArray(reports.id, [...reportIds]));
    for (const r of reportRows) {
      aiByReport.set(r.id, Boolean(r.aiReport));
    }
  }

  const items = rows.map((row) => {
    const meta = parseMeta(row.metadataJson);
    const reportId = typeof meta.reportId === "string" ? meta.reportId : null;
    const usedAiFromMeta = meta.usedAi === true;
    const usedAiFromAction = row.action === "ai_enhance" || row.action === "ai_vision" || row.action === "ai_interpret";
    const usedAiFromReport = reportId ? aiByReport.get(reportId) === true : false;
    const usedAi = usedAiFromMeta || usedAiFromAction || usedAiFromReport;
    const account = row.email || row.phone || row.displayName || row.userId.slice(0, 8);

    return {
      id: row.id,
      userId: row.userId,
      account,
      action: row.action,
      actionLabel: actionLabel(row.action),
      category: isCalcAction(row.action) ? ("calc" as const) : ("non_calc" as const),
      categoryLabel: isCalcAction(row.action) ? "测算" : "非测算",
      moduleId: row.moduleId,
      moduleName: moduleNameZh(row.moduleId),
      profileId: row.profileId,
      reportId,
      usedAi,
      pointsSpent:
        typeof meta.pointsSpent === "number"
          ? meta.pointsSpent
          : typeof meta.pointsSpent === "string" && meta.pointsSpent !== ""
            ? Number(meta.pointsSpent)
            : null,
      createdAt: row.createdAt,
    };
  });

  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(userOperations)
    .where(where);
  const [{ count }] = await countQuery;

  return {
    total: Number(count) || 0,
    limit,
    offset,
    items,
  };
}
