import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { resetDbInstance, getDb } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { users } from "@/lib/db/schema";
import { registerUser, loginUser } from "@/lib/user/auth";
import {
  assertCanSpend,
  BillingError,
  grantPoints,
  spendPoints,
  getPointsStatus,
} from "@/lib/billing/points";
import { getBillingSettings, updateBillingSettings } from "@/lib/billing/settings";

const testDbPath = path.resolve(process.cwd(), "data/test-billing.db");

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

describe("billing points", () => {
  it("grants register bonus of 10 points", async () => {
    const user = await registerUser({
      email: "points@example.com",
      password: "secret12",
    });
    const status = await getPointsStatus(user.id);
    expect(status.balance).toBe(10);
  });

  it("spends points and rejects insufficient balance", async () => {
    const user = await registerUser({
      email: "spend@example.com",
      password: "secret12",
    });
    const spent = await spendPoints({
      userId: user.id,
      amount: 3,
      reason: "test_spend",
    });
    expect(spent.spent).toBe(3);
    expect(spent.balance).toBe(7);

    await expect(
      spendPoints({ userId: user.id, amount: 100, reason: "too_much" })
    ).rejects.toBeInstanceOf(BillingError);
  });

  it("does not spend when billing disabled", async () => {
    const user = await registerUser({
      email: "free@example.com",
      password: "secret12",
    });
    await updateBillingSettings({ billingEnabled: false });
    const spent = await spendPoints({
      userId: user.id,
      amount: 5,
      reason: "should_be_free",
    });
    expect(spent.spent).toBe(0);
    expect(spent.balance).toBe(10);
    await updateBillingSettings({ billingEnabled: true });
  });

  it("admin gift increases balance", async () => {
    const user = await registerUser({
      email: "gift@example.com",
      password: "secret12",
    });
    const { balance } = await grantPoints({
      userId: user.id,
      amount: 20,
      reason: "admin_gift",
    });
    expect(balance).toBe(30);
  });

  it("blocks disabled users from spending", async () => {
    const user = await registerUser({
      email: "disabled@example.com",
      password: "secret12",
    });
    const db = getDb();
    await db
      .update(users)
      .set({ status: "disabled", updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    await expect(assertCanSpend(user.id, 1)).rejects.toMatchObject({ code: "user_disabled" });
    await expect(loginUser({ account: "disabled@example.com", password: "secret12" })).rejects.toThrow(
      /停用/
    );
  });

  it("charges zero for everyone when billing disabled", async () => {
    const user = await registerUser({
      email: "billing-off@example.com",
      password: "secret12",
    });
    await updateBillingSettings({ billingEnabled: false });
    const { requireSpendable, spendPoints: spend } = await import("@/lib/billing/points");
    const pre = await requireSpendable(user.id, "ai");
    expect(pre.amount).toBe(0);
    const spent = await spend({
      userId: user.id,
      amount: pre.amount,
      reason: "billing_off",
    });
    expect(spent.spent).toBe(0);
    expect(spent.balance).toBe(10);
    await updateBillingSettings({ billingEnabled: true });
  });

  it("admin never spends points even with zero balance", async () => {
    const user = await registerUser({
      email: "admin-user@example.com",
      password: "secret12",
    });
    const db = getDb();
    await db
      .update(users)
      .set({ role: "admin", pointsBalance: 0, status: "disabled", updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    await assertCanSpend(user.id, 999);
    const spent = await spendPoints({
      userId: user.id,
      amount: 999,
      reason: "admin_free",
    });
    expect(spent.spent).toBe(0);
    expect(spent.unlimited).toBe(true);

    const loggedIn = await loginUser({ account: "admin-user@example.com", password: "secret12" });
    expect(loggedIn.id).toBe(user.id);
  });

  it("reads default billing settings", async () => {
    const s = await getBillingSettings();
    expect(s.costCalc).toBeGreaterThanOrEqual(0);
    expect(s.costAi).toBeGreaterThanOrEqual(s.costCalc);
    expect(s.costLifeInsights).toBeGreaterThanOrEqual(0);
    expect(s.yuanToPoints).toBe(10);
  });

  it("persists life insights unlock cost", async () => {
    await updateBillingSettings({ costLifeInsights: 42 });
    const s = await getBillingSettings();
    expect(s.costLifeInsights).toBe(42);
    await updateBillingSettings({ costLifeInsights: 30 });
  });

  it("atomic spend rejects when concurrent balance would go negative", async () => {
    const user = await registerUser({
      email: "atomic-spend@example.com",
      password: "secret12",
    });
    const db = getDb();
    await db
      .update(users)
      .set({ pointsBalance: 5, updatedAt: new Date().toISOString() })
      .where(eq(users.id, user.id));

    const a = await spendPoints({ userId: user.id, amount: 3, reason: "a" });
    expect(a.balance).toBe(2);
    await expect(spendPoints({ userId: user.id, amount: 3, reason: "b" })).rejects.toMatchObject({
      code: "insufficient_points",
    });
    const status = await getPointsStatus(user.id);
    expect(status.balance).toBe(2);
  });

  it("unlock life insights is idempotent and charges once", async () => {
    const { unlockLifeInsights } = await import("@/lib/user/reports");
    const { reports } = await import("@/lib/db/schema");
    const user = await registerUser({
      email: "unlock-once@example.com",
      password: "secret12",
    });
    const db = getDb();
    await db
      .update(users)
      .set({
        allowLifeInsights: true,
        pointsBalance: 100,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    const reportId = crypto.randomUUID();
    const insights = {
      version: 1,
      disclaimer: "test",
      timeline: [],
      liuqin: [],
      careerHint: {
        industries: ["测试"],
        currentJobDetectable: false as const,
        currentLikelihoodNote: "n",
        note: "n",
        basis: "t",
      },
    };
    await db.insert(reports).values({
      id: reportId,
      userId: user.id,
      profileId: null,
      moduleId: "bazi",
      factsJson: JSON.stringify({ adminInsights: insights }),
      templateReport: "模板",
      aiReport: null,
      pointsSpent: 0,
      lifeInsightsUnlocked: false,
      createdAt: new Date().toISOString(),
    });

    await updateBillingSettings({ costLifeInsights: 30, billingEnabled: true });

    const first = await unlockLifeInsights(user.id, reportId);
    expect(first.alreadyUnlocked).toBe(false);
    expect(first.spent).toBe(30);

    const second = await unlockLifeInsights(user.id, reportId);
    expect(second.alreadyUnlocked).toBe(true);
    expect(second.spent).toBe(0);

    const status = await getPointsStatus(user.id);
    expect(status.balance).toBe(70);
  });

  it("unlock fails without enough points and leaves locked", async () => {
    const { unlockLifeInsights } = await import("@/lib/user/reports");
    const { reports } = await import("@/lib/db/schema");
    const user = await registerUser({
      email: "unlock-broke@example.com",
      password: "secret12",
    });
    const db = getDb();
    await db
      .update(users)
      .set({
        allowLifeInsights: true,
        pointsBalance: 5,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    const reportId = crypto.randomUUID();
    await db.insert(reports).values({
      id: reportId,
      userId: user.id,
      profileId: null,
      moduleId: "bazi",
      factsJson: JSON.stringify({
        adminInsights: {
          version: 1,
          disclaimer: "t",
          timeline: [],
          liuqin: [],
          careerHint: {
            industries: [],
            currentJobDetectable: false,
            currentLikelihoodNote: "n",
            note: "n",
            basis: "t",
          },
        },
      }),
      templateReport: "模板",
      aiReport: null,
      pointsSpent: 0,
      lifeInsightsUnlocked: false,
      createdAt: new Date().toISOString(),
    });

    await updateBillingSettings({ costLifeInsights: 30, billingEnabled: true });
    await expect(unlockLifeInsights(user.id, reportId)).rejects.toMatchObject({
      code: "insufficient_points",
    });

    const [r] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    expect(r.lifeInsightsUnlocked).toBe(false);
    const status = await getPointsStatus(user.id);
    expect(status.balance).toBe(5);
  });

  it("unlock forbidden when allowLifeInsights is off", async () => {
    const { unlockLifeInsights } = await import("@/lib/user/reports");
    const { reports } = await import("@/lib/db/schema");
    const user = await registerUser({
      email: "unlock-forbid@example.com",
      password: "secret12",
    });
    const db = getDb();
    await db
      .update(users)
      .set({
        allowLifeInsights: false,
        pointsBalance: 100,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    const reportId = crypto.randomUUID();
    await db.insert(reports).values({
      id: reportId,
      userId: user.id,
      profileId: null,
      moduleId: "bazi",
      factsJson: JSON.stringify({
        adminInsights: {
          version: 1,
          disclaimer: "t",
          timeline: [],
          liuqin: [],
          careerHint: {
            industries: [],
            currentJobDetectable: false,
            currentLikelihoodNote: "n",
            note: "n",
            basis: "t",
          },
        },
      }),
      templateReport: "模板",
      aiReport: null,
      pointsSpent: 0,
      lifeInsightsUnlocked: false,
      createdAt: new Date().toISOString(),
    });

    await expect(unlockLifeInsights(user.id, reportId)).rejects.toMatchObject({
      code: "forbidden",
    });
  });
});
