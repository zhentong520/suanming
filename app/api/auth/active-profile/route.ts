import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { setActiveProfile } from "@/lib/user/auth";
import { logUserOperation } from "@/lib/user/operations";
import { getProfileForUser, isAuthError, requireUser } from "@/lib/user/profiles";

export async function POST(request: Request) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const body = await request.json();
  const profileId = body.profileId as string | null;

  if (profileId) {
    const profile = await getProfileForUser(session.userId, profileId);
    if (!profile) return NextResponse.json({ error: "档案不存在" }, { status: 404 });
  }

  await setActiveProfile(session.userId, profileId);
  await logUserOperation({
    userId: session.userId,
    action: "set_active_profile",
    profileId: profileId ?? undefined,
  });

  return NextResponse.json({ activeProfileId: profileId });
}
