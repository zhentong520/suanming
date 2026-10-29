import { getActiveProvider, isGlobalAiEnabled } from "./interpret";
import { logUserOperation } from "@/lib/user/operations";
import type { VisionMessage } from "./provider-interface";

export type VisionReadingModule = "face" | "palm";

export interface VisionLifeDomains {
  personality: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
}

export interface VisionTimeline {
  earlyLife: string;
  midLife: string;
  lateLife: string;
}

export interface VisionAnalysisResult {
  valid: boolean;
  rejectReason?: string;
  imageType?: string;
  observedFeatures: string[];
  analysis: Array<{ feature: string; meaning: string; category: string }>;
  summary: string;
  detailSections: Array<{ title: string; content: string }>;
  lifeDomains?: VisionLifeDomains;
  timeline?: VisionTimeline;
  strengths?: string[];
  cautions?: string[];
  advice?: string;
}

function buildPrompt(module: VisionReadingModule): string {
  if (module === "face") {
    return `你是一位精通传统面相文化的资深解读师。请仔细观察上传的图片，给出「深度、具体、可读懂」的面相报告。

【第一步：图片校验】
判断是否为清晰正面人脸照片（真人正脸，五官可见，光线充足）。
拒绝：手背/手掌/风景/动物/严重模糊/口罩遮挡大半/背影/无法辨认的合影。
不符合则只返回：
{"valid":false,"rejectReason":"具体原因","observedFeatures":[],"analysis":[],"summary":"","detailSections":[]}

【第二步：深度面相分析】（符合时）
请从以下维度仔细观察并撰写，每项要有具体观察依据，避免空泛套话：
1. 三停：上停（额头/发际—眉）、中停（眉—鼻底）、下停（鼻底—下巴），论早年/中年/晚年运势
2. 十二宫要点：命宫（印堂）、财帛、兄弟、田宅、子女、奴仆、夫妻、疾厄、迁移、官禄、福德、父母（能观察到的则论）
3. 五官：眉（眉形、浓淡、长短）、眼（眼型、神采、黑白分明否）、鼻（山根、鼻梁、鼻头、鼻翼）、口（唇形、厚薄、嘴角）、耳（大小、贴脑、垂珠）
4. 气色与神态：整体气色、精神度、喜怒形于色与否
5. 人生四域：事业、财运、感情、健康（各写 120-200 字，要有倾向与建议）
6. 性格气质：150 字左右
7. 优势 3 条、注意事项 3 条、改运建议（穿戴、言行、作息等，100 字）

写作要求：
- observedFeatures 必须尽量使用标准特征名（示例：额头饱满、印堂开阔、眉清目秀、鼻梁高挺、鼻头圆润、法令清晰、地阁丰满、气色红润、夫妻宫清秀、财帛宫丰润等），便于系统对齐规则库
- 每项 analysis.meaning 至少 80 字，结合该特征在面相学中的含义
- observedFeatures 列出 8-12 个具体观察到的特征
- detailSections 至少 8 段，每段 120-250 字
- summary 250-400 字综合总论

返回 JSON（不要 markdown，不要多余文字）：
{
  "valid": true,
  "rejectReason": null,
  "imageType": "face",
  "observedFeatures": ["额头饱满","眉清目秀"],
  "analysis": [{"feature":"额头饱满","category":"三停·上停","meaning":"..."}],
  "summary": "...",
  "lifeDomains": {
    "personality": "...",
    "career": "...",
    "wealth": "...",
    "love": "...",
    "health": "..."
  },
  "timeline": {
    "earlyLife": "上停/额头所主早年...",
    "midLife": "中停所主中年...",
    "lateLife": "下停所主晚年..."
  },
  "strengths": ["...", "...", "..."],
  "cautions": ["...", "...", "..."],
  "advice": "...",
  "detailSections": [
    {"title":"三停总论","content":"..."},
    {"title":"命宫与印堂","content":"..."},
    {"title":"眉眼神态","content":"..."},
    {"title":"鼻相财帛","content":"..."},
    {"title":"口相与人际","content":"..."},
    {"title":"耳相与福泽","content":"..."},
    {"title":"气色神态","content":"..."},
    {"title":"综合断语","content":"..."}
  ]
}

仅供传统文化娱乐参考，非医学诊断。用中文，只输出 JSON。`;
  }

  return `你是一位精通传统手相文化的资深解读师。请仔细观察上传的图片，给出「深度、具体、可读懂」的手相报告。

【第一步：图片校验】
判断是否为清晰手掌照片（掌纹可见，平放或自然张开）。
拒绝：人脸/风景/模糊/握拳看不清纹/只拍到手臂/物品。
不符合则只返回：
{"valid":false,"rejectReason":"具体原因","observedFeatures":[],"analysis":[],"summary":"","detailSections":[]}

【第二步：深度手相分析】（符合时）
请从以下维度仔细观察并撰写：
1. 三大主线：生命线（长短、深浅、弧度、断裂/岛纹/分叉）、智慧线（起点、走向、清晰度）、感情线（深浅、末端走向）
2. 辅线：事业线/太阳线、婚姻线、财运线、健康线（能看到的则论）
3. 掌型与丘位：金木水火土掌型倾向，金星丘、木星丘、土星丘、太阳丘、水星丘、月丘、地丘
4. 手指：拇指、食指、中指、无名指、小指的比例与形态（若可见）
5. 左右手：说明本图观察的是哪只手，男左女右为传统参考
6. 人生四域：事业、财运、感情、健康（各 120-200 字）
7. 性格气质、优势 3 条、注意 3 条、改运建议

写作要求：
- observedFeatures 必须尽量使用标准特征名（示例：生命线较长、智慧线清晰、感情线深长、事业线明显、太阳线显现、婚姻线清晰、财运线明显、金星丘丰满、木星丘高、拇指粗壮、掌型偏方、掌色红润等）
- 每项 analysis.meaning 至少 80 字
- observedFeatures 8-12 个
- detailSections 至少 9 段，每段 120-250 字
- summary 250-400 字

返回 JSON（不要 markdown）：
{
  "valid": true,
  "rejectReason": null,
  "imageType": "palm",
  "observedFeatures": ["生命线较长","智慧线清晰"],
  "analysis": [{"feature":"生命线较长","category":"主线","meaning":"..."}],
  "summary": "...",
  "lifeDomains": {
    "personality": "...",
    "career": "...",
    "wealth": "...",
    "love": "...",
    "health": "..."
  },
  "timeline": {
    "earlyLife": "生命线初段/少年...",
    "midLife": "中段/中年...",
    "lateLife": "末端/晚年..."
  },
  "strengths": ["...", "...", "..."],
  "cautions": ["...", "...", "..."],
  "advice": "...",
  "detailSections": [
    {"title":"掌型总论","content":"..."},
    {"title":"生命线详解","content":"..."},
    {"title":"智慧线详解","content":"..."},
    {"title":"感情线详解","content":"..."},
    {"title":"事业与财运线","content":"..."},
    {"title":"婚姻与人际","content":"..."},
    {"title":"丘位与性格","content":"..."},
    {"title":"手指形态","content":"..."},
    {"title":"综合断语","content":"..."}
  ]
}

仅供传统文化娱乐参考。用中文，只输出 JSON。`;
}

function extractJson(text: string): VisionAnalysisResult {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("AI 返回格式异常，请重试");
  }
  const parsed = JSON.parse(candidate.slice(start, end + 1)) as Partial<VisionAnalysisResult>;

  const lifeDomains = parsed.lifeDomains as Partial<VisionLifeDomains> | undefined;
  const timeline = parsed.timeline as Partial<VisionTimeline> | undefined;

  return {
    valid: Boolean(parsed.valid),
    rejectReason: parsed.rejectReason ?? undefined,
    imageType: parsed.imageType,
    observedFeatures: Array.isArray(parsed.observedFeatures) ? parsed.observedFeatures.map(String) : [],
    analysis: Array.isArray(parsed.analysis)
      ? parsed.analysis.map((a) => ({
          feature: String((a as { feature?: string }).feature ?? ""),
          meaning: String((a as { meaning?: string }).meaning ?? ""),
          category: String((a as { category?: string }).category ?? "综合"),
        }))
      : [],
    summary: String(parsed.summary ?? ""),
    detailSections: Array.isArray(parsed.detailSections)
      ? parsed.detailSections.map((s) => ({
          title: String((s as { title?: string }).title ?? ""),
          content: String((s as { content?: string }).content ?? ""),
        }))
      : [],
    lifeDomains: lifeDomains
      ? {
          personality: String(lifeDomains.personality ?? ""),
          career: String(lifeDomains.career ?? ""),
          wealth: String(lifeDomains.wealth ?? ""),
          love: String(lifeDomains.love ?? ""),
          health: String(lifeDomains.health ?? ""),
        }
      : undefined,
    timeline: timeline
      ? {
          earlyLife: String(timeline.earlyLife ?? ""),
          midLife: String(timeline.midLife ?? ""),
          lateLife: String(timeline.lateLife ?? ""),
        }
      : undefined,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : undefined,
    cautions: Array.isArray(parsed.cautions) ? parsed.cautions.map(String) : undefined,
    advice: parsed.advice ? String(parsed.advice) : undefined,
  };
}

export async function analyzeReadingImage(
  module: VisionReadingModule,
  imageDataUrl: string,
  userId?: string
): Promise<VisionAnalysisResult> {
  const enabled = await isGlobalAiEnabled();
  if (!enabled) {
    throw new Error(
      "图片分析需要开启 AI：请在管理后台打开「全局 AI 开关」，并配置支持识图的模型（火山 Vision / GPT-4o 等）"
    );
  }

  const provider = await getActiveProvider("vision");
  if (!provider) {
    throw new Error("未配置 AI 模型，请先在管理后台添加并启用 AI 提供商");
  }

  const messages: VisionMessage[] = [
    {
      role: "user",
      content: [
        { type: "text", text: buildPrompt(module) },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ];

  const raw = await provider.completeVision(messages, { maxTokens: 4500, temperature: 0.35 });
  const result = extractJson(raw);

  if (!result.valid) {
    throw new Error(result.rejectReason ?? (module === "face" ? "请上传清晰的正脸照片" : "请上传清晰的手掌照片"));
  }

  if (userId) {
    await logUserOperation({
      userId,
      action: "ai_vision",
      moduleId: module,
      metadata: { providerId: provider.id },
    });
  }

  return result;
}

/** @internal for tests */
export { extractJson as parseVisionJsonForTest };
