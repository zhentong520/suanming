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
