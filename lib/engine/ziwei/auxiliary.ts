/** 紫微辅星安星规则 */
import { BRANCHES, branchAtOffset, mingGongPalaceIndex, palaceNameFromBranch } from "./placement";

export interface AuxStar {
  star: string;
  branch: string;
  palace: string;
  category: "文昌系" | "魁钺系" | "禄马系" | "煞曜系" | "空劫系" | "桃花系" | "孤寡系" | "杂曜系";
}

const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/** 文昌：戌起子时顺数至生时；文曲：辰起子时顺数至生时 */
export function wenChangQu(hourZhiIdx: number, mingIdx: number): AuxStar[] {
  const changIdx = branchAtOffset(10, hourZhiIdx); // 戌=10
  const quIdx = branchAtOffset(4, hourZhiIdx); // 辰=4
  return [
    { star: "文昌", branch: BRANCHES[changIdx], palace: palaceNameFromBranch(mingIdx, changIdx), category: "文昌系" },
    { star: "文曲", branch: BRANCHES[quIdx], palace: palaceNameFromBranch(mingIdx, quIdx), category: "文昌系" },
  ];
}

/** 左辅：辰起正月顺数至生月；右弼：戌起正月逆数至生月 */
export function zuoYouFu(lunarMonth: number, mingIdx: number): AuxStar[] {
  const zuoIdx = branchAtOffset(4, lunarMonth - 1);
  const youIdx = branchAtOffset(10, -(lunarMonth - 1));
  return [
    { star: "左辅", branch: BRANCHES[zuoIdx], palace: palaceNameFromBranch(mingIdx, zuoIdx), category: "魁钺系" },
    { star: "右弼", branch: BRANCHES[youIdx], palace: palaceNameFromBranch(mingIdx, youIdx), category: "魁钺系" },
  ];
}

const KUI_YUE: Record<string, [number, number]> = {
  甲: [1, 7],
  戊: [1, 7],
  庚: [1, 7],
  乙: [0, 8],
  己: [0, 8],
  丙: [11, 9],
  丁: [11, 9],
  壬: [3, 5],
  癸: [3, 5],
  辛: [6, 2],
};

/** 天魁天钺 */
export function kuiYue(yearGan: string, mingIdx: number): AuxStar[] {
  const [kui, yue] = KUI_YUE[yearGan] ?? [1, 7];
  return [
    { star: "天魁", branch: BRANCHES[kui], palace: palaceNameFromBranch(mingIdx, kui), category: "魁钺系" },
    { star: "天钺", branch: BRANCHES[yue], palace: palaceNameFromBranch(mingIdx, yue), category: "魁钺系" },
  ];
}

const LU_CUN: Record<string, number> = {
  甲: 2,
  乙: 3,
  丙: 5,
  丁: 6,
  戊: 5,
  己: 6,
  庚: 8,
  辛: 9,
  壬: 11,
  癸: 0,
};

/** 禄存、擎羊、陀罗 */
export function luYangTuo(yearGan: string, mingIdx: number): AuxStar[] {
  const lu = LU_CUN[yearGan] ?? 2;
  const yang = branchAtOffset(lu, 1);
  const tuo = branchAtOffset(lu, -1);
  return [
    { star: "禄存", branch: BRANCHES[lu], palace: palaceNameFromBranch(mingIdx, lu), category: "禄马系" },
    { star: "擎羊", branch: BRANCHES[yang], palace: palaceNameFromBranch(mingIdx, yang), category: "煞曜系" },
    { star: "陀罗", branch: BRANCHES[tuo], palace: palaceNameFromBranch(mingIdx, tuo), category: "煞曜系" },
  ];
}

/** 天马：申子辰→寅，寅午戌→申，亥卯未→巳，巳酉丑→亥 */
export function tianMa(yearZhiIdx: number, mingIdx: number): AuxStar {
  const groups = [
    { zhi: [8, 0, 4], ma: 2 },
    { zhi: [2, 6, 10], ma: 8 },
    { zhi: [11, 3, 7], ma: 5 },
    { zhi: [5, 9, 1], ma: 11 },
  ];
  const g = groups.find((x) => x.zhi.includes(yearZhiIdx)) ?? groups[0];
  return {
    star: "天马",
    branch: BRANCHES[g.ma],
    palace: palaceNameFromBranch(mingIdx, g.ma),
    category: "禄马系",
  };
}

/** 火星铃星 */
export function huoLingXing(yearZhiIdx: number, hourZhiIdx: number, mingIdx: number): AuxStar[] {
  const huoStart = branchAtOffset(2, yearZhiIdx);
  const huoIdx = branchAtOffset(huoStart, hourZhiIdx);
  const lingStart = branchAtOffset(3, yearZhiIdx);
  const lingIdx = branchAtOffset(lingStart, hourZhiIdx);
  return [
    { star: "火星", branch: BRANCHES[huoIdx], palace: palaceNameFromBranch(mingIdx, huoIdx), category: "煞曜系" },
    { star: "铃星", branch: BRANCHES[lingIdx], palace: palaceNameFromBranch(mingIdx, lingIdx), category: "煞曜系" },
  ];
}

/** 地空地劫 */
export function kongJie(hourZhiIdx: number, mingIdx: number): AuxStar[] {
  const kongIdx = branchAtOffset(11, hourZhiIdx);
  const jieIdx = branchAtOffset(11, -hourZhiIdx);
  return [
    { star: "地空", branch: BRANCHES[kongIdx], palace: palaceNameFromBranch(mingIdx, kongIdx), category: "空劫系" },
    { star: "地劫", branch: BRANCHES[jieIdx], palace: palaceNameFromBranch(mingIdx, jieIdx), category: "空劫系" },
  ];
}

/** 红鸾：卯起子年逆数至生年；天喜对宫 */
export function hongLuanTianXi(yearZhiIdx: number, mingIdx: number): AuxStar[] {
  const luanIdx = branchAtOffset(3, -yearZhiIdx);
  const xiIdx = branchAtOffset(luanIdx, 6);
  return [
    { star: "红鸾", branch: BRANCHES[luanIdx], palace: palaceNameFromBranch(mingIdx, luanIdx), category: "桃花系" },
    { star: "天喜", branch: BRANCHES[xiIdx], palace: palaceNameFromBranch(mingIdx, xiIdx), category: "桃花系" },
  ];
}

/** 天姚：丑起正月顺数至生月 */
export function tianYao(lunarMonth: number, mingIdx: number): AuxStar {
  const idx = branchAtOffset(1, lunarMonth - 1);
  return {
    star: "天姚",
    branch: BRANCHES[idx],
    palace: palaceNameFromBranch(mingIdx, idx),
    category: "桃花系",
  };
}

/** 孤辰寡宿：寅卯辰→巳/丑；巳午未→申/辰；申酉戌→亥/未；亥子丑→寅/戌 */
export function guChenGuaSu(yearZhiIdx: number, mingIdx: number): AuxStar[] {
  const groups = [
    { zhi: [2, 3, 4], gu: 5, gua: 1 },
    { zhi: [5, 6, 7], gu: 8, gua: 4 },
    { zhi: [8, 9, 10], gu: 11, gua: 7 },
    { zhi: [11, 0, 1], gu: 2, gua: 10 },
  ];
  const g = groups.find((x) => x.zhi.includes(yearZhiIdx)) ?? groups[0];
  return [
    { star: "孤辰", branch: BRANCHES[g.gu], palace: palaceNameFromBranch(mingIdx, g.gu), category: "孤寡系" },
    { star: "寡宿", branch: BRANCHES[g.gua], palace: palaceNameFromBranch(mingIdx, g.gua), category: "孤寡系" },
  ];
}

/** 华盖：寅午戌→戌，亥卯未→未，申子辰→辰，巳酉丑→丑 */
export function huaGai(yearZhiIdx: number, mingIdx: number): AuxStar {
  const map: Record<number, number> = {
    2: 10,
    6: 10,
    10: 10,
    11: 7,
    3: 7,
    7: 7,
    8: 4,
    0: 4,
    4: 4,
    5: 1,
    9: 1,
    1: 1,
  };
  const idx = map[yearZhiIdx] ?? 10;
  return {
    star: "华盖",
    branch: BRANCHES[idx],
    palace: palaceNameFromBranch(mingIdx, idx),
    category: "杂曜系",
  };
}

/** 天刑：酉起正月顺数至生月 */
export function tianXing(lunarMonth: number, mingIdx: number): AuxStar {
  const idx = branchAtOffset(9, lunarMonth - 1);
  return {
    star: "天刑",
    branch: BRANCHES[idx],
    palace: palaceNameFromBranch(mingIdx, idx),
    category: "杂曜系",
  };
}

/** 天哭：午起子年逆；天虚：午起子年顺 */
export function tianKuXu(yearZhiIdx: number, mingIdx: number): AuxStar[] {
  const ku = branchAtOffset(6, -yearZhiIdx);
  const xu = branchAtOffset(6, yearZhiIdx);
  return [
    { star: "天哭", branch: BRANCHES[ku], palace: palaceNameFromBranch(mingIdx, ku), category: "杂曜系" },
    { star: "天虚", branch: BRANCHES[xu], palace: palaceNameFromBranch(mingIdx, xu), category: "杂曜系" },
  ];
}

/** 龙池：辰起子年顺；凤阁：戌起子年逆 */
export function longChiFengGe(yearZhiIdx: number, mingIdx: number): AuxStar[] {
  const chi = branchAtOffset(4, yearZhiIdx);
  const ge = branchAtOffset(10, -yearZhiIdx);
  return [
    { star: "龙池", branch: BRANCHES[chi], palace: palaceNameFromBranch(mingIdx, chi), category: "杂曜系" },
    { star: "凤阁", branch: BRANCHES[ge], palace: palaceNameFromBranch(mingIdx, ge), category: "杂曜系" },
  ];
}

/** 三台：左辅起顺数至生日；八座：右弼起逆数至生日（按日数简化） */
export function sanTaiBaZuo(lunarDay: number, lunarMonth: number, mingIdx: number): AuxStar[] {
  const zuo = branchAtOffset(4, lunarMonth - 1);
  const you = branchAtOffset(10, -(lunarMonth - 1));
  const dayOff = Math.min(30, Math.max(1, lunarDay)) - 1;
  const tai = branchAtOffset(zuo, dayOff);
  const zuoBa = branchAtOffset(you, -dayOff);
  return [
    { star: "三台", branch: BRANCHES[tai], palace: palaceNameFromBranch(mingIdx, tai), category: "杂曜系" },
    { star: "八座", branch: BRANCHES[zuoBa], palace: palaceNameFromBranch(mingIdx, zuoBa), category: "杂曜系" },
  ];
}

export function placeAuxiliaryStars(
  yearGan: string,
  yearZhiIdx: number,
  lunarMonth: number,
  hourZhiIdx: number,
  mingGongGz: string,
  lunarDay = 1
): AuxStar[] {
  const mingIdx = mingGongPalaceIndex(mingGongGz);
  return [
    ...wenChangQu(hourZhiIdx, mingIdx),
    ...zuoYouFu(lunarMonth, mingIdx),
    ...kuiYue(yearGan, mingIdx),
    ...luYangTuo(yearGan, mingIdx),
    tianMa(yearZhiIdx, mingIdx),
    ...huoLingXing(yearZhiIdx, hourZhiIdx, mingIdx),
    ...kongJie(hourZhiIdx, mingIdx),
    ...hongLuanTianXi(yearZhiIdx, mingIdx),
    tianYao(lunarMonth, mingIdx),
    ...guChenGuaSu(yearZhiIdx, mingIdx),
    huaGai(yearZhiIdx, mingIdx),
    tianXing(lunarMonth, mingIdx),
    ...tianKuXu(yearZhiIdx, mingIdx),
    ...longChiFengGe(yearZhiIdx, mingIdx),
    ...sanTaiBaZuo(lunarDay, lunarMonth, mingIdx),
  ];
}

export { GAN };
