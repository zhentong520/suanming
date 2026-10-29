import { Solar, Lunar } from "lunar-typescript";

export interface BirthInput {
  calendarType: "solar" | "lunar";
  year: number;
  month: number;
  day: number;
  hour?: number | null;
  minute?: number;
  gender?: string;
  /** 出生地纬度（可选） */
  latitude?: number;
  /** 出生地经度（可选；有值则按真太阳时修正时辰） */
  longitude?: number;
  /** 出生地名称（展示用） */
  location?: string;
}

export interface CalendarResult {
  solarDate: string;
  lunarDate: string;
  ganZhiYear: string;
  ganZhiMonth: string;
  ganZhiDay: string;
  ganZhiTime: string;
  shengXiao: string;
  constellation: string;
  naYin: string;
  wuXing: string[];
  timeKnown: boolean;
  /** 是否启用了真太阳时 */
  trueSolarApplied?: boolean;
  /** 钟表时 → 真太阳时说明 */
  trueSolarNote?: string;
  longitudeUsed?: number;
  clockHour?: number;
  clockMinute?: number;
  solarHour?: number;
  solarMinute?: number;
}

const HOUR_NAMES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 中国民用时区常用标准经线（东八区） */
export const CHINA_STANDARD_MERIDIAN = 120;

export function hourToZhi(hour: number): string {
  const idx = Math.floor(((hour + 1) % 24) / 2);
  return HOUR_NAMES[idx] ?? "子";
}

/** 均时差（分钟），简化公式，文化排盘足够 */
export function equationOfTimeMinutes(year: number, month: number, day: number): number {
  const date = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 0);
  const n = (date - start) / 86_400_000;
  const B = ((2 * Math.PI) / 365) * (n - 81);
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** 经度 + 均时差 → 相对钟表时的修正分钟（东正西负） */
export function trueSolarOffsetMinutes(
  longitude: number,
  year: number,
  month: number,
  day: number,
  standardMeridian = CHINA_STANDARD_MERIDIAN
): number {
  const lonMinutes = 4 * (longitude - standardMeridian);
  return lonMinutes + equationOfTimeMinutes(year, month, day);
}

function shiftCivilTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  deltaMinutes: number
): { year: number; month: number; day: number; hour: number; minute: number } {
  const base = Date.UTC(year, month - 1, day, hour, minute, 0);
  const d = new Date(base + Math.round(deltaMinutes) * 60_000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

export function buildLunarFromBirth(input: BirthInput): {
  solar: Solar;
  lunar: Lunar;
  trueSolarApplied: boolean;
  trueSolarNote?: string;
  clockHour?: number;
  clockMinute?: number;
  solarHour?: number;
  solarMinute?: number;
  longitudeUsed?: number;
} {
  const clockHour = input.hour ?? 12;
  const clockMinute = input.minute ?? 0;

  let baseSolar: Solar;
  if (input.calendarType === "lunar") {
    const lunarSeed = Lunar.fromYmd(input.year, input.month, input.day);
    const s = lunarSeed.getSolar();
    baseSolar = Solar.fromYmdHms(s.getYear(), s.getMonth(), s.getDay(), clockHour, clockMinute, 0);
  } else {
    baseSolar = Solar.fromYmdHms(input.year, input.month, input.day, clockHour, clockMinute, 0);
  }

  const timeKnown = input.hour != null;
  const lon = input.longitude;

  if (!timeKnown || lon == null || Number.isNaN(lon)) {
    const lunar = baseSolar.getLunar();
    return {
      solar: baseSolar,
      lunar,
      trueSolarApplied: false,
      clockHour: timeKnown ? clockHour : undefined,
      clockMinute: timeKnown ? clockMinute : undefined,
    };
  }

  const offset = trueSolarOffsetMinutes(lon, baseSolar.getYear(), baseSolar.getMonth(), baseSolar.getDay());
  const shifted = shiftCivilTime(
    baseSolar.getYear(),
    baseSolar.getMonth(),
    baseSolar.getDay(),
    clockHour,
    clockMinute,
    offset
  );
  const solar = Solar.fromYmdHms(shifted.year, shifted.month, shifted.day, shifted.hour, shifted.minute, 0);
  const lunar = solar.getLunar();
  const sign = offset >= 0 ? "+" : "";
  const note = `钟表 ${String(clockHour).padStart(2, "0")}:${String(clockMinute).padStart(2, "0")} → 真太阳时 ${String(shifted.hour).padStart(2, "0")}:${String(shifted.minute).padStart(2, "0")}（经度 ${lon.toFixed(1)}°，修正 ${sign}${offset.toFixed(1)} 分钟）`;

  return {
    solar,
    lunar,
    trueSolarApplied: true,
    trueSolarNote: note,
    clockHour,
    clockMinute,
    solarHour: shifted.hour,
    solarMinute: shifted.minute,
    longitudeUsed: lon,
  };
}

export function computeCalendar(input: BirthInput): CalendarResult {
  const built = buildLunarFromBirth(input);
  const { solar, lunar } = built;
  const eightChar = lunar.getEightChar();
  const timeKnown = input.hour != null;

  return {
    solarDate: solar.toYmd(),
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganZhiYear: eightChar.getYear(),
    ganZhiMonth: eightChar.getMonth(),
    ganZhiDay: eightChar.getDay(),
    ganZhiTime: timeKnown ? eightChar.getTime() : "未知",
    shengXiao: lunar.getYearShengXiao(),
    constellation: solar.getXingZuo(),
    naYin: eightChar.getYearNaYin(),
    wuXing: [
      eightChar.getYearWuXing(),
      eightChar.getMonthWuXing(),
      eightChar.getDayWuXing(),
      timeKnown ? eightChar.getTimeWuXing() : "未知",
    ],
    timeKnown,
    trueSolarApplied: built.trueSolarApplied,
    trueSolarNote: built.trueSolarNote,
    longitudeUsed: built.longitudeUsed,
    clockHour: built.clockHour,
    clockMinute: built.clockMinute,
    solarHour: built.solarHour,
    solarMinute: built.solarMinute,
  };
}

export function getAlmanacForDate(date?: Date) {
  const d = date ?? new Date();
  const solar = Solar.fromDate(d);
  const lunar = solar.getLunar();
  return {
    date: solar.toYmd(),
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    chong: lunar.getDayChongDesc(),
    sha: lunar.getDaySha(),
    jiShen: lunar.getDayJiShen?.() ?? [],
    xiongSha: lunar.getDayXiongSha?.() ?? [],
    wuXing: lunar.getDayNaYin(),
    pengZu: `${lunar.getPengZuGan()} ${lunar.getPengZuZhi()}`,
    shengXiao: lunar.getDayShengXiao(),
  };
}
