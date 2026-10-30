import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { ensureSeeded } from "../init/route";
import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { setActiveProfile } from "@/lib/user/auth";
import { logUserOperation } from "@/lib/user/operations";
import { isAuthError, requireUser } from "@/lib/user/profiles";

export async function GET(request: Request) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const db = getDb();
  const list = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.userId))
    .orderBy(desc(profiles.createdAt));
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const body = await request.json();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const db = getDb();

  await db.insert(profiles).values({
    id,
    userId: session.userId,
    name: body.name ?? null,
    gender: body.gender ?? "unknown",
    calendarType: body.calendarType ?? "solar",
    birthYear: Number(body.birthYear),
    birthMonth: Number(body.birthMonth),
    birthDay: Number(body.birthDay),
    birthHour: body.birthHour != null && body.birthHour !== "" ? Number(body.birthHour) : null,
    birthMinute: body.birthMinute != null ? Number(body.birthMinute) : 0,
    timezone: body.timezone ?? "Asia/Shanghai",
    birthLongitude:
      body.birthLongitude != null && body.birthLongitude !== "" ? Number(body.birthLongitude) : null,
    birthLatitude:
      body.birthLatitude != null && body.birthLatitude !== "" ? Number(body.birthLatitude) : null,
    birthLocation: body.birthLocation?.trim() ? String(body.birthLocation).trim() : null,
    ziSect: body.ziSect === 1 || body.ziSect === 2 ? Number(body.ziSect) : null,
    leapMonth: body.calendarType === "lunar" && body.isLeapMonth === true,
    createdAt: now,
    updatedAt: now,
  });

  const setAsActive = body.setAsActive !== false;
  if (setAsActive) {
    await setActiveProfile(session.userId, id);
  }

  await logUserOperation({
    userId: session.userId,
    action: "create_profile",
    profileId: id,
    metadata: { name: body.name },
  });

  const [created] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return NextResponse.json({ ...created, activeProfileId: setAsActive ? id : session.activeProfileId });
}
