import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import {
  applyAuthCookie,
  createUserToken,
  registerUser,
  validateRegisterInput,
} from "@/lib/user/auth";
import { logUserOperation } from "@/lib/user/operations";
import { AUTH_RATE, checkRateLimit, clientKeyFromRequest } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  await ensureSeeded();
  const rate = checkRateLimit(
    clientKeyFromRequest(request, "auth:register"),
    AUTH_RATE.register.limit,
    AUTH_RATE.register.windowMs
  );
  if (!rate.ok) {
    return NextResponse.json(
      { error: `注册过于频繁，请 ${rate.retryAfterSec} 秒后再试`, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const body = await request.json();
    validateRegisterInput(body);
    const user = await registerUser(body);
    const token = await createUserToken(user.id);
    await logUserOperation({ userId: user.id, action: "register" });

    const res = NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        activeProfileId: null,
      },
    });
    return applyAuthCookie(res, token);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "注册失败" }, { status: 400 });
  }
}
