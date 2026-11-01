/**
 * 吠陀 · Vimshottari 大运全表（Brihat Parashara Hora Shastra Ch.46-49）
 *
 * 120 年九大运：Ketu 7 / Venus 20 / Sun 6 / Moon 10 / Mars 7 / Rahu 18 /
 *              Jupiter 16 / Saturn 19 / Mercury 17。
 * Mahadasha 序列自出生所在大运起循环；Antardasha（子运）= 大运年 × 子运星年 / 120，
 * 自大运主星自身起按同一序列展开。
 * 仅供文化参考。
 */

import { BirthInput } from "../calendar";

export const VIM_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"] as const;

export const VIM_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

export const VIM_CN: Record<string, string> = {
  Ketu: "计都", Venus: "金星", Sun: "太阳", Moon: "月亮", Mars: "火星",
  Rahu: "罗睺", Jupiter: "木星", Saturn: "土星", Mercury: "水星",
};

export interface Mahadasha {
  lord: string;
  lordCn: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
}

export interface Antardasha {
  lord: string;
  lordCn: string;
  startAge: number;
  endAge: number;
}

export interface VimshottariResult {
  mahadashas: Mahadasha[];
  current: { mahadasha: string; antardasha: string; antardashaCn: string; startAge: number; endAge: number };
}

/**
 * 由出生大运主星与剩余年数展开：出生时大运已过 (years - remaining) 年。
 * age 用于定位当前 Mahadasha / Antardasha。
 */
export function vimshottariTimeline(opts: {
  startLord: string;
  dashaYears: number;
  dashaRemaining: number;
  birthYear: number;
  currentAge: number;
}): VimshottariResult {
  const elapsedAtBirth = opts.dashaYears - opts.dashaRemaining;
  const startIdx = VIM_ORDER.indexOf(opts.startLord as (typeof VIM_ORDER)[number]);
  if (startIdx < 0) {
    return { mahadashas: [], current: { mahadasha: "", antardasha: "", antardashaCn: "", startAge: 0, endAge: 0 } };
  }

  // Mahadasha 时间线：从出生所在大运的起点（可为负龄）开始列 9 个
  const mahadashas: Mahadasha[] = [];
  let cursor = -elapsedAtBirth;
  for (let i = 0; i < 9; i++) {
    const lord = VIM_ORDER[(startIdx + i) % 9];
    const years = VIM_YEARS[lord];
    mahadashas.push({
      lord,
      lordCn: VIM_CN[lord],
      startAge: Number(cursor.toFixed(2)),
      endAge: Number((cursor + years).toFixed(2)),
      startYear: opts.birthYear + Math.floor(cursor),
      endYear: opts.birthYear + Math.ceil(cursor + years),
    });
    cursor += years;
  }

  // 当前 Mahadasha / Antardasha
  const age = opts.currentAge;
  const currentMd =
    mahadashas.find((m) => age >= m.startAge && age < m.endAge) ?? mahadashas[mahadashas.length - 1];
  const mdYears = VIM_YEARS[currentMd.lord];
  const mdElapsed = Math.max(0, age - currentMd.startAge);
  const startIdxMd = VIM_ORDER.indexOf(currentMd.lord as (typeof VIM_ORDER)[number]);
  let subCursor = currentMd.startAge;
  let antardasha: Antardasha = {
    lord: currentMd.lord,
    lordCn: currentMd.lordCn,
    startAge: currentMd.startAge,
    endAge: currentMd.endAge,
  };
  for (let i = 0; i < 9; i++) {
    const sub = VIM_ORDER[(startIdxMd + i) % 9];
    const len = (mdYears * VIM_YEARS[sub]) / 120;
    if (age < subCursor + len || i === 8) {
      antardasha = { lord: sub, lordCn: VIM_CN[sub], startAge: Number(subCursor.toFixed(2)), endAge: Number((subCursor + len).toFixed(2)) };
      break;
    }
    subCursor += len;
  }

  return {
    mahadashas,
    current: {
      mahadasha: currentMd.lord,
      antardasha: antardasha.lord,
      antardashaCn: antardasha.lordCn,
      startAge: antardasha.startAge,
      endAge: antardasha.endAge,
    },
  };
}

/** 兼容 BirthInput 直接调用 */
export function computeVimshottari(input: BirthInput, dashaLord: string, dashaYears: number, dashaRemaining: number) {
  const birthYear = input.year;
  const currentAge = new Date().getFullYear() - birthYear;
  return vimshottariTimeline({
    startLord: dashaLord,
    dashaYears,
    dashaRemaining,
    birthYear,
    currentAge,
  });
}
