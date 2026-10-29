/** 紫微斗数安星（基于农历生日、五行局、安紫微诀） */
const PALACES = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "仆役", "官禄", "田宅", "福德", "父母"] as const;
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

const TIAN_STARS = ["紫微", "天机", "太阳", "武曲", "天同", "廉贞"] as const;
const FU_STARS = ["天府", "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军"] as const;

/** 纳音末字 → 五行局数 */
export function naYinToJu(naYin: string): number {
  const wx = naYin.slice(-1);
  const map: Record<string, number> = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 };
  return map[wx] ?? 5;
}

/** 安紫微：农历生日 ÷ 局，商为宫位（寅起），不整除则商+1 */
export function ziweiBranchIndex(lunarDay: number, ju: number): number {
  const q = Math.floor(lunarDay / ju);
  const r = lunarDay % ju;
  const palace = r === 0 ? q : q + 1;
  // 寅=0, 卯=1 … 丑=11
  return (palace - 1 + 12) % 12;
}

export function branchAtOffset(fromYin: number, offset: number): number {
  return (fromYin + offset + 120) % 12;
}

/** 天府安星：紫微所在宫 → 天府所在宫（寅起索引） */
const TIANFU_FROM_ZIWEI = [0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export function tianfuBranchIndex(ziweiIdx: number): number {
  return TIANFU_FROM_ZIWEI[ziweiIdx % 12] ?? 0;
}

export function mingGongPalaceIndex(mingGongGanZhi: string): number {
  const zhi = mingGongGanZhi.slice(-1);
  const idx = BRANCHES.indexOf(zhi as (typeof BRANCHES)[number]);
  return idx >= 0 ? idx : 0;
}

export function palaceNameFromBranch(mingIdx: number, branchIdx: number): string {
  const offset = (branchIdx - mingIdx + 12) % 12;
  return PALACES[offset];
}

const BRIGHTNESS: Record<string, Record<number, string>> = {
  // 寅起 0..11：寅卯辰巳午未申酉戌亥子丑
  紫微: { 0: "庙", 1: "旺", 2: "得", 3: "利", 4: "平", 5: "不", 6: "庙", 7: "旺", 8: "得", 9: "利", 10: "平", 11: "不" },
  天机: { 0: "旺", 1: "陷", 2: "平", 3: "庙", 4: "平", 5: "利", 6: "旺", 7: "陷", 8: "平", 9: "庙", 10: "平", 11: "利" },
  太阳: { 0: "陷", 1: "不", 2: "旺", 3: "庙", 4: "旺", 5: "旺", 6: "庙", 7: "得", 8: "平", 9: "陷", 10: "不", 11: "陷" },
  武曲: { 0: "旺", 1: "庙", 2: "得", 3: "利", 4: "平", 5: "陷", 6: "旺", 7: "庙", 8: "得", 9: "利", 10: "平", 11: "陷" },
  天同: { 0: "平", 1: "利", 2: "庙", 3: "旺", 4: "陷", 5: "不", 6: "平", 7: "利", 8: "庙", 9: "旺", 10: "陷", 11: "不" },
  廉贞: { 0: "平", 1: "利", 2: "庙", 3: "旺", 4: "陷", 5: "不", 6: "平", 7: "利", 8: "庙", 9: "旺", 10: "陷", 11: "不" },
  天府: { 0: "庙", 1: "旺", 2: "得", 3: "利", 4: "平", 5: "得", 6: "庙", 7: "旺", 8: "得", 9: "利", 10: "平", 11: "得" },
  太阴: { 0: "庙", 1: "庙", 2: "陷", 3: "不", 4: "陷", 5: "不", 6: "陷", 7: "不", 8: "旺", 9: "庙", 10: "庙", 11: "庙" },
  贪狼: { 0: "旺", 1: "庙", 2: "平", 3: "利", 4: "陷", 5: "不", 6: "旺", 7: "庙", 8: "平", 9: "利", 10: "陷", 11: "不" },
  巨门: { 0: "旺", 1: "陷", 2: "庙", 3: "平", 4: "利", 5: "不", 6: "旺", 7: "陷", 8: "庙", 9: "平", 10: "利", 11: "不" },
  天相: { 0: "庙", 1: "旺", 2: "得", 3: "利", 4: "平", 5: "得", 6: "庙", 7: "旺", 8: "得", 9: "利", 10: "平", 11: "得" },
  天梁: { 0: "庙", 1: "旺", 2: "陷", 3: "利", 4: "平", 5: "不", 6: "庙", 7: "旺", 8: "陷", 9: "利", 10: "平", 11: "不" },
  七杀: { 0: "旺", 1: "庙", 2: "得", 3: "利", 4: "平", 5: "陷", 6: "旺", 7: "庙", 8: "得", 9: "利", 10: "平", 11: "陷" },
  破军: { 0: "旺", 1: "庙", 2: "平", 3: "利", 4: "陷", 5: "不", 6: "旺", 7: "庙", 8: "平", 9: "利", 10: "陷", 11: "不" },
};

export function getBrightness(star: string, branchIdx: number): string {
  return BRIGHTNESS[star]?.[branchIdx] ?? "平";
}

export interface StarPlacement {
  palace: string;
  branch: string;
  star: string;
  brightness: string;
}

export function placeMainStars(
  lunarDay: number,
  ju: number,
  mingGongGanZhi: string
): { stars: StarPlacement[]; ziweiBranch: string; tianfuBranch: string; juName: string } {
  const mingIdx = mingGongPalaceIndex(mingGongGanZhi);
  const ziweiIdx = ziweiBranchIndex(lunarDay, ju);
  const fuIdx = tianfuBranchIndex(ziweiIdx);

  const juNames: Record<number, string> = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };

  const stars: StarPlacement[] = [];

  TIAN_STARS.forEach((star, i) => {
    const bIdx = branchAtOffset(ziweiIdx, -i);
    stars.push({
      star,
      branch: BRANCHES[bIdx],
      palace: palaceNameFromBranch(mingIdx, bIdx),
      brightness: getBrightness(star, bIdx),
    });
  });

  FU_STARS.forEach((star, i) => {
    const bIdx = branchAtOffset(fuIdx, i);
    stars.push({
      star,
      branch: BRANCHES[bIdx],
      palace: palaceNameFromBranch(mingIdx, bIdx),
      brightness: getBrightness(star, bIdx),
    });
  });

  return {
    stars,
    ziweiBranch: BRANCHES[ziweiIdx],
    tianfuBranch: BRANCHES[fuIdx],
    juName: juNames[ju] ?? "土五局",
  };
}

export { PALACES, BRANCHES };
