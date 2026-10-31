import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { resetDbInstance, getDb, getSqlite } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { users } from "@/lib/db/schema";
import {
  RECHARGE_PACKAGES,
  createRechargeOrder,
  fulfillRechargeOrder,
  findPackage,
} from "@/lib/billing/recharge";
import { getPointsStatus } from "@/lib/billing/points";
import { wxCodeToSession } from "@/lib/wechat/mini-session";

const testDbPath = path.resolve(process.cwd(), "data/test-recharge.db");

beforeAll(async () => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  process.env.DATABASE_URL = `file:${testDbPath}`;
  resetDbInstance();
  runMigrations();
});

afterAll(() => {
  resetDbInstance();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

async function createWxUser(openId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    email: null,
    phone: null,
    passwordHash: "test-hash",
    displayName: "微信用户",
    role: "user",
    status: "active",
    pointsBalance: 0,
    wxOpenId: openId,
    wxSessionKey: "sess-key-abc",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

describe("wechat mini session", () => {
  it("fails with clear message when env missing", async () => {
    delete process.env.WX_MINI_APPID;
    delete process.env.WX_MINI_SECRET;
    await expect(wxCodeToSession("code")).rejects.toThrow(/未配置/);
  });
});

describe("recharge orders", () => {
  it("finds package by id", () => {
    expect(findPackage("points_60")?.priceFen).toBe(600);
    expect(findPackage("nope")).toBeUndefined();
    expect(RECHARGE_PACKAGES.length).toBeGreaterThanOrEqual(3);
  });

  it("creates order, fulfills once, dedupes repeat callback", async () => {
    const userId = await createWxUser("o-abc-1");
    const pkg = findPackage("points_300")!;
    const order = await createRechargeOrder({ userId, pkg });
    const before = (await getPointsStatus(userId)).balance;

    const first = await fulfillRechargeOrder({
      outTradeNo: order.outTradeNo,
      externalTradeNo: "wx-123",
    });
    expect(first.ok).toBe(true);
    expect(first.alreadyPaid).toBeFalsy();
    expect(first.points).toBe(330); // 300 + 30 赠送

    const after = (await getPointsStatus(userId)).balance;
    expect(after).toBe(before + 330);

    const repeat = await fulfillRechargeOrder({ outTradeNo: order.outTradeNo });
    expect(repeat.ok).toBe(true);
    expect(repeat.alreadyPaid).toBe(true);

    const again = (await getPointsStatus(userId)).balance;
    expect(again).toBe(after); // 余额不变：幂等
  });

  it("rejects unknown order", async () => {
    const r = await fulfillRechargeOrder({ outTradeNo: "wx_missing" });
    expect(r.ok).toBe(false);
  });

  it("ledger records recharge entry", async () => {
    const userId = await createWxUser("o-abc-2");
    const pkg = findPackage("points_60")!;
    const order = await createRechargeOrder({ userId, pkg });
    await fulfillRechargeOrder({ outTradeNo: order.outTradeNo });
    const sqlite = getSqlite();
    const row = sqlite
      .prepare("SELECT reason FROM point_ledger WHERE user_id = ? AND reason = 'recharge'")
      .get(userId) as { reason: string } | undefined;
    expect(row?.reason).toBe("recharge");
    void eq;
  });
});
