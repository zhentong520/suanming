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

/* ===== 回调实单确认发货（query_order） ===== */
import { fulfillRechargeOrderWithWxConfirm } from "@/lib/billing/recharge";

const realFetch = globalThis.fetch;

function mockWxFetch(handler: (url: string, body: string) => { status?: number; data: unknown }) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = typeof init?.body === "string" ? init.body : "";
    const out = handler(url, body);
    return new Response(JSON.stringify(out.data), { status: out.status ?? 200 });
  }) as typeof fetch;
}

describe("wechat callback fulfill with query_order confirm", () => {
  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it("fulfills only when wechat confirms paid order", async () => {
    process.env.WX_MINI_APPID = "wx-test-appid";
    process.env.WX_MINI_SECRET = "wx-test-secret";
    process.env.WX_MINI_APPKEY = "test-appkey-0123456789abcdef";
    process.env.WX_MINI_PAY_ENV = "0";

    const userId = await createWxUser("o-confirm-1");
    const pkg = findPackage("points_60")!;
    const order = await createRechargeOrder({ userId, pkg });
    const before = (await getPointsStatus(userId)).balance;

    mockWxFetch((url) => {
      if (url.includes("/cgi-bin/stable_token")) {
        return { data: { access_token: "test-token", expires_in: 7200 } };
      }
      if (url.includes("/xpay/query_order")) {
        return { data: { errcode: 0, order: { order_status: 1, wx_order_id: "wx-ord-1", paid_fee: 600 } } };
      }
      return { status: 404, data: {} };
    });

    const r = await fulfillRechargeOrderWithWxConfirm({ outTradeNo: order.outTradeNo });
    expect(r.ok).toBe(true);
    expect((await getPointsStatus(userId)).balance).toBe(before + 60);

    // 微信内部单号已回填
    const row = getSqlite()
      .prepare("SELECT external_trade_no, status FROM payment_orders WHERE id = ?")
      .get(order.outTradeNo) as { external_trade_no: string; status: string };
    expect(row.external_trade_no).toBe("wx-ord-1");
    expect(row.status).toBe("paid");
  });

  it("rejects forged callback when wechat order missing/unpaid", async () => {
    process.env.WX_MINI_APPID = "wx-test-appid";
    process.env.WX_MINI_SECRET = "wx-test-secret";
    process.env.WX_MINI_APPKEY = "test-appkey-0123456789abcdef";
    const userId = await createWxUser("o-forged-1");
    const pkg = findPackage("points_300")!;
    const order = await createRechargeOrder({ userId, pkg });
    const before = (await getPointsStatus(userId)).balance;

    mockWxFetch((url) => {
      if (url.includes("/cgi-bin/stable_token")) {
        return { data: { access_token: "test-token", expires_in: 7200 } };
      }
      if (url.includes("/xpay/query_order")) {
        return { data: { errcode: 268490004, errmsg: "order not exist" } };
      }
      return { status: 404, data: {} };
    });

    const r = await fulfillRechargeOrderWithWxConfirm({ outTradeNo: order.outTradeNo });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("not paid");
    expect((await getPointsStatus(userId)).balance).toBe(before);
  });

  it("rejects when paid_fee mismatches order amount", async () => {
    process.env.WX_MINI_APPID = "wx-test-appid";
    process.env.WX_MINI_SECRET = "wx-test-secret";
    process.env.WX_MINI_APPKEY = "test-appkey-0123456789abcdef";
    const userId = await createWxUser("o-mismatch-1");
    const pkg = findPackage("points_980")!;
    const order = await createRechargeOrder({ userId, pkg });

    mockWxFetch((url) => {
      if (url.includes("/cgi-bin/stable_token")) {
        return { data: { access_token: "test-token", expires_in: 7200 } };
      }
      if (url.includes("/xpay/query_order")) {
        // 实付 1 分 vs 订单 98 元
        return { data: { errcode: 0, order: { order_status: 1, wx_order_id: "wx-ord-2", paid_fee: 1 } } };
      }
      return { status: 404, data: {} };
    });

    const r = await fulfillRechargeOrderWithWxConfirm({ outTradeNo: order.outTradeNo });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("mismatch");
  });
});

describe("wx_order_id-only callback resolution", () => {
  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it("resolves merchant order via reverse lookup and fulfills", async () => {
    process.env.WX_MINI_APPID = "wx-test-appid";
    process.env.WX_MINI_SECRET = "wx-test-secret";
    process.env.WX_MINI_APPKEY = "test-appkey-0123456789abcdef";
    const userId = await createWxUser("o-resolve-1");
    const pkg = findPackage("points_60")!;
    const order = await createRechargeOrder({ userId, pkg });
    const before = (await getPointsStatus(userId)).balance;

    // 回调只带 wx_order_id：第一次反查拿商户单号，第二次确认支付状态
    mockWxFetch((url) => {
      if (url.includes("/cgi-bin/stable_token")) {
        return { data: { access_token: "test-token", expires_in: 7200 } };
      }
      if (url.includes("/xpay/query_order")) {
        return {
          data: {
            errcode: 0,
            order: { order_id: order.outTradeNo, order_status: 1, wx_order_id: "wx-x1", paid_fee: 600 },
          },
        };
      }
      return { status: 404, data: {} };
    });

    const r = await fulfillRechargeOrderWithWxConfirm({ wxOrderId: "wx-x1", openid: "o-resolve-1" });
    expect(r.ok).toBe(true);
    expect((await getPointsStatus(userId)).balance).toBe(before + 60);

    const row = getSqlite()
      .prepare("SELECT external_trade_no, status FROM payment_orders WHERE id = ?")
      .get(order.outTradeNo) as { external_trade_no: string; status: string };
    expect(row.external_trade_no).toBe("wx-x1");
    expect(row.status).toBe("paid");
  });

  it("rejects wx_order_id-only callback when reverse lookup fails", async () => {
    process.env.WX_MINI_APPID = "wx-test-appid";
    process.env.WX_MINI_SECRET = "wx-test-secret";
    process.env.WX_MINI_APPKEY = "test-appkey-0123456789abcdef";
    mockWxFetch((url) => {
      if (url.includes("/cgi-bin/stable_token")) {
        return { data: { access_token: "test-token", expires_in: 7200 } };
      }
      return { data: { errcode: 268490004, errmsg: "order not exist" } };
    });
    const r = await fulfillRechargeOrderWithWxConfirm({ wxOrderId: "wx-none", openid: "o-ghost" });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("missing order reference");
  });
});
