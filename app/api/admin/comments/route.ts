import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";
import {
  adminDeleteComment,
  adminListComments,
  CommentError,
  commentErrorResponse,
  setCommentStatus,
} from "@/lib/user/comments";

async function requireAdmin(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 100) || 100));
    const items = await adminListComments(limit);
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return commentErrorResponse(error);
  }
}

/** 隐藏 / 恢复留言 */
export async function PUT(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  try {
    const body = (await request.json().catch(() => null)) as {
      id?: unknown;
      status?: unknown;
    } | null;
    if (!body || typeof body.id !== "string") throw new CommentError("参数不正确");
    if (body.status !== "visible" && body.status !== "hidden") {
      throw new CommentError("状态只支持 visible / hidden");
    }
    const ok = await setCommentStatus(body.id, body.status);
    if (!ok) return NextResponse.json({ error: "留言不存在" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return commentErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) throw new CommentError("缺少留言 id");
    await adminDeleteComment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return commentErrorResponse(error);
  }
}
