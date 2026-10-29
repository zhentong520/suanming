import { NextResponse } from "next/server";
import { ensureSeeded } from "../init/route";
import { listUserReports } from "@/lib/user/reports";
import { isAuthError, requireUser } from "@/lib/user/profiles";

export async function GET(request: Request) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50) || 50, 100);
  const list = await listUserReports(session.userId, limit);
  return NextResponse.json({ reports: list });
}
