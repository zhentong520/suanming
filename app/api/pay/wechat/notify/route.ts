import { NextResponse } from "next/server";
import { ensureSeeded } from "../../../init/route";
import { verifyCallbackUrl, parseCallbackOrderRef } from "@/lib/wechat/mini-callback";
import { fulfillRechargeOrderWithWxConfirm } from "@/lib/billing/recharge";

export const runtime = "nodejs";

/**
 * 微信「消息推送」自建回调（虚拟支付发货/退款事件）。
 *
 * GET：小程序后台保存回调配置时的 URL 校验（SHA1 of Token，原样返回 echostr）。
 * POST：事件通知。发货安全由服务端 /xpay/query_order 实单确认保证，
 *       处理成功返回纯文本 "success"，否则微信按衰减策略重试（最多 15 次）。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const echostr = verifyCallbackUrl(url.searchParams);
  if (echostr === null) {
    return new NextResponse("fail", { status: 403 });
  }
  return new NextResponse(echostr, { status: 200 });
}

export async function POST(request: Request) {
  await ensureSeeded();
  const bodyText = await request.text();
  const ref = parseCallbackOrderRef(bodyText);
  if (!ref || (!ref.outTradeNo && !ref.wxOrderId)) {
    // 无订单引用（如异步事件通知/其他消息），按已处理应答避免无谓重试
    return new NextResponse("success", { status: 200 });
  }

  try {
    const result = await fulfillRechargeOrderWithWxConfirm({
      outTradeNo: ref.outTradeNo,
      wxOrderId: ref.wxOrderId,
      openid: ref.openid,
    });
    if (!result.ok) {
      // 订单不存在/未支付/微信侧异常 → 让微信重试（衰减策略）
      return new NextResponse(`fail: ${result.reason ?? "unknown"}`, { status: 400 });
    }
    return new NextResponse("success", { status: 200 });
  } catch (err) {
    return new NextResponse(`fail: ${(err as Error).message}`, { status: 500 });
  }
}
