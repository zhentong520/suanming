import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { aiGlobalSettings, aiModuleSwitches, aiProviders } from "../db/schema";
import { createProvider, type AIProvider } from "./provider-interface";
import { decryptSecret } from "./secret-crypto";
import { getVolcEnvConfig } from "./volc-models";
import { logUserOperation } from "../user/operations";
import { buildAiEnhancePrompt } from "./fact-digest";
import { getAiQuotaStatus } from "./quota";

export async function isGlobalAiEnabled(): Promise<boolean> {
  const db = getDb();
  const [setting] = await db
    .select()
    .from(aiGlobalSettings)
    .where(eq(aiGlobalSettings.key, "global_ai_enabled"))
    .limit(1);
  return setting?.value === "true";
}

export async function isModuleAiEnabled(moduleId: string): Promise<boolean> {
  const global = await isGlobalAiEnabled();
  if (!global) return false;
  const db = getDb();
  const [sw] = await db
    .select()
    .from(aiModuleSwitches)
    .where(eq(aiModuleSwitches.moduleId, moduleId))
    .limit(1);
  return sw?.aiEnabled ?? false;
}

export async function getActiveProvider(kind: "text" | "vision" = "text"): Promise<AIProvider | null> {
  const db = getDb();
  const providers = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.isActive, true));
  if (providers.length === 0) return null;
  const sorted = providers.sort((a, b) => a.priority - b.priority);
  const p = sorted[0];
  const volc = getVolcEnvConfig();
  const modelOverride =
    kind === "vision" && (p.providerType === "volcengine" || p.baseUrl.includes("volces.com"))
      ? volc.visionModel
      : undefined;

  return createProvider({
    id: p.id,
    type: p.providerType as "openai" | "deepseek" | "qwen" | "zhipu" | "moonshot" | "volcengine" | "custom",
    name: p.name,
    baseUrl: p.baseUrl,
    apiKey: decryptSecret(p.apiKeyEncrypted),
    modelName: modelOverride ?? p.modelName,
    maxTokens: p.maxTokens ?? 2048,
    temperature: p.temperature ?? 0.7,
  });
}

export async function maybeEnhanceWithAi(
  moduleId: string,
  facts: Record<string, unknown>,
  templateReport: string,
  userId?: string,
  locale: "zh" | "en" = "zh"
): Promise<string | undefined> {
  const enabled = await isModuleAiEnabled(moduleId);
  if (!enabled) return undefined;

  const provider = await getActiveProvider("text");
  if (!provider) return undefined;

  try {
    const prompt = buildAiEnhancePrompt(moduleId, facts, templateReport, locale);
    const text = await provider.complete(prompt, { maxTokens: 1200, temperature: 0.55 });
    if (!text) return undefined;
    if (userId) {
      await logUserOperation({
        userId,
        action: "ai_enhance",
        moduleId,
        metadata: { providerId: provider.id, locale },
      });
    }
    return text;
  } catch {
    return undefined;
  }
}

export async function testProviderConnection(config: {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}) {
  const provider = createProvider({
    id: "test",
    type: "custom",
    name: "test",
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    modelName: config.modelName,
  });
  const result = await provider.complete("回复：连接成功");
  return { ok: true, message: result.slice(0, 100) };
}

export { getAiQuotaStatus };
