import { describe, expect, it } from "vitest";
import { getSiHua } from "@/lib/engine/ziwei/sihua-daxian";
import {
  SIHUA_SCHOOL_META,
  getSiHuaBySchool,
  mutagenMapBySchool,
  normalizeSihuaSchool,
  schoolAffectsGan,
} from "@/lib/engine/ziwei/sihua-schools";
import { computeZiwei } from "@/lib/engine/ziwei";

const fmt = (list: Array<{ star: string; hua: string }>) =>
  list.map((s) => `${s.star}${s.hua}`).join("");

describe("紫微四化流派（口径可配置体系）", () => {
  it("七共识干：三派完全一致", () => {
    for (const gan of ["甲", "乙", "丙", "丁", "己", "辛", "癸"]) {
      const a = fmt(getSiHua(gan, "tongxing"));
      const b = fmt(getSiHua(gan, "quanshu"));
      const c = fmt(getSiHua(gan, "zhongzhou"));
      expect(a).toBe(b);
      expect(b).toBe(c);
    }
  });

  it("庚干：通行本太阴科天同忌；《全书》天同科太阴忌；中州派天府科", () => {
    expect(fmt(getSiHua("庚", "tongxing"))).toBe("太阳禄武曲权太阴科天同忌");
    expect(fmt(getSiHua("庚", "quanshu"))).toBe("太阳禄武曲权天同科太阴忌");
    expect(fmt(getSiHua("庚", "zhongzhou"))).toBe("太阳禄武曲权天府科天同忌");
  });

  it("戊干：通行本/《全书》右弼科；中州派太阳科（辅弼不入四化）", () => {
    expect(fmt(getSiHua("戊", "tongxing"))).toBe("贪狼禄太阴权右弼科天机忌");
    expect(fmt(getSiHua("戊", "quanshu"))).toBe("贪狼禄太阴权右弼科天机忌");
    expect(fmt(getSiHua("戊", "zhongzhou"))).toBe("贪狼禄太阴权太阳科天机忌");
  });

  it("壬干：通行本左辅科；《全书》/中州派天府科", () => {
    expect(fmt(getSiHua("壬", "tongxing"))).toBe("天梁禄紫微权左辅科武曲忌");
    expect(fmt(getSiHua("壬", "quanshu"))).toBe("天梁禄紫微权天府科武曲忌");
    expect(getSiHua("壬", "zhongzhou").some((s) => s.star === "天府" && s.hua === "科")).toBe(true);
  });

  it("getSiHuaBySchool 直调：未覆盖干回退通行本", () => {
    const fallback = (g: string) => getSiHua(g);
    expect(fmt(getSiHuaBySchool("甲", "zhongzhou", fallback))).toBe(fmt(fallback("甲")));
  });

  it("normalizeSihuaSchool：非法值回退通行本", () => {
    expect(normalizeSihuaSchool(undefined)).toBe("tongxing");
    expect(normalizeSihuaSchool("zhongzhou")).toBe("zhongzhou");
    expect(normalizeSihuaSchool("abc")).toBe("tongxing");
  });

  it("schoolAffectsGan：仅非通行本的戊庚壬受影响", () => {
    expect(schoolAffectsGan("庚", "tongxing")).toBe(false);
    expect(schoolAffectsGan("庚", "zhongzhou")).toBe(true);
    expect(schoolAffectsGan("甲", "zhongzhou")).toBe(false);
  });

  it("mutagenMapBySchool：中州派庚干科在天府", () => {
    const map = mutagenMapBySchool("庚", "zhongzhou", (g) => getSiHua(g));
    expect(map["天府"]).toBe("科");
    expect(map["太阴"]).toBeUndefined();
  });

  it("元数据完整：三派均有名称与出处", () => {
    for (const meta of Object.values(SIHUA_SCHOOL_META)) {
      expect(meta.name.length).toBeGreaterThan(2);
      expect(meta.source.length).toBeGreaterThan(6);
    }
  });

  it("computeZiwei 端到端：中州派戊年生人化科在太阳且提示流派", () => {
    // 1998 为戊寅年
    const base = {
      calendarType: "solar" as const,
      year: 1998,
      month: 6,
      day: 15,
      hour: 10,
      gender: "男",
    };
    const def = computeZiwei(base);
    const zz = computeZiwei({ ...base, ziweiSihuaSchool: "zhongzhou" });
    const defKe = def.siHua.find((s) => s.hua === "科")?.star;
    const zzKe = zz.siHua.find((s) => s.hua === "科")?.star;
    expect(defKe).toBe("右弼");
    expect(zzKe).toBe("太阳");
    expect(zz.sihuaSchoolName).toContain("中州派");
    expect(zz.siHuaNote).toContain("中州派");
    // 非争议干提示无差异：1999 己年
    const jy = computeZiwei({ ...base, year: 1999, ziweiSihuaSchool: "zhongzhou" });
    expect(jy.siHuaNote).toContain("无差异");
  });
});
