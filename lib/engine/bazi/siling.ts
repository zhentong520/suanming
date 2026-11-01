/**
 * 八字 · 月令人元司令分野（《滴天髓》：「月令乃提纲之府……人元为用事之神，
 * 宅之定向也，不可以不卜」。原注：寅月生人，立春后七日前皆值戊土用事，
 * 八日后十四日前丙火用事，十五日后甲木用事。）
 *
 * 算法：以出生日距本月「节」（立春/惊蛰/清明/立夏/芒种/小暑/立秋/白露/寒露/立冬/大雪/小寒）
 * 的日数为入节日，查司令分野表（每节气月约 30 日，各藏干按日数分段用事）。
 * 仅供文化参考。
 */

import { Solar } from "lunar-typescript";

export interface SiLingSegment {
  gan: string;
  days: number;
}

export interface SiLingResult {
  /** 司令之神（天干） */
  gan: string;
  /** 入节第几日（1-based） */
  dayOffset: number;
  /** 本月节名 */
  jie: string;
  /** 分野表（该月） */
  segments: SiLingSegment[];
  note: string;
}

/** 人元司令分野表：月支 → [藏干, 日数]（按用事次序，总和约 30 日） */
export const SILING_TABLE: Record<string, SiLingSegment[]> = {
  寅: [{ gan: "戊", days: 7 }, { gan: "丙", days: 7 }, { gan: "甲", days: 16 }],
  卯: [{ gan: "甲", days: 10 }, { gan: "乙", days: 20 }],
  辰: [{ gan: "乙", days: 9 }, { gan: "癸", days: 3 }, { gan: "戊", days: 18 }],
  巳: [{ gan: "戊", days: 7 }, { gan: "庚", days: 9 }, { gan: "丙", days: 16 }],
  午: [{ gan: "丙", days: 10 }, { gan: "己", days: 9 }, { gan: "丁", days: 11 }],
  未: [{ gan: "丁", days: 9 }, { gan: "乙", days: 3 }, { gan: "己", days: 18 }],
  申: [{ gan: "戊", days: 7 }, { gan: "壬", days: 7 }, { gan: "庚", days: 16 }],
  酉: [{ gan: "庚", days: 10 }, { gan: "辛", days: 20 }],
  戌: [{ gan: "辛", days: 9 }, { gan: "丁", days: 3 }, { gan: "戊", days: 18 }],
  亥: [{ gan: "戊", days: 7 }, { gan: "甲", days: 7 }, { gan: "壬", days: 16 }],
  子: [{ gan: "壬", days: 10 }, { gan: "癸", days: 20 }],
  丑: [{ gan: "癸", days: 9 }, { gan: "辛", days: 3 }, { gan: "己", days: 18 }],
};

/** 十二节（月首节气） */
const JIE_NAMES = [
  "立春", "惊蛰", "清明", "立夏", "芒种", "小暑",
  "立秋", "白露", "寒露", "立冬", "大雪", "小寒",
];

/**
 * 计算司令之神：找出生日之前最近的「节」，按入节第几日查分野表。
 */
export function computeSiLing(date: Date, monthZhi: string): SiLingResult | null {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const table = lunar.getJieQiTable() as unknown as Record<string, Solar>;

  const todayYmd = solar.toYmd();
  let prevJie: { name: string; solar: Solar } | null = null;
  for (const [name, s] of Object.entries(table)) {
    if (!JIE_NAMES.includes(name)) continue;
    if (s.toYmd() <= todayYmd && (!prevJie || s.toYmd() > prevJie.solar.toYmd())) {
      prevJie = { name, solar: s };
    }
  }
  if (!prevJie) return null;

  // 入节第几日（节当天 = 第 1 日）
  const jieMs = new Date(prevJie.solar.toYmd() + "T12:00:00+08:00").getTime();
  const todayMs = new Date(todayYmd + "T12:00:00+08:00").getTime();
  const dayOffset = Math.floor((todayMs - jieMs) / 86400000) + 1;

  const segments = SILING_TABLE[monthZhi] ?? [];
  let acc = 0;
  let gan = "";
  for (const seg of segments) {
    acc += seg.days;
    if (dayOffset <= acc) {
      gan = seg.gan;
      break;
    }
  }
  if (!gan) gan = segments[segments.length - 1]?.gan ?? "";

  return {
    gan,
    dayOffset,
    jie: prevJie.name,
    segments,
    note: `入${prevJie.name}后第${dayOffset}日，${gan}司令用事（月令${monthZhi}）——司令之神引助天干，则气象得令而吉`,
  };
}
