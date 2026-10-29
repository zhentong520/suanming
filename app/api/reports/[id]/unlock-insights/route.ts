import { NextResponse } from "next/server";
import { ensureSeeded } from "../../../init/route";
import { isAuthError, requireUser } from "@/lib/user/profiles";
import { unlockLifeInsights } from "@/lib/user/reports";
import { BillingError } from "@/lib/billing/points";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const { id } = await params;
  try {
    const result = await unlockLifeInsights(session.userId, id);
    return NextResponse.json({
      ok: true,
      alreadyUnlocked: result.alreadyUnlocked,
      lifeInsights: result.lifeInsights,
      spent: result.spent,
      balance: result.balance,
    });
  } catch (e) {
    if (e instanceof BillingError) {
      const status =
        e.code === "not_found"
          ? 404
          : e.code === "forbidden"
            ? 403
            : e.code === "insufficient_points"
              ? 402
              : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "解锁失败" }, { status: 400 });
  }
}
