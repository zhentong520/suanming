import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { resetDbInstance } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { registerUser } from "@/lib/user/auth";
import {
  CommentError,
  COMMENT_MAX_LENGTH,
  adminDeleteComment,
  adminListComments,
  createComment,
  deleteComment,
  listComments,
  resetCommentRateLimiterForTest,
  setCommentStatus,
  validateCommentContent,
  type CommentItem,
} from "@/lib/user/comments";
import type { UserSession } from "@/lib/user/auth";

const testDbPath = path.resolve(process.cwd(), "data/test-comments.db");

function toSession(u: { id: string; email: string | null; phone: string | null; displayName: string | null; role?: string }): UserSession {
  return {
    userId: u.id,
    email: u.email,
    phone: u.phone,
    displayName: u.displayName,
    activeProfileId: null,
    role: u.role ?? "user",
  };
}

let alice: UserSession;
let bob: UserSession;
let admin: UserSession;

beforeAll(async () => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  process.env.DATABASE_URL = `file:${testDbPath}`;
  resetDbInstance();
  runMigrations();

  const aliceUser = await registerUser({ email: "alice@example.com", password: "secret12", displayName: "阿荔" });
  alice = toSession({ ...aliceUser, role: "user" });
  const bobUser = await registerUser({ email: "bob@example.com", password: "secret12", displayName: "阿泊" });
  bob = toSession({ ...bobUser, role: "user" });
  const rootUser = await registerUser({ email: "root@example.com", password: "secret12", displayName: "管理员" });
  admin = toSession({ ...rootUser, role: "admin" });
});

afterAll(() => {
  resetDbInstance();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

beforeEach(() => {
  // 频率限制是进程内状态，用例间重置；用例内部仍可验证限频逻辑
  resetCommentRateLimiterForTest();
});

describe("comments", () => {
  it("validates content", () => {
    expect(() => validateCommentContent("   ")).toThrow(CommentError);
    expect(() => validateCommentContent("a".repeat(COMMENT_MAX_LENGTH + 1))).toThrow(CommentError);
    expect(validateCommentContent("  好\n\n运   来  ")).toBe("好 运 来");
  });

  it("creates a comment with nickname snapshot and lists it", async () => {
    const item = await createComment(alice, "初来乍到，请多指教");
    expect(item.nickname).toBe("阿荔");
    expect(item.status).toBe("visible");

    const { items, total } = await listComments(null, 20, 0);
    expect(total).toBe(1);
    expect(items[0].content).toBe("初来乍到，请多指教");
    expect(items[0].canDelete).toBe(false);
  });

  it("enforces per-user rate limit", async () => {
    await createComment(bob, "第一条");
    await expect(createComment(bob, "第二条")).rejects.toThrow(CommentError);
    // 换人不受影响
    await expect(createComment(admin, "管理员第一条")).resolves.toBeTruthy();
  });

  it("supports one-level reply", async () => {
    const top = (await listComments(null, 20, 0)).items.find((c) => c.content === "初来乍到，请多指教")!;
    const reply = await createComment(bob, "欢迎欢迎", top.id);
    expect(reply.parentId).toBe(top.id);
    expect(reply.replyTo).toBe("阿荔");

    // 回复的回复挂到顶层，回复对象显示为顶层作者
    const reply2 = await createComment(alice, "谢谢", reply.id);
    expect(reply2.parentId).toBe(top.id);
    expect(reply2.replyTo).toBe("阿荔");
  });

  it("hides comments from public list and restores them", async () => {
    const { items } = await listComments(null, 50, 0);
    const target = items.find((c) => c.content === "管理员第一条")!;
    expect(await setCommentStatus(target.id, "hidden")).toBe(true);

    const afterHide = await listComments(null, 50, 0);
    expect(afterHide.items.find((c) => c.id === target.id)).toBeUndefined();

    expect(await setCommentStatus(target.id, "visible")).toBe(true);
  });

  it("allows owner delete but not others", async () => {
    const { items } = await listComments(bob, 50, 0);
    const bobReply = items.find((c) => c.content === "欢迎欢迎")!;
    // 阿荔不能删阿泊的回复
    expect(await deleteComment(alice, bobReply.id)).toBe(false);
    // 本人可删，连带子回复
    expect(await deleteComment(bob, bobReply.id)).toBe(true);
    const after = await listComments(null, 50, 0);
    expect(after.items.find((c) => c.id === bobReply.id)).toBeUndefined();
  });

  it("admin can hard delete and sees hidden items in admin list", async () => {
    const adminView = await adminListComments(100);
    expect(adminView.length).toBeGreaterThanOrEqual(3);

    const victim = adminView[0];
    await adminDeleteComment(victim.id);
    const after = await adminListComments(100);
    expect(after.find((c) => c.id === victim.id)).toBeUndefined();
  });
});
