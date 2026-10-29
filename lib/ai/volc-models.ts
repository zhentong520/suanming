/**
 * 火山方舟 Token / Agent Plan（api/plan/v3）推荐模型。
 * 注意：Plan 网关与按量推理（api/v3）可用模型不同；
 * `doubao-1.5-vision-pro` 等仅按量可用，在 Plan 上会报 UnsupportedModel。
 * 文档：https://www.volcengine.com/docs/82379/2366394
 */
export const VOLC_ARK_MODELS = [
  {
    id: "doubao-seed-2.0-mini",
    label: "Seed 2.0 Mini",
    use: "文本解读（默认，省额度）；亦可识图",
    vision: true,
  },
  {
    id: "doubao-seed-2.0-lite",
    label: "Seed 2.0 Lite",
    use: "文本解读 / 面相识图（推荐）",
    vision: true,
  },
  {
    id: "doubao-seed-2.0-pro",
    label: "Seed 2.0 Pro",
    use: "深度解读 / 复杂识图",
    vision: true,
  },
  {
    id: "doubao-seed-2.0-code",
    label: "Seed 2.0 Code",
    use: "Agent Plan 可用；支持识图",
    vision: true,
  },
  {
    id: "doubao-seed-evolving",
    label: "Seed Evolving",
    use: "Agent Plan 可用；支持识图",
    vision: true,
  },
] as const;

/** 常见误配：按量视觉模型，不能走 api/plan */
export const VOLC_PLAN_UNSUPPORTED_MODELS = [
  "doubao-1.5-vision-pro",
  "doubao-1.5-vision-lite",
  "doubao-seed-1.6-vision",
  "doubao-vision-pro",
  "doubao-vision-lite",
] as const;

export const VOLC_DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/plan/v3";
export const VOLC_ANTHROPIC_BASE_URL = "https://ark.cn-beijing.volces.com/api/plan";
export const VOLC_DEFAULT_TEXT_MODEL = "doubao-seed-2.0-mini";
export const VOLC_DEFAULT_VISION_MODEL = "doubao-seed-2.0-lite";

export function isVolcPlanBaseUrl(baseUrl: string): boolean {
  return /\/api\/plan(\/|$)/i.test(baseUrl) || /ark\.cn-beijing\.volces\.com\/api\/plan/i.test(baseUrl);
}

export function resolveVolcPlanModel(model: string, kind: "text" | "vision"): string {
  const id = model.trim();
  const unsupported = (VOLC_PLAN_UNSUPPORTED_MODELS as readonly string[]).includes(id);
  if (!unsupported) return id || (kind === "vision" ? VOLC_DEFAULT_VISION_MODEL : VOLC_DEFAULT_TEXT_MODEL);
  return kind === "vision" ? VOLC_DEFAULT_VISION_MODEL : VOLC_DEFAULT_TEXT_MODEL;
}

export function getVolcEnvConfig() {
  const baseUrl = (process.env.VOLC_ARK_BASE_URL || VOLC_DEFAULT_BASE_URL).replace(/\/$/, "");
  const rawText = process.env.VOLC_ARK_MODEL || VOLC_DEFAULT_TEXT_MODEL;
  const rawVision =
    process.env.VOLC_ARK_VISION_MODEL || process.env.VOLC_ARK_MODEL || VOLC_DEFAULT_VISION_MODEL;
  const onPlan = isVolcPlanBaseUrl(baseUrl);

  return {
    apiKey: process.env.VOLC_ARK_API_KEY?.trim() || "",
    baseUrl,
    anthropicBaseUrl: (process.env.VOLC_ARK_ANTHROPIC_BASE_URL || VOLC_ANTHROPIC_BASE_URL).replace(
      /\/$/,
      ""
    ),
    textModel: onPlan ? resolveVolcPlanModel(rawText, "text") : rawText,
    visionModel: onPlan ? resolveVolcPlanModel(rawVision, "vision") : rawVision,
    rawTextModel: rawText,
    rawVisionModel: rawVision,
    remappedVision:
      onPlan && resolveVolcPlanModel(rawVision, "vision") !== rawVision.trim(),
    userQuota: Math.max(0, Number(process.env.AI_USER_QUOTA ?? 2) || 2),
  };
}
