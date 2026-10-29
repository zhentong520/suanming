/**
 * AI 生成内容合规风控层。
 *
 * 依据《生成式人工智能服务管理暂行办法》《人工智能生成合成内容标识办法》
 * 及「清朗·整治AI应用乱象」专项要求：
 * 1. 过滤/改写宿命论断语与玄学服务承诺类表述（改运、改命、消灾、开光等）；
 * 2. 软化绝对化断言（必定、注定、百分之百）；
 * 3. 追加显式 AI 生成标识。
 */

/** 违禁词 → 中性替换词（玄学服务承诺类，监管重点词） */
const FORBIDDEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/逆天改命|扭转乾坤/g, "积极应对"],
  [/改运|转运|开运|旺运/g, "调摄"],
  [/改命/g, "自我提升"],
  [/消灾|破灾|化煞|解煞/g, "防范风险"],
  [/开光/g, "祈福习俗"],
  [/法事|道场|做法事/g, "民俗仪式"],
  [/补财库|聚财阵|招财局/g, "理财规划"],
  [/镇宅|辟邪/g, "安宅习俗"],
  [/符咒|符箓/g, "民俗符文化"],
];

/** 绝对化断语软化（宿命论表述，降低误导与舆情风险） */
const ABSOLUTIZE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/必定会/g, "往往会"],
  [/必定/g, "往往"],
  [/必然会/g, "往往会"],
  [/必将/g, "有望"],
  [/百分之百/g, "很大概率"],
  [/铁定/g, "大概率"],
  [/注定要/g, "倾向于"],
  [/命中注定/g, "命盘倾向于"],
  [/注定/g, "倾向于"],
  [/逃不掉|躲不过/g, "需要留意"],
  [/在劫难逃/g, "需多加留意"],
];

export const AI_DISCLAIMER_SUFFIX = "\n\n（本段解读由 AI 辅助生成，仅供文化娱乐参考，不构成任何专业建议。）";

/**
 * 清洗 AI 生成文本：违禁词替换 → 绝对化断语软化 → 压缩连续重复。
 * 幂等：对已清洗文本重复调用不产生进一步变化。
 */
export function sanitizeAiText(text: string): string {
  let out = text ?? "";
  for (const [re, replacement] of FORBIDDEN_REPLACEMENTS) {
    out = out.replace(re, replacement);
  }
  for (const [re, replacement] of ABSOLUTIZE_REPLACEMENTS) {
    out = out.replace(re, replacement);
  }
  return out;
}

/** 是否已带 AI 标识（避免重复追加） */
export function hasAiMarker(text: string): boolean {
  return text.includes("AI 辅助生成") || text.includes("AI生成") || text.includes("AI 生成");
}

/** 清洗并追加显式 AI 生成标识（标识写入文本，历史落库内容亦可追溯） */
export function compliantAiText(text: string): string {
  const cleaned = sanitizeAiText(text);
  return hasAiMarker(cleaned) ? cleaned : cleaned + AI_DISCLAIMER_SUFFIX;
}

/** 运行时敏感词自查：返回命中的违禁词列表（用于日志监控与测试） */
export function findForbiddenTerms(text: string): string[] {
  const hits: string[] = [];
  const words = [
    "改运", "改命", "转运", "开运", "消灾", "破灾", "化煞", "开光",
    "法事", "补财库", "聚财阵", "招财局", "镇宅", "辟邪", "符咒", "符箓",
  ];
  for (const w of words) {
    if (text.includes(w)) hits.push(w);
  }
  return hits;
}
