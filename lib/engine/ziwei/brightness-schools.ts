/**
 * 紫微十四主星亮度流派（口径可配置体系 · 亮度侧）
 *
 * 四套表移植自开源项目 ziwei-doushu（MIT，Renhuai123/ziwei-doushu，
 * lib/ziwei/school-data.ts，经其金标准盘逐格核对），并做交叉验证：
 *  - quanshu（全书派 QS 表）与本项目 iztro 桥接的主星亮度 168 格完全一致
 *    （另见 FANzR-arch/Numerologist_skills 对 iztro 2.6.2 与《紫微斗数全书》卷二总表的逐格比对）
 *  - 表内索引「子起一」：col1=子 … col12=亥
 *  - 七档制（quanshu/xiandai）：1庙 2旺 3得 4利 5平 6不 7陷
 *  - 五档制（zhongzhou/xiandai2）：1庙 2旺 3平 4闲 5陷
 */

export type BrightnessSchool = "iztro" | "quanshu" | "xiandai" | "zhongzhou" | "xiandai2";

export interface BrightnessSchoolMeta {
  key: BrightnessSchool;
  name: string;
  source: string;
  note: string;
}

export const BRIGHTNESS_SCHOOL_ORDER: BrightnessSchool[] = [
  "iztro",
  "quanshu",
  "xiandai",
  "zhongzhou",
  "xiandai2",
];

export const BRIGHTNESS_SCHOOL_META: Record<BrightnessSchool, BrightnessSchoolMeta> = {
  iztro: {
    key: "iztro",
    name: "iztro 口径（默认）",
    source: "iztro 开源引擎（业界主流排盘库）实际输出",
    note: "七档制。与本站默认排盘一致；个别格与《全书》卷二有出入（如紫微在午：iztro 旺、全书庙）。",
  },
  quanshu: {
    key: "quanshu",
    name: "全书派",
    source: "《紫微斗数全书》卷二庙旺总表（ziwei-doushu 金标准盘核对版）",
    note: "七档制：庙旺得利平不陷。古籍卷二总表口径。",
  },
  xiandai: {
    key: "xiandai",
    name: "现代修正一",
    source: "ziwei-doushu 主流口径整理（金标准盘核对）",
    note: "七档制。对《全书》表有十余处现代排盘软件通行修正（如太阴寅旺、天梁丑未旺）。",
  },
  zhongzhou: {
    key: "zhongzhou",
    name: "中州派",
    source: "中州派五档庙陷表（ziwei-doushu 整理，金标准盘核对）",
    note: "五档制：庙旺平闲陷。太阴寅宫记闲，与《全书》差异最大处。",
  },
  xiandai2: {
    key: "xiandai2",
    name: "现代修正二",
    source: "ziwei-doushu 现代修订亮度表第二版（金标准盘核对）",
    note: "五档制。部分现代排盘软件采用的另一套修订口径。",
  },
};

export function normalizeBrightnessSchool(v?: string | null): BrightnessSchool {
  return v === "quanshu" || v === "xiandai" || v === "zhongzhou" || v === "xiandai2" ? v : "iztro";
}

/** 十四主星亮度表：表[星序][地支]，1-based 占位；列 = 子起一（1=子 … 12=亥） */
// 星序：1紫微 2天机 3太阳 4武曲 5天同 6廉贞 7天府 8太阴 9贪狼 10巨门 11天相 12天梁 13七杀 14破军
const STAR_ORDER = [
  "紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府",
  "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军",
] as const;

type NumTable = ReadonlyArray<ReadonlyArray<number>>;

const TABLE_QS: NumTable = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],     // [0] 占位
  [0, 5, 1, 2, 2, 3, 2, 1, 1, 2, 2, 3, 2],     // 紫微
  [0, 1, 7, 3, 2, 4, 5, 1, 7, 3, 2, 4, 5],     // 天机
  [0, 7, 6, 2, 1, 2, 2, 2, 3, 3, 5, 6, 7],     // 太阳
  [0, 2, 1, 3, 4, 1, 5, 2, 1, 3, 4, 1, 5],     // 武曲
  [0, 2, 6, 4, 5, 5, 1, 7, 6, 2, 5, 5, 1],     // 天同
  [0, 5, 4, 1, 5, 4, 7, 5, 4, 1, 5, 4, 7],     // 廉贞
  [0, 1, 1, 1, 3, 1, 3, 2, 1, 3, 2, 1, 3],     // 天府
  [0, 1, 1, 2, 7, 7, 7, 6, 6, 4, 2, 2, 1],     // 太阴
  [0, 2, 1, 5, 4, 1, 7, 2, 1, 5, 4, 1, 7],     // 贪狼
  [0, 2, 6, 1, 1, 7, 2, 2, 6, 1, 1, 7, 2],     // 巨门
  [0, 1, 1, 1, 7, 3, 3, 1, 3, 1, 7, 3, 3],     // 天相
  [0, 1, 2, 1, 1, 1, 3, 1, 2, 7, 3, 1, 7],     // 天梁
  [0, 2, 1, 1, 2, 1, 5, 2, 1, 1, 2, 1, 5],     // 七杀
  [0, 1, 2, 3, 7, 2, 5, 1, 2, 3, 7, 2, 5],     // 破军
];

const TABLE_XD1: NumTable = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],     // [0] 占位
  [0, 5, 1, 1, 2, 3, 2, 1, 1, 2, 2, 3, 2],     // 紫微
  [0, 1, 7, 3, 2, 4, 5, 1, 7, 3, 2, 4, 5],     // 天机
  [0, 7, 6, 2, 1, 2, 2, 1, 3, 4, 5, 7, 7],     // 太阳
  [0, 2, 1, 3, 4, 1, 5, 2, 1, 3, 4, 1, 5],     // 武曲
  [0, 2, 6, 4, 1, 5, 1, 7, 6, 2, 5, 5, 1],     // 天同
  [0, 5, 4, 1, 5, 4, 7, 5, 4, 1, 5, 4, 7],     // 廉贞
  [0, 1, 1, 1, 3, 2, 3, 2, 1, 3, 2, 2, 3],     // 天府
  [0, 1, 1, 6, 7, 7, 7, 7, 5, 4, 2, 2, 1],     // 太阴
  [0, 2, 1, 5, 3, 1, 7, 2, 1, 5, 4, 1, 7],     // 贪狼
  [0, 2, 6, 1, 1, 5, 5, 2, 5, 1, 1, 5, 2],     // 巨门
  [0, 1, 1, 1, 7, 5, 3, 3, 3, 1, 7, 3, 3],     // 天相
  [0, 1, 2, 1, 2, 1, 7, 1, 2, 7, 3, 1, 7],     // 天梁
  [0, 2, 1, 1, 2, 3, 5, 2, 1, 1, 2, 1, 5],     // 七杀
  [0, 1, 2, 3, 7, 2, 5, 1, 2, 3, 7, 2, 5],     // 破军
];

const TABLE_ZZ: NumTable = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 3, 1, 1, 2, 5, 2, 1, 1, 2, 3, 4, 2],
  [0, 1, 5, 2, 2, 1, 3, 1, 5, 3, 2, 1, 3],
  [0, 5, 5, 2, 1, 2, 2, 1, 3, 4, 4, 5, 5],
  [0, 2, 1, 4, 5, 1, 3, 2, 1, 3, 2, 1, 3],
  [0, 2, 5, 4, 1, 3, 1, 5, 5, 2, 3, 3, 1],
  [0, 3, 2, 1, 4, 2, 5, 3, 1, 1, 3, 2, 5],
  [0, 1, 1, 1, 3, 1, 3, 2, 1, 3, 5, 1, 2],
  [0, 1, 1, 4, 5, 4, 5, 5, 3, 3, 2, 2, 1],
  [0, 2, 1, 3, 4, 1, 5, 2, 1, 3, 3, 1, 5],
  [0, 2, 2, 1, 1, 3, 3, 2, 5, 1, 1, 2, 2],
  [0, 1, 1, 1, 5, 2, 3, 2, 4, 1, 5, 4, 3],
  [0, 1, 2, 1, 1, 2, 5, 1, 2, 5, 4, 2, 5],
  [0, 2, 1, 1, 5, 2, 3, 2, 2, 1, 4, 1, 3],
  [0, 1, 2, 5, 2, 2, 4, 1, 1, 5, 5, 2, 3],
];

const TABLE_XD2: NumTable = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 4, 1, 1, 2, 4, 2, 1, 1, 2, 3, 5, 2],
  [0, 1, 5, 2, 2, 2, 3, 1, 5, 2, 2, 2, 3],
  [0, 5, 5, 2, 1, 2, 2, 1, 2, 3, 3, 5, 5],
  [0, 2, 1, 3, 5, 1, 3, 2, 1, 3, 2, 1, 3],
  [0, 2, 5, 3, 1, 2, 1, 5, 5, 2, 3, 3, 1],
  [0, 3, 2, 1, 4, 2, 5, 3, 1, 1, 3, 2, 5],
  [0, 2, 1, 1, 3, 1, 2, 2, 1, 2, 3, 1, 2],
  [0, 1, 1, 5, 5, 5, 5, 5, 5, 2, 2, 1, 1],
  [0, 2, 1, 3, 2, 1, 5, 2, 1, 3, 2, 1, 5],
  [0, 2, 5, 1, 2, 5, 1, 2, 5, 1, 2, 5, 1],
  [0, 1, 1, 1, 5, 2, 3, 2, 3, 1, 5, 5, 3],
  [0, 1, 2, 1, 1, 2, 5, 1, 2, 5, 3, 2, 5],
  [0, 2, 2, 1, 5, 1, 3, 2, 2, 1, 3, 1, 3],
  [0, 1, 1, 5, 2, 2, 3, 1, 1, 5, 5, 2, 3],
];

const TABLES: Record<Exclude<BrightnessSchool, "iztro">, NumTable> = {
  quanshu: TABLE_QS,
  xiandai: TABLE_XD1,
  zhongzhou: TABLE_ZZ,
  xiandai2: TABLE_XD2,
};

const NUM_TO_CN_7: Record<number, string> = {
  1: "庙", 2: "旺", 3: "得", 4: "利", 5: "平", 6: "不", 7: "陷",
};
const NUM_TO_CN_5: Record<number, string> = {
  1: "庙", 2: "旺", 3: "平", 4: "闲", 5: "陷",
};

function numToCn(school: BrightnessSchool, v: number): string | undefined {
  if (!v) return undefined; // 0 = 该派留白
  const map = school === "zhongzhou" || school === "xiandai2" ? NUM_TO_CN_5 : NUM_TO_CN_7;
  return map[v];
}

const STAR_ROW: Record<string, number> = {};
STAR_ORDER.forEach((name, i) => {
  STAR_ROW[name] = i + 1;
});

/**
 * 查主星亮度。branchIdxZi0 = 宫位地支序（子=0 … 亥=11）。
 * 未收录的星 / 该派留白 → undefined（调用方回落 iztro 口径）。
 */
export function schoolMainBrightness(
  star: string,
  branchIdxZi0: number,
  school: BrightnessSchool
): string | undefined {
  const row = STAR_ROW[star];
  if (!row || branchIdxZi0 < 0 || branchIdxZi0 > 11) return undefined;
  if (school === "iztro") return undefined; // 默认口径不查表（iztro 自带亮度），由调用方回落
  const v = TABLES[school][row]?.[branchIdxZi0 + 1];
  return numToCn(school, v ?? 0);
}

/** 生成 (星名, 地支) → 亮度 查询函数，供 iztro 桥接重标亮度用 */
export function brightnessFnForSchool(
  school: BrightnessSchool
): (star: string, branch: string) => string | undefined {
  const BRANCHES_ZI0 = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  return (star, branch) => {
    const idx = BRANCHES_ZI0.indexOf(branch);
    return idx >= 0 ? schoolMainBrightness(star, idx, school) : undefined;
  };
}

/** 当前派别是否与默认（iztro）口径可能不同（用于决定是否重标） */
export function brightnessSchoolAffects(school: BrightnessSchool): boolean {
  return school !== "iztro";
}
