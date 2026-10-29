export function renderTemplateReport(
  moduleId: string,
  facts: Record<string, unknown>,
  scores?: Record<string, number>
): string {
  const lines: string[] = [];

  switch (moduleId) {
    case "bazi": {
      const f = facts as Record<string, string | Record<string, number> | string[] | boolean | string[][]>;
      lines.push("【八字排盘】");
      lines.push(`公历：${f.solarDate}  农历：${f.lunarDate}`);
      lines.push(`四柱：${f.ganZhiYear} ${f.ganZhiMonth} ${f.ganZhiDay} ${f.ganZhiTime}`);
      lines.push(`生肖：${f.shengXiao}  日主：${f.dayMaster}（${f.dayMasterElement}）`);
      if (f.summary) {
        lines.push("");
        lines.push("▎概要");
        lines.push(String(f.summary));
      }
      appendSections(lines, f.sections as unknown as ReportSection[] | undefined);
      break;
    }
    case "bazi-dayun":
    case "bazi-resolve":
    case "chenggu":
    case "zodiac":
    case "name":
    case "naming":
    case "almanac":
    case "match":
    case "ziwei":
    case "word":
    case "horoscope":
    case "heluo":
    case "qizheng":
    case "face":
    case "palm":
    case "fengshui":
    case "numerology":
    case "vedic":
    case "mbti":
    case "xiaoliuren":
    case "lingqian":
    case "qimen":
    case "daliuren":
    case "taiyi":
    case "beijiao":
    case "wuxing-ren":
    case "tiaoyun":
      renderSectionReport(lines, moduleTitle(moduleId), facts);
      break;
    case "yijing":
      renderHexagramReport(lines, "周易易经", facts);
      break;
    case "liuyao":
      renderLiuyaoReport(lines, facts);
      break;
    case "meihua":
      renderHexagramReport(lines, "梅花易数", facts);
      break;
    case "dream":
      renderDreamReport(lines, facts);
      break;
    case "tarot":
      renderTarotReport(lines, facts);
      break;
    default:
      lines.push(`【${moduleId}】`);
      if (facts.summary) lines.push(String(facts.summary));
      else lines.push(JSON.stringify(facts, null, 2));
  }

  if (scores?.total != null) {
    lines.push("");
    lines.push(`综合评分：${scores.total}分`);
  }

  lines.push("");
  lines.push("※ 仅供文化研习与娱乐参考。");
  return lines.join("\n");
}

function moduleTitle(id: string): string {
  const map: Record<string, string> = {
    "bazi-dayun": "大运流年",
    "bazi-resolve": "四柱反查",
    chenggu: "袁天罡称骨",
    zodiac: "生肖运势",
    name: "姓名测算",
    naming: "取名建议",
    word: "测字",
    almanac: "黄历择日",
    match: "合婚配对",
    ziwei: "紫微斗数",
    xiaoliuren: "小六壬",
    lingqian: "灵签占卜",
    qimen: "奇门遁甲",
    daliuren: "大六壬",
    taiyi: "太乙神数",
    beijiao: "掷杯筊",
    dream: "周公解梦",
    tarot: "塔罗占卜",
    horoscope: "星座运势",
    heluo: "河洛理数",
    qizheng: "七政四余",
    face: "面相分析",
    palm: "手相分析",
    fengshui: "风水分析",
    numerology: "数字命理",
    vedic: "吠陀占星",
    mbti: "MBTI 配对",
    "wuxing-ren": "五行人·助运",
    tiaoyun: "医·灵治调运",
  };
  return map[id] ?? id;
}

type ReportSection = { title: string; content: string };

function renderSectionReport(
  lines: string[],
  title: string,
  facts: Record<string, unknown>
) {
  lines.push(`【${title}】`);
  if (facts.question) lines.push(`所问：${facts.question}`);
  if (facts.summary) {
    lines.push("");
    lines.push("▎概要");
    lines.push(String(facts.summary));
  }
  appendSections(lines, facts.sections as ReportSection[] | undefined);
  if (facts.caveat) {
    lines.push("");
    lines.push(`※ ${facts.caveat}`);
  }
}

function appendSections(lines: string[], sections?: ReportSection[]) {
  if (!sections?.length) return;
  for (const s of sections) {
    if (!s.content?.trim()) continue;
    lines.push("");
    lines.push(`▎${s.title}`);
    lines.push(s.content);
  }
}

function renderHexagramReport(
  lines: string[],
  title: string,
  facts: Record<string, unknown>
) {
  lines.push(`【${title}】`);
  if (facts.question) lines.push(`所问：${facts.question}`);
  if (facts.method) lines.push(`起卦方式：${facts.method}`);

  const hex = facts.hexagram ?? facts.benGua;
  if (hex) {
    lines.push(`本卦：${hex}（${facts.fullName ?? `${hex}卦`}）`);
  }
  if (facts.changingHexagram || facts.bianGua) {
    lines.push(`变卦：${facts.changingHexagram ?? facts.bianGua}`);
  }
  if (facts.changingYao) lines.push(`动爻：${facts.changingYao}`);
  if (facts.tiYong) {
    lines.push("");
    lines.push("▎体用");
    lines.push(String(facts.tiYong));
  }
  if (facts.summary) {
    lines.push("");
    lines.push("▎概要");
    lines.push(String(facts.summary));
  }
  appendSections(lines, facts.sections as ReportSection[] | undefined);
}

function renderLiuyaoReport(lines: string[], facts: Record<string, unknown>) {
  renderHexagramReport(lines, "六爻占卜", facts);

  const liuQin = facts.liuQin as { 世应?: string; 六亲?: string } | undefined;
  if (liuQin) {
    lines.push("");
    lines.push("▎世应六亲");
    if (liuQin.世应) lines.push(liuQin.世应);
    if (liuQin.六亲) lines.push(liuQin.六亲);
  }

  const dongLines = facts.lines as Array<{
    position: number;
    type: string;
    changing: boolean;
    meaning?: string;
  }> | undefined;
  if (dongLines?.length) {
    lines.push("");
    lines.push("▎六爻详情");
    const yaoNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
    dongLines.forEach((l) => {
      const pos = yaoNames[l.position - 1] ?? `第${l.position}爻`;
      const mark = l.changing ? "◎动" : "○静";
      lines.push(`${pos} ${l.type} ${mark}${l.meaning ? " — " + l.meaning : ""}`);
    });
  }
  if (facts.dongYaoCount != null) {
    lines.push(`动爻共计：${facts.dongYaoCount}爻`);
  }
}

function renderWordReport(lines: string[], facts: Record<string, unknown>) {
  const f = facts as {
    chars: string;
    question?: string;
    analysis: Array<{
      char: string;
      radical: string;
      strokes: number;
      wuxing: string;
      structure: string;
      hint: string;
    }>;
    totalStrokes: number;
    dominantWuxing: string;
    trend: string;
    summary: string;
    caveat?: string;
  };
  lines.push("【测字】");
  lines.push(`所测：${f.chars}`);
  if (f.question) lines.push(`所问：${f.question}`);
  lines.push("");
  lines.push("▎逐字分析");
  f.analysis.forEach((a) => {
    lines.push(
      `「${a.char}」部首${a.radical}，${a.strokes}画，五行属${a.wuxing}，${a.structure}结构。${a.hint}`
    );
  });
  lines.push("");
  lines.push("▎数理");
  lines.push(`总笔画：${f.totalStrokes}，主导五行：${f.dominantWuxing}`);
  lines.push("");
  lines.push("▎趋势");
  lines.push(f.trend);
  lines.push("");
  lines.push("▎综合");
  lines.push(f.summary);
  if (f.caveat) lines.push(`\n※ ${f.caveat}`);
}

function renderDreamReport(lines: string[], facts: Record<string, unknown>) {
  const f = facts as {
    keyword: string;
    category: string;
    meaning: string;
    summary: string;
    matched: boolean;
    sections?: ReportSection[];
  };
  lines.push("【周公解梦】");
  lines.push(`梦境关键词：${f.keyword}`);
  lines.push(`分类：${f.category}`);
  lines.push("");
  lines.push("▎签意");
  lines.push(f.meaning);
  if (f.sections?.length) {
    appendSections(lines, f.sections);
  } else {
    lines.push("");
    lines.push("▎建议");
    lines.push(
      f.matched
        ? "梦境象征多于预兆，宜结合近期心境与现实处境理解，不必过度忧心。"
        : "未找到精确词条，可将梦境拆分为多个意象分别查询，或记录细节日后对照。"
    );
  }
  lines.push("");
  lines.push("▎概要");
  lines.push(f.summary);
}

function renderTarotReport(lines: string[], facts: Record<string, unknown>) {
  const f = facts as {
    question?: string;
    spread: string;
    cards: Array<{ position: string; name: string; reversed: boolean; meaning: string }>;
    summary: string;
    sections?: ReportSection[];
  };
  lines.push("【塔罗占卜】");
  if (f.question) lines.push(`所问：${f.question}`);
  lines.push(`牌阵：${f.spread}`);
  lines.push("");
  if (f.sections?.length) {
    appendSections(lines, f.sections);
  } else {
    f.cards.forEach((c) => {
      lines.push(`▎${c.position}`);
      lines.push(`${c.name}${c.reversed ? "（逆位）" : "（正位）"}`);
      lines.push(c.meaning);
      lines.push("");
    });
  }
  lines.push("▎牌阵综述");
  lines.push(f.summary);
}
