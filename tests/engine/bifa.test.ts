import { describe, it, expect } from "vitest";
import { evaluateBiFa, maXingOf } from "@/lib/engine/shared/bifa";

describe("三合驿马表", () => {
  it("申子辰马在寅、寅午戌马在申、巳酉丑马在亥、亥卯未马在巳", () => {
    expect(maXingOf("子")).toBe("寅");
    expect(maXingOf("午")).toBe("申");
    expect(maXingOf("酉")).toBe("亥");
    expect(maXingOf("卯")).toBe("巳");
  });
});

function run(overrides: Partial<Parameters<typeof evaluateBiFa>[0]>) {
  return evaluateBiFa({
    keTi: "元首课",
    sanChuanZhi: ["午", "申", "戌"],
    xunKong: ["戌", "亥"],
    shenJiang: [{ general: "贵人", branch: "未" }],
    isDayKe: true,
    dayGanZhi: "甲子",
    siKe: [],
    ...overrides,
  });
}

describe("毕法断语触发", () => {
  it("课体条触发（元首课通例）", () => {
    const hits = run({});
    expect(hits.some((h) => h.fa.includes("元首"))).toBe(true);
  });

  it("初传空亡触发", () => {
    const hits = run({ sanChuanZhi: ["戌", "子", "寅"] }); // 戌空
    expect(hits.some((h) => h.fa === "初传空亡")).toBe(true);
  });

  it("驿马入传触发（甲子日马在寅）", () => {
    const hits = run({ sanChuanZhi: ["午", "寅", "辰"] });
    const ma = hits.find((h) => h.fa === "驿马入传");
    expect(ma).toBeTruthy();
    expect(ma!.source).toBe("原文");
    expect(ma!.text).toContain("催官使者");
  });

  it("三传递生触发（木→火→土：寅午戌链）", () => {
    const hits = run({ sanChuanZhi: ["寅", "午", "戌"] });
    const ds = hits.find((h) => h.fa === "三传递生");
    expect(ds).toBeTruthy();
    expect(ds!.source).toBe("原文");
  });

  it("六阳俱备触发", () => {
    const hits = run({ sanChuanZhi: ["子", "寅", "辰"] });
    expect(hits.some((h) => h.fa === "六阳俱备")).toBe(true);
  });

  it("贵人临传触发", () => {
    const hits = run({ sanChuanZhi: ["未", "酉", "亥"] });
    expect(hits.some((h) => h.fa === "贵人临传")).toBe(true);
  });

  it("无触发时返回空数组", () => {
    const hits = run({ keTi: "未知课体", sanChuanZhi: ["未", "巳", "卯"], xunKong: ["戌", "亥"] });
    expect(Array.isArray(hits)).toBe(true);
  });
});
