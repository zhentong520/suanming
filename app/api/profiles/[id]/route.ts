import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { getProfileForUser, isAuthError, requireUser } from "@/lib/user/profiles";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const { id } = await params;
  const profile = await getProfileForUser(session.userId, id);
  if (!profile) return NextResponse.json({ error: "未找到" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const { id } = await params;
  const profile = await getProfileForUser(session.userId, id);
  if (!profile) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const db = getDb();
  await db.delete(profiles).where(eq(profiles.id, id));

  if (session.activeProfileId === id) {
    const { setActiveProfile } = await import("@/lib/user/auth");
    await setActiveProfile(session.userId, null);
  }

  return NextResponse.json({ ok: true });
}
