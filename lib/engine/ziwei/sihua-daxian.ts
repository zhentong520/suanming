/** 紫微四化与大限流年 */
import { PALACES, BRANCHES } from "./placement";

export interface SiHua {
  star: string;
  hua: "禄" | "权" | "科" | "忌";
  palace?: string;
}

const SI_HUA_TABLE: Record<string, SiHua[]> = {
  甲: [
    { star: "廉贞", hua: "禄" },
    { star: "破军", hua: "权" },
    { star: "武曲", hua: "科" },
    { star: "太阳", hua: "忌" },
  ],
  乙: [
    { star: "天机", hua: "禄" },
    { star: "天梁", hua: "权" },
    { star: "紫微", hua: "科" },
    { star: "太阴", hua: "忌" },
  ],
  丙: [
    { star: "天同", hua: "禄" },
    { star: "天机", hua: "权" },
    { star: "文昌", hua: "科" },
    { star: "廉贞", hua: "忌" },
  ],
  丁: [
    { star: "太阴", hua: "禄" },
    { star: "天同", hua: "权" },
    { star: "天机", hua: "科" },
    { star: "巨门", hua: "忌" },
  ],
  戊: [
    { star: "贪狼", hua: "禄" },
    { star: "太阴", hua: "权" },
    { star: "右弼", hua: "科" },
    { star: "天机", hua: "忌" },
  ],
  己: [
    { star: "武曲", hua: "禄" },
    { star: "贪狼", hua: "权" },
    { star: "天梁", hua: "科" },
    { star: "文曲", hua: "忌" },
  ],
  庚: [
    { star: "太阳", hua: "禄" },
    { star: "武曲", hua: "权" },
    { star: "太阴", hua: "科" },
    { star: "天同", hua: "忌" },
  ],
  辛: [
    { star: "巨门", hua: "禄" },
    { star: "太阳", hua: "权" },
    { star: "文曲", hua: "科" },
    { star: "文昌", hua: "忌" },
  ],
  壬: [
    { star: "天梁", hua: "禄" },
    { star: "紫微", hua: "权" },
    { star: "左辅", hua: "科" },
    { star: "武曲", hua: "忌" },
  ],
  癸: [
    { star: "破军", hua: "禄" },
    { star: "巨门", hua: "权" },
    { star: "太阴", hua: "科" },
    { star: "贪狼", hua: "忌" },
  ],
};

export function getSiHua(yearGan: string): SiHua[] {
  return SI_HUA_TABLE[yearGan] ?? [];
}

export interface DaXianPeriod {
  palace: string;
  branch: string;
  startAge: number;
  endAge: number;
  isCurrent: boolean;
}

const JU_START_AGE: Record<number, number> = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };

/** 大限：阳男阴女顺行，阴男阳女逆行，每宫十年 */
export function computeDaXian(
  ju: number,
  gender: string,
  yearGan: string,
  mingGongBranchIdx: number,
  currentAge: number
): DaXianPeriod[] {
  const yangGan = ["甲", "丙", "戊", "庚", "壬"].includes(yearGan);
  const isMale = gender === "男";
  const forward = (yangGan && isMale) || (!yangGan && !isMale);
  const startAge = JU_START_AGE[ju] ?? 5;

  return Array.from({ length: 12 }, (_, i) => {
    const offset = forward ? i : -i;
    const branchIdx = (mingGongBranchIdx + offset + 120) % 12;
    const palaceIdx = (offset + 120) % 12;
    const ageStart = startAge + i * 10;
    const ageEnd = ageStart + 9;
    return {
      palace: PALACES[palaceIdx],
      branch: BRANCHES[branchIdx],
      startAge: ageStart,
      endAge: ageEnd,
      isCurrent: currentAge >= ageStart && currentAge <= ageEnd,
    };
  });
}

export interface LiuNianInfo {
  year: number;
  ganZhi: string;
  age: number;
  palace: string;
}

/** 流年：当年干支与虚岁对应大限宫位 */
export function computeLiuNian(
  birthYear: number,
  mingGongBranchIdx: number,
  ganZhiList: Array<{ year: number; ganZhi: string }>,
  forward: boolean
): LiuNianInfo[] {
  const currentYear = new Date().getFullYear();
  return ganZhiList
    .filter((g) => g.year >= currentYear - 1 && g.year <= currentYear + 5)
    .map((g) => {
      const age = g.year - birthYear + 1;
      const offset = forward ? age % 12 : -age % 12;
      const palaceIdx = (offset + 120) % 12;
      return {
        year: g.year,
        ganZhi: g.ganZhi,
        age,
        palace: PALACES[palaceIdx],
      };
    });
}

export function attachSiHuaPalace(
  sihua: SiHua[],
  allStars: Array<{ star: string; palace: string }>
): SiHua[] {
  return sihua.map((s) => ({
    ...s,
    palace: allStars.find((st) => st.star === s.star)?.palace ?? "未入盘",
  }));
}

export interface LiuYueInfo {
  lunarMonth: number;
  palace: string;
  branch: string;
  gan?: string;
  ganZhi?: string;
  siHua?: SiHua[];
}

export interface LiuRiInfo {
  lunarDay: number;
  palace: string;
  branch: string;
  gan?: string;
  ganZhi?: string;
  siHua?: SiHua[];
}

/** 流月：以流年命宫为正月，顺数至目标农历月 */
export function computeLiuYue(
  liuNianPalaceIdx: number,
  lunarMonth: number,
  mingGongBranchIdx: number,
  monthGanZhi?: string
): LiuYueInfo {
  const month = Math.min(12, Math.max(1, lunarMonth));
  const palaceIdx = (liuNianPalaceIdx + (month - 1) + 120) % 12;
  const branchIdx = (mingGongBranchIdx + palaceIdx + 120) % 12;
  const gan = monthGanZhi?.[0];
  return {
    lunarMonth: month,
    palace: PALACES[palaceIdx],
    branch: BRANCHES[branchIdx],
    gan,
    ganZhi: monthGanZhi,
    siHua: gan ? getSiHua(gan) : undefined,
  };
}

/** 流日：以流月命宫为初一，顺数至农历日 */
export function computeLiuRi(
  liuYuePalaceIdx: number,
  lunarDay: number,
  mingGongBranchIdx: number,
  dayGanZhi?: string
): LiuRiInfo {
  const day = Math.min(30, Math.max(1, lunarDay));
  const palaceIdx = (liuYuePalaceIdx + (day - 1) + 120) % 12;
  const branchIdx = (mingGongBranchIdx + palaceIdx + 120) % 12;
  const gan = dayGanZhi?.[0];
  return {
    lunarDay: day,
    palace: PALACES[palaceIdx],
    branch: BRANCHES[branchIdx],
    gan,
    ganZhi: dayGanZhi,
    siHua: gan ? getSiHua(gan) : undefined,
  };
}

export function liuNianPalaceIndex(birthYear: number, year: number, forward: boolean): number {
  const age = year - birthYear + 1;
  const offset = forward ? age % 12 : -age % 12;
  return (offset + 120) % 12;
}
