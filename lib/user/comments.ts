import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { comments } from "@/lib/db/schema";
import type { UserSession } from "./auth";

export const COMMENT_MAX_LENGTH = 500;
/** 同一用户两次留言最小间隔（防灌水） */
export const COMMENT_POST_INTERVAL_MS = 60_000;

/** 进程内频率限制（重启即重置，够用；换多实例部署时再落库） */
const lastPostAt = new Map<string, number>();

export interface CommentItem {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  parentId: string | null;
  replyTo: string | null;
  status: string;
  createdAt: string;
  canDelete: boolean;
}

export class CommentError extends Error {}

export function validateCommentContent(raw: unknown): string {
  if (typeof raw !== "string") throw new CommentError("留言内容不能为空");
  // 压掉换行/连续空白，防止排版灌水
  const content = raw.replace(/\s+/g, " ").trim();
  if (!content) throw new CommentError("留言内容不能为空");
  if (content.length > COMMENT_MAX_LENGTH) {
    throw new CommentError(`留言最多 ${COMMENT_MAX_LENGTH} 字`);
  }
  return content;
}

function assertRateLimit(userId: string) {
  const now = Date.now();
  const last = lastPostAt.get(userId) ?? 0;
  if (now - last < COMMENT_POST_INTERVAL_MS) {
    const waitSec = Math.ceil((COMMENT_POST_INTERVAL_MS - (now - last)) / 1000);
    throw new CommentError(`发言太频繁，请 ${waitSec} 秒后再试`);
  }
  lastPostAt.set(userId, now);
}

/** 仅供测试：清空进程内频率限制状态 */
export function resetCommentRateLimiterForTest() {
  lastPostAt.clear();
}

function canDelete(session: UserSession | null, row: { userId: string }): boolean {
  return Boolean(session && (session.role === "admin" || session.userId === row.userId));
}

/** 公开列表：仅 visible，倒序分页；登录用户额外带 canDelete */
export async function listComments(
  session: UserSession | null,
  limit: number,
  offset: number
): Promise<{ items: CommentItem[]; total: number }> {
  const db = getDb();
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safeOffset = Math.max(offset, 0);

  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.status, "visible"))
    .orderBy(desc(comments.createdAt))
    .limit(safeLimit)
    .offset(safeOffset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(comments)
    .where(eq(comments.status, "visible"));

  // 回复目标昵称（一层）
  const parentIds = rows.map((r) => r.parentId).filter((v): v is string => Boolean(v));
  const parentMap = new Map<string, string>();
  if (parentIds.length > 0) {
    const parents = await db
      .select({ id: comments.id, nickname: comments.nickname })
      .from(comments)
      .where(inArray(comments.id, parentIds));
    for (const p of parents) parentMap.set(p.id, p.nickname);
  }

  return {
    items: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      nickname: r.nickname,
      content: r.content,
      parentId: r.parentId,
      replyTo: r.parentId ? (parentMap.get(r.parentId) ?? null) : null,
      status: r.status,
      createdAt: r.createdAt,
      canDelete: canDelete(session, r),
    })),
    total: Number(count) || 0,
  };
}

export async function createComment(
  session: UserSession,
  content: string,
  parentId?: string | null
): Promise<CommentItem> {
  assertRateLimit(session.userId);

  let parent: { id: string; nickname: string; status: string } | null = null;
  if (parentId) {
    const db = getDb();
    const [row] = await db.select().from(comments).where(eq(comments.id, parentId)).limit(1);
    if (!row || row.status !== "visible") throw new CommentError("回复的留言不存在或已被隐藏");
    // 仅支持一层回复：回复的回复挂到顶层
    if (row.parentId) {
      const [top] = await db
        .select({ id: comments.id, nickname: comments.nickname, status: comments.status })
        .from(comments)
        .where(eq(comments.id, row.parentId))
        .limit(1);
      parent = top && top.status === "visible" ? top : null;
    } else {
      parent = { id: row.id, nickname: row.nickname, status: row.status };
    }
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const nickname = session.displayName?.trim() || "游客";
  const now = new Date().toISOString();
  await db.insert(comments).values({
    id,
    userId: session.userId,
    nickname,
    content,
    parentId: parent?.id ?? null,
    status: "visible",
    createdAt: now,
  });

  return {
    id,
    userId: session.userId,
    nickname,
    content,
    parentId: parent?.id ?? null,
    replyTo: parent?.nickname ?? null,
    status: "visible",
    createdAt: now,
    canDelete: true,
  };
}

export async function deleteComment(
  session: UserSession,
  commentId: string
): Promise<boolean> {
  const db = getDb();
  const [row] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!row) return false;
  if (!canDelete(session, row)) return false;

  if (session.role === "admin") {
    // 管理员硬删（连带其下的回复）
    await db.delete(comments).where(eq(comments.id, commentId));
  } else {
    const result = await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, session.userId)))
      .returning({ id: comments.id });
    if (result.length === 0) return false;
  }
  await db.delete(comments).where(eq(comments.parentId, commentId));
  return true;
}

// ---------- 管理端 ----------

export async function adminListComments(limit: number): Promise<CommentItem[]> {
  const db = getDb();
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const rows = await db
    .select()
    .from(comments)
    .orderBy(desc(comments.createdAt))
    .limit(safeLimit);

  const parentIds = rows.map((r) => r.parentId).filter((v): v is string => Boolean(v));
  const parentMap = new Map<string, string>();
  if (parentIds.length > 0) {
    const parents = await db
      .select({ id: comments.id, nickname: comments.nickname })
      .from(comments)
      .where(inArray(comments.id, parentIds));
    for (const p of parents) parentMap.set(p.id, p.nickname);
  }

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    nickname: r.nickname,
    content: r.content,
    parentId: r.parentId,
    replyTo: r.parentId ? (parentMap.get(r.parentId) ?? null) : null,
    status: r.status,
    createdAt: r.createdAt,
    canDelete: true,
  }));
}

export async function setCommentStatus(id: string, status: "visible" | "hidden"): Promise<boolean> {
  const db = getDb();
  const result = await db
    .update(comments)
    .set({ status })
    .where(eq(comments.id, id))
    .returning({ id: comments.id });
  return result.length > 0;
}

export async function adminDeleteComment(id: string): Promise<boolean> {
  const db = getDb();
  await db.delete(comments).where(eq(comments.id, id));
  await db.delete(comments).where(eq(comments.parentId, id));
  return true;
}

export function commentErrorResponse(error: unknown): NextResponse {
  if (error instanceof CommentError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error("[comments] unexpected error:", error);
  return NextResponse.json({ error: "留言服务开小差了，请稍后再试" }, { status: 500 });
}
