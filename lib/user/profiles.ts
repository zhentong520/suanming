import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { getSessionFromRequest, UserSession } from "./auth";

export async function requireUser(request: Request): Promise<UserSession | NextResponse> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  return session;
}

export function isAuthError(result: UserSession | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

export async function getProfileForUser(userId: string, profileId: string) {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);
  return profile ?? null;
}

export async function resolveActiveProfileId(
  session: UserSession,
  requestedProfileId?: string | null
): Promise<string | null> {
  const profileId = requestedProfileId ?? session.activeProfileId;
  if (!profileId) return null;
  const profile = await getProfileForUser(session.userId, profileId);
  return profile ? profile.id : null;
}
