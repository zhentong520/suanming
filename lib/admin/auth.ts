import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import {
  adminPasswordLooksDefault,
  authCookieSecure,
  jwtSecretLooksWeak,
  resolveJwtSecret,
} from "@/lib/security/production-guards";

export const ADMIN_TOKEN_COOKIE = "admin_token";

const secret = () => new TextEncoder().encode(resolveJwtSecret());

export async function verifyAdminCredentials(username: string, password: string) {
  const db = getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

export async function createAdminToken(userId: string, username: string, role: string) {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    // 回查数据库：账号被删除后即使 token 签名有效也立即失效
    const adminId = payload.sub;
    if (!adminId) return null;
    const db = getDb();
    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, adminId)).limit(1);
    if (!row || row.username !== payload.username) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const headerTok = request.headers.get("x-admin-token");
  if (headerTok) return headerTok;

  const cookie = request.headers.get("cookie") ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_TOKEN_COOKIE}=([^;]+)`));
  if (m?.[1]) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  return null;
}

export function applyAdminAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: authCookieSecure(),
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export function clearAdminAuthCookie(res: NextResponse) {
  res.cookies.set(ADMIN_TOKEN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: authCookieSecure(),
    maxAge: 0,
  });
  return res;
}

export async function changeAdminPassword(input: {
  username: string;
  currentPassword: string;
  newPassword: string;
}) {
  if (!input.newPassword || input.newPassword.length < 8) {
    throw new Error("新密码至少 8 位");
  }
  if (input.newPassword === input.currentPassword) {
    throw new Error("新密码不能与当前密码相同");
  }
  const user = await verifyAdminCredentials(input.username, input.currentPassword);
  if (!user) throw new Error("当前密码不正确");

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  const db = getDb();
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, user.id));
  return { username: user.username };
}

export function getSecurityHints() {
  const jwt = process.env.JWT_SECRET ?? "";
  const adminPass = process.env.ADMIN_PASSWORD ?? "admin123";

  return {
    jwtConfigured: Boolean(jwt),
    jwtLooksWeak: jwtSecretLooksWeak(jwt),
    adminEnvPasswordIsDefault: adminPasswordLooksDefault(adminPass),
    authCookieSecure: authCookieSecure(),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    databaseUrl: process.env.DATABASE_URL ?? "file:./data/suanming.db",
    dialect: process.env.DATABASE_DIALECT ?? "sqlite",
  };
}
