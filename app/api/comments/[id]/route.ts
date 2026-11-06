import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { isAuthError, requireUser } from "@/lib/user/profiles";
import { commentErrorResponse, deleteComment } from "@/lib/user/comments";

/** 删除留言：本人可删自己的，管理员可删任意 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  try {
    const session = await requireUser(_request);
    if (isAuthError(session)) return session;

    const { id } = await params;
    const ok = await deleteComment(session, id);
    if (!ok) {
      return NextResponse.json({ error: "留言不存在或无权删除" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return commentErrorResponse(error);
  }
}
