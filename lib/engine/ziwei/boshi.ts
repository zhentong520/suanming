import { BRANCHES, palaceNameFromBranch } from "./placement";

/**
 * 博士十二神（《紫微斗数全书》通行安法）：
 * 禄存所在宫起博士，阳男阴女顺行、阴男阳女逆行，依次：
 * 博士、力士、青龙、小耗、将军、奏书、飞廉、喜神、病符、大耗、伏兵、官府。
 * 禄存安法：甲禄在寅、乙卯、丙戊巳、丁己午、庚申、辛酉、壬亥、癸子。
 */
export interface BoShiStar {
  star: string;
  branch: string;
  palace: string;
  auspicious: boolean;
  note: string;
  order: number;
}

const LUCUN: Record<string, string> = {
  甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳", 己: "午",
  庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
};

const BO_SHI_ORDER = [
  "博士", "力士", "青龙", "小耗", "将军", "奏书",
  "飞廉", "喜神", "病符", "大耗", "伏兵", "官府",
];

/** 吉神（博士、力士、青龙、将军、奏书、喜神）与凶神（余者） */
const AUSPICIOUS = new Set(["博士", "力士", "青龙", "将军", "奏书", "喜神"]);

const STAR_NOTE: Record<string, string> = {
  博士: "主聪明权柄",
  力士: "主权势操劳",
  青龙: "主喜气进财",
  小耗: "主小破财耗",
  将军: "主威武争斗",
  奏书: "主文书之喜",
  飞廉: "主口舌是非",
  喜神: "主喜庆人缘",
  病符: "主疾病缠扰",
  大耗: "主大破财耗",
  伏兵: "主暗损阴谋",
  官府: "主官非词讼",
};

export function computeBoShiShiErShen(
  yearGan: string,
  gender: string,
  mingIdx: number,
): BoShiStar[] {
  const luBranch = LUCUN[yearGan] ?? "寅";
  const start = BRANCHES.indexOf(luBranch as (typeof BRANCHES)[number]);
  if (start < 0) return [];

  const yangGan = ["甲", "丙", "戊", "庚", "壬"].includes(yearGan);
  const forward = (yangGan && gender === "男") || (!yangGan && gender === "女");

  return BO_SHI_ORDER.map((star, i) => {
    const idx = forward ? (start + i) % 12 : (start - i + 24) % 12;
    const branch = BRANCHES[idx];
    return {
      star,
      branch,
      palace: palaceNameFromBranch(mingIdx, idx),
      auspicious: AUSPICIOUS.has(star),
      note: STAR_NOTE[star],
      order: i,
    };
  });
}

export function formatBoShiSummary(items: Array<BoShiStar & { note?: string }>): string {
  return items.map((s) => `${s.star}在${s.palace}`).join("、");
}
