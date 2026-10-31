import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { generateKeyPairSync, createSign } from "crypto";
import { resetDbInstance, getDb, getSqlite } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import {
  buildSignContent,
  buildPagePayUrl,
  createAlipayOrder,
  handleAlipayNotify,
  rsaVerify,
} from "@/lib/billing/alipay";
import { findPackage } from "@/lib/billing/recharge";
import { getPointsStatus } from "@/lib/billing/points";
import { users } from "@/lib/db/schema";

const testDbPath = path.resolve(process.cwd(), "data/test-alipay.db");

// 测试用 RSA 密钥对（仅用于签名往返，不涉及真实账户）
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
// 模拟 .env 单行私钥（把换行折叠后由 toPem 还原）
const privateKeySingleLine = privateKeyPem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");

function signWithTestKey(content: string): string {
  const signer = createSign("RSA-SHA256");
  signer.update(content, "utf8");
  return signer.sign(privateKeyPem, "base64");
}

beforeAll(() => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  process.env.DATABASE_URL = `file:${testDbPath}`;
  process.env.ALIPAY_APP_ID = "2021000100000000";
  process.env.ALIPAY_PRIVATE_KEY = privateKeySingleLine;
  process.env.ALIPAY_ALIPAY_PUBLIC_KEY = publicKeyPem;
  process.env.ALIPAY_GATEWAY_URL = "https://openapi-sandbox.dl.alipaydev.com/gateway.do";
  process.env.NEXT_PUBLIC_SITE_URL = "https://test.example.com";
  resetDbInstance();
  runMigrations();
});

afterAll(() => {
  resetDbInstance();
  delete process.env.ALIPAY_APP_ID;
  delete process.env.ALIPAY_PRIVATE_KEY;
  delete process.env.ALIPAY_ALIPAY_PUBLIC_KEY;
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

async function createWxLessUser() {
  const db = getDb();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    passwordHash: "test-hash",
    role: "user",
    status: "active",
    pointsBalance: 0,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

describe("alipay sign utils", () => {
  it("sorts keys and excludes sign/sign_type/empty values", () => {
    const content = buildSignContent({
      sign_type: "RSA2",
      sign: "xxx",
      charset: "utf-8",
      app_id: "a1",
      empty: "",
      biz_content: '{"a":1}',
    });
    // 按 key 升序、排除 sign/sign_type/空值；签名串使用原始值（不 URL 编码，支付宝规范）
    expect(content).toBe(`app_id=a1&biz_content={"a":1}&charset=utf-8`);
  });

  it("verifies a signature made with the matching private key", () => {
    const content = "app_id=a1&charset=utf-8";
    const sig = signWithTestKey(content);
    expect(rsaVerify(content, sig, publicKeyPem)).toBe(true);
    expect(rsaVerify(content + "x", sig, publicKeyPem)).toBe(false);
  });
});

describe("alipay page pay flow", () => {
  it("builds gateway url with valid RSA2 sign", async () => {
    const userId = await createWxLessUser();
    const pkg = findPackage("points_60")!;
    const order = await createAlipayOrder({ userId, pkg });
    const url = buildPagePayUrl({ orderId: order.id, pkg });

    expect(url.startsWith("https://openapi-sandbox.dl.alipaydev.com/gateway.do?")).toBe(true);
    const qs = new URL(url).searchParams;
    expect(qs.get("method")).toBe("alipay.trade.page.pay");
    expect(qs.get("app_id")).toBe("2021000100000000");
    const biz = JSON.parse(qs.get("biz_content")!);
    expect(biz.out_trade_no).toBe(order.id);
    expect(biz.total_amount).toBe("6.00");

    // 从 URL 里还原签名验证（URLSearchParams 会解码）
    const params: Record<string, string> = {};
    for (const [k, v] of qs.entries()) params[k] = v;
    const content = buildSignContent(params);
    expect(rsaVerify(content, params.sign, publicKeyPem)).toBe(true);
  });

  it("notify: verifies sign, matches amount, fulfills idempotently", async () => {
    const userId = await createWxLessUser();
    const pkg = findPackage("points_300")!;
    const order = await createAlipayOrder({ userId, pkg });
    const balanceBefore = (await getPointsStatus(userId)).balance;

    const bizParams: Record<string, string> = {
      app_id: "2021000100000000",
      charset: "utf-8",
      out_trade_no: order.id,
      trade_no: "2026110122001000000",
      trade_status: "TRADE_SUCCESS",
      total_amount: "30.00",
    };
    bizParams.sign = signWithTestKey(buildSignContent(bizParams));

    const first = await handleAlipayNotify(bizParams);
    expect(first.ok).toBe(true);
    expect((await getPointsStatus(userId)).balance).toBe(balanceBefore + 330);

    // 重复通知幂等
    const repeat = await handleAlipayNotify(bizParams);
    expect(repeat.ok).toBe(true);
    expect(repeat.alreadyPaid).toBe(true);
    expect((await getPointsStatus(userId)).balance).toBe(balanceBefore + 330);

    // 篡改金额被拒
    const tampered: Record<string, string> = { ...bizParams, total_amount: "0.01" };
    tampered.sign = signWithTestKey(buildSignContent(tampered));
    const bad = await handleAlipayNotify(tampered);
    expect(bad.ok).toBe(false);
    expect(bad.reason).toContain("amount mismatch");
  });

  it("notify: rejects wrong signature", async () => {
    const userId = await createWxLessUser();
    const pkg = findPackage("points_60")!;
    const order = await createAlipayOrder({ userId, pkg });
    const params: Record<string, string> = {
      app_id: "2021000100000000",
      out_trade_no: order.id,
      trade_status: "TRADE_SUCCESS",
      total_amount: "6.00",
      sign: "bogus-signature",
    };
    const r = await handleAlipayNotify(params);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("signature");
  });

  it("notify: ignores pending trade states without fulfillment", async () => {
    const userId = await createWxLessUser();
    const pkg = findPackage("points_60")!;
    const order = await createAlipayOrder({ userId, pkg });
    const params: Record<string, string> = {
      app_id: "2021000100000000",
      out_trade_no: order.id,
      trade_status: "WAIT_BUYER_PAY",
      total_amount: "6.00",
    };
    params.sign = signWithTestKey(buildSignContent(params));
    const r = await handleAlipayNotify(params);
    expect(r.ok).toBe(true);
    expect((await getPointsStatus(userId)).balance).toBe(0);
    // 订单仍为 pending，可被后续成功通知发货
    const row = getSqlite().prepare("SELECT status FROM payment_orders WHERE id = ?").get(order.id) as {
      status: string;
    };
    expect(row.status).toBe("pending");
  });
});
