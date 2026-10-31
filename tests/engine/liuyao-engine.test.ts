import { describe, it, expect } from "vitest";
import { buildLiuyaoNajia } from "@/lib/engine/yijing/liuyao-najia";
import {
  analyzeLiuyao,
  assignBeasts,
  pickYongShen,
  xunKong,
} from "@/lib/engine/yijing/liuyao-engine";
import { computeLiuyao } from "@/lib/engine/yijing";

describe("旬空查表", () => {
  it("甲子日空戌亥", () => {
    expect(xunKong("甲", "子")).toEqual(["戌", "亥"]);
  });
  it("甲戌日空申酉", () => {
    expect(xunKong("甲", "戌")).toEqual(["申", "酉"]);
  });
  it("庚午日空辰巳（甲子旬？庚午属甲子旬之第六位…实际庚午在甲子旬，空戌亥不对时应单独验证）", () => {
    // 庚午：gi=6, zi=6 → n=6（甲子旬）→ 空戌亥
    expect(xunKong("庚", "午")).toEqual(["戌", "亥"]);
  });
});

describe("六兽起法（卜筮正宗）", () => {
  it("甲乙日初爻起青龙，丙丁日起朱雀，壬癸日起玄武", () => {
    expect(assignBeasts("甲")[0].beast).toBe("青龙");
    expect(assignBeasts("甲")[1].beast).toBe("朱雀");
    expect(assignBeasts("丙")[0].beast).toBe("朱雀");
    expect(assignBeasts("癸")[0].beast).toBe("玄武");
  });
});

describe("用神选取（增删卜易用神分类）", () => {
  it("求财取妻财", () => {
    const r = pickYongShen("我想求财，生意做得成吗");
    expect(r.label).toBe("妻财");
  });
  it("考试升迁取官鬼", () => {
    expect(pickYongShen("今年升迁有望吗").label).toBe("官鬼");
  });
  it("占病默认以世爻为用", () => {
    expect(pickYongShen("我身体最近不舒服，占一卦").label).toBe("世爻");
  });
  it("空问题回退世爻", () => {
    expect(pickYongShen("").label).toBe("世爻");
  });
});

describe("断卦引擎（确定性盘面）", () => {
  // 乾为天：lines 全阳，属乾宫本宫，世在上爻
  // 甲日干六亲：子水=父母、寅木=兄弟、辰土=兄弟、午火=子孙、申金=妻财、戌土=妻财
  const najia = buildLiuyaoNajia({ lines: [1, 1, 1, 1, 1, 1], dayGan: "甲", dayZhi: "午" });

  it("求财：妻财两现取其一，元神为生金之土", () => {
    const r = analyzeLiuyao({
      question: "求财",
      dayGan: "甲",
      dayZhi: "午",
      monthZhi: "申",
      najia,
      changedNajia: [],
    });
    expect(r.yongShen.label).toBe("妻财");
    expect(r.yong).not.toBeNull();
    // 宫五行六亲：乾宫金，金克木 → 甲寅木爻为妻财（京房正统）
    expect(r.yong!.najia).toBe("甲寅");
    expect(r.yong!.liuQin).toBe("妻财");
    // 妻财(木)之元神=生木者水（子孙），忌神=克木者金（兄弟）
    expect(r.yuan?.wx).toBe("水");
    expect(r.ji?.wx).toBe("金"); // 克金者木
    expect(["吉", "平", "凶", "吉中带阻"]).toContain(r.conclusion.level);
    expect(r.conclusion.basis.length).toBeGreaterThan(5);
  });

  it("力量清单包含增删卜易条文口径", () => {
    const r = analyzeLiuyao({
      question: "求财",
      dayGan: "甲",
      dayZhi: "午",
      monthZhi: "申",
      najia,
      changedNajia: [],
    });
    for (const line of r.liLiang) {
      expect(
        line.includes("忌神") || line.includes("元神") || line.includes("用神")
      ).toBe(true);
    }
  });

  it("世爻为用（占病）时取世爻评分", () => {
    const r = analyzeLiuyao({
      question: "自占病情",
      dayGan: "甲",
      dayZhi: "午",
      monthZhi: "申",
      najia,
      changedNajia: [],
    });
    expect(r.yongShen.label).toBe("世爻");
    expect(r.yong?.position).toBe(6);
  });
});

describe("computeLiuyao 集成", () => {
  it("输出 duanGua 且 sections 含断卦", () => {
    const r = computeLiuyao("求财生意", new Date(2026, 10, 1, 12));
    expect(r.duanGua).toBeTruthy();
    expect(r.duanGua.conclusion.level).toBeTruthy();
    const titles = (r.sections ?? []).map((s: { title: string }) => s.title);
    expect(titles).toContain("断卦（《增删卜易》四神）");
    expect(r.summary).toContain("用神");
  });

  it("手动装卦同样出断卦", () => {
    const r = computeLiuyao("问事业", new Date(2026, 10, 1, 12), [7, 7, 8, 8, 7, 7]);
    expect(r.duanGua).toBeTruthy();
    expect(r.duanGua!.yongShen.label).toBeTruthy();
  });
});
