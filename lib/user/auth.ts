import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { authCookieSecure, resolveJwtSecret } from "@/lib/security/production-guards";

export const USER_TOKEN_COOKIE = "user_token";

const secret = () => new TextEncoder().encode(resolveJwtSecret());

export interface UserSession {
  userId: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  activeProfileId: string | null;
  role: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function validateRegisterInput(input: {
  email?: string;
  phone?: string;
  password: string;
}) {
  const email = input.email?.trim() ? normalizeEmail(input.email) : null;
  const phone = input.phone?.trim() ? normalizePhone(input.phone) : null;
  const password = input.password ?? "";

  if (!email && !phone) {
    throw new Error("请填写邮箱或手机号码");
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("邮箱格式不正确");
  }
  if (phone && !/^1\d{10}$/.test(phone)) {
    throw new Error("手机号码格式不正确（11位）");
  }
  if (password.length < 6) {
    throw new Error("密码至少 6 位");
  }
  return { email, phone, password };
}

export async function registerUser(input: {
  email?: string;
  phone?: string;
  password: string;
  displayName?: string;
}) {
  const { email, phone, password } = validateRegisterInput(input);
  const db = getDb();
  const now = new Date().toISOString();

  if (email) {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) throw new Error("该邮箱已注册");
  }
  if (phone) {
    const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    if (existing) throw new Error("该手机号已注册");
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    id,
    email,
    phone,
    passwordHash,
    displayName: input.displayName?.trim() || null,
    activeProfileId: null,
    role: "user",
    status: "active",
    pointsBalance: 0,
    aiQuotaUsed: 0,
    createdAt: now,
    updatedAt: now,
  });

  const { grantPoints } = await import("@/lib/billing/points");
  const { getBillingSettings } = await import("@/lib/billing/settings");
  const settings = await getBillingSettings();
  if (settings.registerBonus > 0) {
    await grantPoints({
      userId: id,
      amount: settings.registerBonus,
      reason: "register_bonus",
      refType: "user",
      refId: id,
    });
  }

  return { id, email, phone, displayName: input.displayName?.trim() || null };
}

export async function loginUser(input: { account: string; password: string }) {
  const account = input.account.trim();
  const password = input.password ?? "";
  if (!account || !password) throw new Error("请输入账号和密码");

  const db = getDb();
  const isEmail = account.includes("@");
  const normalized = isEmail ? normalizeEmail(account) : normalizePhone(account);

  const [user] = await db
    .select()
    .from(users)
    .where(isEmail ? eq(users.email, normalized) : eq(users.phone, normalized))
    .limit(1);

  if (!user) throw new Error("账号或密码错误");
  // 前台管理员最高权限：即使被标记停用也可登录
  if ((user.status ?? "active") === "disabled" && user.role !== "admin") {
    throw new Error("账号已停用，请联系管理员");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("账号或密码错误");

  return user;
}

export async function createUserToken(userId: string) {
  return new SignJWT({ type: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyUserToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.type !== "user" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${USER_TOKEN_COOKIE}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function getSessionFromRequest(request: Request): Promise<UserSession | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const userId = await verifyUserToken(token);
  if (!userId) return null;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  if ((user.status ?? "active") === "disabled" && user.role !== "admin") return null;

  return {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    activeProfileId: user.activeProfileId,
    role: user.role ?? "user",
  };
}

export async function getSessionFromCookies(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifyUserToken(token);
  if (!userId) return null;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  if ((user.status ?? "active") === "disabled" && user.role !== "admin") return null;

  return {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName,
    activeProfileId: user.activeProfileId,
    role: user.role ?? "user",
  };
}

export async function setActiveProfile(userId: string, profileId: string | null) {
  const db = getDb();
  await db
    .update(users)
    .set({ activeProfileId: profileId, updatedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
}

export function authCookieHeader(token: string) {
  const secure = authCookieSecure() ? "; Secure" : "";
  return `${USER_TOKEN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure}`;
}

export function clearAuthCookieHeader() {
  const secure = authCookieSecure() ? "; Secure" : "";
  return `${USER_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/** 通过 NextResponse.cookies 写入，避免 Headers 里 Set-Cookie 被吞掉 */
export function applyAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(USER_TOKEN_COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: authCookieSecure(),
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(USER_TOKEN_COOKIE, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: authCookieSecure(),
    maxAge: 0,
  });
  return res;
}

export async function findUserByAccount(account: string) {
  const db = getDb();
  const isEmail = account.includes("@");
  const normalized = isEmail ? normalizeEmail(account) : normalizePhone(account);
  const [user] = await db
    .select()
    .from(users)
    .where(isEmail ? eq(users.email, normalized) : eq(users.phone, normalized))
    .limit(1);
  return user ?? null;
}
