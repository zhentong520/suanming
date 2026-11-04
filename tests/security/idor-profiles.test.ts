/**
 * 档案/报告越权访问（IDOR）防线测试
 * 直接调路由层函数（不经 HTTP），验证跨用户访问被拒。
 */
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";

describe("档案隔离（IDOR 防线）", () => {
  it("computeModuleReport 拒绝用他人档案算卦", async () => {
    const { runModule } = await import("@/lib/hub/divination-router");
    const { randomUUID } = await import("crypto");

    // 模拟：请求方 userId 是陌生人，profileId 指向他人（或不存在）档案
    await expect(
      runModule({
        module: "bazi",
        userId: randomUUID(),
        profileId: randomUUID(), // 不属于该用户
        params: {},
      } as never)
    ).rejects.toThrow(/档案不存在|需要档案/);
  });

  it("getProfileForUser 只返回本人档案", async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/idortest.db";
    const { getProfileForUser } = await import("@/lib/user/profiles");
    const { getDb } = await import("@/lib/db/client");
    const { profiles } = await import("@/lib/db/schema");
    const db = getDb();

    const ownerId = "owner-" + randomUUID();
    const strangerId = "stranger-" + randomUUID();
    const pid = randomUUID();
    db.insert(profiles)
      .values({
        id: pid,
        userId: ownerId,
        name: "本人档案",
        gender: "男",
        calendarType: "solar",
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoNothing()
      .run();

    // 本人可见
    expect(await getProfileForUser(ownerId, pid)).toBeTruthy();
    // 陌生人不可见
    expect(await getProfileForUser(strangerId, pid)).toBeNull();
  });
});
