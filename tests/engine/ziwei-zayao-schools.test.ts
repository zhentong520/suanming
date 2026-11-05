import { describe, expect, it } from "vitest";
import {
  GENG_SI_HUA,
  effectiveDouMonth,
  gengSiHuaStars,
  kuiYueBranches,
  normalizeGengSihua,
  normalizeKuiyueSchool,
  normalizeLeapMonthSchool,
  normalizeTianmaSchool,
  tianMaBranch,
} from "@/lib/engine/ziwei/zayao-schools";
import { getSiHua } from "@/lib/engine/ziwei/sihua-daxian";
import { computeZiwei } from "@/lib/engine/ziwei";

const fmt = (list: Array<{ star: string; hua: string }>) =>
  list.map((s) => `${s.star}${s.hua}`).join("");

describe("杂曜与月份口径（口径可配置体系 v4）", () => {
  it("庚干四化五变体", () => {
    expect(fmt(getSiHua("庚", "tongxing", "GYWYT"))).toBe("太阳禄武曲权太阴科天同忌");
    expect(fmt(getSiHua("庚", "tongxing", "GYWTY"))).toBe("太阳禄武曲权天同科太阴忌");
    expect(fmt(getSiHua("庚", "tongxing", "GYWFT"))).toBe("太阳禄武曲权天府科天同忌");
    expect(fmt(getSiHua("庚", "tongxing", "GYWFX"))).toBe("太阳禄武曲权天府科天相忌");
    expect(fmt(getSiHua("庚", "tongxing", "GYWTX"))).toBe("太阳禄武曲权天同科天相忌");
  });

  it("庚变体只影响庚干；非庚干回退流派表", () => {
    expect(gengSiHuaStars("甲", "GYWTX")).toBeNull();
    expect(fmt(getSiHua("戊", "tongxing", "GYWTX"))).toBe("贪狼禄太阴权右弼科天机忌");
    expect(gengSiHuaStars("庚", "GYWTY")).toEqual(GENG_SI_HUA.GYWTY);
  });

  it("默认变体 = 通行本，normalize 拦非法值", () => {
    expect(normalizeGengSihua(undefined)).toBe("GYWYT");
    expect(normalizeGengSihua("GYWFX")).toBe("GYWFX");
    expect(normalizeGengSihua("xyz")).toBe("GYWYT");
  });

  it("天马：年支起与月支起", () => {
    // 午年（寅午戌）→ 申
    expect(tianMaBranch(6)).toBe(8); // 申=8
    expect(tianMaBranch(2)).toBe(8); // 寅月（寅午戌）→ 申
    // 子年 → 寅
    expect(tianMaBranch(0)).toBe(2);
  });

  it("魁钺四诀：差异集中在庚辛壬癸", () => {
    expect(kuiYueBranches("庚", "qs1")).toEqual([1, 7]); // 丑未
    expect(kuiYueBranches("庚", "qs2")).toEqual([7, 3]); // 午寅
    expect(kuiYueBranches("庚", "qs3")).toEqual([3, 7]); // 寅午
    expect(kuiYueBranches("庚", "qs4")).toEqual([1, 7]); // 丑未（同通行）
    // 共识干不受变体影响
    for (const s of ["qs2", "qs3", "qs4"] as const) {
      expect(kuiYueBranches("甲", s)).toEqual([1, 7]);
      expect(kuiYueBranches("丙", s)).toEqual([11, 9]);
    }
  });

  it("normalize 杂曜口径", () => {
    expect(normalizeTianmaSchool("month-branch")).toBe("month-branch");
    expect(normalizeTianmaSchool("x")).toBe("year-branch");
    expect(normalizeKuiyueSchool("qs3")).toBe("qs3");
    expect(normalizeKuiyueSchool("q")).toBe("qs1");
    expect(normalizeLeapMonthSchool("next")).toBe("next");
    expect(normalizeLeapMonthSchool(undefined)).toBe("split");
  });

  it("闰月归属三口径", () => {
    // 闰二月（signed -2），本月=2，次月=3
    expect(effectiveDouMonth(-2, 10, "origin")).toBe(2); // 整月归本月
    expect(effectiveDouMonth(-2, 10, "split")).toBe(2); // 前半月归本月
    expect(effectiveDouMonth(-2, 20, "split")).toBe(3); // 后半月归次月
    expect(effectiveDouMonth(-2, 1, "next")).toBe(3); // 整月归次月
    // 非闰月不受影响
    expect(effectiveDouMonth(5, 20, "split")).toBe(5);
  });

  it("computeZiwei 端到端：庚年选变体后化忌从天同变太阴/天相，天马月支起可换宫", () => {
    const base = { calendarType: "solar" as const, year: 1990, month: 5, day: 15, hour: 10, gender: "男" };
    const def = computeZiwei(base);
    const tx = computeZiwei({ ...base, ziweiGengSihua: "GYWTX" });
    const defJi = def.siHua.find((s) => s.hua === "忌")?.star;
    const txJi = tx.siHua.find((s) => s.hua === "忌")?.star;
    expect(defJi).toBe("天同");
    expect(txJi).toBe("天相");
    expect(tx.gengSihuaName).toContain("阳武同相");
    // 天马：月支起（巳月 → 巳酉丑 → 亥）vs 年支起（午年 → 寅午戌 → 申）
    const defMa = def.auxiliaryStars.find((s) => s.star === "天马");
    const monthMa = computeZiwei({ ...base, ziweiTianmaSchool: "month-branch" }).auxiliaryStars.find(
      (s) => s.star === "天马"
    );
    expect(defMa?.branch).toBe("申");
    expect(monthMa?.branch).toBe("亥");
    expect(monthMa).not.toEqual(defMa);
  });
});
