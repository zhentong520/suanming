import { NextResponse } from "next/server";
import { desc, eq, like, or, sql } from "drizzle-orm";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";
import { BillingError, grantPoints } from "@/lib/billing/points";

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
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);

  const db = getDb();
  const where = q
    ? or(
        like(users.email, `%${q}%`),
        like(users.phone, `%${q}%`),
        like(users.displayName, `%${q}%`)
      )
    : undefined;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      displayName: users.displayName,
      role: users.role,
      status: users.status,
      pointsBalance: users.pointsBalance,
      allowLifeInsights: users.allowLifeInsights,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(where);

  return NextResponse.json({
    total: Number(count) || 0,
    limit,
    offset,
    items: rows,
  });
}

export async function PUT(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await request.json();
  const userId = String(body.userId ?? "").trim();
  if (!userId) return NextResponse.json({ error: "缺少 userId" }, { status: 400 });

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const action = String(body.action ?? "");

  try {
    if (action === "set_status") {
      const status = body.status === "disabled" ? "disabled" : "active";
      await db
        .update(users)
        .set({ status, updatedAt: new Date().toISOString() })
        .where(eq(users.id, userId));
      return NextResponse.json({ ok: true, status });
    }

    if (action === "gift_points") {
      const amount = Math.floor(Number(body.amount ?? 0));
      if (amount <= 0) return NextResponse.json({ error: "赠送积分须为正整数" }, { status: 400 });
      const GIFT_MAX = Math.max(1, Math.floor(Number(process.env.ADMIN_GIFT_POINTS_MAX ?? 10000)));
      if (amount > GIFT_MAX) {
        return NextResponse.json(
          { error: `单次赠分不能超过 ${GIFT_MAX}`, code: "gift_cap", max: GIFT_MAX },
          { status: 400 }
        );
      }
      const result = await grantPoints({
        userId,
        amount,
        reason: "admin_gift",
        refType: "admin",
        meta: { note: String(body.note ?? "") },
      });
      return NextResponse.json({ ok: true, balance: result.balance });
    }

    if (action === "set_allow_life_insights") {
      const allow = Boolean(body.allow);
      await db
        .update(users)
        .set({ allowLifeInsights: allow, updatedAt: new Date().toISOString() })
        .where(eq(users.id, userId));
      return NextResponse.json({ ok: true, allowLifeInsights: allow });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (e) {
    if (e instanceof BillingError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "操作失败" }, { status: 400 });
  }
}
