/** 紫微四化飞星串宫与十二宫干 */

import { PALACES, BRANCHES, getBrightness } from "./placement";
import { attachSiHuaPalace, getSiHua, type SiHua } from "./sihua-daxian";

export type FeiXingSource = "生年" | "大限" | "流年" | "流月" | "流日";

export interface FeiXingEdge {
  source: FeiXingSource;
  star: string;
  hua: "禄" | "权" | "科" | "忌";
  fromPalace: string;
  toPalace: string;
  opposite: boolean;
  selfHua: boolean;
  brightness: string;
  note: string;
}

export interface PalaceStem {
  palace: string;
  branch: string;
  stem: string;
  ganZhi: string;
}

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

const HUA_NOTE: Record<string, string> = {
  禄: "主增益、机遇与实质收获",
  权: "主权柄、掌控与主导力",
  科: "主名声、文书与贵人",
  忌: "主操心、阻滞与反复",
};

/** 命宫起寅位天干：阳男阴女顺，阴男阳女逆；以年干起寅宫干 */
export function computePalaceStems(
  yearGan: string,
  mingGongBranchIdx: number,
  forward: boolean
): PalaceStem[] {
  const ganIdx = STEMS.indexOf(yearGan as (typeof STEMS)[number]);
  const startGan = ganIdx >= 0 ? ganIdx : 0;
  // 寅宫干：甲年丙寅、乙年戊寅… 简化：年干对应寅宫干 = (年干序*2+2)%10 甲→丙
  const yinStemIdx = (startGan * 2 + 2) % 10;

  return PALACES.map((palace, palaceOffset) => {
    const branchIdx = forward
      ? (mingGongBranchIdx + palaceOffset) % 12
      : (mingGongBranchIdx - palaceOffset + 120) % 12;
    // 从寅起算该地支相对寅的偏移
    const fromYin = (branchIdx - 2 + 12) % 12;
    const stemIdx = (yinStemIdx + fromYin) % 10;
    const stem = STEMS[stemIdx];
    const branch = BRANCHES[branchIdx];
    return {
      palace,
      branch,
      stem,
      ganZhi: `${stem}${branch}`,
    };
  });
}

function starMeta(
  star: string,
  allStars: Array<{ star: string; palace: string; branch?: string; brightness?: string }>
) {
  const hit = allStars.find((s) => s.star === star);
  return {
    palace: hit?.palace ?? "未入盘",
    branch: hit?.branch ?? "",
    brightness: hit?.brightness ?? "平",
  };
}

function oppositePalace(palace: string): string {
  const i = PALACES.indexOf(palace as (typeof PALACES)[number]);
  if (i < 0) return palace;
  return PALACES[(i + 6) % 12];
}

/** 将一组四化展开为飞星边：星所在宫 → 飞入关系（自化/对宫） */
export function buildFeiXingEdges(
  source: FeiXingEdge["source"],
  sihua: SiHua[],
  allStars: Array<{ star: string; palace: string; branch?: string; brightness?: string }>
): FeiXingEdge[] {
  const edges: FeiXingEdge[] = [];
  for (const s of sihua) {
    const meta = starMeta(s.star, allStars);
    const from = meta.palace;
    const opp = oppositePalace(from);
    const selfHua = from !== "未入盘";
    const brightness =
      meta.branch && BRANCHES.includes(meta.branch as (typeof BRANCHES)[number])
        ? getBrightness(s.star, BRANCHES.indexOf(meta.branch as (typeof BRANCHES)[number]))
        : meta.brightness;

    edges.push({
      source,
      star: s.star,
      hua: s.hua,
      fromPalace: from,
      toPalace: from,
      opposite: false,
      selfHua,
      brightness,
      note: `${s.star}化${s.hua}在${from}（${HUA_NOTE[s.hua]}；亮度${brightness}${selfHua ? "；本宫自化" : ""}）`,
    });
    edges.push({
      source,
      star: s.star,
      hua: s.hua,
      fromPalace: from,
      toPalace: opp,
      opposite: true,
      selfHua: false,
      brightness,
      note: `${s.star}化${s.hua}冲对宫${opp}（对宫受${s.hua}力影响）`,
    });
  }
  return edges;
}

export function computeFeiXingBundle(input: {
  yearGan: string;
  daXianGan?: string;
  liuNianGan?: string;
  liuYueGan?: string;
  liuRiGan?: string;
  allStars: Array<{ star: string; palace: string; branch?: string; brightness?: string }>;
}) {
  const birth = attachSiHuaPalace(getSiHua(input.yearGan), input.allStars);
  const daXianSiHua = input.daXianGan
    ? attachSiHuaPalace(getSiHua(input.daXianGan), input.allStars)
    : [];
  const liuNianSiHua = input.liuNianGan
    ? attachSiHuaPalace(getSiHua(input.liuNianGan), input.allStars)
    : [];
  const liuYueSiHua = input.liuYueGan
    ? attachSiHuaPalace(getSiHua(input.liuYueGan), input.allStars)
    : [];
  const liuRiSiHua = input.liuRiGan
    ? attachSiHuaPalace(getSiHua(input.liuRiGan), input.allStars)
    : [];

  const feiXing = [
    ...buildFeiXingEdges("生年", birth, input.allStars),
    ...buildFeiXingEdges("大限", daXianSiHua, input.allStars),
    ...buildFeiXingEdges("流年", liuNianSiHua, input.allStars),
    ...buildFeiXingEdges("流月", liuYueSiHua, input.allStars),
    ...buildFeiXingEdges("流日", liuRiSiHua, input.allStars),
  ];

  return {
    birthSiHua: birth,
    daXianSiHua,
    liuNianSiHua,
    liuYueSiHua,
    liuRiSiHua,
    feiXing,
  };
}

/** 忌冲禄/权等简要断语 */
export function interpretFeiXingClash(edges: FeiXingEdge[]): string {
  const self = edges.filter((e) => !e.opposite);
  const bySource = (src: FeiXingSource) => self.filter((e) => e.source === src);
  const parts: string[] = [];
  for (const src of ["生年", "大限", "流年", "流月", "流日"] as FeiXingSource[]) {
    const list = bySource(src);
    if (!list.length) continue;
    const ji = list.find((e) => e.hua === "忌");
    const lu = list.find((e) => e.hua === "禄");
    if (ji && lu && ji.fromPalace === lu.fromPalace) {
      parts.push(`${src}禄忌同宫于${ji.fromPalace}，得失并存，宜主动化解。`);
    } else if (ji) {
      const opp = edges.find((e) => e.source === src && e.opposite && e.hua === "忌");
      parts.push(`${src}忌在${ji.fromPalace}${opp ? `冲${opp.toPalace}` : ""}，该宫事务多反复。`);
    }
  }
  return parts.join(" ") || "飞星无明显禄忌对冲，宜按各宫四化顺推。";
}

export function formatFeiXingSummary(edges: FeiXingEdge[], limit = 12): string {
  const self = edges.filter((e) => !e.opposite).slice(0, limit);
  if (!self.length) return "未见飞星数据。";
  return self.map((e) => `[${e.source}] ${e.note}`).join("\n");
}
