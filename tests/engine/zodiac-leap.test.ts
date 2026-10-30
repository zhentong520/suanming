import { describe, it, expect } from "vitest";
import { computeCalendar } from "@/lib/engine/calendar";
import { computeZodiac, getZodiacRelation } from "@/lib/engine/zodiac";

/**
 * 生肖口径与农历闰月回归：锁定引擎约定。
 * 1. 生肖双口径：立春生肖与八字年柱一致（命理主流）；春节生肖为民俗参考；
 * 2. 农历闰月以 isLeapMonth 标记（lunar-typescript 负数月约定）；
 * 3. 六合/六冲关系表锚点。
 * 锚点：2024 立春 02-04、春节 02-10；2023 年闰二月。
 */
describe("生肖双口径", () => {
  it("2024-02-03（立春前、春节前）：两口径同为兔", () => {
    const r = computeCalendar({ calendarType: "solar", year: 2024, month: 2, day: 3, hour: 12 });
    expect(r.zodiacLichun).toBe("兔");
    expect(r.shengXiao).toBe("兔");
  });

  it("2024-02-05（立春后、春节前）：立春口径龙 / 春节口径兔", () => {
    const r = computeCalendar({ calendarType: "solar", year: 2024, month: 2, day: 5, hour: 12 });
    expect(r.zodiacLichun).toBe("龙");
    expect(r.shengXiao).toBe("兔");
  });

  it("2024-03-01（两节点后）：两口径同为龙", () => {
    const r = computeCalendar({ calendarType: "solar", year: 2024, month: 3, day: 1, hour: 12 });
    expect(r.zodiacLichun).toBe("龙");
    expect(r.shengXiao).toBe("龙");
  });

  it("computeZodiac 主输出采用立春口径并附说明", () => {
    const z = computeZodiac({ calendarType: "solar", year: 2024, month: 2, day: 5, hour: 12 });
    expect(z.zodiac).toBe("龙");
    expect(z.zodiacChunjie).toBe("兔");
    expect(z.zodiacNote).toContain("立春");
  });
});

describe("农历闰月", () => {
  it("2023 闰二月初一 → 2023-03-22（平二月初一 → 02-20）", () => {
    const leap = computeCalendar({ calendarType: "lunar", year: 2023, month: 2, day: 1, hour: 12, isLeapMonth: true });
    const norm = computeCalendar({ calendarType: "lunar", year: 2023, month: 2, day: 1, hour: 12 });
    expect(leap.solarDate).toBe("2023-03-22");
    expect(norm.solarDate).toBe("2023-02-20");
    expect(leap.lunarDate).toContain("闰");
  });

  it("isLeapMonth 对公历输入不生效", () => {
    const a = computeCalendar({ calendarType: "solar", year: 2023, month: 3, day: 22, hour: 12, isLeapMonth: true });
    const b = computeCalendar({ calendarType: "solar", year: 2023, month: 3, day: 22, hour: 12 });
    expect(a.ganZhiDay).toBe(b.ganZhiDay);
  });
});

describe("生肖关系锚点", () => {
  it("六合与六冲", () => {
    expect(getZodiacRelation("鼠", "牛").type).toBe("六合");
    expect(getZodiacRelation("牛", "鼠").type).toBe("六合");
    expect(getZodiacRelation("鼠", "马").type).toBe("六冲");
    expect(getZodiacRelation("马", "鼠").type).toBe("六冲");
    expect(getZodiacRelation("龙", "龙").type).toBe("普通");
  });
});
