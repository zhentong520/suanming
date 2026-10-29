import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { applyAuthCookie, createUserToken, loginUser } from "@/lib/user/auth";
import { logUserOperation } from "@/lib/user/operations";
import { AUTH_RATE, checkRateLimit, clientKeyFromRequest } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  await ensureSeeded();
  const rate = checkRateLimit(
    clientKeyFromRequest(request, "auth:login"),
    AUTH_RATE.login.limit,
    AUTH_RATE.login.windowMs
  );
  if (!rate.ok) {
    return NextResponse.json(
      { error: `登录过于频繁，请 ${rate.retryAfterSec} 秒后再试`, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    const user = await loginUser({ account: body.account, password: body.password });
    const token = await createUserToken(user.id);
    await logUserOperation({ userId: user.id, action: "login" });

    const res = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        activeProfileId: user.activeProfileId,
      },
    });
    return applyAuthCookie(res, token);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "登录失败" }, { status: 400 });
  }
}
