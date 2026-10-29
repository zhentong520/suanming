import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";
import { getBillingSettings, updateBillingSettings } from "@/lib/billing/settings";

async function requireAdmin(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const settings = await getBillingSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await request.json();
  const settings = await updateBillingSettings({
    billingEnabled: typeof body.billingEnabled === "boolean" ? body.billingEnabled : undefined,
    costCalc: typeof body.costCalc === "number" ? body.costCalc : undefined,
    costAi: typeof body.costAi === "number" ? body.costAi : undefined,
    costVision: typeof body.costVision === "number" ? body.costVision : undefined,
    costLifeInsights: typeof body.costLifeInsights === "number" ? body.costLifeInsights : undefined,
    registerBonus: typeof body.registerBonus === "number" ? body.registerBonus : undefined,
    yuanToPoints: typeof body.yuanToPoints === "number" ? body.yuanToPoints : undefined,
  });
  return NextResponse.json({ ok: true, settings });
}
