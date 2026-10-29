import { analyzeReadingImage } from "@/lib/ai/vision-reading";
import { loadContentJson } from "@/lib/content/catalog";
import { matchFeatureCombos } from "./combos";
import { jiugongFaceSection } from "./jiugong-face";

export type FeatureRule = { feature: string; meaning: string; category: string };

function getFaceRules() {
  return loadContentJson<{ features: FeatureRule[] }>("face-rules.json");
}

function getPalmRules() {
  return loadContentJson<{ features: FeatureRule[] }>("palm-rules.json");
}

export function listFaceFeatureNames(): string[] {
  return getFaceRules().features.map((f) => f.feature);
}

export function listPalmFeatureNames(): string[] {
  return getPalmRules().features.map((f) => f.feature);
}

/** 将观测特征对齐到规则库标准名 */
export function normalizeFeatureNames(
  rules: FeatureRule[],
  observed: string[],
  limit = 12
): string[] {
  const names = rules.map((r) => r.feature);
  const out: string[] = [];
  const used = new Set<string>();
  for (const raw of observed) {
    const t = String(raw).trim();
    if (!t) continue;
    const exact = names.find((n) => n === t);
    const soft = names.find((n) => t.includes(n) || n.includes(t));
    const hit = exact ?? soft;
    if (hit && !used.has(hit)) {
      used.add(hit);
      out.push(hit);
    } else if (!hit && !used.has(t)) {
      used.add(t);
      out.push(t);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function matchRules(rules: FeatureRule[], features: string[]) {
  return features.map((f) => {
    const rule = rules.find((r) => r.feature === f || f.includes(r.feature) || r.feature.includes(f));
    return rule ?? { feature: f, meaning: "此特征需结合整体综合判断。", category: "综合" };
  });
}

function mergeAnalysisWithRules(
  rules: FeatureRule[],
  features: string[],
  visionAnalysis: Array<{ feature: string; meaning: string; category: string }>
) {
  const matched = matchRules(rules, features);
  if (!visionAnalysis?.length) return matched;
  return matched.map((m) => {
    const rule = rules.find((r) => r.feature === m.feature);
    if (rule) return { ...m, meaning: rule.meaning, category: rule.category };
    const v = visionAnalysis.find(
      (a) => a.feature === m.feature || a.feature.includes(m.feature) || m.feature.includes(a.feature)
    );
    return v ? { feature: m.feature, meaning: v.meaning, category: v.category || m.category } : m;
  });
}

export function computeFaceReading(features: string[]) {
  const rules = getFaceRules().features;
  const selected =
    features.length > 0
      ? normalizeFeatureNames(rules, features)
      : ["额头饱满", "眉清目秀"];
  const analysis = matchRules(rules, selected);
  const combos = matchFeatureCombos("face", selected);

  const jiugong = jiugongFaceSection();
  return {
    source: "manual",
    features: selected,
    analysis,
    combos,
    jiugongFace: jiugong.content,
    summary: [
      ...analysis.map((m) => `${m.feature}：${m.meaning}`),
      ...combos.map((c) => `【组合·${c.title}】${c.meaning}`),
    ].join("\n"),
    caveat: "面相解读为传统文化参考，非医学诊断。",
  };
}

export function computePalmReading(features: string[]) {
  const rules = getPalmRules().features;
  const selected =
    features.length > 0
      ? normalizeFeatureNames(rules, features)
      : ["生命线较长", "智慧线清晰"];
  const analysis = matchRules(rules, selected);
  const combos = matchFeatureCombos("palm", selected);

  return {
    source: "manual",
    features: selected,
    analysis,
    combos,
    hand: "男左女右（传统说法）",
    summary: [
      ...analysis.map((m) => `${m.feature}：${m.meaning}`),
      ...combos.map((c) => `【组合·${c.title}】${c.meaning}`),
    ].join("\n"),
    caveat: "手相解读为传统文化参考，非医学诊断。",
  };
}

export async function computeFaceReadingFromImage(
  imageDataUrl: string,
  imageId?: string,
  userId?: string
) {
  const vision = await analyzeReadingImage("face", imageDataUrl, userId);
  const rules = getFaceRules().features;
  const features = normalizeFeatureNames(rules, vision.observedFeatures);
  const analysis = mergeAnalysisWithRules(rules, features, vision.analysis);
  const combos = matchFeatureCombos("face", features);

  const jiugong = jiugongFaceSection();
  return {
    source: "image",
    imageId: imageId ?? null,
    imageType: vision.imageType ?? "face",
    features,
    analysis,
    combos,
    jiugongFace: jiugong.content,
    summary:
      vision.summary ||
      [...analysis.map((m) => `${m.feature}：${m.meaning}`), ...combos.map((c) => `【组合·${c.title}】${c.meaning}`)].join(
        "\n"
      ),
    detailSections: vision.detailSections,
    lifeDomains: vision.lifeDomains,
    timeline: vision.timeline,
    strengths: vision.strengths,
    cautions: vision.cautions,
    advice: vision.advice,
    caveat: "基于上传照片的深度传统面相文化解读，仅供娱乐参考，非医学或科学诊断。",
  };
}

export async function computePalmReadingFromImage(
  imageDataUrl: string,
  imageId?: string,
  userId?: string
) {
  const vision = await analyzeReadingImage("palm", imageDataUrl, userId);
  const rules = getPalmRules().features;
  const features = normalizeFeatureNames(rules, vision.observedFeatures);
  const analysis = mergeAnalysisWithRules(rules, features, vision.analysis);
  const combos = matchFeatureCombos("palm", features);

  return {
    source: "image",
    imageId: imageId ?? null,
    imageType: vision.imageType ?? "palm",
    features,
    analysis,
    combos,
    hand: "男左女右（传统说法，以实际观察为准）",
    summary:
      vision.summary ||
      [...analysis.map((m) => `${m.feature}：${m.meaning}`), ...combos.map((c) => `【组合·${c.title}】${c.meaning}`)].join(
        "\n"
      ),
    detailSections: vision.detailSections,
    lifeDomains: vision.lifeDomains,
    timeline: vision.timeline,
    strengths: vision.strengths,
    cautions: vision.cautions,
    advice: vision.advice,
    caveat: "基于上传照片的深度传统手相文化解读，仅供娱乐参考，非医学或科学诊断。",
  };
}
