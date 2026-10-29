import { NextResponse } from "next/server";
import { clearAuthCookie, getSessionFromRequest } from "@/lib/user/auth";
import { logUserOperation } from "@/lib/user/operations";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (session) {
    await logUserOperation({ userId: session.userId, action: "logout" });
  }
  const res = NextResponse.json({ ok: true });
  return clearAuthCookie(res);
}
