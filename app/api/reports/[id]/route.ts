import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { getUserReport } from "@/lib/user/reports";
import { isAuthError, requireUser } from "@/lib/user/profiles";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const { id } = await params;
  const report = await getUserReport(session.userId, id);
  if (!report) {
    return NextResponse.json({ error: "报告不存在或无权查看" }, { status: 404 });
  }
  return NextResponse.json(report);
}
