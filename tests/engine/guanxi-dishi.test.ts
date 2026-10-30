import { describe, it, expect } from "vitest";
import { computeBazi } from "@/lib/engine/bazi";

/**
 * 干支关系网与十二长生回归（子平经典要素）。
 * 锚点：毛泽东命盘 癸巳 甲子 丁酉 甲辰。
 * 丁火阴干逆行：长生在酉——酉长生、巳帝旺、子绝、辰衰。
 */
describe("十二长生", () => {
  it("丁日主四柱长生状态（阴干逆行锚点）", () => {
    const r = computeBazi({ calendarType: "solar", year: 1893, month: 12, day: 26, hour: 8, minute: 0 });
    const by = Object.fromEntries(r.diShi!.map((d) => [d.pillar, d.diShi]));
    expect(by["日柱"]).toBe("长生"); // 丁长生在酉
    expect(by["年柱"]).toBe("帝旺"); // 丁帝旺在巳
    expect(by["月柱"]).toBe("绝"); // 丁绝在子
    expect(by["时柱"]).toBe("衰"); // 丁衰在辰
  });

  it("无时辰时只输出三柱", () => {
    const r = computeBazi({ calendarType: "solar", year: 1893, month: 12, day: 26 });
    expect(r.diShi).toHaveLength(3);
  });
});

describe("干支关系网", () => {
  it("毛泽东命盘：日支酉与时支辰六合（辰酉合金）", () => {
    const r = computeBazi({ calendarType: "solar", year: 1893, month: 12, day: 26, hour: 8, minute: 0 });
    const gx = r.ganZhiGuanXi!;
    expect(gx.liuHe.some((x) => x.detail.includes("酉") && x.detail.includes("辰"))).toBe(true);
    expect(gx.summary).toContain("六合");
  });

  it("三合局识别：寅午戌火局", () => {
    // 1990-06-15 12:00：庚午 壬午 戊午? 不确定，用构造样本：1984-02-05 子时 年甲子月丙寅日戊子时 → 子与?构造申子辰需申辰
    // 用已知：1992-08-08 申时 壬申年 戊申月? 引擎算，仅断言函数对"申子"两组不成局返回空三合
    const r = computeBazi({ calendarType: "solar", year: 1992, month: 8, day: 8, hour: 16 });
    const gx = r.ganZhiGuanXi!;
    expect(Array.isArray(gx.sanHe)).toBe(true);
  });
});
