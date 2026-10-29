/**
 * 八字日主旺衰与喜用神（得令·通根·透干·调候）
 * 实用评分法，供排盘与大运交叉断语使用。
 */

export type WuXing = "金" | "木" | "水" | "火" | "土";

const STEM_WX: Record<string, WuXing> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const BRANCH_MAIN_WX: Record<string, WuXing> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

/** 地支藏干（本气在前） */
export const BRANCH_HIDDENS: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "戊", "庚"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

const SHENG: Record<WuXing, WuXing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<WuXing, WuXing> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

function generates(a: WuXing, b: WuXing) {
  return SHENG[a] === b;
}
function controls(a: WuXing, b: WuXing) {
  return KE[a] === b;
}
function same(a: WuXing, b: WuXing) {
  return a === b;
}

export interface StrengthDetail {
  score: number;
  deLing: boolean;
  deDi: boolean;
  deShi: boolean;
  tiaoHouNeed: WuXing | null;
  notes: string[];
}

export interface YongShenResult {
  strength: "偏旺" | "偏弱" | "中和";
  strengthScore: number;
  detail: StrengthDetail;
  usefulGods: WuXing[];
  avoidGods: WuXing[];
  usefulTenGodsHint: string;
  summary: string;
}

function monthCommandElement(monthZhi: string): WuXing {
  return BRANCH_MAIN_WX[monthZhi] ?? "土";
}

function rootScore(dayGan: string, branches: string[]): { score: number; hit: string[] } {
  const dmWx = STEM_WX[dayGan];
  let score = 0;
  const hit: string[] = [];
  for (const zhi of branches) {
    const hiddens = BRANCH_HIDDENS[zhi] ?? [];
    hiddens.forEach((gan, i) => {
      if (gan === dayGan) {
        const w = i === 0 ? 12 : i === 1 ? 7 : 4;
        score += w;
        hit.push(`${zhi}藏${gan}`);
      } else if (STEM_WX[gan] === dmWx) {
        const w = i === 0 ? 8 : i === 1 ? 4 : 2;
        score += w;
        hit.push(`${zhi}藏${gan}(同气)`);
      } else if (generates(STEM_WX[gan], dmWx)) {
        const w = i === 0 ? 5 : 2;
        score += w;
        hit.push(`${zhi}藏${gan}(生身)`);
      }
    });
  }
  return { score, hit };
}

/** 通根透干明细（供报告与大运交叉） */
export function analyzeTongGenTouGan(input: {
  dayGan: string;
  yearGan: string;
  monthGan: string;
  timeGan?: string;
  yearZhi: string;
  monthZhi: string;
  dayZhi: string;
  timeZhi?: string;
}): {
  rootScore: number;
  rootHits: string[];
  touGan: string[];
  summary: string;
} {
  const branches = [input.yearZhi, input.monthZhi, input.dayZhi, input.timeZhi].filter(Boolean) as string[];
  const stems = [input.yearGan, input.monthGan, input.timeGan].filter(Boolean) as string[];
  const roots = rootScore(input.dayGan, branches);
  const help = stemHelpScore(input.dayGan, stems);
  const touGan = help.notes.filter((n) => /透|帮|印|比/.test(n) || n.includes("干"));
  const summary = [
    roots.hit.length ? `通根：${roots.hit.join("、")}` : "四支少通根",
    help.notes.length ? `透干：${help.notes.slice(0, 4).join("、")}` : "天干少助",
  ].join("；");
  return { rootScore: roots.score, rootHits: roots.hit, touGan: help.notes, summary };
}

/** 大运/流年对格局的成破影响 */
export function scoreGanZhiAgainstGeJu(
  ganZhi: string,
  geJuName: string,
  broken?: boolean
): { label: "成格" | "破格" | "平" | "扶身"; reason: string } {
  const gan = ganZhi[0] ?? "";
  const rules: Array<{ names: string[]; help: string[]; harm: string[]; helpTip: string; harmTip: string }> = [
    {
      names: ["正官格"],
      help: ["甲", "乙", "壬", "癸"], // 印/比 loosely by common — use ten gods via element better
      harm: ["丙", "丁"],
      helpTip: "印比有气，官格易清",
      harmTip: "伤官透出，官格易破",
    },
    {
      names: ["七杀格"],
      help: ["壬", "癸", "丙", "丁"],
      harm: [],
      helpTip: "印食出现，杀威可化可制",
      harmTip: "杀重无制",
    },
    {
      names: ["食神格"],
      help: ["戊", "己", "庚", "辛"],
      harm: ["壬", "癸"],
      helpTip: "财星透出，食神生财",
      harmTip: "枭印夺食，食神受制",
    },
    {
      names: ["伤官格"],
      help: ["壬", "癸", "戊", "己"],
      harm: ["庚", "辛"],
      helpTip: "伤官配印或生财，锋芒可收",
      harmTip: "伤官见官风险上升",
    },
    {
      names: ["正财格", "偏财格"],
      help: ["庚", "辛", "甲", "乙"],
      harm: [],
      helpTip: "财官或比劫平衡，财可守",
      harmTip: "比劫争夺或身弱难任",
    },
    {
      names: ["正印格", "偏印格"],
      help: ["庚", "辛"],
      harm: ["戊", "己"],
      helpTip: "官杀生印，学业事业有靠",
      harmTip: "财星破印",
    },
  ];

  // 简化：按格局名关键字 + 干五行关系提示（不严格十神）
  const hit = rules.find((r) => r.names.includes(geJuName));
  if (!hit) {
    return { label: "平", reason: `${ganZhi}对${geJuName}影响中性` };
  }
  // 用五行粗判：甲乙木、丙丁火…
  const wx = STEM_WX[gan];
  if (geJuName.includes("官") && (wx === "火" || gan === "丙" || gan === "丁")) {
    return { label: "破格", reason: `${ganZhi}易透伤官之气，${hit.harmTip}` };
  }
  if (geJuName.includes("食") && (wx === "水" || gan === "壬" || gan === "癸")) {
    return { label: "破格", reason: `${ganZhi}易见枭印，${hit.harmTip}` };
  }
  if (geJuName.includes("印") && (wx === "土" || gan === "戊" || gan === "己")) {
    return { label: "破格", reason: `${ganZhi}财星气息加重，${hit.harmTip}` };
  }
  if (broken && (wx === "木" || wx === "水")) {
    return { label: "扶身", reason: `${ganZhi}可扶身助印，缓解破格压力` };
  }
  if (geJuName.includes("杀") && (wx === "水" || wx === "火")) {
    return { label: "成格", reason: `${ganZhi}${hit.helpTip}` };
  }
  if (geJuName.includes("官") && wx === "水") {
    return { label: "成格", reason: `${ganZhi}${hit.helpTip}` };
  }
  if (geJuName.includes("食") && (wx === "土" || wx === "金")) {
    return { label: "成格", reason: `${ganZhi}${hit.helpTip}` };
  }
  return { label: "平", reason: `${ganZhi}对${geJuName}影响平稳` };
}

function stemHelpScore(dayGan: string, stems: string[]): { score: number; notes: string[] } {
  const dmWx = STEM_WX[dayGan];
  let score = 0;
  const notes: string[] = [];
  for (const gan of stems) {
    if (!gan || gan === dayGan) continue;
    const wx = STEM_WX[gan];
    if (!wx) continue;
    if (same(wx, dmWx)) {
      score += 10;
      notes.push(`${gan}比劫帮身`);
    } else if (generates(wx, dmWx)) {
      score += 8;
      notes.push(`${gan}印星生身`);
    } else if (controls(wx, dmWx)) {
      score -= 8;
      notes.push(`${gan}官杀克身`);
    } else if (generates(dmWx, wx)) {
      score -= 5;
      notes.push(`${gan}食伤泄身`);
    } else if (controls(dmWx, wx)) {
      score -= 6;
      notes.push(`${gan}财星耗身`);
    }
  }
  return { score, notes };
}

/** 调候：按日主与月令细化寒暖燥湿需求 */
function tiaoHouNeed(dayGan: string, monthZhi: string): WuXing | null {
  const dmWx = STEM_WX[dayGan] ?? "土";
  const cold = ["亥", "子", "丑"].includes(monthZhi);
  const hot = ["巳", "午", "未"].includes(monthZhi);
  const damp = ["辰", "丑", "未"].includes(monthZhi);
  if (cold) {
    if (dmWx === "水" || dmWx === "金") return "火";
    if (dmWx === "木") return "火";
    if (dmWx === "土") return "火";
    return "火";
  }
  if (hot) {
    if (dmWx === "火" || dmWx === "土") return "水";
    if (dmWx === "金") return "水";
    if (dmWx === "木") return "水";
    return "水";
  }
  if (damp && (dmWx === "土" || dmWx === "水")) return "火";
  // 春秋：甲乙木喜火暖、庚辛金喜润、丙丁火喜水、壬癸水喜土堤、戊己土喜木疏
  if (["寅", "卯"].includes(monthZhi)) {
    if (dmWx === "木") return "火";
    if (dmWx === "金") return "水";
    if (dmWx === "火") return "水";
  }
  if (["申", "酉"].includes(monthZhi)) {
    if (dmWx === "金") return "水";
    if (dmWx === "火") return "水";
    if (dmWx === "木") return "火";
  }
  return null;
}

export function analyzeDayMasterStrength(input: {
  dayGan: string;
  yearGan: string;
  monthGan: string;
  timeGan?: string | null;
  yearZhi: string;
  monthZhi: string;
  dayZhi: string;
  timeZhi?: string | null;
}): StrengthDetail {
  const { dayGan, monthZhi } = input;
  const dmWx = STEM_WX[dayGan] ?? "土";
  const monthWx = monthCommandElement(monthZhi);
  const notes: string[] = [];

  let score = 50;
  let deLing = false;
  if (same(monthWx, dmWx)) {
    score += 22;
    deLing = true;
    notes.push(`月令${monthZhi}属${monthWx}，日主得令`);
  } else if (generates(monthWx, dmWx)) {
    score += 14;
    deLing = true;
    notes.push(`月令${monthZhi}生身，日主得令生扶`);
  } else if (controls(monthWx, dmWx)) {
    score -= 18;
    notes.push(`月令${monthZhi}克身，日主失令`);
  } else if (generates(dmWx, monthWx)) {
    score -= 10;
    notes.push(`月令泄身`);
  } else if (controls(dmWx, monthWx)) {
    score -= 8;
    notes.push(`月令耗身（财地）`);
  }

  const branches = [input.yearZhi, input.monthZhi, input.dayZhi, input.timeZhi].filter(Boolean) as string[];
  const roots = rootScore(dayGan, branches);
  score += Math.min(28, roots.score);
  const deDi = roots.score >= 10;
  if (roots.hit.length) notes.push(`通根：${roots.hit.slice(0, 4).join("、")}`);
  else notes.push("四支少通根，日主根基偏虚");

  const stems = [input.yearGan, input.monthGan, input.timeGan].filter(Boolean) as string[];
  const help = stemHelpScore(dayGan, stems);
  score += help.score;
  const deShi = help.score >= 8;
  notes.push(...help.notes.slice(0, 4));

  const need = tiaoHouNeed(dayGan, monthZhi);
  if (need) notes.push(`调候倾向：喜${need}`);

  score = Math.max(5, Math.min(95, Math.round(score)));

  return {
    score,
    deLing,
    deDi,
    deShi,
    tiaoHouNeed: need,
    notes,
  };
}

function tenGodName(dm: WuXing, other: WuXing, otherGan: string): string {
  const yang = "甲丙戊庚壬".includes(otherGan);
  const dmYang = "甲丙戊庚壬".includes(Object.entries(STEM_WX).find(([, w]) => w === dm)?.[0] ?? "甲");
  // simplified naming by relation only
  if (same(dm, other)) return yang === dmYang ? "比肩" : "劫财";
  if (generates(other, dm)) return yang === dmYang ? "偏印" : "正印";
  if (generates(dm, other)) return yang === dmYang ? "食神" : "伤官";
  if (controls(dm, other)) return yang === dmYang ? "偏财" : "正财";
  if (controls(other, dm)) return yang === dmYang ? "七杀" : "正官";
  return "未知";
}

export function deriveYongShen(detail: StrengthDetail, dayGan: string, missing: string[] = []): YongShenResult {
  const dm = STEM_WX[dayGan] ?? "土";
  let strength: YongShenResult["strength"] = "中和";
  if (detail.score >= 62) strength = "偏旺";
  else if (detail.score <= 40) strength = "偏弱";

  const shengWo = Object.entries(SHENG).find(([, v]) => v === dm)?.[0] as WuXing; // 印
  const woSheng = SHENG[dm]; // 食伤
  const woKe = KE[dm]; // 财
  const keWo = Object.entries(KE).find(([, v]) => v === dm)?.[0] as WuXing; // 官杀
  const biJie = dm;

  let useful: WuXing[] = [];
  let avoid: WuXing[] = [];

  if (strength === "偏弱") {
    useful = [shengWo, biJie].filter(Boolean) as WuXing[];
    avoid = [woKe, keWo, woSheng];
  } else if (strength === "偏旺") {
    useful = [woSheng, woKe, keWo];
    avoid = [shengWo, biJie];
  } else {
    useful = [shengWo, woSheng, woKe].slice(0, 2);
    avoid = [biJie];
  }

  // 调候优先插入
  if (detail.tiaoHouNeed) {
    useful = [detail.tiaoHouNeed, ...useful.filter((x) => x !== detail.tiaoHouNeed)];
  }
  // 缺啥补啥适度参考
  for (const m of missing) {
    if (ELEMENTS_OK(m) && !useful.includes(m as WuXing)) useful.push(m as WuXing);
  }

  useful = unique(useful).slice(0, 3);
  avoid = unique(avoid.filter((x) => !useful.includes(x))).slice(0, 3);

  const usefulTenGodsHint =
    strength === "偏弱"
      ? "喜印比扶助（贵人、学习、同辈协作），忌财官过度耗克。"
      : strength === "偏旺"
        ? "喜食伤泄秀、财星耗身、官杀制约；忌再叠印比。"
        : "喜用相对平衡，大运流年观生克细节即可。";

  const summary = `日主${dayGan}（${dm}）${strength}（评分${detail.score}）。${
    detail.deLing ? "得令" : "失令"
  }·${detail.deDi ? "有根" : "少根"}·${detail.deShi ? "得势" : "党众不足"}。喜用：${useful.join("、")}；忌神：${avoid.join("、") || "无显"}。`;

  return {
    strength,
    strengthScore: detail.score,
    detail,
    usefulGods: useful,
    avoidGods: avoid,
    usefulTenGodsHint,
    summary,
  };
}

function ELEMENTS_OK(x: string): x is WuXing {
  return ["金", "木", "水", "火", "土"].includes(x);
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function scoreElementAgainstYongShen(
  element: WuXing,
  useful: WuXing[],
  avoid: WuXing[]
): { score: number; label: "吉" | "平" | "凶"; reason: string } {
  if (useful.includes(element)) return { score: 80, label: "吉", reason: `${element}为喜用` };
  if (avoid.includes(element)) return { score: 30, label: "凶", reason: `${element}为忌神` };
  return { score: 55, label: "平", reason: `${element}中性` };
}

export function scoreGanZhiAgainstYongShen(
  ganZhi: string,
  useful: WuXing[],
  avoid: WuXing[]
): { score: number; label: "吉" | "平" | "凶"; reason: string } {
  const gan = ganZhi[0];
  const zhi = ganZhi[1];
  const gWx = STEM_WX[gan];
  const zWx = BRANCH_MAIN_WX[zhi];
  if (!gWx || !zWx) return { score: 50, label: "平", reason: "干支未知" };
  const a = scoreElementAgainstYongShen(gWx, useful, avoid);
  const b = scoreElementAgainstYongShen(zWx, useful, avoid);
  const score = Math.round(a.score * 0.55 + b.score * 0.45);
  const label = score >= 68 ? "吉" : score <= 42 ? "凶" : "平";
  return {
    score,
    label,
    reason: `干${gan}(${gWx})${a.reason}；支${zhi}(${zWx})${b.reason}`,
  };
}

export { STEM_WX, BRANCH_MAIN_WX, SHENG, KE, tenGodName };
