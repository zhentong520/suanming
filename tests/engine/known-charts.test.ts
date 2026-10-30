import { describe, it, expect } from "vitest";
import { computeBazi } from "@/lib/engine/bazi";
import { equationOfTimeMinutes } from "@/lib/engine/calendar";

/**
 * 公开命例交叉验证：以广为引用、口径稳定的公开资料为锚，防止排盘引擎回归。
 * 命例来源均为命理学界长期通行的公开资料；若断言失败优先怀疑引擎而非锚点。
 */
describe("公开命例交叉验证", () => {
  it("毛泽东 1893-12-26 辰时 → 癸巳 甲子 丁酉 甲辰", () => {
    const r = computeBazi({ calendarType: "solar", year: 1893, month: 12, day: 26, hour: 8, minute: 0 });
    expect(r.ganZhiYear).toBe("癸巳");
    expect(r.ganZhiMonth).toBe("甲子");
    expect(r.ganZhiDay).toBe("丁酉");
    expect(r.ganZhiTime).toBe("甲辰");
  });

  it("1949-10-01 开国大典日柱为甲子", () => {
    const r = computeBazi({ calendarType: "solar", year: 1949, month: 10, day: 1, hour: 15, minute: 0 });
    expect(r.ganZhiDay).toBe("甲子");
    expect(r.ganZhiYear).toBe("己丑");
  });
});

/**
 * 年柱岁次锚点：史载干支纪年（取年中日期，远离立春边界）。
 * 辛亥 1911、壬子 1912、甲子 1984、庚辰 2000 均为史书岁次，无流派争议。
 */
describe("年柱岁次锚点", () => {
  const cases: Array<[number, number, number, string]> = [
    [1911, 10, 10, "辛亥"], // 武昌起义
    [1912, 7, 1, "壬子"],
    [1984, 8, 16, "甲子"],
    [2000, 6, 1, "庚辰"],
  ];
  for (const [y, m, d, pillar] of cases) {
    it(`${y}-${m}-${d} 年柱 ${pillar}`, () => {
      const r = computeBazi({ calendarType: "solar", year: y, month: m, day: d, hour: 12, minute: 0 });
      expect(r.ganZhiYear).toBe(pillar);
    });
  }
});

/**
 * 日柱六十周期锚：以史载 1949-10-01 甲子日为基准，期望值由「儒略日差 mod 60」
 * 独立算术推导（不依赖引擎的历法库），可捕捉日柱链上的任何历法回归。
 * 覆盖：相邻日、回退日、整周期、闰日、夏令时期间、远未来。
 */
describe("日柱六十周期锚", () => {
  const GAN = "甲乙丙丁戊己庚辛壬癸";
  const ZHI = "子丑寅卯辰巳午未申酉戌亥";
  const CYCLE = Array.from({ length: 60 }, (_, i) => GAN[i % 10] + ZHI[i % 12]);
  const ANCHOR = Date.UTC(1949, 9, 1); // 1949-10-01 = 甲子（史载）

  function expectedDayPillar(y: number, m: number, d: number): string {
    const diff = Math.round((Date.UTC(y, m - 1, d) - ANCHOR) / 86400000);
    return CYCLE[((diff % 60) + 60) % 60];
  }

  const cases: Array<[number, number, number, string]> = [
    [1949, 10, 2, "次日子丑顺推"],
    [1949, 9, 30, "前日回推"],
    [1949, 11, 30, "整周期+60"],
    [1988, 7, 1, "夏令时期间（钟面正午不受回拨影响日期）"],
    [2000, 2, 29, "闰日"],
    [2024, 1, 1, "近年元旦"],
    [2100, 3, 1, "远未来"],
  ];
  for (const [y, m, d, note] of cases) {
    it(`${y}-${m}-${d}（${note}）`, () => {
      const r = computeBazi({ calendarType: "solar", year: y, month: m, day: d, hour: 12, minute: 0 });
      expect(r.ganZhiDay).toBe(expectedDayPillar(y, m, d));
    });
  }

  it("DST 跨日校正后的日柱与校正目标日一致", () => {
    // 1991-05-02 00:30 属 DST 结束前夜歧义时段前（5/2 0:30 在区间内）→ 回拨至 05-01 23:30，
    // 日柱应等于 1991-05-01 正午的日柱（由周期算术独立推导）
    const rolled = computeBazi({ calendarType: "solar", year: 1991, month: 5, day: 2, hour: 0, minute: 30 });
    expect(rolled.ganZhiDay).toBe(expectedDayPillar(1991, 5, 1));
  });
});

/**
 * 均时差锚点：天文参考值（NOAA）——2 月中旬约 -14.2 分钟、11 月初约 +16.4 分钟、
 * 4/15 与 6/13 附近过零。容差 ±0.5 分钟，对 2 小时时辰粒度绰绰有余。
 */
describe("均时差锚点", () => {
  it("2 月中旬约 -14 分钟", () => {
    expect(equationOfTimeMinutes(2024, 2, 11)).toBeCloseTo(-14.2, 0);
    expect(equationOfTimeMinutes(2024, 2, 11)).toBeGreaterThan(-15);
    expect(equationOfTimeMinutes(2024, 2, 11)).toBeLessThan(-13.5);
  });

  it("11 月初约 +16.4 分钟", () => {
    expect(equationOfTimeMinutes(2024, 11, 3)).toBeGreaterThan(15.8);
    expect(equationOfTimeMinutes(2024, 11, 3)).toBeLessThan(17);
  });

  it("4/15 与 6/13 附近过零", () => {
    expect(Math.abs(equationOfTimeMinutes(2024, 4, 15))).toBeLessThan(1);
    expect(Math.abs(equationOfTimeMinutes(2024, 6, 13))).toBeLessThan(1);
  });
});
