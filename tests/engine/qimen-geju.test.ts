import { describe, it, expect } from "vitest";
import {
  analyzeQiMenGeJu,
  starXingWang,
  menPoCheck,
  SHI_GAN_KE_YING,
} from "@/lib/engine/qimen-daliuren/geju";
import { computeQimen } from "@/lib/engine/qimen-daliuren";

describe("十干克应表（烟波钓叟歌）", () => {
  it("吉凶格条目完整且原文依据齐全", () => {
    const expectedJi = ["青龙返首", "飞鸟跌穴"];
    const expectedXiong = ["白入荧", "荧入白", "大格", "刑格", "上格", "蛇夭矫", "雀投江", "龙逃走", "虎猖狂"];
    for (const name of expectedJi) {
      const hit = Object.values(SHI_GAN_KE_YING).find((x) => x.name === name);
      expect(hit, name).toBeTruthy();
      expect(hit!.kind).toBe("吉");
      expect(hit!.verse).toBeTruthy();
    }
    for (const name of expectedXiong) {
      const hit = Object.values(SHI_GAN_KE_YING).find((x) => x.name === name);
      expect(hit, name).toBeTruthy();
      expect(hit!.kind).toBe("凶");
    }
  });
});

describe("格局扫描（合成盘面）", () => {
  it("天盘戊加地盘丙 = 青龙返首（甲遁于戊）", () => {
    const r = analyzeQiMenGeJu(
      [{ palace: "坎", tianGan: "戊", diGan: "丙", gate: "休", god: "值符", star: "天蓬" }],
      { monthZhi: "子" }
    );
    expect(r.geJuList).toHaveLength(1);
    expect(r.geJuList[0].name).toBe("青龙返首");
    expect(r.geJuList[0].kind).toBe("吉");
    expect(r.summary).toContain("青龙返首");
  });

  it("天盘丙加地盘戊 = 飞鸟跌穴", () => {
    const r = analyzeQiMenGeJu(
      [{ palace: "离", tianGan: "丙", diGan: "戊" }],
      { monthZhi: "午" }
    );
    expect(r.geJuList[0].name).toBe("飞鸟跌穴");
  });

  it("凶格：庚加癸大格 / 乙加辛龙逃走 / 癸加丁蛇夭矫", () => {
    const r = analyzeQiMenGeJu(
      [
        { palace: "坤", tianGan: "庚", diGan: "癸" },
        { palace: "震", tianGan: "乙", diGan: "辛" },
        { palace: "兑", tianGan: "癸", diGan: "丁" },
      ],
      {}
    );
    const names = r.geJuList.map((g) => g.name);
    expect(names).toEqual(expect.arrayContaining(["大格", "龙逃走", "蛇夭矫"]));
    expect(r.geJuList.every((g) => g.kind === "凶")).toBe(true);
    expect(r.summary).toContain("宜避其方位时辰");
  });

  it("三遁：天遁（生门+丙+丁）/ 地遁（开门+乙+己）/ 人遁（休门+丁+太阴）", () => {
    const r = analyzeQiMenGeJu(
      [
        { palace: "艮", tianGan: "丙", diGan: "丁", gate: "生" },
        { palace: "乾", tianGan: "乙", diGan: "己", gate: "开" },
        { palace: "坎", tianGan: "丁", diGan: "庚", gate: "休", god: "太阴" },
      ],
      {}
    );
    expect(r.sanDun).toHaveLength(3);
    expect(r.sanDun[0]).toContain("天遁");
    expect(r.sanDun[1]).toContain("地遁");
    expect(r.sanDun[2]).toContain("人遁");
  });

  it("伏干格：天盘庚加时干", () => {
    const r = analyzeQiMenGeJu(
      [{ palace: "乾", tianGan: "庚", diGan: "丙" }],
      { timeGan: "丙" }
    );
    expect(r.ganGe.join("")).toContain("伏干格");
  });

  it("九星旺衰：天蓬水星旺于我生之月（亥子水月为相、寅卯木月为旺）", () => {
    expect(starXingWang("天蓬", "子")!.state).toBe("相");
    expect(starXingWang("天蓬", "寅")!.state).toBe("旺");
    expect(starXingWang("天蓬", "辰")!.state).toBe("囚"); // 土克水
  });

  it("门迫：门克宫为迫，宫克门为制", () => {
    expect(menPoCheck({ palace: "离", tianGan: "丙", diGan: "丙", gate: "开" })!).toContain("迫"); // 开门金克离宫火
    expect(menPoCheck({ palace: "乾", tianGan: "丙", diGan: "丙", gate: "景" })!).toContain("制"); // 乾宫金克景门火
  });
});

describe("computeQimen 集成", () => {
  it("输出 qiMenGeJu 且 sections 含十干克应", () => {
    const r = computeQimen("求财生意", new Date(2026, 10, 1, 12));
    expect(r.qiMenGeJu).toBeTruthy();
    expect(Array.isArray(r.qiMenGeJu!.geJuList)).toBe(true);
    const titles = (r.sections ?? []).map((s: { title: string }) => s.title);
    expect(titles).toContain("十干克应（《烟波钓叟歌》）");
  });
});
