import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { runMigrations } from "./migrate";
import {
  modules,
  adminUsers,
  aiGlobalSettings,
  aiModuleSwitches,
  aiProviders,
  moduleStats,
} from "./schema";
import { MODULE_DEFINITIONS } from "../hub/module-registry";
import { encryptSecret } from "../ai/secret-crypto";
import { getVolcEnvConfig } from "../ai/volc-models";
import { ensureAdminRoleByEmail } from "../ai/quota";

export async function seedDatabase() {
  runMigrations();
  const db = getDb();
  const now = new Date().toISOString();

  const existingModules = await db.select().from(modules).limit(1);
  if (existingModules.length === 0) {
    await db.insert(modules).values(
      MODULE_DEFINITIONS.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        description: m.description,
        priority: m.priority,
        enabled: m.defaultEnabled,
        showOnHome: m.showOnHome,
        sortOrder: m.sortOrder,
        implemented: m.implemented,
      }))
    );

    await db.insert(aiModuleSwitches).values(
      MODULE_DEFINITIONS.map((m) => ({
        moduleId: m.id,
        aiEnabled: false,
        fallbackToTemplate: true,
      }))
    );

    await db.insert(moduleStats).values(
      MODULE_DEFINITIONS.map((m) => ({
        moduleId: m.id,
        callCount: 0,
        todayCount: 0,
      }))
    );
  } else {
    for (const m of MODULE_DEFINITIONS) {
      const [existing] = await db.select().from(modules).where(eq(modules.id, m.id)).limit(1);
      const newlyImplemented = existing && !existing.implemented && m.implemented;
      await db
        .update(modules)
        .set({
          name: m.name,
          category: m.category,
          description: m.description,
          priority: m.priority,
          implemented: m.implemented,
          showOnHome: m.showOnHome,
          sortOrder: m.sortOrder,
          ...(newlyImplemented ? { enabled: m.defaultEnabled } : {}),
        })
        .where(eq(modules.id, m.id));
    }
  }

  const globalSettings = await db.select().from(aiGlobalSettings).limit(1);
  if (globalSettings.length === 0) {
    await db.insert(aiGlobalSettings).values([
      { key: "global_ai_enabled", value: "false" },
      { key: "default_provider_id", value: "" },
      { key: "site_name", value: process.env.NEXT_PUBLIC_SITE_NAME ?? "易道命理" },
      { key: "disclaimer", value: "本系统仅供文化研习与娱乐参考，不构成医疗、法律、金融建议。" },
    ]);
  }

  await ensureVolcArkProvider(now);

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const existingAdmin = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);

  if (existingAdmin.length === 0) {
    const password = process.env.ADMIN_PASSWORD ?? "admin123";
    const hash = await bcrypt.hash(password, 10);
    await db.insert(adminUsers).values({
      id: crypto.randomUUID(),
      username,
      passwordHash: hash,
      role: "superadmin",
      createdAt: now,
    });
  }

  const adminEmails = (process.env.AI_UNLIMITED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const email of adminEmails) {
    await ensureAdminRoleByEmail(email);
  }
}

async function ensureVolcArkProvider(now: string) {
  const volc = getVolcEnvConfig();
  if (!volc.apiKey) return;

  const db = getDb();
  const existing = await db.select().from(aiProviders);
  const found = existing.find(
    (p) => p.providerType === "volcengine" || p.baseUrl.includes("ark.cn-beijing.volces.com")
  );

  const encrypted = encryptSecret(volc.apiKey);
  if (found) {
    await db
      .update(aiProviders)
      .set({
        name: "火山方舟 Token Plan",
        providerType: "volcengine",
        baseUrl: volc.baseUrl,
        apiKeyEncrypted: encrypted,
        modelName: volc.textModel,
        isActive: true,
        priority: 0,
      })
      .where(eq(aiProviders.id, found.id));
  } else {
    await db.insert(aiProviders).values({
      id: crypto.randomUUID(),
      name: "火山方舟 Token Plan",
      providerType: "volcengine",
      baseUrl: volc.baseUrl,
      apiKeyEncrypted: encrypted,
      modelName: volc.textModel,
      maxTokens: 2048,
      temperature: 0.7,
      isActive: true,
      priority: 0,
      createdAt: now,
    });
  }

  await db
    .update(aiGlobalSettings)
    .set({ value: "true" })
    .where(eq(aiGlobalSettings.key, "global_ai_enabled"));

  const enableIds = [
    "bazi",
    "bazi-dayun",
    "ziwei",
    "word",
    "match",
    "face",
    "palm",
    "tarot",
    "yijing",
    "liuyao",
  ];
  for (const moduleId of enableIds) {
    await db
      .update(aiModuleSwitches)
      .set({ aiEnabled: true, fallbackToTemplate: true })
      .where(eq(aiModuleSwitches.moduleId, moduleId));
  }
}
