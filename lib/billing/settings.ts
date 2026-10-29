import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { aiGlobalSettings } from "@/lib/db/schema";

export type BillingCostKind = "calc" | "ai" | "vision" | "life_insights";

export interface BillingSettings {
  billingEnabled: boolean;
  costCalc: number;
  costAi: number;
  costVision: number;
  /** 解锁流年事件倾向 + 六亲时间线（人生洞察） */
  costLifeInsights: number;
  registerBonus: number;
  yuanToPoints: number;
}

const DEFAULTS: BillingSettings = {
  billingEnabled: true,
  costCalc: 1,
  costAi: 10,
  costVision: 20,
  costLifeInsights: 30,
  registerBonus: 10,
  yuanToPoints: 10,
};

const KEYS = {
  billingEnabled: "billing_enabled",
  costCalc: "billing_cost_calc",
  costAi: "billing_cost_ai",
  costVision: "billing_cost_vision",
  costLifeInsights: "billing_cost_life_insights",
  registerBonus: "billing_register_bonus",
  yuanToPoints: "billing_yuan_to_points",
} as const;

function parseBool(v: string | undefined, fallback: boolean) {
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

function parseIntSafe(v: string | undefined, fallback: number) {
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export async function getBillingSettings(): Promise<BillingSettings> {
  const db = getDb();
  const rows = await db.select().from(aiGlobalSettings);
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    billingEnabled: parseBool(map.get(KEYS.billingEnabled), DEFAULTS.billingEnabled),
    costCalc: parseIntSafe(map.get(KEYS.costCalc), DEFAULTS.costCalc),
    costAi: parseIntSafe(map.get(KEYS.costAi), DEFAULTS.costAi),
    costVision: parseIntSafe(map.get(KEYS.costVision), DEFAULTS.costVision),
    costLifeInsights: parseIntSafe(map.get(KEYS.costLifeInsights), DEFAULTS.costLifeInsights),
    registerBonus: parseIntSafe(map.get(KEYS.registerBonus), DEFAULTS.registerBonus),
    yuanToPoints: parseIntSafe(map.get(KEYS.yuanToPoints), DEFAULTS.yuanToPoints),
  };
}

async function upsertSetting(key: string, value: string) {
  const db = getDb();
  const [existing] = await db.select().from(aiGlobalSettings).where(eq(aiGlobalSettings.key, key)).limit(1);
  if (existing) {
    await db.update(aiGlobalSettings).set({ value }).where(eq(aiGlobalSettings.key, key));
  } else {
    await db.insert(aiGlobalSettings).values({ key, value });
  }
}

export async function updateBillingSettings(partial: Partial<BillingSettings>): Promise<BillingSettings> {
  if (partial.billingEnabled !== undefined) {
    await upsertSetting(KEYS.billingEnabled, partial.billingEnabled ? "true" : "false");
  }
  if (partial.costCalc !== undefined) {
    await upsertSetting(KEYS.costCalc, String(Math.max(0, Math.floor(partial.costCalc))));
  }
  if (partial.costAi !== undefined) {
    await upsertSetting(KEYS.costAi, String(Math.max(0, Math.floor(partial.costAi))));
  }
  if (partial.costVision !== undefined) {
    await upsertSetting(KEYS.costVision, String(Math.max(0, Math.floor(partial.costVision))));
  }
  if (partial.costLifeInsights !== undefined) {
    await upsertSetting(KEYS.costLifeInsights, String(Math.max(0, Math.floor(partial.costLifeInsights))));
  }
  if (partial.registerBonus !== undefined) {
    await upsertSetting(KEYS.registerBonus, String(Math.max(0, Math.floor(partial.registerBonus))));
  }
  if (partial.yuanToPoints !== undefined) {
    await upsertSetting(KEYS.yuanToPoints, String(Math.max(1, Math.floor(partial.yuanToPoints))));
  }
  return getBillingSettings();
}

export function costForKind(settings: BillingSettings, kind: BillingCostKind): number {
  if (kind === "vision") return settings.costVision;
  if (kind === "ai") return settings.costAi;
  if (kind === "life_insights") return settings.costLifeInsights;
  return settings.costCalc;
}
