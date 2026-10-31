import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { wxCodeToSession } from "@/lib/wechat/mini-session";
import { createUserToken } from "@/lib/user/auth";
import { grantPoints } from "@/lib/billing/points";
import { getBillingSettings } from "@/lib/billing/settings";

export const runtime = "nodejs";

/**
 * 微信小程序登录：wx.login 的 code 换 openid，存在则登录、不存在则建号。
 * body: { code: string; nickname?: string }
 * 返回: { token, user } —— 小程序端以 Bearer token 调用后续接口。
 */
export async function POST(request: Request) {
  await ensureSeeded();
  let body: { code?: string; nickname?: string };
  try {
    body = (await request.json()) as { code?: string; nickname?: string };
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }
  const code = body.code?.trim();
  if (!code) return NextResponse.json({ error: "缺少微信登录 code" }, { status: 400 });

  let session: { openid: string; sessionKey: string; unionid?: string };
  try {
    session = await wxCodeToSession(code);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const db = getDb();
  const now = new Date().toISOString();
  const nickname = body.nickname?.trim() || null;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.wxOpenId, session.openid))
    .limit(1);

  let userId: string;
  let user: typeof users.$inferSelect;

  if (existing) {
    if ((existing.status ?? "active") === "disabled" && existing.role !== "admin") {
      return NextResponse.json({ error: "账号已停用，请联系管理员" }, { status: 403 });
    }
    userId = existing.id;
    const [updated] = await db
      .update(users)
      .set({
        wxSessionKey: session.sessionKey,
        updatedAt: now,
        ...(nickname && !existing.displayName ? { displayName: nickname } : {}),
      })
      .where(eq(users.id, userId))
      .returning();
    user = updated;
  } else {
    // 微信新用户：无邮箱/手机号，密码哈希用随机串占位（不支持密码登录，直到用户绑定账号）
    const randomPassword = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const [created] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: null,
        phone: null,
        passwordHash,
        displayName: nickname ?? "微信用户",
        activeProfileId: null,
        role: "user",
        status: "active",
        pointsBalance: 0,
        aiQuotaUsed: 0,
        wxOpenId: session.openid,
        wxSessionKey: session.sessionKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    userId = created.id;
    user = created;

    // 新人注册积分（与注册接口口径一致）
    const settings = await getBillingSettings();
    if (settings.registerBonus > 0) {
      await grantPoints({
        userId,
        amount: settings.registerBonus,
        reason: "register_bonus",
        refType: "user",
        refId: userId,
      });
      user.pointsBalance = (user.pointsBalance ?? 0) + settings.registerBonus;
    }
  }

  const token = await createUserToken(userId);
  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      activeProfileId: user.activeProfileId,
      role: user.role ?? "user",
      pointsBalance: user.pointsBalance ?? 0,
      isNew: !existing,
    },
  });
}
