import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { aiGlobalSettings, aiModuleSwitches } from "@/lib/db/schema";
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
  const global = await db.select().from(aiGlobalSettings);
  const modules = await db.select().from(aiModuleSwitches);
  return NextResponse.json({ global, modules });
}

export async function PUT(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const body = await request.json();
  const db = getDb();

  if (body.globalAiEnabled != null) {
    await db
      .update(aiGlobalSettings)
      .set({ value: body.globalAiEnabled ? "true" : "false" })
      .where(eq(aiGlobalSettings.key, "global_ai_enabled"));
  }

  if (body.moduleId != null) {
    await db
      .update(aiModuleSwitches)
      .set({ aiEnabled: body.aiEnabled ?? false })
      .where(eq(aiModuleSwitches.moduleId, body.moduleId));
  }

  return NextResponse.json({ ok: true });
}
