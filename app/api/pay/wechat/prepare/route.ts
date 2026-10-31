import { NextResponse } from "next/server";
import { ensureSeeded } from "../../../init/route";
import { isAuthError, requireUser } from "@/lib/user/profiles";
import {
  RECHARGE_PACKAGES,
  buildVirtualPaymentPayload,
  createRechargeOrder,
  findPackage,
  isXpayConfigured,
} from "@/lib/billing/recharge";

export const runtime = "nodejs";

/** GET: 档位列表 + 虚拟支付是否已配置 */
export async function GET() {
  return NextResponse.json({
    packages: RECHARGE_PACKAGES.map((p) => ({
      id: p.id,
      label: p.label,
      priceFen: p.priceFen,
      priceYuan: p.priceFen / 100,
      points: p.points,
      bonusPoints: p.bonusPoints,
    })),
    xpayConfigured: isXpayConfigured(),
  });
}

/** POST { packageId } → 创建 pending 订单并返回 wx.requestVirtualPayment 参数 */
export async function POST(request: Request) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  if (!isXpayConfigured()) {
    return NextResponse.json(
      { error: "充值渠道暂未开通（服务端未配置虚拟支付），请联系管理员" },
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
    const order = await createRechargeOrder({ userId: session.userId, pkg });
    const payload = await buildVirtualPaymentPayload({
      orderId: order.id,
      userId: session.userId,
      pkg,
    });
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
