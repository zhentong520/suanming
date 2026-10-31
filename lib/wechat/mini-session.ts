/**
 * 微信小程序服务端会话：code2Session / stable_token / 虚拟支付实单查询。
 * 环境变量：
 *   WX_MINI_APPID            小程序 AppID
 *   WX_MINI_SECRET           小程序 AppSecret
 *   WX_MINI_APPKEY           现网 AppKey（虚拟支付，env=0）
 *   WX_MINI_SANDBOX_APPKEY   沙箱 AppKey（env=1）
 *   WX_MINI_PAY_ENV          0 正式 / 1 沙箱
 * 未配置时所有能力返回明确错误，不 crash。
 */

import { createHmac } from "crypto";

export interface WxSession {
  openid: string;
  sessionKey: string;
  unionid?: string;
}

export function getWxMiniConfig(): { appid: string; secret: string } | null {
  const appid = process.env.WX_MINI_APPID?.trim();
  const secret = process.env.WX_MINI_SECRET?.trim();
  if (!appid || !secret) return null;
  return { appid, secret };
}

/**
 * 调用微信 jscode2session，换取 openid 与 session_key。
 * 错误码文档：https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
 */
export async function wxCodeToSession(code: string): Promise<WxSession> {
  const cfg = getWxMiniConfig();
  if (!cfg) {
    throw new Error("服务端未配置 WX_MINI_APPID / WX_MINI_SECRET，暂不支持微信登录");
  }
  const url =
    "https://api.weixin.qq.com/sns/jscode2session" +
    `?appid=${encodeURIComponent(cfg.appid)}` +
    `&secret=${encodeURIComponent(cfg.secret)}` +
    `&js_code=${encodeURIComponent(code)}` +
    "&grant_type=authorization_code";

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`微信会话接口请求失败(${res.status})`);
  const data = (await res.json()) as {
    errcode?: number;
    errmsg?: string;
    openid?: string;
    session_key?: string;
    unionid?: string;
  };

  if (data.errcode && data.errcode !== 0) {
    if (data.errcode === 40029) throw new Error("微信登录凭据无效，请重试");
    if (data.errcode === 45011) throw new Error("微信接口限频，请稍后再试");
    if (data.errcode === 40226) throw new Error("该用户已被微信风控，暂不能登录");
    throw new Error(`微信登录失败(${data.errcode})：${data.errmsg ?? "未知错误"}`);
  }
  if (!data.openid || !data.session_key) {
    throw new Error("微信登录返回不完整，请重试");
  }
  return { openid: data.openid, sessionKey: data.session_key, unionid: data.unionid };
}

/* ===== 虚拟支付服务端 API（/xpay/*）===== */

/** xpay 环境：0 正式 / 1 沙箱（AppKey 两套，必须配对） */
export function xpayEnv(): number {
  return process.env.WX_MINI_PAY_ENV === "1" ? 1 : 0;
}

/** 按 env 取对应 AppKey；未配置返回 null */
export function getXpayAppKey(): string | null {
  const key =
    xpayEnv() === 1 ? process.env.WX_MINI_SANDBOX_APPKEY?.trim() : process.env.WX_MINI_APPKEY?.trim();
  return key || null;
}

/** HMAC-SHA256 → hex 小写（微信虚拟支付签名规范） */
function hmacHex(key: string, message: string): string {
  return createHmac("sha256", key).update(message, "utf8").digest("hex");
}

/** 服务端 /xpay/* 接口的 pay_sig：hex(HMAC-SHA256(AppKey, uri + '&' + postBody)) */
export function xpayPaySig(uri: string, postBody: string): string {
  const appKey = getXpayAppKey();
  if (!appKey) throw new Error("服务端未配置虚拟支付 AppKey（WX_MINI_APPKEY / WX_MINI_SANDBOX_APPKEY）");
  return hmacHex(appKey, `${uri}&${postBody}`);
}

/* ---- access_token 稳定凭证（进程内缓存，到期前 300s 主动刷新） ---- */
let cachedToken: { token: string; expiresAt: number } | null = null;
let tokenPromise: Promise<string> | null = null;

export async function getStableAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 300_000) return cachedToken.token;
  if (tokenPromise) return tokenPromise;

  tokenPromise = (async () => {
    const cfg = getWxMiniConfig();
    if (!cfg) throw new Error("服务端未配置 WX_MINI_APPID / WX_MINI_SECRET");
    const res = await fetch("https://api.weixin.qq.com/cgi-bin/stable_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "client_credential", appid: cfg.appid, secret: cfg.secret }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`获取 access_token 失败(${res.status})`);
    const data = (await res.json()) as { access_token?: string; expires_in?: number; errcode?: number; errmsg?: string };
    if (!data.access_token) {
      throw new Error(`获取 access_token 失败(${data.errcode})：${data.errmsg ?? ""}`);
    }
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 7200) * 1000,
    };
    return data.access_token;
  })();

  try {
    return await tokenPromise;
  } finally {
    tokenPromise = null;
  }
}

export interface WxOrderQueryResult {
  /** 微信侧确认订单已支付成功 */
  paid: boolean;
  /** 微信内部单号（回填订单用） */
  wxOrderId?: string;
  /** 订单状态原文（0 创建 / 1 支付成功 / 2 已退款 / 3 已关闭，以微信文档为准） */
  orderStatus?: number;
  /** 实付金额（分） */
  paidFee?: number;
  errcode?: number;
  errmsg?: string;
}

/**
 * 服务端实单查询：POST /xpay/query_order。
 * 发货前调用，确保只有微信侧真实支付成功的订单才会入账。
 */
export async function wxQueryXpayOrder(opts: {
  openid: string;
  orderId: string;
}): Promise<WxOrderQueryResult> {
  const appKey = getXpayAppKey();
  if (!appKey) throw new Error("服务端未配置虚拟支付 AppKey");

  // 字段顺序固定（签名基于原始串，不能二次序列化）
  const body = JSON.stringify({ openid: opts.openid, env: xpayEnv(), order_id: opts.orderId });
  const paySig = hmacHex(appKey, `/xpay/query_order&${body}`);
  const accessToken = await getStableAccessToken();

  const res = await fetch(
    `https://api.weixin.qq.com/xpay/query_order?access_token=${encodeURIComponent(accessToken)}&pay_sig=${encodeURIComponent(paySig)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(15_000),
    }
  );
  if (!res.ok) throw new Error(`query_order 请求失败(${res.status})`);
  const data = (await res.json()) as {
    errcode?: number;
    errmsg?: string;
    order?: {
      order_status?: number;
      wx_order_id?: string;
      paid_fee?: number;
    };
  };

  if (data.errcode && data.errcode !== 0) {
    return { paid: false, errcode: data.errcode, errmsg: data.errmsg };
  }
  const orderStatus = data.order?.order_status;
  return {
    // 1 = 支付成功（0 创建 / 2 退款 / 3 关闭）
    paid: orderStatus === 1,
    wxOrderId: data.order?.wx_order_id,
    orderStatus,
    paidFee: data.order?.paid_fee,
    errcode: data.errcode ?? 0,
    errmsg: data.errmsg,
  };
}
