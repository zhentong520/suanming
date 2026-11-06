import { NextResponse } from "next/server";
import { ensureSeeded } from "../init/route";
import { getSessionFromRequest } from "@/lib/user/auth";
import {
  CommentError,
  commentErrorResponse,
  createComment,
  listComments,
  validateCommentContent,
} from "@/lib/user/comments";

/** 公开留言列表（游客可读，登录用户带 canDelete 标记） */
export async function GET(request: Request) {
  await ensureSeeded();
  try {
    const session = await getSessionFromRequest(request);
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 20) || 20;
    const offset = Number(searchParams.get("offset") ?? 0) || 0;
    const data = await listComments(session, limit, offset);
    return NextResponse.json(data);
  } catch (error) {
    return commentErrorResponse(error);
  }
}

/** 发布留言（需登录，60 秒一条） */
export async function POST(request: Request) {
  await ensureSeeded();
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "请先登录后再留言" }, { status: 401 });
    }
    const body = (await request.json().catch(() => null)) as {
      content?: unknown;
      parentId?: unknown;
    } | null;
    if (!body) throw new CommentError("请求格式不正确");

    const content = validateCommentContent(body.content);
    const parentId =
      typeof body.parentId === "string" && body.parentId.trim() ? body.parentId.trim() : null;
    const item = await createComment(session, content, parentId);
    return NextResponse.json({ item });
  } catch (error) {
    return commentErrorResponse(error);
  }
}
