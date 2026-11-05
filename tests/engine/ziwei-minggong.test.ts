import { describe, expect, it } from "vitest";
import { computeZiwei } from "@/lib/engine/ziwei";
import { computeIztroAstrolabe } from "@/lib/engine/ziwei/iztro-bridge";
import { douShuMingShenGong, naYinOfGanZhi, naYinToJu } from "@/lib/engine/ziwei/placement";

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

describe("斗数命宫安法（安命身宫诀）与落宫一致性", () => {
  it("标准例：1990-5-15 巳时 → 命宫戊子（火六局），与 iztro 一致", () => {
    const g = douShuMingShenGong(4, 5, "庚"); // 农历四月、巳时、庚年
    expect(BRANCHES[g.mingIdx]).toBe("子");
    expect(g.mingGz).toBe("戊子"); // 庚年五虎遁：戊寅起，子宫=戊子
    expect(naYinOfGanZhi("戊子")).toBe("霹雳火");
    expect(naYinToJu("霹雳火")).toBe(6); // 火六局
    // 身宫：月宫起子顺数生时 → 戌
    expect(BRANCHES[g.shenIdx]).toBe("戌");
  });

  it("纳音表抽验", () => {
    expect(naYinOfGanZhi("甲子")).toBe("海中金");
    expect(naYinOfGanZhi("壬戌")).toBe("大海水");
    expect(naYinOfGanZhi("庚子")).toBe("壁上土");
  });

  it("自研安星落宫与 iztro 引擎一致（多盘交叉验证）——修复八字命宫误用", () => {
    const charts = [
      { y: 1990, m: 5, d: 15, h: 10 },
      { y: 1984, m: 2, d: 3, h: 4 },
      { y: 2001, m: 11, d: 28, h: 22 },
      { y: 1975, m: 8, d: 8, h: 6 },
    ];
    for (const c of charts) {
      const zw = computeZiwei({
        calendarType: "solar",
        year: c.y,
        month: c.m,
        day: c.d,
        hour: c.h,
        gender: "男",
      });
      const iz = computeIztroAstrolabe({
        solarYmd: `${c.y}-${c.m}-${c.d}`,
        hourZhiIdx: Math.floor(((c.h + 1) % 24) / 2),
        gender: "男",
      });
      // 自研命宫地支 = iztro 命宫地支
      const selfBranch = zw.mingGong.match(/（(..)）/)?.[1]?.slice(-1);
      expect({ chart: c, self: selfBranch, iztro: iz.palaceBranch["命宫"] }).toEqual({
        chart: c,
        self: iz.palaceBranch["命宫"],
        iztro: iz.palaceBranch["命宫"],
      });
      // 每颗主星落宫一致
      for (const s of zw.stars) {
        const izPalace = iz.starPalace[s.star];
        const izBranch = izPalace ? iz.palaceBranch[izPalace] : undefined;
        if (izBranch && izBranch !== s.branch) {
          throw new Error(`落宫不一致: ${c.y}-${c.m}-${c.d} ${s.star} 自研@${s.branch} vs iztro@${izBranch}`);
        }
      }
      // 五行局一致
      expect(zw.wuXingJu).toBe(iz.fiveElementsClass);
    }
  });
});
