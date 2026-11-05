import { describe, expect, it } from "vitest";
import { buildLunarFromBirth, computeCalendar } from "@/lib/engine/calendar";
import {
  CALIBRATION_FIELDS,
  DEFAULT_CALIBRATION,
  calibrationSummary,
  normalizeCalibration,
} from "@/lib/engine/shared/calibration";

describe("排盘口径（calibration）", () => {
  const base = {
    calendarType: "solar" as const,
    year: 1990,
    month: 5,
    day: 15,
    hour: 10,
    minute: 30,
  };

  it("真太阳时默认启用：有经度时校正时辰", () => {
    const on = buildLunarFromBirth({ ...base, longitude: 87.6 }); // 乌鲁木齐，远离东经120°
    expect(on.trueSolarApplied).toBe(true);
    expect(on.solarHour).not.toBe(base.hour); // 偏移量足够大，时辰应被推移
    expect(on.trueSolarNote).toContain("经度");
  });

  it("真太阳时关闭：useTrueSolar=false 等价于无经度排盘", () => {
    const off = buildLunarFromBirth({ ...base, longitude: 87.6, useTrueSolar: false });
    const none = buildLunarFromBirth({ ...base });
    expect(off.trueSolarApplied).toBe(false);
    expect(off.solarHour).toBe(none.solarHour);
    expect(off.solar.toYmdHms()).toBe(none.solar.toYmdHms());
  });

  it("开关关闭但无经度：同样不校正", () => {
    const off = buildLunarFromBirth({ ...base, useTrueSolar: false });
    expect(off.trueSolarApplied).toBe(false);
    expect(off.trueSolarNote).toBeUndefined();
  });

  it("computeCalendar 透传口径字段", () => {
    const r = computeCalendar({ ...base, longitude: 116.4 });
    expect(r.trueSolarApplied).toBe(true);
    expect(r.longitudeUsed).toBe(116.4);
    const off = computeCalendar({ ...base, longitude: 116.4, useTrueSolar: false });
    expect(off.trueSolarApplied).toBe(false);
    expect(off.longitudeUsed).toBeUndefined();
  });

  it("normalizeCalibration：缺省=默认口径，显式 false 才关闭", () => {
    expect(normalizeCalibration(undefined)).toEqual(DEFAULT_CALIBRATION);
    expect(normalizeCalibration({})).toEqual(DEFAULT_CALIBRATION);
    expect(normalizeCalibration({ useTrueSolar: false }).useTrueSolar).toBe(false);
    expect(normalizeCalibration({ ziSect: 1 }).ziSect).toBe(1);
    // 非法值回退默认
    expect(normalizeCalibration({ ziSect: 3 as unknown as 1 }).ziSect).toBe(2);
  });

  it("calibrationSummary：四种组合文案正确", () => {
    expect(calibrationSummary({ useTrueSolar: true, ziSect: 2 }, 116.4)).toContain("真太阳时校正开");
    expect(calibrationSummary({ useTrueSolar: false, ziSect: 2 }, 116.4)).toContain("关（用户选择钟表时间口径）");
    expect(calibrationSummary({ useTrueSolar: true, ziSect: 2 }, null)).toContain("未填经度");
    expect(calibrationSummary({ useTrueSolar: true, ziSect: 1 }, null)).toContain("算次日");
    expect(calibrationSummary(DEFAULT_CALIBRATION, null)).toContain("算当天");
  });

  it("口径元数据完整：每个字段至少两个选项且都带依据", () => {
    expect(CALIBRATION_FIELDS.length).toBeGreaterThanOrEqual(2);
    for (const f of CALIBRATION_FIELDS) {
      expect(f.options.length).toBeGreaterThanOrEqual(2);
      for (const o of f.options) {
        expect(o.basis.length).toBeGreaterThan(10);
        expect(o.label.length).toBeGreaterThan(0);
      }
    }
  });
});
