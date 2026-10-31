/**
 * 支付宝「电脑网站支付」（alipay.trade.page.pay）。
 *
 * 流程：
 *  1. 客户端选档位 → POST /api/pay/alipay/prepare（创建 pending 订单，返回收银台跳转 URL）
 *  2. 浏览器跳转支付宝网关完成支付
 *  3. 支付宝异步通知 POST /api/pay/alipay/notify（RSA2 验签 → 金额校验 → 幂等发货 → 应答 "success"）
 *  4. 同步回跳 GET /api/pay/alipay/return → 回到 /recharge（仅展示用，发货以 notify 为准）
 *
 * 签名规范：参数按 key ASCII 升序拼 k=v&k=v（排除 sign/sign_type 与空值），
 * RSA-SHA256(SHA256withRSA) 用应用私钥签名；验签用支付宝公钥。
 *
 * 环境变量：
 *   ALIPAY_APP_ID            开放平台应用 AppId
 *   ALIPAY_PRIVATE_KEY       应用私钥（PKCS8 单行，\n 转义或真实换行均可）
 *   ALIPAY_ALIPAY_PUBLIC_KEY 支付宝公钥（openplatform 下「支付宝公钥」，不是应用公钥）
 *   ALIPAY_GATEWAY_URL       默认 https://openapi.alipay.com/gateway.do
 *                            沙箱 https://openapi-sandbox.dl.alipaydev.com/gateway.do
 *   ALIPAY_NOTIFY_URL        异步通知地址（默认 {site}/api/pay/alipay/notify）
 *   ALIPAY_RETURN_URL        同步回跳地址（默认 {site}/api/pay/alipay/return）
 *
 * 资质提示：电脑网站支付需企业/个体工商户签约；境外本地币收款需另走 Antom/Alipay+。
 */

import { createSign, createVerify } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { paymentOrders } from "@/lib/db/schema";
import { fulfillRechargeOrder, type RechargePackage } from "./recharge";
import { getSiteUrl } from "@/lib/site-config";

export interface AlipayConfig {
  appId: string;
  privateKey: string;
  alipayPublicKey: string;
  gatewayUrl: string;
  notifyUrl: string;
  returnUrl: string;
}

/** 支持把 PKCS8 私钥还原成多行 PEM（存 .env 时可整行粘贴） */
function toPem(key: string, type: "PRIVATE KEY" | "PUBLIC KEY"): string {
  const raw = key
    .trim()
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const body = raw.replace(/(.{64})/g, "$1\n").trim();
  return `-----BEGIN ${type}-----\n${body}\n-----END ${type}-----`;
}

export function getAlipayConfig(): AlipayConfig | null {
  const appId = process.env.ALIPAY_APP_ID?.trim();
  const privateKey = process.env.ALIPAY_PRIVATE_KEY?.trim();
  const alipayPublicKey = process.env.ALIPAY_ALIPAY_PUBLIC_KEY?.trim();
  if (!appId || !privateKey || !alipayPublicKey) return null;
  const site = getSiteUrl();
  return {
    appId,
    privateKey: toPem(privateKey, "PRIVATE KEY"),
    alipayPublicKey: toPem(alipayPublicKey, "PUBLIC KEY"),
    gatewayUrl:
      process.env.ALIPAY_GATEWAY_URL?.trim() || "https://openapi.alipay.com/gateway.do",
    notifyUrl: process.env.ALIPAY_NOTIFY_URL?.trim() || `${site}/api/pay/alipay/notify`,
    returnUrl: process.env.ALIPAY_RETURN_URL?.trim() || `${site}/api/pay/alipay/return`,
  };
}

export function isAlipayConfigured(): boolean {
  return getAlipayConfig() !== null;
}

/** 待签名串：key 升序 k=v& 拼接（排除 sign/sign_type/空值） */
export function buildSignContent(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => k !== "sign" && k !== "sign_type" && params[k] !== "" && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

function rsaSign(content: string, privateKeyPem: string): string {
  const signer = createSign("RSA-SHA256");
  signer.update(content, "utf8");
  return signer.sign(privateKeyPem, "base64");
}

export function rsaVerify(content: string, signatureB64: string, publicKeyPem: string): boolean {
  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(content, "utf8");
    return verifier.verify(publicKeyPem, signatureB64, "base64");
  } catch {
    return false;
  }
}

/** 创建 pending 订单（payment_orders，channel=alipay_page） */
export async function createAlipayOrder(opts: {
  userId: string;
  pkg: RechargePackage;
}): Promise<{ id: string }> {
  const db = getDb();
  const id = `ali_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(paymentOrders).values({
    id,
    userId: opts.userId,
    channel: "alipay_page",
    amountYuan: opts.pkg.priceFen / 100,
    points: opts.pkg.points + opts.pkg.bonusPoints,
    status: "pending",
    metaJson: JSON.stringify({
      packageId: opts.pkg.id,
      priceFen: opts.pkg.priceFen,
      basePoints: opts.pkg.points,
      bonusPoints: opts.pkg.bonusPoints,
    }),
    createdAt: new Date().toISOString(),
  });
  return { id };
}

/**
 * 构建 alipay.trade.page.pay 收银台跳转 URL（GET）。
 * 金额必须与米大师…无关，此处为支付宝侧 total_amount（元，两位小数）。
 */
export function buildPagePayUrl(opts: { orderId: string; pkg: RechargePackage; subject?: string }): string {
  const cfg = getAlipayConfig();
  if (!cfg) throw new Error("服务端未配置支付宝支付（ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_ALIPAY_PUBLIC_KEY）");

  const totalAmount = (opts.pkg.priceFen / 100).toFixed(2);
  const bizContent = JSON.stringify({
    out_trade_no: opts.orderId,
    product_code: "FAST_INSTANT_TRADE_PAY",
    total_amount: totalAmount,
    subject: opts.subject ?? `易道命理积分充值 ${opts.pkg.points}积分`,
  });

  const params: Record<string, string> = {
    app_id: cfg.appId,
    method: "alipay.trade.page.pay",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: formatAlipayTimestamp(new Date()),
    version: "1.0",
    notify_url: cfg.notifyUrl,
    return_url: cfg.returnUrl,
    biz_content: bizContent,
  };
  const sign = rsaSign(buildSignContent(params), cfg.privateKey);
  const query = new URLSearchParams({ ...params, sign }).toString();
  return `${cfg.gatewayUrl}?${query}`;
}

function formatAlipayTimestamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}

/**
 * 异步通知处理：验签 → 订单金额校验 → 幂等发货。
 * 返回值决定应答：ok → "success"；其余按 HTTP 400/fail 处理（支付宝会重试）。
 */
export async function handleAlipayNotify(params: Record<string, string>): Promise<{
  ok: boolean;
  reason?: string;
  alreadyPaid?: boolean;
}> {
  const cfg = getAlipayConfig();
  if (!cfg) return { ok: false, reason: "alipay not configured" };

  const sign = params.sign;
  if (!sign) return { ok: false, reason: "missing sign" };
  const content = buildSignContent(params);
  if (!rsaVerify(content, sign, cfg.alipayPublicKey)) {
    return { ok: false, reason: "signature verify failed" };
  }

  if (params.app_id !== cfg.appId) return { ok: false, reason: "app_id mismatch" };

  const tradeStatus = params.trade_status ?? "";
  if (tradeStatus !== "TRADE_SUCCESS" && tradeStatus !== "TRADE_FINISHED") {
    // 等待买家付款等中间态：应答 success 但不发货
    return { ok: true, reason: `ignored status ${tradeStatus}` };
  }

  const outTradeNo = params.out_trade_no ?? "";
  if (!outTradeNo) return { ok: false, reason: "missing out_trade_no" };

  const db = getDb();
  const [order] = await db
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.id, outTradeNo))
    .limit(1);
  if (!order) return { ok: false, reason: "order not found" };

  // 金额校验：通知金额必须与订单一致，防止篡改
  const notifiedAmount = Number(params.total_amount ?? "0");
  if (Math.abs(notifiedAmount - order.amountYuan) > 0.001) {
    return { ok: false, reason: `amount mismatch: notify=${notifiedAmount} order=${order.amountYuan}` };
  }

  const result = await fulfillRechargeOrder({
    outTradeNo,
    externalTradeNo: params.trade_no ?? null,
    expectedAmountYuan: order.amountYuan,
  });
  if (!result.ok) return { ok: false, reason: "fulfill failed" };

  return { ok: true, alreadyPaid: result.alreadyPaid };
}
