import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { pointLedger, users } from "@/lib/db/schema";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";

async function requireAdmin(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const url = new URL(request.url);
  const userId = (url.searchParams.get("userId") ?? "").trim();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);

  const db = getDb();
  const where = userId ? eq(pointLedger.userId, userId) : undefined;

  const rows = await db
    .select({
      id: pointLedger.id,
      userId: pointLedger.userId,
      delta: pointLedger.delta,
      balanceAfter: pointLedger.balanceAfter,
      reason: pointLedger.reason,
      refType: pointLedger.refType,
      refId: pointLedger.refId,
      createdAt: pointLedger.createdAt,
      email: users.email,
      phone: users.phone,
      displayName: users.displayName,
    })
    .from(pointLedger)
    .leftJoin(users, eq(pointLedger.userId, users.id))
    .where(where)
    .orderBy(desc(pointLedger.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pointLedger)
    .where(where);

  return NextResponse.json({
    total: Number(count) || 0,
    limit,
    offset,
    items: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      account: r.email || r.phone || r.displayName || r.userId.slice(0, 8),
      delta: r.delta,
      balanceAfter: r.balanceAfter,
      reason: r.reason,
      refType: r.refType,
      refId: r.refId,
      createdAt: r.createdAt,
    })),
  });
}
