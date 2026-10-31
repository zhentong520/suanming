import { describe, it, expect } from "vitest";
import { computeTiaoHou, getMonthHiddenStems } from "@/lib/engine/bazi/tiaohou";
import { computeGeJu } from "@/lib/engine/bazi/geju";

describe("穷通宝鉴调候用神表", () => {
  const GANS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const ZHIS = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
  const VALID = "甲乙丙丁戊己庚辛壬癸";

  it("covers all 10 gan x 12 zhi cells with valid stems", () => {
    for (const g of GANS) {
      for (const z of ZHIS) {
        const r = computeTiaoHou(g, z);
        expect(r.primary, `${g}${z}`).toMatch(new RegExp(`^[${VALID}]$`));
        for (const s of r.secondary) {
          expect(s).toMatch(new RegExp(`^[${VALID}]$`));
        }
        expect(r.note).toBeTruthy();
      }
    }
  });

  it("returns canonical primary gods for known cells", () => {
    // 正月甲木：丙癸（寒木向阳）
    expect(computeTiaoHou("甲", "寅").primary).toBe("丙");
    expect(computeTiaoHou("甲", "寅").secondary).toContain("癸");
    // 五月甲木火炎：癸水为急
    expect(computeTiaoHou("甲", "午").primary).toBe("癸");
    // 冬金喜丙火温暖
    expect(computeTiaoHou("辛", "丑").primary).toBe("丙");
    // 仲冬丙火非壬不威
    expect(computeTiaoHou("丙", "子").primary).toBe("壬");
  });

  it("exposes month hidden stems for transparent-god rules", () => {
    expect(getMonthHiddenStems("寅")).toEqual(["甲", "丙", "戊"]);
    expect(getMonthHiddenStems("午")).toEqual(["丁", "己"]);
  });
});

describe("子平透干取格（《渊海子平·宝法》《子平真诠》）", () => {
  it("prefers transparent hidden stem over month main qi", () => {
    // 甲日主，寅月藏干甲丙戊，丙透于年/月干 → 食神格（透干），而非建禄格（本气）
    const r = computeGeJu({
      dayGan: "甲",
      monthZhi: "寅",
      yearGan: "丙",
      monthGan: "丙",
      timeGan: "戊",
    });
    expect(r.name).toBe("食神格");
    expect(r.takenFrom).toBe("透干");
    expect(r.monthQi).toBe("丙");
  });

  it("skips bi-jian transparent gods and falls back to next transparent", () => {
    // 甲日主，寅月，透甲(比肩)与戊(偏财) → 比肩不取格，取戊 → 偏财格
    const r = computeGeJu({
      dayGan: "甲",
      monthZhi: "寅",
      yearGan: "甲",
      monthGan: "戊",
    });
    expect(r.name).toBe("偏财格");
    expect(r.takenFrom).toBe("透干");
  });

  it("falls back to main qi (jian-lu) when nothing transparent", () => {
    const r = computeGeJu({
      dayGan: "甲",
      monthZhi: "寅",
      yearGan: "庚",
      monthGan: "辛",
    });
    expect(r.name).toBe("建禄格");
    expect(r.takenFrom).toBe("本气");
    expect(r.monthQi).toBe("甲");
  });

  it("tags shan/evi nature, usage and xiang-shen", () => {
    const official = computeGeJu({
      dayGan: "甲",
      monthZhi: "酉",
      yearGan: "癸",
      monthGan: "辛",
    });
    expect(official.name).toBe("正官格");
    expect(official.shanE).toBe("善");
    expect(official.usage).toBe("顺用");
    expect(official.xiangShen).toContain("印");

    const killing = computeGeJu({
      dayGan: "甲",
      monthZhi: "申",
      yearGan: "壬",
      monthGan: "庚",
    });
    expect(killing.name).toBe("七杀格");
    expect(killing.shanE).toBe("恶");
    expect(killing.usage).toBe("逆用");
  });

  it("marks rescue when a break factor has a saving god", () => {
    // 正官格 + 伤官(破) + 正印(救)：败中有成，全凭救应
    const r = computeGeJu({
      dayGan: "甲",
      monthZhi: "酉",
      yearGan: "丁",
      monthGan: "辛",
      timeGan: "癸",
    });
    expect(r.name).toBe("正官格");
    expect(r.breakFactors.join("")).toContain("伤官");
    expect(r.rescue?.join("")).toContain("败中有成");
    expect(r.broken).toBe(false);
    expect(r.summary).toContain("带忌有救");
  });

  it("keeps broken=true when no rescue exists", () => {
    const r = computeGeJu({
      dayGan: "甲",
      monthZhi: "酉",
      yearGan: "丁",
      monthGan: "辛",
      timeGan: "丁",
    });
    expect(r.breakFactors.length).toBeGreaterThan(0);
    expect(r.rescue).toBeUndefined();
    expect(r.broken).toBe(true);
  });
});
