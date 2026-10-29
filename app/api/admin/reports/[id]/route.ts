import { NextResponse } from "next/server";
import { ensureSeeded } from "../../../init/route";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";
import { getAdminReport } from "@/lib/admin/reports";

async function requireAdmin(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const report = await getAdminReport(id);
  if (!report) return NextResponse.json({ error: "报告不存在" }, { status: 404 });
  return NextResponse.json(report);
}
