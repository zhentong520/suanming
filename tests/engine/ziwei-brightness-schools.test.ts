import { describe, expect, it } from "vitest";
import { computeIztroAstrolabe } from "@/lib/engine/ziwei/iztro-bridge";
import {
  BRIGHTNESS_SCHOOL_META,
  brightnessFnForSchool,
  brightnessSchoolAffects,
  normalizeBrightnessSchool,
  schoolMainBrightness,
} from "@/lib/engine/ziwei/brightness-schools";
import { computeZiwei } from "@/lib/engine/ziwei";

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const MAIN_STARS = [
  "紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府",
  "太阴", "贪狼", "巨门", "天相", "天梁", "七杀", "破军",
];

describe("紫微亮度流派（口径可配置体系）", () => {
  it("全书表与 iztro 引擎逐宫比对：差异应为个别已知格（<3 格/盘）", () => {
    const charts = [
      { y: 1990, m: 5, d: 15, h: 10 },
      { y: 1984, m: 2, d: 3, h: 4 },
      { y: 2001, m: 11, d: 28, h: 22 },
    ];
    for (const c of charts) {
      const zw = computeZiwei({
        calendarType: "solar" as const,
        year: c.y,
        month: c.m,
        day: c.d,
        hour: c.h,
        gender: "男",
      });
      const mismatches: string[] = [];
      for (const s of zw.stars) {
        const byTable = schoolMainBrightness(s.star, BRANCHES.indexOf(s.branch), "quanshu");
        if (s.brightness !== byTable) mismatches.push(`${s.star}@${s.branch}: 引擎${s.brightness}/表${byTable ?? "留白"}`);
      }
      // 已知个别分歧（如紫微午宫）允许存在，但不允许大面积错位（错位会在数据抄录错误时大面积爆发）
      expect(mismatches.length).toBeLessThan(3);
    }
  });

  it("已知分歧锚点：紫微@午 iztro=旺 而《全书》表=庙；太阴诸派对照", () => {
    // iztro 引擎实际输出（本项目默认口径）
    expect(schoolMainBrightness("太阴", 11, "quanshu")).toBe("庙"); // 亥《全书》
    expect(schoolMainBrightness("太阴", 3, "quanshu")).toBe("陷"); // 卯
    expect(schoolMainBrightness("太阴", 2, "zhongzhou")).toBe("闲"); // 寅·中州派
    expect(schoolMainBrightness("太阳", 0, "quanshu")).toBe("陷"); // 子
    expect(schoolMainBrightness("太阳", 6, "quanshu")).toBe("旺"); // 午
    // 紫微午宫：iztro 引擎输出旺（跨盘实测），《全书》卷二记庙 —— 派别切换的真实价值
    const zw = computeZiwei({ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 10, gender: "男" });
    const zwQS = computeZiwei({ ...{ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 10, gender: "男" }, ziweiBrightnessSchool: "quanshu" });
    const ziweiDefault = zw.stars.find((s) => s.star === "紫微");
    const ziweiQS = zwQS.stars.find((s) => s.star === "紫微");
    expect(ziweiDefault?.branch).toBe(ziweiQS?.branch);
    if (ziweiDefault?.branch === "午") {
      expect(ziweiDefault?.brightness).toBe("旺");
      expect(ziweiQS?.brightness).toBe("庙");
    }
  });

  it("七档 vs 五档：中州派不出「得/利/不」，只有庙旺平闲陷", () => {
    for (const star of MAIN_STARS) {
      for (let b = 0; b < 12; b++) {
        const v = schoolMainBrightness(star, b, "zhongzhou");
        if (v) expect(["庙", "旺", "平", "闲", "陷"]).toContain(v);
      }
    }
  });

  it("各派间确有实质差异（不是复制四份同样的表）", () => {
    let diff = 0;
    for (const star of MAIN_STARS) {
      for (let b = 0; b < 12; b++) {
        const qs = schoolMainBrightness(star, b, "quanshu");
        const zz = schoolMainBrightness(star, b, "zhongzhou");
        const xd = schoolMainBrightness(star, b, "xiandai");
        if (qs !== zz) diff++;
        if (qs !== xd) diff++;
      }
    }
    expect(diff).toBeGreaterThan(20);
  });

  it("normalize / affects：缺省=iztro 口径且不重标", () => {
    expect(normalizeBrightnessSchool(undefined)).toBe("iztro");
    expect(normalizeBrightnessSchool("zhongzhou")).toBe("zhongzhou");
    expect(normalizeBrightnessSchool("abc")).toBe("iztro");
    expect(brightnessSchoolAffects("iztro")).toBe(false);
    expect(brightnessSchoolAffects("quanshu")).toBe(true);
    expect(brightnessSchoolAffects("xiandai2")).toBe(true);
  });

  it("元数据完整", () => {
    for (const meta of Object.values(BRIGHTNESS_SCHOOL_META)) {
      expect(meta.name.length).toBeGreaterThan(1);
      expect(meta.source.length).toBeGreaterThan(6);
    }
  });

  it("computeZiwei 端到端：选派后主星亮度按该派表重标，默认路径不变", () => {
    const base = {
      calendarType: "solar" as const,
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      gender: "男",
    };
    const def = computeZiwei(base);
    const zz = computeZiwei({ ...base, ziweiBrightnessSchool: "zhongzhou" });
    const xd2 = computeZiwei({ ...base, ziweiBrightnessSchool: "xiandai2" });

    // 默认输出 = iztro 原始亮度（回归保护）
    const iz = computeIztroAstrolabe({
      solarYmd: "1990-05-15",
      hourZhiIdx: BRANCHES.indexOf("巳"),
      gender: "男",
    });
    for (const s of def.stars) {
      if (s.star in iz.brightness) expect(s.brightness).toBe(iz.brightness[s.star]);
    }
    // 选派后：每颗主星亮度与该派表查表一致，且整体与默认存在差异
    let diffCount = 0;
    for (const s of zz.stars) {
      const expected = schoolMainBrightness(s.star, BRANCHES.indexOf(s.branch), "zhongzhou");
      if (expected) expect(s.brightness).toBe(expected);
      const d = def.stars.find((x) => x.star === s.star);
      if (d && d.brightness !== s.brightness) diffCount++;
    }
    expect(diffCount).toBeGreaterThan(0);
    expect(zz.brightnessSchoolName).toContain("中州派");
    expect(xd2.brightnessSchoolName).toContain("现代修正二");
    // 全量星曜串（starsFull）也按派重标亮度
    expect(xd2.summary).toContain("亮度流派");
  });
});
