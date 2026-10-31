import { NextResponse } from "next/server";
import { handleAlipayNotify } from "@/lib/billing/alipay";

export const runtime = "nodejs";

/**
 * 支付宝异步通知（POST form-urlencoded）。
 * 处理成功必须返回纯文本 "success"，否则支付宝按衰减策略重试。
 */
export async function POST(request: Request) {
  let params: Record<string, string>;
  try {
    const form = await request.formData();
    params = {};
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") params[k] = v;
    }
  } catch {
    return new NextResponse("fail: bad form", { status: 400 });
  }

  const result = await handleAlipayNotify(params);
  if (!result.ok) {
    return new NextResponse(`fail: ${result.reason ?? "unknown"}`, { status: 400 });
  }
  return new NextResponse("success", { status: 200 });
}
