import { NextResponse } from "next/server";
import { ensureSeeded } from "../../../init/route";
import { isAuthError, requireUser } from "@/lib/user/profiles";
import {
  buildPagePayUrl,
  createAlipayOrder,
  isAlipayConfigured,
} from "@/lib/billing/alipay";
import { findPackage } from "@/lib/billing/recharge";

export const runtime = "nodejs";

/** GET: 支付宝网页支付是否已配置 */
export async function GET() {
  return NextResponse.json({ alipayConfigured: isAlipayConfigured() });
}

/** POST { packageId } → 创建 pending 订单并返回支付宝收银台跳转 URL */
export async function POST(request: Request) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  if (!isAlipayConfigured()) {
    return NextResponse.json(
      { error: "支付宝网页支付暂未开通，请联系管理员" },
      { status: 503 }
    );
  }

  let body: { packageId?: string };
  try {
    body = (await request.json()) as { packageId?: string };
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }
  const pkg = findPackage(body.packageId ?? "");
  if (!pkg) return NextResponse.json({ error: "未知充值档位" }, { status: 400 });

  try {
    const order = await createAlipayOrder({ userId: session.userId, pkg });
    const redirectUrl = buildPagePayUrl({ orderId: order.id, pkg });
    return NextResponse.json({ orderId: order.id, redirectUrl });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
