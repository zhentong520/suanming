/**
 * 微信小程序虚拟支付（道具直购 short_series_goods）充值积分。
 *
 * 流程：
 *  1. 客户端选档位 → POST /api/pay/wechat/prepare（本模块创建 pending 订单并签名）
 *  2. 客户端 wx.requestVirtualPayment({ signData, paySig, signature, mode })
 *  3. 微信/Midas 回调 POST /api/pay/wechat/notify（本模块验签、标记已支付、发放积分）
 *     —— 发货一律以服务端回调为准，前端 success 不作为发货依据。
 *
 * 签名规范（微信小程序虚拟支付 2.0）：
 *   paySig    = hex( HMAC-SHA256( AppKey, "requestVirtualPayment&" + signData ) )
 *   signature = hex( HMAC-SHA256( session_key, signData ) )
 *   signData  为服务端序列化的 JSON 字符串，客户端必须原样上送（不得重新序列化）。
 *
 * 环境变量：
 *   WX_MINI_OFFER_ID         米大师应用 id（offerId）
 *   WX_MINI_APPKEY           现网 AppKey（env=0）
 *   WX_MINI_SANDBOX_APPKEY   沙箱 AppKey（env=1，可选）
 *   WX_MINI_PAY_ENV          0 正式 / 1 沙箱（默认 0）
 */

import { createHmac, randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb, getSqlite } from "@/lib/db/client";
import { paymentOrders, users } from "@/lib/db/schema";
import { grantPoints } from "./points";
import { wxQueryXpayOrder, type WxOrderQueryResult } from "@/lib/wechat/mini-session";

export interface RechargePackage {
  id: string;
  /** 展示名 */
  label: string;
  /** 道具单价（分）——须与米大师后台道具价格一致 */
  priceFen: number;
  /** 到账积分 */
  points: number;
  /** 赠送积分（写进文案） */
  bonusPoints: number;
}

/** 充值档位：goodsPrice 必须与米大师后台「道具管理」配置完全一致 */
export const RECHARGE_PACKAGES: RechargePackage[] = [
  { id: "points_60", label: "60 积分", priceFen: 600, points: 60, bonusPoints: 0 },
  { id: "points_300", label: "300 积分", priceFen: 3000, points: 300, bonusPoints: 30 },
  { id: "points_980", label: "980 积分", priceFen: 9800, points: 980, bonusPoints: 130 },
];

export function findPackage(packageId: string): RechargePackage | undefined {
  return RECHARGE_PACKAGES.find((p) => p.id === packageId);
}

function payEnv(): number {
  return process.env.WX_MINI_PAY_ENV === "1" ? 1 : 0;
}

export function isXpayConfigured(): boolean {
  const offerId = process.env.WX_MINI_OFFER_ID?.trim();
  const env = payEnv();
  const appKey = env === 1 ? process.env.WX_MINI_SANDBOX_APPKEY?.trim() : process.env.WX_MINI_APPKEY?.trim();
  return Boolean(offerId && appKey);
}

function hmacHex(key: string, message: string): string {
  return createHmac("sha256", key).update(message, "utf8").digest("hex");
}

/** 生成待签的 signData 字符串（键序固定，客户端原样上送） */
function buildSignData(opts: {
  offerId: string;
  priceFen: number;
  packageId: string;
  outTradeNo: string;
}): string {
  const signObj = {
    offerId: opts.offerId,
    buyQuantity: 1,
    env: payEnv(),
    currencyType: "CNY",
    productId: opts.packageId,
    goodsPrice: opts.priceFen,
    outTradeNo: opts.outTradeNo,
    attach: opts.outTradeNo,
  };
  return JSON.stringify(signObj);
}

/** 创建 pending 充值订单（payment_orders，channel=wx_xpay） */
export async function createRechargeOrder(opts: {
  userId: string;
  pkg: RechargePackage;
}): Promise<{ id: string; outTradeNo: string }> {
  const db = getDb();
  const id = `wx_${Date.now().toString(36)}_${randomUUID().slice(0, 8)}`;
  await db.insert(paymentOrders).values({
    id,
    userId: opts.userId,
    channel: "wx_xpay",
    amountYuan: opts.pkg.priceFen / 100,
    points: opts.pkg.points + opts.pkg.bonusPoints,
    status: "pending",
    metaJson: JSON.stringify({
      packageId: opts.pkg.id,
      priceFen: opts.pkg.priceFen,
      basePoints: opts.pkg.points,
      bonusPoints: opts.pkg.bonusPoints,
      env: payEnv(),
    }),
    createdAt: new Date().toISOString(),
  });
  return { id, outTradeNo: id };
}

export interface VirtualPaymentPayload {
  mode: "short_series_goods";
  signData: string;
  paySig: string;
  signature: string;
  orderId: string;
  outTradeNo: string;
}

/**
 * 为 pending 订单生成 wx.requestVirtualPayment 所需参数。
 * signature 依赖用户当前 session_key（微信登录时保存），过期需重新登录。
 */
export async function buildVirtualPaymentPayload(opts: {
  orderId: string;
  userId: string;
  pkg: RechargePackage;
}): Promise<VirtualPaymentPayload> {
  const offerId = process.env.WX_MINI_OFFER_ID?.trim();
  const env = payEnv();
  const appKey =
    env === 1 ? process.env.WX_MINI_SANDBOX_APPKEY?.trim() : process.env.WX_MINI_APPKEY?.trim();
  if (!offerId || !appKey) {
    throw new Error("服务端未配置虚拟支付（WX_MINI_OFFER_ID / WX_MINI_APPKEY）");
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, opts.userId)).limit(1);
  if (!user) throw new Error("用户不存在");
  if (!user.wxSessionKey || !user.wxOpenId) {
    throw new Error("缺少微信会话，请先使用微信登录后重试");
  }

  const signData = buildSignData({
    offerId,
    priceFen: opts.pkg.priceFen,
    packageId: opts.pkg.id,
    outTradeNo: opts.orderId,
  });
  const paySig = hmacHex(appKey, `requestVirtualPayment&${signData}`);
  const signature = hmacHex(user.wxSessionKey, signData);

  return {
    mode: "short_series_goods",
    signData,
    paySig,
    signature,
    orderId: opts.orderId,
    outTradeNo: opts.orderId,
  };
}

/**
 * 回调发货安全模型（微信自建回调走「消息推送」协议，事件体无 AppKey 签名可本地验）：
 *   收到回调 → 取订单引用 → 向微信 /xpay/query_order 查实单 →
 *   微信侧确认支付成功且实付金额一致 → 才标记已支付并入账。
 * 伪造回调因订单在微信侧不存在/未支付而无法触发发货。
 */
export async function fulfillRechargeOrderWithWxConfirm(opts: {
  outTradeNo?: string;
  wxOrderId?: string;
  openid?: string;
}): Promise<{
  ok: boolean;
  reason?: string;
  alreadyPaid?: boolean;
  points?: number;
  userId?: string;
}> {
  const sqlite = getSqlite();

  // 1) 定位订单：优先商户单号；仅微信内部单号时按 external_trade_no 兜底匹配
  if (opts.wxOrderId && !opts.outTradeNo) {
    const paidRow = sqlite
      .prepare(
        "SELECT id, user_id, points FROM payment_orders WHERE external_trade_no = ? AND status = 'paid'"
      )
      .get(opts.wxOrderId) as { id: string; user_id: string; points: number } | undefined;
    if (paidRow) return { ok: true, alreadyPaid: true, userId: paidRow.user_id, points: paidRow.points };
  }

  const outTradeNo = opts.outTradeNo;
  if (!outTradeNo) return { ok: false, reason: "missing order reference" };

  const order = sqlite
    .prepare("SELECT id, user_id, points, status, amount_yuan FROM payment_orders WHERE id = ?")
    .get(outTradeNo) as
    | { id: string; user_id: string; points: number; status: string; amount_yuan: number }
    | undefined;
  if (!order) return { ok: false, reason: "order not found" };
  if (order.status === "paid") {
    return { ok: true, alreadyPaid: true, userId: order.user_id, points: order.points };
  }
  if (order.status !== "pending") return { ok: false, reason: "invalid order status" };

  // 2) query_order 实单确认（需要用户 openid）
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, order.user_id)).limit(1);
  if (!user?.wxOpenId) return { ok: false, reason: "user has no wx openid" };

  let query: WxOrderQueryResult;
  try {
    query = await wxQueryXpayOrder({ openid: opts.openid ?? user.wxOpenId, orderId: order.id });
  } catch (err) {
    // 微信侧接口异常时不发货，等待回调重试
    return { ok: false, reason: `query_order failed: ${(err as Error).message}` };
  }
  if (!query.paid) {
    return {
      ok: false,
      reason: `wx order not paid (status=${query.orderStatus ?? "unknown"}${query.errmsg ? `, ${query.errmsg}` : ""})`,
    };
  }

  // 3) 实付金额校验（分 → 元），与订单一致才发货
  if (typeof query.paidFee === "number") {
    const paidYuan = query.paidFee / 100;
    if (Math.abs(paidYuan - order.amount_yuan) > 0.001) {
      return { ok: false, reason: `wx paid_fee mismatch: ${paidYuan} vs ${order.amount_yuan}` };
    }
  }

  // 4) 幂等发货
  const result = await fulfillRechargeOrder({
    outTradeNo: order.id,
    externalTradeNo: query.wxOrderId ?? opts.wxOrderId,
  });
  if (!result.ok) return { ok: false, reason: "fulfill failed" };
  return { ok: true, userId: result.userId, points: result.points, alreadyPaid: result.alreadyPaid };
}

/**
 * 发货：把订单标记为已支付并发放积分（幂等）。
 * 只有 status=pending 的订单会被受理；重复回调直接返回已处理。
 * expectedAmountYuan 提供时校验订单金额（支付宝渠道用），不符则拒绝发货。
 */
export async function fulfillRechargeOrder(opts: {
  outTradeNo: string;
  externalTradeNo?: string;
  expectedAmountYuan?: number;
}): Promise<{ ok: boolean; alreadyPaid?: boolean; points?: number; userId?: string }> {
  const sqlite = getSqlite();
  const now = new Date().toISOString();

  const row = sqlite
    .prepare("SELECT id, user_id, points, status, meta_json, amount_yuan FROM payment_orders WHERE id = ?")
    .get(opts.outTradeNo) as
    | { id: string; user_id: string; points: number; status: string; meta_json: string | null; amount_yuan: number }
    | undefined;
  if (!row) return { ok: false };
  if (
    typeof opts.expectedAmountYuan === "number" &&
    Math.abs(opts.expectedAmountYuan - row.amount_yuan) > 0.001
  ) {
    return { ok: false };
  }
  if (row.status === "paid") return { ok: true, alreadyPaid: true, userId: row.user_id, points: row.points };
  if (row.status !== "pending") return { ok: false };

  const upd = sqlite
    .prepare(
      `UPDATE payment_orders
       SET status = 'paid', external_trade_no = ?, paid_at = ?
       WHERE id = ? AND status = 'pending'`
    )
    .run(opts.externalTradeNo ?? null, now, opts.outTradeNo);
  if (upd.changes === 0) return { ok: true, alreadyPaid: true, userId: row.user_id, points: row.points };

  await grantPoints({
    userId: row.user_id,
    amount: row.points,
    reason: "recharge",
    refType: "payment_order",
    refId: row.id,
    meta: { channel: "wx_xpay", externalTradeNo: opts.externalTradeNo ?? null },
  });

  return { ok: true, userId: row.user_id, points: row.points };
}

/** 查询用户充值订单（小程序「充值记录」） */
export async function listRechargeOrders(userId: string, limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(paymentOrders)
    .where(and(eq(paymentOrders.userId, userId), eq(paymentOrders.channel, "wx_xpay")))
    .limit(limit);
}
