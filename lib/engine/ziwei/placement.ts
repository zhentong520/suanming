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

/** 六十甲子纳音（《六十甲子纳音歌》，三十配对，公版经典数据） */
const NA_YIN: Record<string, string> = {};
{
  const pairs: Array<[string[], string]> = [
    [["甲子", "乙丑"], "海中金"], [["丙寅", "丁卯"], "炉中火"], [["戊辰", "己巳"], "大林木"],
    [["庚午", "辛未"], "路旁土"], [["壬申", "癸酉"], "剑锋金"], [["甲戌", "乙亥"], "山头火"],
    [["丙子", "丁丑"], "涧下水"], [["戊寅", "己卯"], "城头土"], [["庚辰", "辛巳"], "白蜡金"],
    [["壬午", "癸未"], "杨柳木"], [["甲申", "乙酉"], "泉中水"], [["丙戌", "丁亥"], "屋上土"],
    [["戊子", "己丑"], "霹雳火"], [["庚寅", "辛卯"], "松柏木"], [["壬辰", "癸巳"], "长流水"],
    [["甲午", "乙未"], "沙中金"], [["丙申", "丁酉"], "山下火"], [["戊戌", "己亥"], "平地木"],
    [["庚子", "辛丑"], "壁上土"], [["壬寅", "癸卯"], "金箔金"], [["甲辰", "乙巳"], "覆灯火"],
    [["丙午", "丁未"], "天河水"], [["戊申", "己酉"], "大驿土"], [["庚戌", "辛亥"], "钗钏金"],
    [["壬子", "癸丑"], "桑柘木"], [["甲寅", "乙卯"], "大溪水"], [["丙辰", "丁巳"], "沙中土"],
    [["戊午", "己未"], "天上火"], [["庚申", "辛酉"], "石榴木"], [["壬戌", "癸亥"], "大海水"],
  ];
  for (const [gz, ny] of pairs) {
    NA_YIN[gz[0]] = ny;
    NA_YIN[gz[1]] = ny;
  }
}

export function naYinOfGanZhi(gz: string): string {
  return NA_YIN[gz] ?? "路旁土";
}

/** 五虎遁：年干 → 寅宫天干 */
const WU_HU_DUN: Record<string, string> = {
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲",
};

const GAN_ORDER = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

/** 年干 → 十二宫天干（寅起五虎遁，顺行） */
export function palaceGanByYearGan(yearGan: string): string[] {
  const yinGan = WU_HU_DUN[yearGan] ?? "丙";
  const start = GAN_ORDER.indexOf(yinGan as (typeof GAN_ORDER)[number]);
  // 寅=2，十二宫干从寅宫顺行
  return Array.from({ length: 12 }, (_, i) => {
    return GAN_ORDER[(start + i) % 10];
  });
}

/**
 * 斗数安命身宫（《紫微斗数全书》安命身宫诀）：
 * 寅起正月顺数至生月；生月宫起子时，逆数至生时 = 命宫，顺数至生时 = 身宫。
 * 宫干按五虎遁。闰月暂按当月取（闰月归属另属流派口径）。
 */
export function douShuMingShenGong(
  lunarMonthAbs: number,
  hourZhiIdx: number,
  yearGan: string
): { mingIdx: number; mingGz: string; shenIdx: number; shenGz: string } {
  const month = Math.min(12, Math.max(1, lunarMonthAbs));
  const mingIdx = (2 + (month - 1) - hourZhiIdx + 240) % 12;
  const shenIdx = (2 + (month - 1) + hourZhiIdx) % 12;
  const gans = palaceGanByYearGan(yearGan);
  const mingGz = `${gans[(mingIdx - 2 + 12) % 12]}${BRANCHES[mingIdx]}`;
  const shenGz = `${gans[(shenIdx - 2 + 12) % 12]}${BRANCHES[shenIdx]}`;
  return { mingIdx, mingGz, shenIdx, shenGz };
}

/**
 * 安紫微诀（《全书》）：生日不能被局数整除则借数凑整；
 * 商数从寅起顺数，借数逆回（offset 奇数逆行、偶数顺行，与主流排盘一致）。
 * 返回寅起 0 基索引（寅=0 … 丑=11），与 iztro 同基。
 */
export function ziweiBranchIndex(lunarDay: number, ju: number): number {
  let offset = -1;
  let quotient = 0;
  let remainder = -1;
  do {
    offset++;
    quotient = Math.floor((lunarDay + offset) / ju);
    remainder = (lunarDay + offset) % ju;
  } while (remainder !== 0);
  quotient %= 12;
  let idx = quotient - 1;
  idx += offset % 2 === 0 ? offset : -offset;
  return ((idx % 12) + 12) % 12;
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
  // ziweiBranchIndex 返回寅起 0 基，本项目 BRANCHES 为子起 0，转换 +2
  const ziweiIdxYin = ziweiBranchIndex(lunarDay, ju);
  const ziweiIdx = (ziweiIdxYin + 2) % 12;
  const fuIdx = (tianfuBranchIndex(ziweiIdxYin) + 2) % 12;

  const juNames: Record<number, string> = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };

  const stars: StarPlacement[] = [];

  // 紫微系安星诀：「紫微逆去天机星，隔一阳武天同轮，又隔二位廉贞地」
  const TIAN_OFFSETS = [0, -1, -3, -4, -5, -8];
  TIAN_STARS.forEach((star, i) => {
    const bIdx = branchAtOffset(ziweiIdx, TIAN_OFFSETS[i]);
    stars.push({
      star,
      branch: BRANCHES[bIdx],
      palace: palaceNameFromBranch(mingIdx, bIdx),
      brightness: getBrightness(star, bIdx),
    });
  });

  // 天府系安星诀：天府→太阴→贪狼→巨门→天相→天梁→七杀皆顺行紧邻，「七杀空三是破军」（隔三宫）
  const FU_OFFSETS = [0, 1, 2, 3, 4, 5, 6, 10];
  FU_STARS.forEach((star, i) => {
    const bIdx = branchAtOffset(fuIdx, FU_OFFSETS[i]);
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
