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
  /**
   * 晚子时（23:00-23:59）日柱流派：1 = 算次日（子初换日），2 = 算当天（默认，子正换日派）。
   * 仅影响 23 点出生的日柱归属。
   */
  ziSect?: 1 | 2;
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
  /** 是否做了中国夏令时（1986-1991）校正 */
  dstApplied?: boolean;
  /** 夏令时校正说明（含歧义时段提醒） */
  dstNote?: string;
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

/**
 * 中国夏令时实施区间（钟面时间，公开史实；多数权威来源一致）：
 * 开始日 02:00 拨快至 03:00，结束日 02:00 拨回至 01:00。
 * 1986 年为首年（5 月 4 日起）；1992 年起停行。
 */
const CHINA_DST_WINDOWS: Record<number, [string, string]> = {
  1986: ["1986-05-04", "1986-09-14"],
  1987: ["1987-04-12", "1987-09-13"],
  1988: ["1988-04-10", "1988-09-11"],
  1989: ["1989-04-16", "1989-09-17"],
  1990: ["1990-04-15", "1990-09-16"],
  1991: ["1991-04-14", "1991-09-15"],
};

export interface ChinaDSTCheck {
  /** 钟面时间处于夏令时（需回拨 1 小时得到标准时间） */
  dst: boolean;
  /** 歧义时段（开始日 02:00-02:59 钟面不存在；结束日 01:00-01:59 出现两次），已按夏令时处理，需人工核实 */
  ambiguous: boolean;
}

/** 判断钟面时间是否处于中国夏令时（仅覆盖 1986-1991；更早年代时区混乱，不做自动校正） */
export function checkChinaDST(year: number, month: number, day: number, hour: number): ChinaDSTCheck {
  const window = CHINA_DST_WINDOWS[year];
  if (!window) return { dst: false, ambiguous: false };
  const date = (m: number, d: number) => m * 100 + d;
  const [start, end] = window;
  const [, sM, sD] = start.split("-").map(Number);
  const [, eM, eD] = end.split("-").map(Number);
  const dayNum = date(month, day);
  const startNum = date(sM, sD);
  const endNum = date(eM, eD);

  if (dayNum === startNum) {
    // 开始日 02:00 起为夏令时；02:00-02:59 钟面不存在，按夏令时处理并标记歧义
    return { dst: hour >= 2, ambiguous: hour === 2 };
  }
  if (dayNum === endNum) {
    // 结束日 02:00 拨回：凌晨 00:00-01:59 钟面为夏令时；其中 01:00-01:59 与拨回后的标准时段重叠，歧义
    return { dst: hour < 2, ambiguous: hour === 1 };
  }
  return { dst: dayNum > startNum && dayNum < endNum, ambiguous: false };
}

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
  dstApplied: boolean;
  dstNote?: string;
} {
  const clockHour = input.hour ?? 12;
  const clockMinute = input.minute ?? 0;
  const timeKnown = input.hour != null;

  // 1) 农历入口先换算公历日期（时辰不参与换算）
  let year = input.year;
  let month = input.month;
  let day = input.day;
  if (input.calendarType === "lunar") {
    const s = Lunar.fromYmd(input.year, input.month, input.day).getSolar();
    year = s.getYear();
    month = s.getMonth();
    day = s.getDay();
  }

  // 2) 夏令时校正（基于公历日期判断；可能回退到前一日，影响日/月柱）
  let hour = clockHour;
  let minute = clockMinute;
  let dstApplied = false;
  let dstNote: string | undefined;
  if (timeKnown) {
    const { dst, ambiguous } = checkChinaDST(year, month, day, hour);
    if (dst) {
      const shifted = shiftCivilTime(year, month, day, hour, minute, -60);
      year = shifted.year;
      month = shifted.month;
      day = shifted.day;
      hour = shifted.hour;
      minute = shifted.minute;
      dstApplied = true;
      dstNote = ambiguous
        ? `已按中国夏令时回拨 1 小时 → ${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}（该钟面时段处于夏令时起止边界，存在歧义，请向本人核实原始记录）`
        : `已按中国夏令时（1986-1991）回拨 1 小时 → ${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
  }

  const baseSolar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lon = input.longitude;

  // 3) 无经度：到此为止（已含夏令时校正）
  if (!timeKnown || lon == null || Number.isNaN(lon)) {
    const lunar = baseSolar.getLunar();
    return {
      solar: baseSolar,
      lunar,
      trueSolarApplied: false,
      clockHour: timeKnown ? clockHour : undefined,
      clockMinute: timeKnown ? clockMinute : undefined,
      dstApplied,
      dstNote,
    };
  }

  // 4) 真太阳时（经度差 + 均时差）
  const offset = trueSolarOffsetMinutes(lon, baseSolar.getYear(), baseSolar.getMonth(), baseSolar.getDay());
  const shifted = shiftCivilTime(
    baseSolar.getYear(),
    baseSolar.getMonth(),
    baseSolar.getDay(),
    hour,
    minute,
    offset
  );
  const solar = Solar.fromYmdHms(shifted.year, shifted.month, shifted.day, shifted.hour, shifted.minute, 0);
  const lunar = solar.getLunar();
  const sign = offset >= 0 ? "+" : "";
  const trueNote = `钟表 ${String(clockHour).padStart(2, "0")}:${String(clockMinute).padStart(2, "0")} → 真太阳时 ${String(shifted.hour).padStart(2, "0")}:${String(shifted.minute).padStart(2, "0")}（经度 ${lon.toFixed(1)}°，修正 ${sign}${offset.toFixed(1)} 分钟）`;
  const note = dstNote ? `${dstNote}；${trueNote}` : trueNote;

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
    dstApplied,
    dstNote,
  };
}

/** 按出生输入的晚子时流派取八字对象（默认 sect 2：晚子时日柱算当天；1 = 算次日） */
export function eightCharFromBirth(lunar: Lunar, input?: Pick<BirthInput, "ziSect">) {
  const ec = lunar.getEightChar();
  if (input?.ziSect === 1 || input?.ziSect === 2) ec.setSect(input.ziSect);
  return ec;
}

export function computeCalendar(input: BirthInput): CalendarResult {
  const built = buildLunarFromBirth(input);
  const { solar, lunar } = built;
  const eightChar = eightCharFromBirth(lunar, input);
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
    dstApplied: built.dstApplied,
    dstNote: built.dstNote,
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
