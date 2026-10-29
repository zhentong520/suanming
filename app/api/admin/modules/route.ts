import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { modules } from "@/lib/db/schema";
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
  const db = getDb();
  const list = await db.select().from(modules).orderBy(modules.sortOrder);
  return NextResponse.json(list);
}

export async function PUT(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "缺少模块 id" }, { status: 400 });

  const patch: Partial<{ enabled: boolean; showOnHome: boolean; sortOrder: number }> = {};
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body.showOnHome === "boolean") patch.showOnHome = body.showOnHome;
  if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "无更新字段" }, { status: 400 });
  }

  const db = getDb();
  await db.update(modules).set(patch).where(eq(modules.id, body.id));
  return NextResponse.json({ ok: true });
}
