import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";
import { listAdminOperations, type OpsCategory } from "@/lib/admin/operations";

async function requireAdmin(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const url = new URL(request.url);
  const category = (url.searchParams.get("category") ?? "all") as OpsCategory;
  // 钳制分页参数，防止异常大查询（与 admin/users 路由保持一致）
  const limit = Math.min(200, Math.max(1, Math.floor(Number(url.searchParams.get("limit") ?? 50)) || 50));
  const offset = Math.max(0, Math.floor(Number(url.searchParams.get("offset") ?? 0)) || 0);

  if (!["all", "calc", "non_calc"].includes(category)) {
    return NextResponse.json({ error: "category 无效" }, { status: 400 });
  }

  const data = await listAdminOperations({ category, limit, offset });
  return NextResponse.json(data);
}
