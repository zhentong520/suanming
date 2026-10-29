import { describe, it, expect } from "vitest";
import { computeCalendar, getAlmanacForDate } from "@/lib/engine/calendar";
import { computeBazi } from "@/lib/engine/bazi";
import { computeChenggu } from "@/lib/engine/chenggu";
import { computeZodiac, getZodiacRelation } from "@/lib/engine/zodiac";
import { computeNameWuge } from "@/lib/engine/name-wuge";
import { computeWordDivination } from "@/lib/engine/word-divination";
import { computeMatchmaking } from "@/lib/engine/matchmaking";

const samples = [
  { year: 1990, month: 5, day: 15, hour: 15, gender: "男" },
  { year: 1988, month: 2, day: 29, hour: 8, gender: "女" },
  { year: 2000, month: 1, day: 1, hour: 0, gender: "男" },
  { year: 1995, month: 12, day: 31, hour: 23, gender: "女" },
  { year: 1985, month: 6, day: 6, hour: 12, gender: "男" },
];

describe("calendar engine", () => {
  it("computes calendar for solar dates", () => {
    const r = computeCalendar({ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15 });
    expect(r.shengXiao).toBeTruthy();
    expect(r.ganZhiYear).toHaveLength(2);
  });

  it("returns almanac", () => {
    const a = getAlmanacForDate(new Date("2024-01-01"));
    expect(a.yi).toBeDefined();
    expect(a.ji).toBeDefined();
  });
});

describe("bazi engine", () => {
  samples.forEach((s, i) => {
    it(`computes bazi sample ${i + 1}`, () => {
      const r = computeBazi({ calendarType: "solar", ...s });
      expect(r.dayMaster).toBeTruthy();
      expect(r.elementCount).toHaveProperty("金");
      expect(r.yongShen?.usefulGods.length).toBeGreaterThan(0);
      expect(["偏旺", "偏弱", "中和"]).toContain(r.strength);
    });
  });

  it("applies true solar time when longitude set", () => {
    const base = computeBazi({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 23,
      minute: 10,
    });
    const west = computeBazi({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 23,
      minute: 10,
      longitude: 87.6,
      location: "乌鲁木齐",
    });
    expect(west.trueSolarApplied).toBe(true);
    expect(west.trueSolarNote).toContain("真太阳时");
    // 西边经度修正可能改变时柱
    expect(west.ganZhiTime).toBeTruthy();
    expect(base.ganZhiDay).toBeTruthy();
  });

  it("scores dayun against yongshen", async () => {
    const { computeBaziDayun } = await import("@/lib/engine/bazi");
    const r = computeBaziDayun({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      gender: "男",
    });
    expect(r.daYun[0].yongShenLabel).toMatch(/吉|平|凶/);
    expect(r.liuNian[0].yongShenScore).toBeGreaterThan(0);
  });
});

describe("chenggu engine", () => {
  it("computes bone weight", () => {
    const r = computeChenggu({ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15 });
    expect(r.totalWeight).toBeGreaterThan(0);
    expect(r.song).toBeTruthy();
  });
});

describe("zodiac engine", () => {
  it("computes zodiac", () => {
    const r = computeZodiac({ calendarType: "solar", year: 1990, month: 5, day: 15 });
    expect(r.zodiac).toBe("马");
  });

  it("relation scoring", () => {
    const r = getZodiacRelation("鼠", "牛");
    expect(r.type).toBe("六合");
    expect(r.score).toBeGreaterThan(80);
  });
});

describe("name engine", () => {
  it("computes wuge", () => {
    const r = computeNameWuge("张三", 1);
    expect(r.grids.renGe.value).toBeGreaterThan(0);
    expect(r.totalScore).toBeGreaterThan(0);
  });
});

describe("word engine", () => {
  it("computes word divination", () => {
    const r = computeWordDivination("福", "事业");
    expect(r.analysis.length).toBeGreaterThan(0);
  });
});

describe("match engine", () => {
  it("computes matchmaking", () => {
    const a = { calendarType: "solar" as const, year: 1990, month: 5, day: 15, hour: 15 };
    const b = { calendarType: "solar" as const, year: 1992, month: 8, day: 14, hour: 21, gender: "女" };
    const r = computeMatchmaking(a, b);
    expect(r.scores.total).toBeGreaterThan(0);
    expect(r.scores.total).toBeLessThanOrEqual(100);
    expect(r.scores.spousePalace).toBeGreaterThan(0);
    expect(r.scores.yongShenCross).toBeGreaterThan(0);
    expect(r.scores.naYin).toBeGreaterThan(0);
    expect(r.scores.ziweiSpouse).toBeGreaterThan(0);
    expect(r.personA.dayNaYin).toBeTruthy();
    expect(r.spousePalaceRelation.type).toBeTruthy();
    expect(r.sihuaCompare?.notes?.length).toBeGreaterThan(0);
    expect(r.sihuaCompare?.summary).toBeTruthy();
  });
});

describe("name kangxi strokes", () => {
  it("marks naming override for 华", () => {
    const r = computeNameWuge("张华", 1);
    expect(r.charStrokes.find((c) => c.char === "华")?.stroke).toBe(14);
    expect(r.charStrokes.find((c) => c.char === "华")?.source).toBe("naming_override");
    expect(r.kangxiApplied).toContain("华");
  });

  it("loads kangxi full dict for common chars", () => {
    const r = computeNameWuge("永明", 1);
    const yong = r.charStrokes.find((c) => c.char === "永");
    expect(yong?.source).toMatch(/kangxi_dict|table/);
    expect(yong?.stroke).toBeGreaterThan(0);
  });

  it("analyzes sancai and stages", () => {
    const r = computeNameWuge("张浩然", 1);
    expect(r.sancai.config).toHaveLength(3);
    expect(r.sancai.luck).toMatch(/吉|平|凶/);
    expect(r.lifeStages.mid).toContain("人格");
    expect(r.totalScore).toBeGreaterThan(20);
  });

  it("links yongshen when birth provided", () => {
    const r = computeNameWuge("张浩然", {
      surnameLen: 1,
      birth: { calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15, gender: "男" },
    });
    expect(r.yongShenFit?.usefulGods?.length).toBeGreaterThan(0);
  });
});

describe("naming suggestions", () => {
  it("ranks full names with meanings", async () => {
    const { suggestNaming } = await import("@/lib/engine/name-wuge");
    const r = suggestNaming({
      surname: "张",
      gender: "男",
      givenLen: 2,
      count: 6,
      birth: { calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15, gender: "男" },
    });
    expect(r.candidates.length).toBeGreaterThanOrEqual(4);
    expect(r.candidates[0].fullName.startsWith("张")).toBe(true);
    expect(r.candidates[0].score).toBeGreaterThan(0);
    expect(r.candidates[0].meanings.length).toBe(2);
    expect(r.baziHint).toContain("日主");
  });
});

describe("almanac bazi link", () => {
  it("scores day against yongshen when profile present", async () => {
    const { computeAlmanac } = await import("@/lib/engine/almanac");
    const r = computeAlmanac("2024-06-01", {
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      gender: "男",
    });
    expect(r.ganZhiDay).toHaveLength(2);
    expect(r.yongShenDay?.yongShenLabel).toMatch(/吉|平|凶/);
    expect(r.upcomingPicks?.length).toBeGreaterThan(0);
  });
});

describe("module registry", () => {
  it("has 31 modules all implemented", async () => {
    const { MODULE_DEFINITIONS } = await import("@/lib/hub/module-registry");
    expect(MODULE_DEFINITIONS.length).toBe(31);
    expect(MODULE_DEFINITIONS.every((m) => m.implemented)).toBe(true);
  });
});

describe("bazi detailed reading", () => {
  it("includes love wealth health sections", async () => {
    const { computeBaziWithReading } = await import("@/lib/engine/bazi");
    const { renderTemplateReport } = await import("@/lib/report/template-renderer");
    const r = computeBaziWithReading({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      gender: "男",
    });
    expect((r.sections ?? []).length).toBeGreaterThan(7);
    const report = renderTemplateReport("bazi", r as unknown as Record<string, unknown>);
    expect(report).toContain("感情姻缘");
    expect(report).toContain("财运分析");
    expect(report).toContain("健康调养");
    expect(report.length).toBeGreaterThan(500);
  });
});

describe("enriched readings for beginners", () => {
  it("chenggu has beginner guide and sections", async () => {
    const { computeChenggu } = await import("@/lib/engine/chenggu");
    const { enrichModuleFacts } = await import("@/lib/engine/enrich-readings");
    const { renderTemplateReport } = await import("@/lib/report/template-renderer");
    const raw = computeChenggu({ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15 });
    const facts = enrichModuleFacts("chenggu", raw as unknown as Record<string, unknown>);
    expect((facts.sections as unknown[])[0]).toMatchObject({ title: "小白导读" });
    const report = renderTemplateReport("chenggu", facts);
    expect(report).toContain("事业运势");
    expect(report).toContain("财运分析");
    expect(report.length).toBeGreaterThan(350);
  });

  it("match has pairing advice", async () => {
    const { enrichModuleFacts } = await import("@/lib/engine/enrich-readings");
    const { computeMatchmaking } = await import("@/lib/engine/matchmaking");
    const a = { calendarType: "solar" as const, year: 1990, month: 5, day: 15, hour: 15 };
    const b = { calendarType: "solar" as const, year: 1992, month: 8, day: 14, hour: 21 };
    const facts = enrichModuleFacts("match", computeMatchmaking(a, b) as unknown as Record<string, unknown>);
    const titles = (facts.sections as Array<{ title: string }>).map((s) => s.title);
    expect(titles).toContain("相处建议");
    expect(titles).toContain("小白导读");
    expect(titles).toContain("双方四化对照");
    const career = (facts.sections as Array<{ title: string; content: string }>).find(
      (s) => s.title === "事业合作"
    );
    expect(career?.content).toMatch(/喜用|总分/);
  });

  it("yijing gets beginner guide prepended", async () => {
    const { computeYijing } = await import("@/lib/engine/yijing");
    const { enrichModuleFacts } = await import("@/lib/engine/enrich-readings");
    const facts = enrichModuleFacts("yijing", computeYijing("事业") as unknown as Record<string, unknown>);
    expect((facts.sections as Array<{ title: string }>)[0].title).toBe("小白导读");
  });
});

describe("divination detail reports", () => {
  it("yijing returns detailed sections", async () => {
    const { computeYijing } = await import("@/lib/engine/yijing");
    const { renderTemplateReport } = await import("@/lib/report/template-renderer");
    const facts = computeYijing("事业") as unknown as Record<string, unknown>;
    expect((facts.sections as unknown[]).length).toBeGreaterThan(8);
    const report = renderTemplateReport("yijing", facts);
    expect(report).toContain("卦辞");
    expect(report).toContain("象辞");
    expect(report.length).toBeGreaterThan(300);
  });

  it("liuyao includes line details", async () => {
    const { computeLiuyao } = await import("@/lib/engine/yijing");
    const { renderTemplateReport } = await import("@/lib/report/template-renderer");
    const facts = computeLiuyao("财运") as unknown as Record<string, unknown>;
    const report = renderTemplateReport("liuyao", facts);
    expect(report).toContain("六爻详情");
    expect(report).toContain("变卦");
  });

  it("lingqian has career and wealth sections", async () => {
    const { computeLingqian } = await import("@/lib/engine/lingqian");
    const { renderTemplateReport } = await import("@/lib/report/template-renderer");
    const facts = computeLingqian() as unknown as Record<string, unknown>;
    const report = renderTemplateReport("lingqian", facts);
    expect(report).toContain("事业");
    expect(report).toContain("财运");
  });
});

describe("P2/P3 engines", () => {
  const profile = { calendarType: "solar" as const, year: 1990, month: 5, day: 15, hour: 15, gender: "男" };

  it("heluo", async () => {
    const { computeHeluo } = await import("@/lib/engine/heluo-qizheng");
    expect(computeHeluo(profile).mingGua).toBeTruthy();
  });

  it("qimen", async () => {
    const { computeQimen } = await import("@/lib/engine/qimen-daliuren");
    expect(computeQimen("事业").gate).toBeTruthy();
  });

  it("fengshui", async () => {
    const { computeFengshui } = await import("@/lib/engine/fengshui");
    const r = computeFengshui(profile, { facing: "南", houseYear: 2024 });
    expect(r.mingGua).toContain("卦");
    expect(r.facing).toBe("南");
    expect(r.feixingSummary).toBeTruthy();
    expect(r.nianPan?.length).toBeGreaterThan(0);
  });

  it("numerology", async () => {
    const { computeNumerology } = await import("@/lib/engine/numerology");
    expect(computeNumerology(profile).lifePathNumber).toBeGreaterThan(0);
  });

  it("mbti", async () => {
    const { computeMbtiMatch } = await import("@/lib/engine/mbti");
    const r = computeMbtiMatch("INTJ", "ENFP");
    expect(r.score).toBeGreaterThan(0);
  });
});

describe("deepened algorithms", () => {
  const fixedDate = new Date("2024-06-15T14:30:00");

  it("yijing is deterministic for same time and question", async () => {
    const { computeYijing } = await import("@/lib/engine/yijing");
    const a = computeYijing("事业", fixedDate);
    const b = computeYijing("事业", fixedDate);
    expect(a.hexagram).toBe(b.hexagram);
  });

  it("liuyao derives hex from coin lines", async () => {
    const { computeLiuyao } = await import("@/lib/engine/yijing");
    const r = computeLiuyao("财运", fixedDate);
    expect(r.lines).toHaveLength(6);
    expect(r.benGua).toBeTruthy();
    expect(r.bianGua).toBeTruthy();
  });

  it("xiaoliuren uses hour branch", async () => {
    const { computeXiaoliuren } = await import("@/lib/engine/yijing");
    const r = computeXiaoliuren("问事", fixedDate);
    expect(r.hourZhi).toBeTruthy();
    expect(["大安", "留连", "速喜", "赤口", "小吉", "空亡"]).toContain(r.gong);
  });

  it("qimen uses sanyuan plate", async () => {
    const { computeQimen } = await import("@/lib/engine/qimen-daliuren");
    const r = computeQimen("事业", fixedDate);
    expect(r.yuan).toBeTruthy();
    expect(r.ju).toMatch(/局/);
    expect((r.plate as unknown[]).length).toBe(9);
  });

  it("daliuren uses shenjiang", async () => {
    const { computeDaliuren } = await import("@/lib/engine/qimen-daliuren");
    const r = computeDaliuren("问事", fixedDate);
    expect(r.dayGanZhi).toHaveLength(2);
    expect((r.shenJiang as unknown[]).length).toBe(12);
    expect(r.timeDunGan).toBeTruthy();
    expect(r.monthJiang).toBeTruthy();
    expect(r.siKe[0].desc).toContain("上");
  });

  it("ziwei has sihua and auxiliary stars", async () => {
    const { computeZiwei } = await import("@/lib/engine/ziwei");
    const r = computeZiwei({ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15, gender: "男" });
    expect(r.stars.length).toBe(14);
    expect((r.auxiliaryStars as unknown[]).length).toBeGreaterThan(10);
    expect((r.siHua as unknown[]).length).toBe(4);
    expect((r.daXian as unknown[]).length).toBe(12);
    expect((r.palaces as unknown[]).length).toBe(12);
    const bright = (r.stars as Array<{ brightness: string }>).map((s) => s.brightness);
    expect(bright.some((b) => b !== "平")).toBe(true);
  });

  it("liuyao includes najia liuqin", async () => {
    const { computeLiuyao } = await import("@/lib/engine/yijing");
    const r = computeLiuyao("事业");
    expect(r.liuQin.装卦).toContain("世");
    expect((r.yaoDetail as unknown[]).length).toBe(6);
  });

  it("ai fact digest stays compact", async () => {
    const { buildAiFactDigest } = await import("@/lib/ai/fact-digest");
    const digest = buildAiFactDigest("bazi", {
      dayMaster: "庚",
      strength: "偏弱",
      ganZhiDay: "庚辰",
      yongShen: { usefulGods: ["土", "金"], avoidGods: ["木"], summary: "测试" },
    });
    expect(digest).toContain("喜用神");
    expect(digest.length).toBeLessThan(2000);
  });

  it("vedic uses lahiri ayanamsa", async () => {
    const { computeVedic } = await import("@/lib/engine/vedic");
    const r = computeVedic({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      longitude: 121.5,
      latitude: 31.2,
    });
    expect(r.ayanamsa).toBeTruthy();
    expect(r.moonDegree).toBeTruthy();
    expect(r.dashaRemainingYears).toBeGreaterThan(0);
    expect(r.lagnaCn).toBeTruthy();
    expect((r.planets as unknown[]).length).toBeGreaterThanOrEqual(7);
  });

  it("qizheng lists seven luminaries", async () => {
    const { computeQizheng } = await import("@/lib/engine/heluo-qizheng");
    const r = computeQizheng({ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15 });
    expect((r.planetPositions as unknown[]).length).toBe(9);
  });

  it("bazi reverse lookup returns candidates", async () => {
    const { resolveBaziFromPillars } = await import("@/lib/engine/bazi");
    const r = resolveBaziFromPillars("庚午-辛巳-庚辰-癸未");
    expect(r.candidates.length).toBeGreaterThan(0);
    expect(r.candidates[0].solarDate).not.toBe("—");
  });

  it("tarot and lingqian are reproducible with same seed", async () => {
    const { computeTarot } = await import("@/lib/engine/tarot");
    const { computeLingqian } = await import("@/lib/engine/lingqian");
    const a = computeTarot("事业", 3, 12345);
    const b = computeTarot("事业", 3, 12345);
    expect(a.cards.map((c) => c.name).join(",")).toBe(b.cards.map((c) => c.name).join(","));
    const l1 = computeLingqian("求签", 777);
    const l2 = computeLingqian("求签", 777);
    expect(l1.number).toBe(l2.number);
  });

  it("ziwei has liuYue liuRi and expanded aux stars", async () => {
    const { computeZiwei } = await import("@/lib/engine/ziwei");
    const r = computeZiwei({ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15, gender: "男" });
    expect(r.liuYue?.palace).toBeTruthy();
    expect(r.liuRi?.palace).toBeTruthy();
    expect(r.auxiliaryStars.some((a) => a.star === "红鸾")).toBe(true);
  });

  it("bazi exposes shenSha and geJu", async () => {
    const { computeBazi } = await import("@/lib/engine/bazi");
    const r = computeBazi({ calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15, gender: "男" });
    expect(r.geJu?.name).toBeTruthy();
    expect(Array.isArray(r.shenSha)).toBe(true);
  });

  it("qimen plate has zhiFu zhiShi kongWang", async () => {
    const { computeQimen } = await import("@/lib/engine/qimen-daliuren");
    const r = computeQimen("问财运", new Date("2024-06-01T10:00:00"));
    expect(r.zhiFu).toBeTruthy();
    expect(r.zhiShi).toBeTruthy();
    expect(r.kongWang).toBeTruthy();
  });

  it("vedic uses astronomy-engine ephemeris note", async () => {
    const { EPHEMERIS_NOTE } = await import("@/lib/engine/vedic/astro");
    expect(EPHEMERIS_NOTE).toContain("astronomy-engine");
  });
});

describe("engine phase-2 deepen", () => {
  it("ziwei feixing edges and 12 palace stems", async () => {
    const { computeZiwei } = await import("@/lib/engine/ziwei");
    const r = computeZiwei({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      gender: "男",
    });
    expect(r.palaceStems).toHaveLength(12);
    expect(r.feiXing.length).toBeGreaterThan(0);
    expect(r.feiXing.some((e: { hua: string }) => ["禄", "权", "科", "忌"].includes(e.hua))).toBe(true);
  });

  it("bazi geju success and break factors", async () => {
    const { computeGeJu } = await import("@/lib/engine/bazi/geju");
    const okGuan = computeGeJu({
      dayGan: "甲",
      monthZhi: "酉",
      yearGan: "癸",
      monthGan: "辛",
      timeGan: "乙",
    });
    expect(okGuan.name).toBe("正官格");
    expect(okGuan.successFactors.some((s) => s.includes("官印"))).toBe(true);

    const okSha = computeGeJu({
      dayGan: "甲",
      monthZhi: "申",
      yearGan: "癸",
      monthGan: "庚",
      timeGan: "乙",
    });
    expect(okSha.name).toBe("七杀格");
    expect(okSha.successFactors.some((s) => s.includes("杀印"))).toBe(true);

    const breakGuan = computeGeJu({
      dayGan: "甲",
      monthZhi: "酉",
      yearGan: "丁",
      monthGan: "辛",
      timeGan: "乙",
    });
    expect(breakGuan.breakFactors.some((s) => s.includes("伤官"))).toBe(true);

    const breakShi = computeGeJu({
      dayGan: "甲",
      monthZhi: "巳",
      yearGan: "壬",
      monthGan: "丙",
      timeGan: "乙",
    });
    expect(breakShi.name).toBe("食神格");
    expect(breakShi.breakFactors.some((s) => s.includes("枭"))).toBe(true);
  });

  it("bazi shensha includes tianDe yueDe huaGai rules", async () => {
    const { computeShenSha } = await import("@/lib/engine/bazi/shensha");
    const items = computeShenSha({
      yearGanZhi: "甲寅",
      monthGanZhi: "丙寅",
      dayGanZhi: "戊午",
      timeGanZhi: "丁巳",
    });
    const names = items.map((i) => i.name);
    expect(names.some((n) => ["天德", "月德", "华盖", "天乙贵人", "文昌", "驿马", "桃花"].includes(n))).toBe(true);
  });

  it("qimen plate has diGan tianGan jiGong maXing", async () => {
    const { computeQimen } = await import("@/lib/engine/qimen-daliuren");
    const r = computeQimen("问财运", new Date("2024-06-01T10:00:00"));
    expect(r.jiGong).toContain("寄");
    expect(r.maXing).toBeTruthy();
    const withGan = r.plate.filter((p: { diGan?: string; tianGan?: string }) => p.diGan && p.tianGan);
    expect(withGan.length).toBeGreaterThanOrEqual(8);
  });

  it("daliuren takeMethod is always recorded", async () => {
    const { computeDaliuren } = await import("@/lib/engine/qimen-daliuren");
    const r = computeDaliuren("测事", new Date("2024-03-15T14:30:00"));
    expect(r.takeMethod).toBeTruthy();
    expect(r.takeMethod.length).toBeGreaterThan(1);
    expect(r.sanChuan[0].meaning).toBeTruthy();
    expect(r.shenJiang).toHaveLength(12);
  });

  it("liuyao changing lines get 动爻细读 section", async () => {
    const { computeLiuyao } = await import("@/lib/engine/yijing");
    const r = computeLiuyao("问事", new Date("2024-01-01"), [9, 7, 8, 7, 8, 7]);
    const titles = r.sections.map((s: { title: string }) => s.title);
    expect(titles).toContain("动爻细读");
    expect(r.lineAnalysis).toContain("初爻");
  });

  it("asc longitude and rashi do not throw", async () => {
    const { approximateLagna, approximateLagnaLongitude, julianDay } = await import(
      "@/lib/engine/vedic/astro"
    );
    const jd = julianDay(1990, 5, 15, 7);
    const lon = approximateLagnaLongitude(jd, 121.5, 31.2);
    const rashi = approximateLagna(jd, 121.5, 31.2);
    expect(lon).toBeGreaterThanOrEqual(0);
    expect(lon).toBeLessThan(360);
    expect(rashi).toBeGreaterThanOrEqual(0);
    expect(rashi).toBeLessThan(12);
  });
});

describe("engine phase-3 deepen", () => {
  it("ziwei has liuyue/liuri sihua and extra aux stars", async () => {
    const { computeZiwei } = await import("@/lib/engine/ziwei");
    const r = computeZiwei({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      gender: "男",
    });
    expect(r.liuYueSiHua?.length).toBeGreaterThan(0);
    expect(r.liuRiSiHua?.length).toBeGreaterThan(0);
    expect(r.feiXingClash).toBeTruthy();
    expect(r.auxiliaryStars.some((a: { star: string }) => a.star === "天哭")).toBe(true);
    expect(r.auxiliaryStars.some((a: { star: string }) => a.star === "三台")).toBe(true);
  });

  it("liuyao jingfang shi-ying and fuShen section", async () => {
    const { computeLiuyao } = await import("@/lib/engine/yijing");
    const r = computeLiuyao("问事", new Date("2024-01-01"), [7, 7, 7, 7, 7, 7]);
    expect(r.gongPalace).toBeTruthy();
    expect(r.gongRole).toBeTruthy();
    expect(r.shiYao).toBeGreaterThanOrEqual(1);
    expect(r.yingYao).toBeGreaterThanOrEqual(1);
    expect(r.sections.some((s: { title: string }) => s.title === "伏神与冲合")).toBe(true);
  });

  it("bazi dayun includes geJu labels and tongGen", async () => {
    const { computeBazi, computeBaziDayun } = await import("@/lib/engine/bazi");
    const b = computeBazi({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      gender: "男",
    });
    expect(b.tongGen?.summary).toBeTruthy();
    const d = computeBaziDayun({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      gender: "男",
    });
    expect(d.daYun[0].geJuLabel).toBeTruthy();
    expect(d.liuNian[0].geJuReason).toBeTruthy();
  });

  it("qimen detects menPo or jiXing fields", async () => {
    const { computeQimen } = await import("@/lib/engine/qimen-daliuren");
    const r = computeQimen("问官运", new Date("2024-06-01T10:00:00"));
    expect(Array.isArray(r.menPo)).toBe(true);
    expect(Array.isArray(r.jiXing)).toBe(true);
    expect(r.sections.some((s: { title: string }) => s.title === "八神")).toBe(true);
  });

  it("daliuren shenjiang section has meanings", async () => {
    const { computeDaliuren } = await import("@/lib/engine/qimen-daliuren");
    const r = computeDaliuren("测事", new Date("2024-03-15T14:30:00"));
    const shen = r.sections.find((s: { title: string }) => s.title === "神将");
    expect(shen?.content).toContain("贵人");
    expect(r.sections.find((s: { title: string }) => s.title === "断语")?.content).toContain("取传法");
  });

  it("vedic planets expose retrograde flag", async () => {
    const { computeVedic } = await import("@/lib/engine/vedic");
    const r = computeVedic({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      longitude: 121.5,
      latitude: 31.2,
    });
    expect(r.planets.every((p: { retrograde?: boolean }) => typeof p.retrograde === "boolean")).toBe(
      true
    );
  });
});

describe("engine phase-4 face palm tiepan hehun", () => {
  it("bazi career section cites geju and yongshen", async () => {
    const { computeBaziWithReading } = await import("@/lib/engine/bazi");
    const r = computeBaziWithReading({
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 15,
      gender: "男",
    });
    const career = r.sections?.find((s) => s.title === "事业运势");
    expect(career?.content).toMatch(/格局|喜用/);
    const wealth = r.sections?.find((s) => s.title === "财运分析");
    expect(wealth?.content).toMatch(/日主|成格|破格|喜用/);
  });

  it("qimen wealth cites yongshen palace", async () => {
    const { computeQimen } = await import("@/lib/engine/qimen-daliuren");
    const r = computeQimen("问财运", new Date("2024-06-01T10:00:00"));
    const wealth = r.sections.find((s: { title: string }) => s.title === "财运");
    expect(wealth?.content).toContain("用神");
  });

  it("daliuren career cites takeMethod", async () => {
    const { computeDaliuren } = await import("@/lib/engine/qimen-daliuren");
    const r = computeDaliuren("测事", new Date("2024-03-15T14:30:00"));
    const career = r.sections.find((s: { title: string }) => s.title === "事业");
    expect(career?.content).toContain("取传");
  });
});

describe("admin insights (internal only)", () => {
  it("builds timeline liuqin career without claiming current job", async () => {
    const { buildBaziAdminInsights, stripAdminInsights } = await import(
      "@/lib/engine/bazi/admin-insights"
    );
    const insights = buildBaziAdminInsights({
      dayMasterElement: "火",
      tenGods: ["正财", "正官", "比肩", "食神"],
      usefulGods: ["木", "火"],
      avoidGods: ["金"],
      geJuName: "正财格",
      gender: "男",
      daYunList: [
        {
          ganZhi: "甲寅",
          startYear: 2020,
          endYear: 2029,
          startAge: 30,
          yongShenLabel: "吉",
        },
      ],
      liuNianList: [{ year: 2026, ganZhi: "丙午", age: 36, yongShenLabel: "平" }],
    });
    expect(insights.timeline.length).toBeGreaterThan(0);
    expect(insights.liuqin.some((q) => q.relation === "配偶")).toBe(true);
    expect(insights.careerHint.currentJobDetectable).toBe(false);
    expect(insights.careerHint.industries.length).toBeGreaterThan(0);
    const stripped = stripAdminInsights({ summary: "ok", adminInsights: insights });
    expect(stripped.adminInsights).toBeUndefined();
    expect(stripped.summary).toBe("ok");
  });

  it("face/palm themes merge with birth insights when provided", async () => {
    const { buildBaziAdminInsights } = await import("@/lib/engine/bazi/admin-insights");
    const { buildFacePalmAdminInsights } = await import("@/lib/engine/face-palm/admin-insights");
    const birth = buildBaziAdminInsights({
      dayMasterElement: "木",
      usefulGods: ["水", "木"],
      gender: "女",
      daYunList: [{ ganZhi: "壬寅", startYear: 2024, endYear: 2033, startAge: 28, yongShenLabel: "吉" }],
      liuNianList: [{ year: 2026, ganZhi: "丙午", age: 30, yongShenLabel: "平" }],
    });
    const onlyPalm = buildFacePalmAdminInsights({
      module: "palm",
      features: ["感情线深长", "事业线清晰"],
    });
    expect(onlyPalm.timeline.length).toBeGreaterThan(0);
    expect(onlyPalm.disclaimer).toContain("面相手相");

    const merged = buildFacePalmAdminInsights({
      module: "face",
      features: ["印堂饱满", "鼻梁挺直"],
      birthInsights: birth,
    });
    expect(merged.timeline.some((t) => t.note.includes("相学补充"))).toBe(true);
    expect(merged.disclaimer).toContain("出生盘");
    expect(merged.careerHint.currentJobDetectable).toBe(false);
  });
});
