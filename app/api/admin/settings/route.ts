import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import {
  changeAdminPassword,
  getSecurityHints,
  getTokenFromRequest,
  verifyAdminToken,
} from "@/lib/admin/auth";
import { ensureAdminRoleByEmail } from "@/lib/ai/quota";
import { getVolcEnvConfig } from "@/lib/ai/volc-models";

async function requireAdmin(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const volc = getVolcEnvConfig();
  return NextResponse.json({
    username: typeof admin.username === "string" ? admin.username : "admin",
    security: getSecurityHints(),
    ai: {
      userQuota: volc.userQuota,
      volcConfigured: Boolean(volc.apiKey),
      textModel: volc.textModel,
      visionModel: volc.visionModel,
      baseUrl: volc.baseUrl,
    },
  });
}

export async function PUT(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await request.json();

  if (body.action === "grant-ai-admin") {
    const email = String(body.email ?? "").trim();
    if (!email) return NextResponse.json({ error: "请填写前台用户邮箱" }, { status: 400 });
    await ensureAdminRoleByEmail(email);
    return NextResponse.json({
      ok: true,
      message: `已将 ${email} 设为前台管理员角色（AI 无限次）。若账号尚未注册，请先注册再执行。`,
    });
  }

  const username =
    (typeof admin.username === "string" && admin.username) ||
    String(body.username ?? "admin");

  try {
    await changeAdminPassword({
      username,
      currentPassword: String(body.currentPassword ?? ""),
      newPassword: String(body.newPassword ?? ""),
    });
    return NextResponse.json({
      ok: true,
      message: "密码已更新。请使用新密码重新登录。",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "修改失败" }, { status: 400 });
  }
}
