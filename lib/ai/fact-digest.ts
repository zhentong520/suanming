/**
 * 把引擎 facts 压成「关键事实清单」，供 AI 锚定，避免整包 JSON 幻觉。
 */

function pick(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") out[k] = obj[k];
  }
  return out;
}

function truncate(s: string, n = 400): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function buildAiFactDigest(moduleId: string, facts: Record<string, unknown>): string {
  const lines: string[] = [`模块: ${moduleId}`];

  const common = pick(facts, [
    "solarDate",
    "lunarDate",
    "ganZhiYear",
    "ganZhiMonth",
    "ganZhiDay",
    "ganZhiTime",
    "dayMaster",
    "dayMasterElement",
    "strength",
    "strengthScore",
    "trueSolarNote",
    "hexagram",
    "fullName",
    "overview",
    "summary",
  ]);
  for (const [k, v] of Object.entries(common)) {
    lines.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  }

  const yong = facts.yongShen as
    | { usefulGods?: string[]; avoidGods?: string[]; summary?: string; usefulTenGodsHint?: string }
    | undefined;
  if (yong) {
    lines.push(`喜用神: ${(yong.usefulGods ?? []).join("、")}`);
    lines.push(`忌神: ${(yong.avoidGods ?? []).join("、")}`);
    if (yong.summary) lines.push(`用神总论: ${yong.summary}`);
    if (yong.usefulTenGodsHint) lines.push(`十神提示: ${yong.usefulTenGodsHint}`);
  }

  if (Array.isArray(facts.tenGods)) lines.push(`十神: ${(facts.tenGods as string[]).join("、")}`);
  if (facts.elementCount) lines.push(`五行统计: ${JSON.stringify(facts.elementCount)}`);
  if (Array.isArray(facts.missingElements) && (facts.missingElements as string[]).length) {
    lines.push(`缺五行: ${(facts.missingElements as string[]).join("、")}`);
  }

  if (Array.isArray(facts.daYun)) {
    const cur = (facts.daYun as Array<Record<string, unknown>>).find((d) => d.isCurrent);
    if (cur) {
      lines.push(
        `当前大运: ${cur.ganZhi} ${cur.startYear}-${cur.endYear} 评定:${cur.yongShenLabel ?? "—"}(${cur.yongShenScore ?? "—"})`
      );
    }
  }

  if (Array.isArray(facts.stars)) {
    const ming = (facts.stars as Array<{ palace: string; star: string; brightness?: string }>).filter(
      (s) => s.palace === "命宫" || s.palace === facts.mingGongPalace
    );
    if (ming.length) lines.push(`命宫主星: ${ming.map((s) => `${s.star}${s.brightness ?? ""}`).join("、")}`);
  }
  if (Array.isArray(facts.siHua)) {
    lines.push(
      `四化: ${(facts.siHua as Array<{ star: string; hua: string; palace?: string }>)
        .map((s) => `${s.star}化${s.hua}${s.palace ? `@${s.palace}` : ""}`)
        .join("、")}`
    );
  }

  if (facts.benGua || facts.bianGua) {
    lines.push(`本卦: ${facts.benGua ?? facts.hexagram} 变卦: ${facts.bianGua ?? "—"}`);
  }
  if (facts.liuQin && typeof facts.liuQin === "object") {
    lines.push(`六亲摘要: ${JSON.stringify(facts.liuQin)}`);
  }

  if (typeof facts.scores === "object" && facts.scores) {
    lines.push(`评分: ${JSON.stringify(facts.scores)}`);
  }
  if (typeof facts.totalScore === "number") lines.push(`总分: ${facts.totalScore}`);

  if (facts.grids && typeof facts.grids === "object") {
    const g = facts.grids as Record<string, { value?: number; luck?: string; element?: string }>;
    lines.push(
      `五格: 天${g.tianGe?.value}${g.tianGe?.luck}/${g.tianGe?.element} 人${g.renGe?.value}${g.renGe?.luck}/${g.renGe?.element} 地${g.diGe?.value}${g.diGe?.luck}/${g.diGe?.element} 外${g.waiGe?.value}${g.waiGe?.luck} 总${g.zongGe?.value}${g.zongGe?.luck}`
    );
  }
  if (facts.sancai && typeof facts.sancai === "object") {
    const s = facts.sancai as { config?: string; luck?: string; desc?: string };
    lines.push(`三才: ${s.config}（${s.luck}） ${s.desc ?? ""}`);
  }
  if (facts.yongShenFit && typeof facts.yongShenFit === "object") {
    lines.push(`姓名×喜用: ${JSON.stringify(facts.yongShenFit)}`);
  }
  if (Array.isArray(facts.candidates)) {
    lines.push(
      `取名候选: ${(facts.candidates as Array<{ fullName: string; score: number; sancai?: string }>)
        .slice(0, 8)
        .map((c) => `${c.fullName}(${c.score}/${c.sancai ?? ""})`)
        .join("、")}`
    );
  }
  if (typeof facts.baziHint === "string") lines.push(`八字提示: ${facts.baziHint}`);

  if (typeof facts.summary === "string") lines.push(`引擎摘要: ${truncate(facts.summary, 280)}`);

  // 控制长度
  let text = lines.join("\n");
  if (text.length > 2200) text = `${text.slice(0, 2200)}\n…(已截断)`;
  return text;
}

export function buildAiEnhancePrompt(
  moduleId: string,
  facts: Record<string, unknown>,
  templateReport: string,
  locale: "zh" | "en" = "zh"
): string {
  const digest = buildAiFactDigest(moduleId, facts);
  const reportClip = truncate(templateReport, 1800);
  if (locale === "en") {
    return `You are a senior interpreter of classical Chinese metaphysics for a general audience. Using the FACT LIST and BASE REPORT below, write a 500–800 word English supplement.

Hard rules:
1. Do not invent or contradict pillars, hexagrams, scores, useful gods, luck cycles, or star names in the fact list
2. Do not invent specifics not present in the list
3. Structure: temperament → career → wealth → relationships → health → actionable advice (omit N/A)
4. Keep traditional Chinese terms in Chinese with a short English gloss in parentheses when first used
5. End with: "For cultural entertainment only."

[FACT LIST]
${digest}

[BASE REPORT EXCERPT]
${reportClip}`;
  }

  return `你是精通传统命理文化的资深解读师。请基于下方「关键事实清单」与「基础报告」撰写深度补充解读（500-800字）。

硬性约束：
1. 不得修改、编造或否定清单中的四柱、卦名、分数、喜用神、大运干支、星曜等硬事实
2. 若清单未给出的信息，不要臆造具体干支/宫位/星名
3. 按「性格气质 → 事业 → 财运 → 感情 → 健康 → 行动建议」展开（不适用可省略）
4. 语言具体、少套话，建议可执行
5. 末尾注明「以上仅供文化娱乐参考」

【关键事实清单】
${digest}

【基础报告（节选）】
${reportClip}`;
}
