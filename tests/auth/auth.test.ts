import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { resetDbInstance } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import {
  registerUser,
  loginUser,
  createUserToken,
  verifyUserToken,
  setActiveProfile,
  validateRegisterInput,
} from "@/lib/user/auth";
import { getProfileForUser, resolveActiveProfileId } from "@/lib/user/profiles";
import { logUserOperation } from "@/lib/user/operations";
import { getDb } from "@/lib/db/client";
import { profiles, userOperations, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runModule } from "@/lib/hub/divination-router";

const testDbPath = path.resolve(process.cwd(), "data/test-auth.db");

beforeAll(() => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  process.env.DATABASE_URL = `file:${testDbPath}`;
  resetDbInstance();
  runMigrations();
});

afterAll(() => {
  resetDbInstance();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

describe("user auth", () => {
  it("registers with email and logs in", async () => {
    const user = await registerUser({
      email: "test@example.com",
      password: "secret12",
      displayName: "测试用户",
    });
    expect(user.email).toBe("test@example.com");

    const loggedIn = await loginUser({ account: "test@example.com", password: "secret12" });
    expect(loggedIn.id).toBe(user.id);

    const token = await createUserToken(user.id);
    const userId = await verifyUserToken(token);
    expect(userId).toBe(user.id);
  });

  it("registers with phone", async () => {
    const user = await registerUser({ phone: "13800138000", password: "pass123" });
    expect(user.phone).toBe("13800138000");
  });

  it("rejects invalid register input", () => {
    expect(() => validateRegisterInput({ password: "123" })).toThrow("请填写邮箱或手机号码");
    expect(() => validateRegisterInput({ email: "bad", password: "123456" })).toThrow("邮箱格式不正确");
    expect(() => validateRegisterInput({ phone: "123", password: "123456" })).toThrow("手机号码格式不正确");
    expect(() => validateRegisterInput({ email: "a@b.com", password: "123" })).toThrow("密码至少 6 位");
  });
});

describe("profiles per user", () => {
  it("creates multiple profiles and resolves active profile", async () => {
    const user = await registerUser({ email: "multi@example.com", password: "secret12" });
    const db = getDb();
    const now = new Date().toISOString();

    const profileA = crypto.randomUUID();
    const profileB = crypto.randomUUID();

    await db.insert(profiles).values([
      {
        id: profileA,
        userId: user.id,
        name: "档案甲",
        gender: "男",
        calendarType: "solar",
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 15,
        birthMinute: 0,
        timezone: "Asia/Shanghai",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: profileB,
        userId: user.id,
        name: "档案乙",
        gender: "女",
        calendarType: "solar",
        birthYear: 1992,
        birthMonth: 8,
        birthDay: 20,
        birthHour: 10,
        birthMinute: 0,
        timezone: "Asia/Shanghai",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await setActiveProfile(user.id, profileA);

    const [stored] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    expect(stored.activeProfileId).toBe(profileA);

    const session = {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      activeProfileId: profileA,
      role: "user" as const,
    };

    const activeId = await resolveActiveProfileId(session);
    expect(activeId).toBe(profileA);

    const profile = await getProfileForUser(user.id, profileA);
    expect(profile?.name).toBe("档案甲");

    await setActiveProfile(user.id, profileB);
    const sessionB = { ...session, activeProfileId: profileB };
    expect(await resolveActiveProfileId(sessionB)).toBe(profileB);
  });

  it("logs user operations", async () => {
    const user = await registerUser({ email: "ops@example.com", password: "secret12" });
    await logUserOperation({ userId: user.id, action: "register" });
    await logUserOperation({ userId: user.id, action: "module_calc", moduleId: "bazi" });

    const db = getDb();
    const ops = await db
      .select()
      .from(userOperations)
      .where(eq(userOperations.userId, user.id));

    expect(ops.length).toBeGreaterThanOrEqual(2);
    expect(ops.some((o) => o.action === "module_calc" && o.moduleId === "bazi")).toBe(true);
  });

  it("module calc uses active profile from session", async () => {
    const user = await registerUser({ email: "calc@example.com", password: "secret12" });
    const db = getDb();
    const now = new Date().toISOString();
    const profileId = crypto.randomUUID();

    await db.insert(profiles).values({
      id: profileId,
      userId: user.id,
      name: "测算档",
      gender: "男",
      calendarType: "solar",
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 15,
      birthHour: 15,
      birthMinute: 0,
      timezone: "Asia/Shanghai",
      createdAt: now,
      updatedAt: now,
    });
    await setActiveProfile(user.id, profileId);

    const result = await runModule({
      module: "bazi",
      userId: user.id,
      profileId,
      params: {},
    });

    expect(result.templateReport).toBeTruthy();
    expect(result.facts).toBeTruthy();
  });
});
