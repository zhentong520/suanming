import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-config";

export const runtime = "nodejs";

/**
 * 支付宝同步回跳（GET）：仅作展示引导，发货一律以异步通知为准。
 * 重定向回充值页并带 paid 标记，前端提示「到账确认中」。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL("/recharge", getSiteUrl());
  target.searchParams.set("paid", url.searchParams.get("out_trade_no") ? "1" : "0");
  return NextResponse.redirect(target.toString(), { status: 302 });
}
