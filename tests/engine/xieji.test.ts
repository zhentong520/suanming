import { describe, it, expect } from "vitest";
import { Solar } from "lunar-typescript";
import { computeXieJi } from "@/lib/engine/almanac/xieji";
import { computeAlmanac } from "@/lib/engine/almanac";

const ZHIS = "子丑寅卯辰巳午未申酉戌亥";

/** 在 [startDays, endDays] 范围内（自 2026-01-01 起）找第一个满足条件的日期 */
function findDate(offsetFrom: number, offsetTo: number, pred: (date: Date) => boolean): Date {
  for (let off = offsetFrom; off <= offsetTo; off++) {
    const d = new Date(2026, 0, 1 + off, 12);
    if (pred(d)) return d;
  }
  throw new Error("no date matched");
}

function dayZhiOf(d: Date): string {
  return Solar.fromDate(d).getLunar().getEightChar().getDayZhi();
}

describe("协纪辨方书择日打分", () => {
  it("月破日：日支冲月支 → 凶煞含月破，verdict 为忌", () => {
    // 找一个日支冲月支的日子（子月午日 / 午月子日 等）
    const d = findDate(0, 380, (x) => {
      const lunar = Solar.fromDate(x).getLunar().getEightChar();
      const mz = lunar.getMonthZhi();
      const dz = lunar.getDayZhi();
      return (ZHIS.indexOf(dz) + 6) % 12 === ZHIS.indexOf(mz);
    });
    const r = computeXieJi(d);
    expect(r.xiongSha.map((x) => x.name)).toContain("月破");
    expect(r.verdict.level).toBe("忌");
  });

  it("四废日：春季庚申/辛酉 → 凶煞含四废", () => {
    // 找寅/卯/辰月的庚申或辛酉日
    const d = findDate(30, 130, (x) => {
      const lunar = Solar.fromDate(x).getLunar().getEightChar();
      const mz = lunar.getMonthZhi();
      return ["寅", "卯", "辰"].includes(mz) && ["庚申", "辛酉"].includes(lunar.getDay());
    });
    const r = computeXieJi(d);
    expect(r.xiongSha.map((x) => x.name)).toContain("四废");
    expect(r.verdict.level).toBe("忌");
  });

  it("天赦日：春季戊寅 → 吉神含天赦", () => {
    // 找寅月的戊寅日
    const d = findDate(30, 90, (x) => {
      const lunar = Solar.fromDate(x).getLunar().getEightChar();
      return lunar.getMonthZhi() === "寅" && lunar.getDay() === "戊寅";
    });
    const r = computeXieJi(d);
    const tianShe = r.jiShen.find((x) => x.name === "天赦");
    expect(tianShe).toBeTruthy();
    expect(tianShe!.weight).toBe(4);
  });

  it("月德日：寅月丙日 → 吉神含月德", () => {
    const d = findDate(30, 60, (x) => {
      const lunar = Solar.fromDate(x).getLunar().getEightChar();
      return lunar.getMonthZhi() === "寅" && lunar.getDayGan() === "丙";
    });
    const r = computeXieJi(d);
    expect(r.jiShen.map((x) => x.name)).toContain("月德");
  });

  it("总纲原文出现在裁定依据中", () => {
    const r = computeXieJi(new Date(2026, 10, 1, 12));
    expect(r.verdict.basis).toContain("从宜不从忌");
    expect(["宜", "平", "忌"]).toContain(r.verdict.level);
  });

  it("分用事覆盖八类活动", () => {
    const r = computeXieJi(new Date(2026, 10, 1, 12));
    const acts = r.perActivity.map((a) => a.activity);
    for (const a of ["嫁娶", "开市", "出行", "移徙", "修造", "安葬", "祭祀", "求医"]) {
      expect(acts).toContain(a);
    }
  });

  it("computeAlmanac 集成 xieJi", () => {
    const r = computeAlmanac("2026-11-01");
    expect(r.xieJi).toBeTruthy();
    expect(r.xieJi.dayGZ).toBeTruthy();
  });
});
