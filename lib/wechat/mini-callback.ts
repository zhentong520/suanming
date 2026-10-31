/**
 * 微信小程序「消息推送」自建回调协议（虚拟支付发货事件走此通道）。
 *
 * 配置入口：小程序后台 → 开发 → 开发管理 → 消息推送
 *   - URL 填本服务 /api/pay/wechat/notify
 *   - Token 填 WX_MINI_CALLBACK_TOKEN
 *   - 数据格式选 JSON，消息加密方式选「明文模式」
 *   （安全性由「query_order 实单确认后才发货」保证，见 lib/billing/recharge.ts）
 *
 * 协议（https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/message-push.html）：
 *   GET  URL 校验：query 带 signature/timestamp/nonce/echostr，
 *        将 Token、timestamp、nonce 字典序排序后拼接做 SHA1，与 signature 一致 → 原样返回 echostr
 *   POST 事件：明文模式直接读 body（JSON）
 */

import { createHash } from "crypto";

export function getCallbackToken(): string | null {
  return process.env.WX_MINI_CALLBACK_TOKEN?.trim() || null;
}

/** GET URL 校验：合法返回应答的 echostr，否则 null */
export function verifyCallbackUrl(query: URLSearchParams): string | null {
  const token = getCallbackToken();
  if (!token) return null;
  const signature = query.get("signature") ?? "";
  const timestamp = query.get("timestamp") ?? "";
  const nonce = query.get("nonce") ?? "";
  const echostr = query.get("echostr") ?? "";
  if (!signature || !echostr) return null;

  const sha1 = createHash("sha1")
    .update([token, timestamp, nonce].sort().join(""), "utf8")
    .digest("hex");
  return sha1 === signature ? echostr : null;
}

export interface CallbackOrderRef {
  /** 商户订单号（我们 payment_orders.id，即 out_trade_no） */
  outTradeNo?: string;
  /** 微信内部单号（用于按 external_trade_no 兜底匹配） */
  wxOrderId?: string;
  openid?: string;
  /** 事件类型（如 xpay_goods_deliver_notify / xpay_refund_notify） */
  event?: string;
}

/**
 * 从回调事件体解析订单引用。
 * 兼容 JSON（消息推送配置的数据格式）。XML 格式做兜底正则抽取。
 */
export function parseCallbackOrderRef(bodyText: string): CallbackOrderRef | null {
  if (!bodyText.trim()) return null;
  try {
    const data = JSON.parse(bodyText) as Record<string, unknown>;
    const outTradeNo = firstStr(data.OutTradeNo, data.out_trade_no, data.orderId, data.order_id, data.attach) ?? undefined;
    const wxOrderId = firstStr(data.WxOrderId, data.wx_order_id) ?? undefined;
    // 无订单引用的消息（文本/心跳等）不算回调事件
    if (!outTradeNo && !wxOrderId) return null;
    return {
      outTradeNo,
      wxOrderId,
      openid: firstStr(data.OpenId, data.openid, data.FromUserName) ?? undefined,
      event: firstStr(data.Event, data.event, data.MsgType) ?? undefined,
    };
  } catch {
    /* fallthrough to XML */
  }
  // XML 兜底：抽取常见标签
  const pick = (tag: string): string | undefined =>
    new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([^<\\]]*)(?:\\]\\]>)?</${tag}>`).exec(bodyText)?.[1] ||
    undefined;
  const outTradeNo = pick("OutTradeNo") ?? pick("out_trade_no");
  const wxOrderId = pick("WxOrderId") ?? pick("wx_order_id");
  if (!outTradeNo && !wxOrderId) return null;
  return {
    outTradeNo,
    wxOrderId,
    openid: pick("OpenId") ?? pick("openid"),
    event: pick("Event") ?? pick("event"),
  };
}

function firstStr(...vals: Array<unknown>): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v) return v;
  }
  return null;
}
