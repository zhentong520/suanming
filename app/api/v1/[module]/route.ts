import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureSeeded } from "../../init/route";
import { runModule } from "@/lib/hub/divination-router";
import { getModuleDefinition } from "@/lib/hub/module-registry";
import { getDb } from "@/lib/db/client";
import { modules, reports } from "@/lib/db/schema";
import { logUserOperation } from "@/lib/user/operations";
import { isAuthError, requireUser, resolveActiveProfileId } from "@/lib/user/profiles";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/security/rate-limit";
import { localeFromRequest } from "@/lib/i18n/request-locale";
import {
  BillingError,
  estimateCostKind,
  requireSpendable,
  resolveActualCostKind,
  spendPoints,
} from "@/lib/billing/points";
import { stripAdminInsights } from "@/lib/engine/bazi/admin-insights";

export async function POST(request: Request, { params }: { params: Promise<{ module: string }> }) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const isAdmin = session.role === "admin";

  if (!isAdmin) {
    const rate = checkRateLimit(clientKeyFromRequest(request, `v1:${session.userId}`), 60, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${rate.retryAfterSec} 秒后再试` },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }
  }

  const { module } = await params;
  const def = getModuleDefinition(module);
  if (!def) return NextResponse.json({ error: "未知模块" }, { status: 404 });

  const db = getDb();
  const [mod] = await db.select().from(modules).where(eq(modules.id, module)).limit(1);
  // 管理员可使用已关闭模块；普通用户不可
  if (!isAdmin && mod && !mod.enabled) {
    return NextResponse.json({ error: "该模块已关闭" }, { status: 403 });
  }

  const body = await request.json();
  const locale = localeFromRequest(request);
  const profileId = await resolveActiveProfileId(session, body.profileId ?? session.activeProfileId);
  const calcParams = (body.params ?? {}) as Record<string, unknown>;

  if (def.requiresProfile && !profileId) {
    return NextResponse.json({ error: "请先创建并选择当前档案" }, { status: 400 });
  }

  try {
    const estimatedKind = await estimateCostKind({
      moduleId: module,
      params: calcParams,
      skipAi: body.skipAi === true,
    });
    // 关闭收费时 amount=0；管理员 amount=0
    const precheck = await requireSpendable(session.userId, estimatedKind);

    const result = await runModule({
      module,
      userId: session.userId,
      profileId: profileId ?? undefined,
      params: calcParams,
      locale,
      skipAi: body.skipAi === true,
    });

    const actualKind = resolveActualCostKind({
      moduleId: module,
      facts: result.facts,
      aiReport: result.aiReport,
    });
    const charge = await requireSpendable(session.userId, actualKind);
    const spent = await spendPoints({
      userId: session.userId,
      amount: charge.amount,
      reason: `calc_${actualKind}`,
      refType: "report",
      refId: result.reportId,
      meta: {
        moduleId: module,
        kind: actualKind,
        billingEnabled: charge.billingEnabled,
        estimatedKind,
        precheckAmount: precheck.amount,
      },
    });

    if (result.reportId) {
      await db
        .update(reports)
        .set({ pointsSpent: spent.spent })
        .where(eq(reports.id, result.reportId));
    }

    await logUserOperation({
      userId: session.userId,
      action: "module_calc",
      moduleId: module,
      profileId: profileId ?? undefined,
      metadata: {
        ...(result.reportId ? { reportId: result.reportId } : {}),
        usedAi: Boolean(result.aiReport),
        locale,
        pointsSpent: spent.spent,
        pointsBalanceAfter: spent.balance,
        costKind: actualKind,
        billingEnabled: spent.billingEnabled,
      },
    });

    return NextResponse.json({
      ...result,
      facts: isAdmin ? result.facts : stripAdminInsights(result.facts as Record<string, unknown>),
      pointsSpent: spent.spent,
      pointsBalance: spent.unlimited ? null : spent.balance,
      pointsUnlimited: spent.unlimited,
      billingEnabled: spent.billingEnabled,
    });
  } catch (e) {
    if (e instanceof BillingError) {
      const status = e.code === "insufficient_points" ? 402 : e.code === "user_disabled" ? 403 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "计算失败" }, { status: 400 });
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const def = getModuleDefinition(module);
  if (!def) return NextResponse.json({ error: "未知模块" }, { status: 404 });
  return NextResponse.json(def);
}
