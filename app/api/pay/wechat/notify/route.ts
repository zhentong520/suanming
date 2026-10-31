import { NextResponse } from "next/server";
import {
  fulfillRechargeOrder,
  verifyXpayNotifySignature,
} from "@/lib/billing/recharge";

export const runtime = "nodejs";

/**
 * 微信虚拟支付发货回调（xpay_goods_deliver_notify / xpay_coin_pay_notify 类事件推送）。
 * 约定：attach 里透传业务订单号（outTradeNo），或直接用 body.outTradeNo。
 * 必须返回 { ErrCode: 0, ErrMsg: "success" }，否则微信会持续重试。
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const uri = url.pathname;
  const bodyText = await request.text();

  const providedSig =
    request.headers.get("x-pay-sign") ?? url.searchParams.get("sig") ?? null;
  if (!verifyXpayNotifySignature(uri, bodyText, providedSig)) {
    return NextResponse.json({ ErrCode: -4, ErrMsg: "signature invalid" }, { status: 401 });
  }

  let body: {
    OutTradeNo?: string;
    outTradeNo?: string;
    WxOrderId?: string;
    wxOrderId?: string;
    attach?: string;
  };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ ErrCode: -1, ErrMsg: "bad json" }, { status: 400 });
  }

  const outTradeNo = body.OutTradeNo ?? body.outTradeNo ?? body.attach ?? "";
  if (!outTradeNo) {
    return NextResponse.json({ ErrCode: -1, ErrMsg: "missing out_trade_no" }, { status: 400 });
  }

  const result = await fulfillRechargeOrder({
    outTradeNo,
    externalTradeNo: body.WxOrderId ?? body.wxOrderId,
  });

  if (!result.ok) {
    return NextResponse.json({ ErrCode: -1, ErrMsg: "order not found" }, { status: 404 });
  }

  return NextResponse.json({ ErrCode: 0, ErrMsg: "success" });
}
