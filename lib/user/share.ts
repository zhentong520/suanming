/**
 * 报告公开分享：随机 token → 免登录只读页 /s/[token]，可撤销。
 * 一个报告同一时间只有一个有效 token（重复生成=旧 token 作废换新）。
 */
import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { reports, shareTokens } from "@/lib/db/schema";
import { getModuleDefinition } from "@/lib/hub/module-registry";

export interface SharedReportView {
  moduleName: string;
  templateReport: string;
  aiReport: string | null;
  createdAt: string;
}

export async function createShareToken(userId: string, reportId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
    .limit(1);
  if (!row) throw new Error("报告不存在或无权操作");

  // 旧 token 一律作废，换新（撤销语义由此实现）
  await db
    .update(shareTokens)
    .set({ revoked: true })
    .where(and(eq(shareTokens.reportId, reportId), eq(shareTokens.userId, userId)));

  const token = randomBytes(24).toString("base64url");
  await db.insert(shareTokens).values({
    id: crypto.randomUUID(),
    token,
    reportId,
    userId,
    revoked: false,
    createdAt: new Date().toISOString(),
  });
  return token;
}

export async function revokeShareToken(userId: string, reportId: string): Promise<void> {
  const db = getDb();
  await db
    .update(shareTokens)
    .set({ revoked: true })
    .where(and(eq(shareTokens.reportId, reportId), eq(shareTokens.userId, userId)));
}

export async function getShareTokenStatus(userId: string, reportId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ token: shareTokens.token })
    .from(shareTokens)
    .where(
      and(
        eq(shareTokens.reportId, reportId),
        eq(shareTokens.userId, userId),
        eq(shareTokens.revoked, false)
      )
    )
    .limit(1);
  return row?.token ?? null;
}

export async function getSharedReport(token: string): Promise<SharedReportView | null> {
  const db = getDb();
  const [row] = await db
    .select({
      moduleId: reports.moduleId,
      templateReport: reports.templateReport,
      aiReport: reports.aiReport,
      createdAt: reports.createdAt,
    })
    .from(shareTokens)
    .innerJoin(reports, eq(shareTokens.reportId, reports.id))
    .where(and(eq(shareTokens.token, token), eq(shareTokens.revoked, false)))
    .limit(1);
  if (!row) return null;
  const def = getModuleDefinition(row.moduleId);
  return {
    moduleName: def?.name ?? row.moduleId,
    templateReport: row.templateReport,
    aiReport: row.aiReport ?? null,
    createdAt: row.createdAt,
  };
}
