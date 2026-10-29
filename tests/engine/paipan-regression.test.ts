import { describe, it, expect } from "vitest";
import { computeBazi } from "@/lib/engine/bazi";
import type { BirthInput } from "@/lib/engine/calendar";

/**
 * 排盘口径回归测试：锁定当前引擎在边界样本上的行为，防止未来改动造成口径漂移。
 *
 * 已锁定的口径约定（改动任何一条 = 有意变更口径，须同步更新此文件并通知全端）：
 * 1. 年柱以立春换年（1986-02-04 立春：03 日→乙丑，05 日→丙寅）；
 * 2. 中国夏令时（1986-1991）自动回拨 1 小时（行业口径：出生记录为当时钟面时间）；
 *    开始日 02:00-02:59 / 结束日 01:00-01:59 为歧义时段，按夏令时处理并标记；
 * 3. 晚子时（23:00-23:59）默认不换日（sect 2），可经 BirthInput.ziSect=1 切换为算次日；
 * 4. 时辰未知时，时柱为「未知」占位、不做推断。
 *
 * 锚点核对：1984-08-16 为甲子年；1986-07-01 12:00 夏令时钟面 → 标准 11:00（午时）。
 */

function pillars(input: BirthInput) {
  const r = computeBazi(input);
  return {
    year: r.ganZhiYear,
    month: r.ganZhiMonth,
    day: r.ganZhiDay,
    time: r.timeKnown ? r.ganZhiTime : "",
    dayMaster: r.dayMaster,
  };
}

describe("排盘口径回归（立春换年）", () => {
  it("立春前属上一干支年", () => {
    const p = pillars({ calendarType: "solar", year: 1986, month: 2, day: 3, hour: 23, minute: 30 });
    expect(p.year).toBe("乙丑");
  });

  it("立春日白天属新年干支", () => {
    const p = pillars({ calendarType: "solar", year: 1986, month: 2, day: 4, hour: 10, minute: 0 });
    expect(p.year).toBe("乙丑"); // 1986 立春交节在 02-04 白天之后，当日早间仍属乙丑
  });

  it("立春次日属丙寅", () => {
    const p = pillars({ calendarType: "solar", year: 1986, month: 2, day: 5, hour: 10, minute: 0 });
    expect(p.year).toBe("丙寅");
  });

  it("甲子锚点 1984-08-16", () => {
    const p = pillars({ calendarType: "solar", year: 1984, month: 8, day: 16, hour: 12, minute: 0 });
    expect(p.year).toBe("甲子");
  });
});

describe("排盘口径回归（晚子时换日）", () => {
  it("晚子时 23:30 日柱取当日（不换日口径）", () => {
    const lateNight = pillars({ calendarType: "solar", year: 1990, month: 1, day: 1, hour: 23, minute: 30 });
    const before = pillars({ calendarType: "solar", year: 1990, month: 1, day: 1, hour: 12, minute: 0 });
    expect(lateNight.day).toBe(before.day);
    expect(lateNight.time.endsWith("子")).toBe(true);
  });

  it("早子时 00:30 日柱取次日", () => {
    const earlyMorning = pillars({ calendarType: "solar", year: 1990, month: 1, day: 2, hour: 0, minute: 30 });
    const lateNight = pillars({ calendarType: "solar", year: 1990, month: 1, day: 1, hour: 23, minute: 30 });
    expect(earlyMorning.day).not.toBe(lateNight.day);
  });
});

describe("排盘口径回归（中国夏令时 1986-1991）", () => {
  it("夏令时区间内钟面回拨 1 小时（12:00 → 标准 11:00 午时）", () => {
    const p = pillars({ calendarType: "solar", year: 1986, month: 7, day: 1, hour: 12, minute: 0 });
    expect(p.time).toBe("甲午");
    expect(p.dayMaster).toBe("丙");
  });

  it("区间外不校正", () => {
    const p = pillars({ calendarType: "solar", year: 1990, month: 1, day: 15, hour: 12, minute: 0 });
    expect(p.time).toBe("壬午");
  });

  it("夏令时跨日：1991-05-02 00:30 回拨至 05-01 23:30，日柱随之变化", () => {
    const crossed = pillars({ calendarType: "solar", year: 1991, month: 5, day: 2, hour: 0, minute: 30 });
    const reference = pillars({ calendarType: "solar", year: 1991, month: 5, day: 1, hour: 23, minute: 30 });
    expect(crossed.day).toBe(reference.day);
    expect(crossed.time.endsWith("子")).toBe(true);
  });

  it("开始日凌晨（02:00 前）不校正", () => {
    const p = pillars({ calendarType: "solar", year: 1986, month: 5, day: 4, hour: 1, minute: 30 });
    expect(p.dayMaster).toBe("戊");
  });
});

describe("排盘口径回归（晚子时流派 ziSect）", () => {
  it("默认 sect 2：晚子时日柱算当天", () => {
    const p = pillars({ calendarType: "solar", year: 1990, month: 1, day: 1, hour: 23, minute: 30 });
    expect(p.day).toBe("丙寅");
  });

  it("ziSect=1：晚子时日柱算次日", () => {
    const p = pillars({ calendarType: "solar", year: 1990, month: 1, day: 1, hour: 23, minute: 30, ziSect: 1 });
    expect(p.day).toBe("丁卯");
  });
});

describe("排盘口径回归（时辰未知）", () => {
  it("无时辰时 timeKnown=false 且时柱为「未知」占位", () => {
    const r = computeBazi({ calendarType: "solar", year: 1995, month: 3, day: 15 });
    expect(r.timeKnown).toBe(false);
    expect(r.ganZhiTime).toBe("未知");
  });
});
