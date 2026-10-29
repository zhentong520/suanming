import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import {
  applyAdminAuthCookie,
  clearAdminAuthCookie,
  createAdminToken,
  getTokenFromRequest,
  verifyAdminCredentials,
  verifyAdminToken,
} from "@/lib/admin/auth";
import { AUTH_RATE, checkRateLimit, clientKeyFromRequest } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  await ensureSeeded();
  const rate = checkRateLimit(
    clientKeyFromRequest(request, "auth:admin"),
    AUTH_RATE.adminLogin.limit,
    AUTH_RATE.adminLogin.windowMs
  );
  if (!rate.ok) {
    return NextResponse.json(
      { error: `登录过于频繁，请 ${rate.retryAfterSec} 秒后再试`, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const body = await request.json();
  const user = await verifyAdminCredentials(body.username, body.password);
  if (!user) return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  const token = await createAdminToken(user.id, user.username, user.role);
  const res = NextResponse.json({ ok: true, username: user.username, role: user.role });
  return applyAdminAuthCookie(res, token);
}

export async function GET(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return NextResponse.json({ authenticated: false });
  const payload = await verifyAdminToken(token);
  return NextResponse.json({ authenticated: !!payload, user: payload });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  return clearAdminAuthCookie(res);
}
