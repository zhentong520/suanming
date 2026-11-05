/**
 * 紫微杂曜与月份口径（口径可配置体系 v4）
 *
 * 覆盖 ziwei-doushu 9 类流派开关中自研引擎涉及的剩余项：
 *  - 天马（年支起 / 月支起）
 *  - 天魁天钺（4 种安诀变体，差异集中在庚辛壬癸干）
 *  - 庚干生年四化（5 种主流变体，戊/壬干走四化流派开关）
 *  - 闰月归属（月中分界 / 归本月 / 归次月）
 * 依据：各安诀均为公版古籍通行口诀；变体对照移植自 ziwei-doushu（MIT，金标准盘核对）。
 * 未纳入：天空、天使天伤、长生十二神、截空旬空（iztro 固定口径或使用率低，后续按需扩展）。
 */

import { BRANCHES } from "./placement";

export type TianmaSchool = "year-branch" | "month-branch";
export type KuiyueSchool = "qs1" | "qs2" | "qs3" | "qs4";
export type LeapMonthSchool = "split" | "origin" | "next";
export type GengSihua = "GYWYT" | "GYWTY" | "GYWFT" | "GYWFX" | "GYWTX";

export interface TianmaSchoolMeta {
  key: TianmaSchool;
  name: string;
  basis: string;
}
export const TIANMA_SCHOOL_META: Record<TianmaSchool, TianmaSchoolMeta> = {
  "year-branch": { key: "year-branch", name: "年支起（默认）", basis: "寅午戌人马在申、申子辰马在寅、巳酉丑马在亥、亥卯未马在巳，以生年支起（通行）" },
  "month-branch": { key: "month-branch", name: "月支起", basis: "同诀而以生月支起天马，部分流派用于流月驛马推断" },
};

export interface KuiyueSchoolMeta {
  key: KuiyueSchool;
  name: string;
  basis: string;
}
/** 各派天魁天钺表：年干 → [魁, 钺] 地支序（子起 0） */
const KUIYUE_TABLES: Record<KuiyueSchool, Record<string, [number, number]>> = {
  qs1: {
    甲: [1, 7], 戊: [1, 7], 庚: [1, 7],
    乙: [0, 8], 己: [0, 8],
    丙: [11, 9], 丁: [11, 9],
    壬: [3, 5], 癸: [3, 5],
    辛: [6, 2],
  },
  qs2: {
    甲: [1, 7], 戊: [1, 7], 庚: [7, 3],
    乙: [0, 8], 己: [0, 8],
    丙: [11, 9], 丁: [11, 9],
    壬: [5, 3], 癸: [3, 5],
    辛: [7, 3],
  },
  qs3: {
    甲: [1, 7], 戊: [1, 7], 庚: [3, 7],
    乙: [0, 8], 己: [0, 8],
    丙: [11, 9], 丁: [11, 9],
    壬: [5, 3], 癸: [3, 5],
    辛: [3, 7],
  },
  qs4: {
    甲: [1, 7], 戊: [1, 7], 庚: [1, 7],
    乙: [0, 8], 己: [0, 8],
    丙: [11, 9], 丁: [11, 9],
    壬: [3, 5], 癸: [5, 3],
    辛: [7, 3],
  },
};
export const KUIYUE_SCHOOL_META: Record<KuiyueSchool, KuiyueSchoolMeta> = {
  qs1: { key: "qs1", name: "通行诀（默认）", basis: "甲戊庚牛羊、乙己鼠猴乡、丙丁猪鸡位、壬癸兔蛇藏、六辛逢马虎（通行口诀）" },
  qs2: { key: "qs2", name: "诀二（庚辛午寅）", basis: "庚辛魁钺改午寅、壬改巳卯（ziwei-doushu 变体二，金标准盘核对）" },
  qs3: { key: "qs3", name: "诀三（庚辛寅午）", basis: "庚辛魁钺改寅午（ziwei-doushu 变体三）" },
  qs4: { key: "qs4", name: "诀四（辛午寅癸巳卯）", basis: "辛改午寅、癸改巳卯（ziwei-doushu 变体四）" },
};

export interface LeapMonthMeta {
  key: LeapMonthSchool;
  name: string;
  basis: string;
}
export const LEAP_MONTH_META: Record<LeapMonthSchool, LeapMonthMeta> = {
  split: { key: "split", name: "月中分界（默认）", basis: "闰月前 15 天归本月、后 15 天归次月，主流排盘默认口径（ziwei-doushu 150 组金标准盘对照）" },
  origin: { key: "origin", name: "整月归本月", basis: "闰 X 月整月按 X 月起排" },
  next: { key: "next", name: "整月归次月", basis: "闰 X 月整月按 X+1 月起排（倪师派）" },
};

export interface GengSihuaMeta {
  key: GengSihua;
  name: string;
  basis: string;
}
/** 庚干四化五变体：[禄, 权, 科, 忌] */
export const GENG_SI_HUA: Record<GengSihua, [string, string, string, string]> = {
  GYWYT: ["太阳", "武曲", "太阴", "天同"],
  GYWTY: ["太阳", "武曲", "天同", "太阴"],
  GYWFT: ["太阳", "武曲", "天府", "天同"],
  GYWFX: ["太阳", "武曲", "天府", "天相"],
  GYWTX: ["太阳", "武曲", "天同", "天相"],
};
export const GENG_SI_HUA_META: Record<GengSihua, GengSihuaMeta> = {
  GYWYT: { key: "GYWYT", name: "阳武阴同（默认）", basis: "太阳禄、武曲权、太阴科、天同忌——《紫微斗数全集》通行" },
  GYWTY: { key: "GYWTY", name: "阳武同阴", basis: "太阳禄、武曲权、天同科、太阴忌——《全书》天同不化忌说" },
  GYWFT: { key: "GYWFT", name: "阳武府同", basis: "太阳禄、武曲权、天府科、天同忌——中州派王亭之" },
  GYWFX: { key: "GYWFX", name: "阳武府相", basis: "太阳禄、武曲权、天府科、天相忌——天相化忌说" },
  GYWTX: { key: "GYWTX", name: "阳武同相", basis: "太阳禄、武曲权、天同科、天相忌——北派" },
};

export function normalizeTianmaSchool(v?: string | null): TianmaSchool {
  return v === "month-branch" ? "month-branch" : "year-branch";
}
export function normalizeKuiyueSchool(v?: string | null): KuiyueSchool {
  return v === "qs2" || v === "qs3" || v === "qs4" ? v : "qs1";
}
export function normalizeLeapMonthSchool(v?: string | null): LeapMonthSchool {
  return v === "origin" || v === "next" ? v : "split";
}
export function normalizeGengSihua(v?: string | null): GengSihua {
  return v === "GYWTY" || v === "GYWFT" || v === "GYWFX" || v === "GYWTX" ? v : "GYWYT";
}

/** 闰月归属 → 斗数有效月序（1-12）。lunarMonthSigned<0 表示闰月 */
export function effectiveDouMonth(lunarMonthSigned: number, lunarDay: number, school: LeapMonthSchool): number {
  const day = Math.min(30, Math.max(1, lunarDay || 1));
  if (lunarMonthSigned >= 0) return lunarMonthSigned;
  const m = Math.abs(lunarMonthSigned);
  if (school === "origin") return m;
  if (school === "next") return Math.min(12, m + 1);
  return day <= 15 ? m : Math.min(12, m + 1);
}

/** 天马：按年支或月支三合起马 */
export function tianMaBranch(yearOrMonthZhiIdx: number): number {
  const groups = [
    { zhi: [8, 0, 4], ma: 2 },
    { zhi: [2, 6, 10], ma: 8 },
    { zhi: [11, 3, 7], ma: 5 },
    { zhi: [5, 9, 1], ma: 11 },
  ];
  const g = groups.find((x) => x.zhi.includes(yearOrMonthZhiIdx)) ?? groups[0];
  return g.ma;
}

/** 各派魁钺查表 */
export function kuiYueBranches(yearGan: string, school: KuiyueSchool): [number, number] {
  return KUIYUE_TABLES[school][yearGan] ?? KUIYUE_TABLES.qs1[yearGan] ?? [1, 7];
}

/** 庚干四化按变体取四星（非庚干返回 null，走四化流派表） */
export function gengSiHuaStars(yearGan: string, variant: GengSihua): [string, string, string, string] | null {
  if (yearGan !== "庚") return null;
  return GENG_SI_HUA[variant];
}

/** 地支序（子起 0）→ 地支 */
export function branchName(idx: number): string {
  return BRANCHES[idx] ?? BRANCHES[0];
}
