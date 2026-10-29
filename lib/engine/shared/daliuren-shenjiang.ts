/** 大六壬神将、遁干 */
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const GENERALS = ["贵人", "螣蛇", "朱雀", "六合", "勾陈", "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后"] as const;

/** 昼贵起始宫（地支索引） */
const GUI_REN_DAY: Record<string, number> = {
  甲: 1,
  戊: 1,
  庚: 1,
  乙: 0,
  己: 0,
  丙: 11,
  丁: 11,
  壬: 3,
  癸: 3,
  辛: 6,
};

/** 夜贵起始宫 */
const GUI_REN_NIGHT: Record<string, number> = {
  甲: 7,
  戊: 7,
  庚: 7,
  乙: 8,
  己: 8,
  丙: 9,
  丁: 9,
  壬: 5,
  癸: 5,
  辛: 2,
};

export interface ShenJiang {
  general: string;
  branch: string;
  stem?: string;
}

export function isDayTime(hour: number): boolean {
  return hour >= 6 && hour < 18;
}

/** 排十二天将：贵人起，顺排 */
export function placeShenJiang(dayGan: string, hour: number): ShenJiang[] {
  const isDay = isDayTime(hour);
  const table = isDay ? GUI_REN_DAY : GUI_REN_NIGHT;
  const guiRenIdx = table[dayGan] ?? 1;
  const forward = ["甲", "戊", "庚", "丙", "丁"].includes(dayGan) ? isDay : !isDay;

  return GENERALS.map((general, i) => {
    const offset = forward ? i : -i;
    const bIdx = (guiRenIdx + offset + 120) % 12;
    return { general, branch: BRANCHES[bIdx] };
  });
}

/** 五子元遁：日干推时干 */
export function dunGan(dayGan: string, timeZhiIdx: number): string {
  const dayGanIdx = STEMS.indexOf(dayGan as (typeof STEMS)[number]);
  const startStemIdx = (dayGanIdx % 5) * 2;
  const stemIdx = (startStemIdx + timeZhiIdx) % 10;
  return STEMS[stemIdx];
}

/** 天地盘遁干：以日干为起点配地支 */
export function tianDiPan(dayGan: string, dayZhiIdx: number, timeZhiIdx: number) {
  const dayGanIdx = STEMS.indexOf(dayGan as (typeof STEMS)[number]);
  const tianPan = Array.from({ length: 12 }, (_, i) => {
    const stemIdx = (dayGanIdx + i) % 10;
    return { branch: BRANCHES[(dayZhiIdx + i) % 12], stem: STEMS[stemIdx] };
  });
  const diPan = BRANCHES[dayZhiIdx];
  const timeDunGan = dunGan(dayGan, timeZhiIdx);
  return { tianPan, diPan, timeDunGan };
}

export { BRANCHES, GENERALS };
