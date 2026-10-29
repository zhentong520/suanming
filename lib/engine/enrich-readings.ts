import {
  MODULE_INTROS,
  ReadingSection,
  levelAdvice,
  prependGuideIfMissing,
  scoreLabel,
  withBeginnerGuide,
} from "./shared/reading";
import {
  heluoGuaReading,
  lifeDomainsByElement,
  lifeDomainsBySignLevel,
  palaceDeepReading,
  qizhengStarReading,
  questionContextBlock,
  synthesizeActionGuide,
  vedicLifeReading,
} from "./shared/deep-sections";
import { interpretSiHuaFlying, interpretKeyPalaceHua } from "./ziwei/sihua-reading";
import type { Locale } from "@/lib/i18n/config";
import { localizeSectionTitle, translateKey } from "@/lib/i18n/get-dictionary";

type Facts = Record<string, unknown>;

function enrichChenggu(f: Facts): Facts {
  const level = String(f.level ?? "中等");
  const domains = lifeDomainsBySignLevel(level);
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.chenggu, [
    {
      title: "骨重结果",
      content: `总骨重：${f.totalWeightStr}\n等级：${level}\n（年${f.yearWeight} + 月${f.monthWeight} + 日${f.dayWeight} + 时${f.hourWeight}）\n\n骨重越重未必越好，关键在歌诀吉凶与整体解读。`,
    },
    { title: "歌诀", content: String(f.song) },
    { title: "命运总论", content: String(f.summary) },
    { title: "事业运势", content: domains.career },
    { title: "财运分析", content: domains.wealth },
    { title: "感情姻缘", content: domains.love },
    { title: "健康调养", content: domains.health },
    { title: "综合建议", content: levelAdvice(level) },
  ]);
  return { ...f, sections, summary: `${f.totalWeightStr}（${level}）${f.summary}` };
}

function enrichZodiac(f: Facts): Facts {
  const el = String(f.element ?? "土").replace(/[^金木水火土]/g, "") || "土";
  const domains = lifeDomainsByElement(el);
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.zodiac, [
    {
      title: "你的生肖",
      content: `生肖：${f.zodiac}\n五行倾向：${f.element}\n${f.isTaiSui ? "⚠ 今年值太岁，宜谨慎行事、避免重大变动，可穿红、行善化解。" : "今年未值太岁，可按常规规划。"}`,
    },
    { title: "性格特点", content: String(f.traits) },
    { title: "今年运势", content: String(f.fortune) },
    {
      title: "吉利提示",
      content: `吉利：${(f.lucky as string[]).join("、")}\n需留意：${(f.unlucky as string[]).join("、")}`,
    },
    { title: "属相关系", content: String(f.relations) },
    { title: "事业运势", content: `${String(f.fortune)}\n\n${domains.career}` },
    { title: "财运分析", content: domains.wealth },
    { title: "感情姻缘", content: domains.love },
    { title: "健康调养", content: domains.health },
  ]);
  return { ...f, sections, summary: `${f.zodiac}生肖：${f.traits} ${f.fortune}` };
}

function enrichName(f: Facts): Facts {
  const grids = f.grids as Record<string, { value: number; luck: string; desc: string; element: string }>;
  const charStrokes = (f.charStrokes as Array<{ char: string; stroke: number; source: string }>) ?? [];
  const sancai = f.sancai as { config: string; luck: string; desc: string; score: number } | undefined;
  const yong = f.yongShenFit as { desc: string; usefulGods?: string[]; avoidGods?: string[] } | null | undefined;
  const life = f.lifeStages as { early: string; mid: string; late: string } | undefined;
  const gridExplain =
    "天格=姓氏运（家族）\n人格=主运（性格核心，最重要）\n地格=前运（约36岁前）\n外格=副运（社交印象）\n总格=后运（整体结果）\n三才=天→人→地的五行配置";
  const gridDetail = Object.entries(grids)
    .map(([k, v]) => {
      const label =
        k === "tianGe" ? "天格" : k === "renGe" ? "人格" : k === "diGe" ? "地格" : k === "waiGe" ? "外格" : "总格";
      return `${label}：${v.value}（${v.luck}·${v.element}）\n  ${v.desc}`;
    })
    .join("\n\n");
  const strokeDetail = charStrokes
    .map((c) => {
      const src =
        c.source === "naming_override"
          ? "姓名学差异"
          : c.source === "kangxi_dict"
            ? "康熙字典"
            : c.source === "table"
              ? "笔画表"
              : "估算待核";
      return `${c.char} ${c.stroke}画（${src}）`;
    })
    .join(" · ");

  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.name, [
    { title: "五格与三才", content: gridExplain },
    {
      title: "笔画校验",
      content: `标准：${f.strokeStandard ?? "康熙优先"}\n${strokeDetail || "—"}\n${f.verificationNote ?? ""}`,
    },
    {
      title: "综合评分",
      content: `姓名：${f.name}\n综合：${f.totalScore}分\n${sancai ? `三才：${sancai.config}（${sancai.luck}·${sancai.score}分）\n${sancai.desc}` : ""}`,
    },
    { title: "五格详解", content: gridDetail },
    {
      title: "人格解读（重点）",
      content: `人格${grids.renGe.value}（${grids.renGe.luck}）：${grids.renGe.desc}\n这是姓名中最重要的格，主性格与核心运势。`,
    },
    ...(life
      ? [
          {
            title: "人生阶段",
            content: `${life.early}\n${life.mid}\n${life.late}`,
          },
        ]
      : []),
    ...(yong
      ? [
          {
            title: "八字喜用对照",
            content: `${yong.desc}\n喜用：${(yong.usefulGods ?? []).join("、") || "—"}\n忌神：${(yong.avoidGods ?? []).join("、") || "—"}`,
          },
        ]
      : [
          {
            title: "八字喜用对照",
            content: "未绑定档案时仅评数理。到「我的档案」选择出生信息后重测，可对照喜用神。",
          },
        ]),
    {
      title: "事业财运",
      content: `总格${grids.zongGe.luck}——${grids.zongGe.desc}\n外格影响人缘机遇：${grids.waiGe.luck}——${grids.waiGe.desc}`,
    },
    {
      title: "感情健康",
      content: `地格主早年与家庭：${grids.diGe.luck}——${grids.diGe.desc}\n天格与家族氛围：${grids.tianGe.luck}——${grids.tianGe.desc}`,
    },
    { title: "综合建议", content: String(f.summary) },
  ]);
  return { ...f, sections, summary: String(f.summary) };
}

function enrichNaming(f: Facts): Facts {
  const candidates = (f.candidates as Array<{
    fullName: string;
    score: number;
    reason: string;
    meanings: string[];
    sancai: string;
    gridsSummary: string;
  }>) ?? [];
  const list =
    candidates.length > 0
      ? candidates
          .map(
            (c, i) =>
              `${i + 1}. ${c.fullName}（${c.score}分）\n   ${c.reason}\n   ${c.gridsSummary}\n   ${c.meanings.join("；")}`
          )
          .join("\n\n")
      : (f.suggestions as string[]).map((s, i) => `${i + 1}. ${s}`).join("\n");

  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.naming, [
    {
      title: "取名条件",
      content: `姓氏：${f.surname}\n性别：${f.gender ?? "—"}\n名字字数：${f.givenLen ?? 2}\n偏好五行：${f.preferredWuxing}\n八字：${f.baziHint ?? "—"}`,
    },
    { title: "推荐名单（已按数理+三才+喜用排序）", content: list },
    {
      title: "如何最终定名",
      content:
        "1. 优先看人格、总格、三才是否俱吉\n2. 读音顺口，避开不雅谐音\n3. 核对家族辈分与忌讳用字\n4. 喜用神一致更佳，但不必牺牲音义\n5. 全家满意与好记好写同样重要",
    },
    { title: "说明", content: String(f.note) },
  ]);
  const top = candidates[0]?.fullName ?? (f.suggestions as string[])?.[0] ?? "";
  return {
    ...f,
    sections,
    summary: top ? `为「${f.surname}」姓优选：${top}等${candidates.length || (f.suggestions as string[])?.length}个` : String(f.note),
  };
}

function enrichWord(f: Facts): Facts {
  const analysis = f.analysis as Array<{ char: string; radical: string; strokes: number; wuxing: string; hint: string }>;
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.word, [
    {
      title: "测字说明",
      content: `所测：${f.chars}\n所问：${f.question}\n总笔画：${f.totalStrokes}，主导五行：${f.dominantWuxing}`,
    },
    {
      title: "逐字分析",
      content: analysis.map((a) => `「${a.char}」部首${a.radical}，${a.strokes}画，属${a.wuxing}。${a.hint}`).join("\n"),
    },
    { title: "趋势判断", content: String(f.trend) },
    {
      title: "事业财运",
      content:
        f.dominantWuxing === "金" || f.dominantWuxing === "土"
          ? "宜守成积累，稳扎稳打求财。"
          : f.dominantWuxing === "火"
            ? "宜主动争取，短期可见成效。"
            : "宜灵活应变，以智取胜。",
    },
    {
      title: "感情健康",
      content: "测字重象意，感情宜看字中偏旁——如「心」旁多主情感。健康宜结合所问之事，不必过度解读。",
    },
    { title: "综合", content: String(f.summary) },
  ]);
  return { ...f, sections };
}

function enrichAlmanac(f: Facts): Facts {
  const picks = (f.upcomingPicks as Array<{
    date: string;
    ganZhiDay: string;
    yongShenLabel: string;
    fitScore: number;
    note: string;
    personalChong: boolean;
  }>) ?? [];
  const yd = f.yongShenDay as
    | { ganZhiDay: string; yongShenLabel: string; yongShenScore: number; note: string; fitScore: number }
    | undefined;

  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.almanac, [
    {
      title: "日期信息",
      content: `公历：${f.date}\n农历：${f.lunarDate}\n日柱：${f.ganZhiDay ?? "—"}\n生肖日：${f.shengXiao} · 纳音：${f.wuXing}`,
    },
    {
      title: "今日宜",
      content: `${(f.yi as string[]).join("、") || "—"}\n\n宜=适合做的事，可参考安排重要活动、签约、出行、嫁娶等。`,
    },
    {
      title: "今日忌",
      content: `${(f.ji as string[]).join("、") || "—"}\n\n忌=不宜做的事，宜避开或谨慎。`,
    },
    {
      title: "冲煞与彭祖",
      content: `冲煞：${f.chong}\n煞方：${f.sha}\n彭祖百忌：${f.pengZu}`,
    },
    ...((f.jiuXing as { name?: string; nature?: string; tip?: string; note?: string } | undefined)
      ? [
          {
            title: "金符经·日九星（简）",
            content: `今日${(f.jiuXing as { name: string }).name} · 【${(f.jiuXing as { nature: string }).nature}】\n${(f.jiuXing as { tip: string }).tip}\n\n${(f.jiuXing as { note: string }).note}`,
          },
        ]
      : []),
    ...(f.personalHint ? [{ title: "个人生肖提示", content: String(f.personalHint) }] : []),
    ...(yd
      ? [
          {
            title: "八字喜用联动（今日）",
            content: `日柱${yd.ganZhiDay} · 喜用评定【${yd.yongShenLabel}】（${yd.yongShenScore}）· 综合适配${yd.fitScore}\n喜用：${((f.usefulGods as string[]) ?? []).join("、") || "—"}\n忌神：${((f.avoidGods as string[]) ?? []).join("、") || "—"}\n${yd.note}`,
          },
        ]
      : []),
    ...(picks.length
      ? [
          {
            title: "近两周优选日（八字+黄历）",
            content: picks
              .map(
                (p) =>
                  `${p.date} ${p.ganZhiDay} [${p.yongShenLabel}] 适配${p.fitScore}${p.personalChong ? " ·冲生肖" : ""}\n  ${p.note}`
              )
              .join("\n"),
          },
        ]
      : []),
    {
      title: "事业择日",
      content: `宜：${(f.yi as string[]).filter((x) => /开市|签约|求职|上任|祭祀/.test(x)).join("、") || "按常规安排"}\n忌：${(f.ji as string[]).filter((x) => /动土|开仓|破土/.test(x)).join("、") || "无特别忌项"}`,
    },
    {
      title: "婚嫁出行",
      content: `嫁娶、纳采、出行可参考「宜」项与上方优选日；若冲自身生肖，宜改期。`,
    },
    {
      title: "使用建议",
      content: String(f.baziLinkNote ?? "黄历宜作参考，重要决定还需结合实际情况。"),
    },
  ]);
  return {
    ...f,
    sections,
    summary: yd
      ? `${f.date} 日柱${yd.ganZhiDay}【${yd.yongShenLabel}】，宜${(f.yi as string[]).slice(0, 3).join("、")}`
      : `${f.date} 宜${(f.yi as string[]).slice(0, 3).join("、")}，忌${(f.ji as string[]).slice(0, 3).join("、")}`,
  };
}

function enrichMatch(f: Facts): Facts {
  const scores = f.scores as {
    zodiac: number;
    wuxingComplement: number;
    dayMaster: number;
    spousePalace?: number;
    yongShenCross?: number;
    naYin?: number;
    ziweiSpouse?: number;
    sihuaCompare?: number;
    total: number;
  };
  const rel = f.zodiacRelation as { type: string; desc: string };
  const spouse = f.spousePalaceRelation as { type: string; desc: string } | undefined;
  const naYin = f.naYinRelation as { desc: string } | undefined;
  const sihuaCompare = f.sihuaCompare as { summary?: string; notes?: string[]; score?: number } | undefined;
  const a = f.personA as {
    zodiac: string;
    dayMaster: string;
    element: string;
    dayPillar?: string;
    dayNaYin?: string;
    usefulGods?: string[];
    ziweiSpouse?: string;
  };
  const b = f.personB as {
    zodiac: string;
    dayMaster: string;
    element: string;
    dayPillar?: string;
    dayNaYin?: string;
    usefulGods?: string[];
    ziweiSpouse?: string;
  };

  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.match, [
    {
      title: "双方信息",
      content: `A：${a.zodiac} · 日柱${a.dayPillar ?? a.dayMaster}（${a.element}）纳音${a.dayNaYin ?? "—"} 喜用${(a.usefulGods ?? []).join("、") || "—"}\nB：${b.zodiac} · 日柱${b.dayPillar ?? b.dayMaster}（${b.element}）纳音${b.dayNaYin ?? "—"} 喜用${(b.usefulGods ?? []).join("、") || "—"}`,
    },
    {
      title: "综合评分",
      content: `总分：${scores.total}分（${scoreLabel(scores.total)}）\n生肖：${scores.zodiac}\n五行互补：${scores.wuxingComplement}\n日主：${scores.dayMaster}\n夫妻宫：${scores.spousePalace ?? "—"}\n纳音：${scores.naYin ?? "—"}\n喜用交叉：${scores.yongShenCross ?? "—"}\n紫微夫妻/四化：${scores.ziweiSpouse ?? "—"}${scores.sihuaCompare != null ? `（对照${scores.sihuaCompare}）` : ""}`,
    },
    { title: "生肖关系", content: `${rel.type}——${rel.desc}` },
    ...(naYin ? [{ title: "纳音关系", content: naYin.desc }] : []),
    ...(spouse
      ? [{ title: "夫妻宫（日支）", content: `${spouse.type}——${spouse.desc}` }]
      : []),
    {
      title: "配偶星与紫微",
      content: `${f.spouseStarHints ?? "—"}\nA ${a.ziweiSpouse ?? "—"}\nB ${b.ziweiSpouse ?? "—"}`,
    },
    ...(sihuaCompare
      ? [
          {
            title: "双方四化对照",
            content: `${sihuaCompare.summary ?? ""}\n${(sihuaCompare.notes ?? []).join("\n")}`,
          },
        ]
      : []),
    {
      title: "喜用神交叉",
      content: String(f.yongShenHint ?? "—"),
    },
    {
      title: "事业合作",
      content: [
        `基于总分${scores.total}、喜用交叉${scores.yongShenCross ?? "—"}、紫微对照${scores.ziweiSpouse ?? "—"}：`,
        scores.total >= 80 && (scores.yongShenCross ?? 0) >= 70
          ? `双方喜用较契（A喜${(a.usefulGods ?? []).join("、") || "—"} / B喜${(b.usefulGods ?? []).join("、") || "—"}），事业合作可共同规划，建议按专长分工推进。`
          : scores.total >= 60
            ? `合作需明确职责：日主关系与五行互补${scores.wuxingComplement}分，差异处可互补，定期对齐进度。`
            : `事业合伙宜谨慎：冲克或忌神交叉较显，重大合作需书面协议、小步试水。`,
        sihuaCompare?.notes?.find((n) => n.includes("官禄") || n.includes("财帛"))
          ? `四化提示：${sihuaCompare.notes.find((n) => n.includes("官禄") || n.includes("财帛"))}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      title: "财运互动",
      content: [
        `五行互补${scores.wuxingComplement}分；纳音：${naYin?.desc ?? "—"}。`,
        scores.wuxingComplement >= 70
          ? "五行有互补，理财观念可互相学习，宜共同制定财务目标与应急金。"
          : "金钱观或有差异，宜各自管账、大额支出共商，避免情绪化消费。",
        sihuaCompare?.notes?.find((n) => n.includes("财帛"))
          ? `四化财帛：${sihuaCompare.notes.find((n) => n.includes("财帛"))}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    {
      title: "感情相处",
      content: [
        spouse ? `日支夫妻宫：${spouse.type}——${spouse.desc}` : "",
        sihuaCompare?.summary ?? "",
        (scores.spousePalace ?? 60) >= 80
          ? "夫妻宫较合，感情黏合度高，宜共同规划生活仪式。"
          : (scores.spousePalace ?? 60) <= 45
            ? "夫妻宫冲克显，宜制度沟通、减少冷战，重大分歧可引入冷静期。"
            : scores.total >= 60
              ? "有互补也有差异，多理解少指责，把四化忌入的宫位当事务提醒而非互相指责。"
              : "差异较大，需更多耐心磨合，先稳情绪再谈大事。",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    { title: "相处建议", content: (f.details as string[]).join("\n") || "详见分项解读。" },
  ]);
  return { ...f, sections };
}

function enrichBaziDayun(f: Facts): Facts {
  const daYun = f.daYun as Array<{
    ganZhi: string;
    startYear: number;
    endYear: number;
    isCurrent: boolean;
    yongShenLabel?: string;
    yongShenScore?: number;
    yongShenReason?: string;
    advice?: string;
  }>;
  const current = daYun.find((d) => d.isCurrent);
  const yong = f.yongShen as
    | { summary?: string; usefulGods?: string[]; avoidGods?: string[]; usefulTenGodsHint?: string }
    | undefined;
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS["bazi-dayun"], [
    {
      title: "起运信息",
      content: `${f.startAge}岁起运（约${f.startYear}年起）\n日主：${f.dayMaster ?? "—"} · 强弱：${f.strength ?? "—"}${
        f.strengthScore != null ? `（${f.strengthScore}）` : ""
      }\n\n大运与命局喜用交叉判断吉凶。`,
    },
    ...(yong
      ? [
          {
            title: "命局喜用（断运依据）",
            content: `${yong.summary ?? ""}\n喜用：${(yong.usefulGods ?? []).join("、")}\n忌神：${(yong.avoidGods ?? []).join("、") || "无"}\n${yong.usefulTenGodsHint ?? ""}`,
          },
        ]
      : []),
    {
      title: "大运列表（含喜用评分）",
      content: daYun
        .map((d) => {
          const tag = d.yongShenLabel ? `[${d.yongShenLabel}${d.yongShenScore ?? ""}]` : "";
          return `${d.isCurrent ? "▶ " : "  "}${d.ganZhi}（${d.startYear}—${d.endYear}）${tag}${d.isCurrent ? " ← 当前" : ""}`;
        })
        .join("\n"),
    },
    ...(current
      ? [
          {
            title: "当前大运详解",
            content: `您正处于${current.ganZhi}大运（${current.startYear}—${current.endYear}）${
              current.yongShenLabel ? `，喜用评定：${current.yongShenLabel}（${current.yongShenScore}）` : ""
            }。\n${current.yongShenReason ? `依据：${current.yongShenReason}\n` : ""}${current.advice ?? ""}`,
          },
        ]
      : []),
    {
      title: "事业运势",
      content: current?.advice ? `事业侧：${current.advice}` : "结合大运干支与命局喜忌判断事业方向。",
    },
    {
      title: "财运分析",
      content:
        current?.yongShenLabel === "吉"
          ? "喜用大运下财星易发用，可稳健扩大收入，仍忌过高杠杆。"
          : current?.yongShenLabel === "凶"
            ? "忌神大运下宜控开销、防合伙破财与冲动投资。"
            : "大运财运中平，以正财积累为主，流年见财星再择机。",
    },
    {
      title: "感情姻缘",
      content:
        current?.yongShenLabel === "吉"
          ? "运势得助，感情宜主动经营，婚恋节点可择流年吉年。"
          : "关系宜沟通减耗，避免在忌神流年冲动定夺。",
    },
    {
      title: "流年看法",
      content: "流年干支同样按喜用打分：吉年进取，凶年守成。大运定十年基调，流年定当年起伏。",
    },
  ]);
  const liuNian = f.liuNian as
    | Array<{ year: number; ganZhi: string; yongShenLabel?: string; yongShenScore?: number }>
    | undefined;
  if (liuNian?.length) {
    sections.push({
      title: "近年流年（喜用标注）",
      content: liuNian
        .slice(0, 10)
        .map((ln) => `${ln.year}年 ${ln.ganZhi}${ln.yongShenLabel ? ` [${ln.yongShenLabel}${ln.yongShenScore ?? ""}]` : ""}`)
        .join("\n"),
    });
  }
  if (f.trueSolarNote) {
    sections.unshift({ title: "真太阳时", content: String(f.trueSolarNote) });
  }
  return {
    ...f,
    sections,
    summary: yong?.summary
      ? String(yong.summary)
      : current
        ? `当前${current.ganZhi}大运（${current.startYear}—${current.endYear}）`
        : `起运${f.startAge}岁`,
  };
}

function enrichZiwei(f: Facts): Facts {
  const stars = f.stars as Array<{ palace: string; star: string; brightness: string }>;
  const aux = (f.auxiliaryStars as Array<{ star: string; palace: string }>) ?? [];
  const mingPalace = String(f.mingGongPalace ?? "命宫");
  const mingStar = stars.find((s) => s.palace === mingPalace) ?? stars[0];
  const caiStar = stars.find((s) => s.palace === "财帛");
  const fuStar = stars.find((s) => s.palace === "夫妻");
  const guanStar = stars.find((s) => s.palace === "官禄");
  const sihua = (f.siHua as Array<{ star: string; hua: string; palace?: string }>) ?? [];
  const daXian = (f.daXian as Array<{ palace: string; startAge: number; endAge: number; isCurrent?: boolean }>) ?? [];
  const sihuaReading = interpretSiHuaFlying(sihua);

  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.ziwei, [
    {
      title: "核心宫位",
      content: `命宫：${f.mingGong}（最重要，主整体）\n身宫：${f.shenGong}（后天发展）\n五行局：${f.wuXingJu}\n命主：${f.mingZhu} · 身主：${f.shenZhu ?? "—"}`,
    },
    {
      title: "十二宫盘",
      content: Array.isArray(f.palaces)
        ? (f.palaces as Array<{ palace: string; text: string }>)
            .map((p) => `${p.palace}：${p.text}`)
            .join("\n")
        : stars.map((s) => `${s.palace}${s.star}(${s.brightness})`).join(" · "),
    },
    {
      title: "四化飞星详断",
      content: sihuaReading,
    },
    {
      title: "飞星串宫",
      content: String(f.feiXingSummary ?? "飞星待排。"),
    },
    {
      title: "大限/流年/流月流日四化",
      content: (() => {
        const dx = (f.daXianSiHua as Array<{ star: string; hua: string; palace?: string }>) ?? [];
        const ln = (f.liuNianSiHua as Array<{ star: string; hua: string; palace?: string }>) ?? [];
        const ly = (f.liuYueSiHua as Array<{ star: string; hua: string; palace?: string }>) ?? [];
        const lr = (f.liuRiSiHua as Array<{ star: string; hua: string; palace?: string }>) ?? [];
        const fmt = (label: string, arr: typeof dx) =>
          arr.length ? `${label}：${arr.map((s) => `${s.star}化${s.hua}→${s.palace ?? "?"}`).join("、")}` : `${label}待排`;
        return [fmt("大限", dx), fmt("流年", ln), fmt("流月", ly), fmt("流日", lr)].join("\n");
      })(),
    },
    {
      title: "飞星禄忌提示",
      content: String(f.feiXingClash ?? "飞星禄忌提示待排。"),
    },
    {
      title: "十二宫干",
      content: Array.isArray(f.palaceStems)
        ? (f.palaceStems as Array<{ palace: string; ganZhi: string }>)
            .map((p) => `${p.palace}${p.ganZhi}`)
            .join(" · ")
        : "宫干待排",
    },
    {
      title: "关键宫四化",
      content: [
        interpretKeyPalaceHua(sihua, "命宫"),
        interpretKeyPalaceHua(sihua, "财帛"),
        interpretKeyPalaceHua(sihua, "官禄"),
        interpretKeyPalaceHua(sihua, "夫妻"),
      ].join("\n"),
    },
    {
      title: "辅星摘要",
      content: aux.length ? aux.map((a) => `${a.star}在${a.palace}`).join(" · ") : "辅星待排。",
    },
    {
      title: "大限",
      content: daXian.length
        ? daXian
            .filter((d) => d.isCurrent || d.startAge <= 40)
            .slice(0, 6)
            .map((d) => `${d.palace} ${d.startAge}-${d.endAge}岁${d.isCurrent ? "（当前）" : ""}`)
            .join("\n")
        : String(f.currentDaXian ?? "待排"),
    },
    {
      title: "流月流日",
      content: (() => {
        const ly = f.liuYue as {
          lunarMonth?: number;
          palace?: string;
          branch?: string;
          ganZhi?: string;
          siHua?: Array<{ star: string; hua: string }>;
        } | undefined;
        const lr = f.liuRi as {
          lunarDay?: number;
          palace?: string;
          branch?: string;
          ganZhi?: string;
          siHua?: Array<{ star: string; hua: string }>;
        } | undefined;
        if (!ly && !lr) return "流月流日待排。";
        return [
          ly
            ? `流月（农历${ly.lunarMonth}月${ly.ganZhi ? "·" + ly.ganZhi : ""}）落${ly.palace}（${ly.branch}）${ly.siHua?.length ? "，四化" + ly.siHua.map((s) => `${s.star}化${s.hua}`).join("、") : ""}。`
            : "",
          lr
            ? `流日（农历${lr.lunarDay}日${lr.ganZhi ? "·" + lr.ganZhi : ""}）落${lr.palace}（${lr.branch}）${lr.siHua?.length ? "，四化" + lr.siHua.map((s) => `${s.star}化${s.hua}`).join("、") : ""}。`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
      })(),
    },
    {
      title: "命宫主星",
      content: mingStar
        ? `${mingStar.palace}坐${mingStar.star}（${mingStar.brightness}），决定一生基调与性格核心。庙旺得地则发挥顺利，陷地则多波折需借辅星。`
        : "命宫主星需结合完整排盘。",
    },
    {
      title: "事业财运",
      content: `官禄宫：${guanStar ? `${guanStar.star}（${guanStar.brightness}）` : "待细排"}；${interpretKeyPalaceHua(sihua, "官禄")}\n财帛宫：${caiStar ? `${caiStar.star}（${caiStar.brightness}）` : "待细排"}；${interpretKeyPalaceHua(sihua, "财帛")}`,
    },
    {
      title: "感情婚姻",
      content: `夫妻宫：${fuStar ? `${fuStar.star}（${fuStar.brightness}）` : "待细排"}；${interpretKeyPalaceHua(sihua, "夫妻")}`,
    },
    {
      title: "健康疾厄",
      content: `疾厄宫主星：${stars.find((s) => s.palace === "疾厄")?.star ?? "待细排"}。宜结合大运流年看健康起伏，规律作息为要。`,
    },
    palaceDeepReading(stars),
    { title: "说明", content: String(f.caveat ?? "紫微以命宫、四化、大限并参。") },
  ]);
  return { ...f, sections, sihuaReading };
}

function enrichHeluo(f: Facts): Facts {
  const wuxing = String(f.wuxing);
  const gua = String(f.mingGua);
  const domains = heluoGuaReading(gua, wuxing);
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.heluo, [
    {
      title: "命卦结果",
      content: `先天命卦：${gua}卦（五行属${wuxing}）\n后天运卦：${f.houTianGua ?? "—"}（${f.houTianWuXing ?? ""}）\n上卦：${f.upperGua} · 下卦：${f.lowerGua}\n四柱：${f.pillars}\n生肖：${f.shengXiao}`,
    },
    { title: "卦意总论", content: String(f.summary) },
    { title: "性格气质", content: domains.personality },
    { title: "事业运势", content: domains.career },
    { title: "财运分析", content: domains.wealth },
    { title: "感情姻缘", content: domains.love },
    { title: "健康调养", content: domains.health },
    synthesizeActionGuide("河洛理数以命卦定大方向，宜因时顺势，吉年进取、凶年守成。", String(f.caveat)),
  ]);
  return { ...f, sections };
}

function enrichQizheng(f: Facts): Facts {
  const mainStar = String(f.mainStar);
  const house = String(f.mingGong);
  const domains = qizhengStarReading(mainStar, house);
  const planetLines = Array.isArray(f.planetPositions)
    ? (f.planetPositions as Array<{ name: string; rashi: string; degree: string }>)
        .map((p) => `${p.name}：${p.rashi} ${p.degree}°`)
        .join("\n")
    : "";
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.qizheng, [
    {
      title: "星盘概要",
      content: `出生：${f.solarDate}\n地点：${f.location ?? "—"}\n命宫：${house}\n主星：${mainStar} · 辅星：${f.secondaryStar}\n日月：${f.sunRashi ?? "—"}/${f.moonRashi ?? "—"}\n罗睺计都：${f.rahuHouse ?? "—"}/${f.ketuHouse ?? "—"}\n岁差：${f.ayanamsa ?? "—"}°`,
    },
    ...(planetLines ? [{ title: "七政四余位置", content: planetLines }] : []),
    { title: "主星主题", content: String(f.summary) },
    { title: "性格气质", content: domains.personality },
    { title: "事业运势", content: domains.career },
    { title: "财运分析", content: domains.wealth },
    { title: "感情姻缘", content: domains.love },
    { title: "健康调养", content: domains.health },
    { title: "说明", content: String(f.caveat) },
  ]);
  return { ...f, sections };
}

function enrichHoroscope(f: Facts): Facts {
  const el = String(f.element);
  const elTrait: Record<string, string> = { 火: "热情行动", 土: "务实稳定", 风: "灵活社交", 水: "情感直觉" };
  const elKey = el === "风" ? "木" : el === "水" ? "水" : el === "火" ? "火" : el === "土" ? "土" : "金";
  const domains = lifeDomainsByElement(elKey);
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.horoscope, [
    {
      title: "你的星座",
      content: `${f.sign}（${f.constellation}）\n日期范围：${f.range}\n元素：${el}（${elTrait[el] ?? ""}）\n性格：${f.traits}`,
    },
    { title: "今日运势", content: String(f.dailyFortune) },
    { title: "幸运提示", content: `幸运色：${f.luckyColor}\n幸运数字：${f.luckyNumber}` },
    { title: "事业运势", content: `${String(f.dailyFortune)}\n\n${domains.career}` },
    { title: "财运分析", content: domains.wealth },
    { title: "感情姻缘", content: domains.love },
    { title: "健康调养", content: domains.health },
  ]);
  return { ...f, sections };
}

function enrichFace(f: Facts): Facts {
  const analysis = f.analysis as Array<{ feature: string; meaning: string; category: string }>;
  const detailSections = f.detailSections as Array<{ title: string; content: string }> | undefined;
  const life = f.lifeDomains as
    | { personality: string; career: string; wealth: string; love: string; health: string }
    | undefined;
  const timeline = f.timeline as { earlyLife: string; midLife: string; lateLife: string } | undefined;
  const strengths = f.strengths as string[] | undefined;
  const cautions = f.cautions as string[] | undefined;

  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.face, [
    ...(f.source === "image"
      ? [{ title: "深度识图", content: "以下为您上传照片的多维度深度面相解读，含三停十二宫、四域运势与人生阶段分析。" }]
      : []),
    { title: "综合总论", content: String(f.summary) || "—" },
    ...(life
      ? [
          { title: "性格气质", content: life.personality || "—" },
          { title: "事业运势", content: life.career || "—" },
          { title: "财运分析", content: life.wealth || "—" },
          { title: "感情婚姻", content: life.love || "—" },
          { title: "健康倾向", content: life.health || "—" },
        ]
      : []),
    ...(timeline
      ? [
          {
            title: "人生阶段",
            content: `早年（上停）：${timeline.earlyLife}\n\n中年（中停）：${timeline.midLife}\n\n晚年（下停）：${timeline.lateLife}`,
          },
        ]
      : []),
    { title: "观察特征", content: (f.features as string[]).join("、") || "—" },
    {
      title: "特征详解",
      content:
        analysis.length > 0
          ? analysis.map((a) => `▎${a.feature}（${a.category}）\n${a.meaning}`).join("\n\n")
          : "—",
    },
    ...(((f.combos as Array<{ title: string; meaning: string; matched?: string[] }>) ?? []).length
      ? [
          {
            title: "特征组合",
            content: (f.combos as Array<{ title: string; meaning: string; matched?: string[] }>)
              .map((c) => `▎${c.title}${c.matched?.length ? `（${c.matched.join("+")}）` : ""}\n${c.meaning}`)
              .join("\n\n"),
          },
        ]
      : []),
    ...(detailSections?.map((s) => ({ title: s.title, content: s.content })) ?? []),
    ...(f.jiugongFace ? [{ title: "九宫面相", content: String(f.jiugongFace) }] : []),
    ...(strengths?.length
      ? [{ title: "先天优势", content: strengths.map((s, i) => `${i + 1}. ${s}`).join("\n") }]
      : []),
    ...(cautions?.length
      ? [{ title: "注意事项", content: cautions.map((s, i) => `${i + 1}. ${s}`).join("\n") }]
      : []),
    ...(f.advice ? [{ title: "改运建议", content: String(f.advice) }] : []),
    { title: "说明", content: String(f.caveat) },
  ]);
  return { ...f, sections };
}

function enrichPalm(f: Facts): Facts {
  const analysis = f.analysis as Array<{ feature: string; meaning: string; category: string }>;
  const detailSections = f.detailSections as Array<{ title: string; content: string }> | undefined;
  const life = f.lifeDomains as
    | { personality: string; career: string; wealth: string; love: string; health: string }
    | undefined;
  const timeline = f.timeline as { earlyLife: string; midLife: string; lateLife: string } | undefined;
  const strengths = f.strengths as string[] | undefined;
  const cautions = f.cautions as string[] | undefined;

  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.palm, [
    ...(f.source === "image"
      ? [{ title: "深度识图", content: "以下为您上传照片的多维度深度手相解读，含主线辅线、丘位掌型、四域运势与人生阶段分析。" }]
      : []),
    { title: "综合总论", content: String(f.summary) || "—" },
    ...(life
      ? [
          { title: "性格气质", content: life.personality || "—" },
          { title: "事业运势", content: life.career || "—" },
          { title: "财运分析", content: life.wealth || "—" },
          { title: "感情婚姻", content: life.love || "—" },
          { title: "健康倾向", content: life.health || "—" },
        ]
      : []),
    ...(timeline
      ? [
          {
            title: "人生阶段",
            content: `少年（线纹初段）：${timeline.earlyLife}\n\n中年（线纹中段）：${timeline.midLife}\n\n晚年（线纹末段）：${timeline.lateLife}`,
          },
        ]
      : []),
    { title: "掌纹概览", content: `观察：${(f.features as string[]).join("、") || "—"}\n${f.hand ?? ""}` },
    {
      title: "纹路详解",
      content:
        analysis.length > 0
          ? analysis.map((a) => `▎${a.feature}（${a.category}）\n${a.meaning}`).join("\n\n")
          : "—",
    },
    ...(((f.combos as Array<{ title: string; meaning: string; matched?: string[] }>) ?? []).length
      ? [
          {
            title: "特征组合",
            content: (f.combos as Array<{ title: string; meaning: string; matched?: string[] }>)
              .map((c) => `▎${c.title}${c.matched?.length ? `（${c.matched.join("+")}）` : ""}\n${c.meaning}`)
              .join("\n\n"),
          },
        ]
      : []),
    ...(detailSections?.map((s) => ({ title: s.title, content: s.content })) ?? []),
    ...(strengths?.length
      ? [{ title: "先天优势", content: strengths.map((s, i) => `${i + 1}. ${s}`).join("\n") }]
      : []),
    ...(cautions?.length
      ? [{ title: "注意事项", content: cautions.map((s, i) => `${i + 1}. ${s}`).join("\n") }]
      : []),
    ...(f.advice ? [{ title: "改运建议", content: String(f.advice) }] : []),
    { title: "说明", content: String(f.caveat) },
  ]);
  return { ...f, sections };
}

function enrichFengshui(f: Facts): Facts {
  const el = String(f.element ?? "土").replace(/[^金木水火土]/g, "") || "土";
  const domains = lifeDomainsByElement(el);
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.fengshui, [
    {
      title: "命卦信息",
      content: `本命：${f.mingGua}\n五行：${f.element}\n组别：${f.group}\n生肖：${f.shengXiao}`,
    },
    {
      title: "玄空飞星",
      content: `${f.feixingSummary ?? ""}\n向首运星${f.facingYunStar} · 年星${f.facingNianStar}\n${f.feixingAdvice ?? ""}\n年盘：${f.nianPanText ?? "—"}`,
    },
    {
      title: "八宅×飞星",
      content: String(f.comboNote ?? ""),
    },
    {
      title: "吉方（宜多用）",
      content: `${(f.luckyDirections as string[]).join("、")}\n\n可用于：卧室床头、书桌、办公座位朝向、谈判方位。`,
    },
    {
      title: "凶方（宜避免）",
      content: `${(f.unluckyDirections as string[]).join("、")}\n\n长期坐卧不宜朝向此方位，床位、灶位尤需注意。`,
    },
    { title: "布局建议", content: `${f.bedroomTip}\n${f.deskTip}` },
    { title: "事业运势", content: `面向吉方工作学习，可提升专注与贵人运。\n${domains.career}` },
    { title: "财运分析", content: `财位宜在吉方保持整洁明亮，忌堆放杂物。\n${domains.wealth}` },
    { title: "感情姻缘", content: `卧室布局宜温馨成对，忌镜子对床。\n${domains.love}` },
    { title: "健康调养", content: domains.health },
    { title: "说明", content: String(f.caveat) },
  ]);
  return { ...f, sections };
}

function enrichNumerology(f: Facts): Facts {
  const lp = f.lifePathNumber as number;
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.numerology, [
    {
      title: "生命灵数",
      content: `出生日期：${f.birthDate}\n生命灵数：${lp}\n\n计算：将出生年月日所有数字相加，直至个位数（11/22/33为大师数保留）。`,
    },
    { title: "数字含义", content: String(f.lifePathMeaning) },
    ...(f.expressionNumber
      ? [{ title: "表达数", content: `表达数${f.expressionNumber}：${f.expressionMeaning}` }]
      : []),
    {
      title: "性格气质",
      content: String(f.lifePathMeaning),
    },
    {
      title: "事业运势",
      content: `灵数${lp}：${f.lifePathMeaning}\n\n${lp <= 3 ? "宜创意、表达、开拓类工作。" : lp >= 7 ? "宜研究、技术、深度专业。" : "宜管理、协调、服务类工作。"}`,
    },
    {
      title: "财运分析",
      content: lp % 2 === 0 ? "宜稳健理财、长期规划，忌投机。" : "财来财去较快，宜强制储蓄与预算。",
    },
    {
      title: "感情姻缘",
      content: `灵数${lp}${lp <= 3 ? "：宜自由表达，找能欣赏你的伴侣。" : lp >= 7 ? "：宜深度精神连接，忌肤浅关系。" : "：宜平衡独立与亲密。"}`,
    },
    {
      title: "健康调养",
      content: lp % 2 === 0 ? "宜规律稳定的生活节奏，防消化问题。" : "宜适度变化与运动，防焦虑失眠。",
    },
  ]);
  return { ...f, sections };
}

function enrichVedic(f: Facts): Facts {
  const domains = vedicLifeReading(String(f.nakshatra), String(f.currentDasha));
  const planetLines = Array.isArray(f.planets)
    ? (f.planets as Array<{ cn: string; rashi: string; house: string }>)
        .map((p) => `${p.cn}：${p.rashi}（${p.house}）`)
        .join("\n")
    : "";
  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.vedic, [
    {
      title: "星宿信息",
      content: `本命星宿：${f.nakshatra}（${f.nakshatraCn}，第${f.nakshatraPada ?? "?"}足）\n上升：${f.lagnaCn ?? "—"}\n月亮：${f.rashiCn ?? f.moonSign} ${f.moonDegree ?? ""}°\n太阳：${f.sunRashiCn ?? "—"}\nLahiri岁差：${f.ayanamsa ?? "—"}°\n观测地：${f.location ?? "默认"}`,
    },
    ...(planetLines ? [{ title: "行星宫位（整宫制）", content: planetLines }] : []),
    {
      title: "大运",
      content: `当前${f.currentDasha}大运（周期${f.dashaYears ?? "?"}年），约余${f.dashaRemainingYears ?? "?"}年。`,
    },
    { title: "星宿含义", content: String(f.meaning) },
    { title: "运势总论", content: String(f.summary) },
    { title: "性格气质", content: domains.personality },
    { title: "事业运势", content: domains.career },
    { title: "财运分析", content: domains.wealth },
    { title: "感情姻缘", content: domains.love },
    { title: "健康调养", content: domains.health },
    { title: "说明", content: String(f.caveat) },
  ]);
  return { ...f, sections };
}

function enrichMbti(f: Facts): Facts {
  const dim = f.dimensionMatch as { EI: boolean; SN: boolean; TF: boolean; JP: boolean };
  const dimExplain = [
    `E/I（内外向）：${dim.EI ? "相同" : "不同"}——${dim.EI ? "相处模式相近" : "一方内向一方外向，互补"}`,
    `S/N（感知）：${dim.SN ? "相同" : "不同"}——${dim.SN ? "都重实际或都重直觉" : "一个务实一个理想"}`,
    `T/F（思考）：${dim.TF ? "相同" : "不同"}——${dim.TF ? "决策方式一致" : "一个重逻辑一个重感受"}`,
    `J/P（判断）：${dim.JP ? "相同" : "不同"}——${dim.JP ? "生活节奏一致" : "一个计划一个随性"}`,
  ].join("\n");

  const sections: ReadingSection[] = withBeginnerGuide(MODULE_INTROS.mbti, [
    {
      title: "配对结果",
      content: `${f.typeA} × ${f.typeB}\n匹配分：${f.score}分（${scoreLabel(f.score as number)}）`,
    },
    { title: "维度分析", content: dimExplain },
    { title: "相处解读", content: String(f.description) },
    {
      title: "建议",
      content: (f.score as number) >= 80 ? "性格协调度高，保持真诚沟通即可。" : "差异处需互相理解，把不同当互补而非对立。",
    },
  ]);
  return { ...f, sections };
}

function enrichBaziResolve(f: Facts): Facts {
  const sections: ReadingSection[] = withBeginnerGuide(
    "四柱反查=已知八字（年月日时干支），反推可能的出生时间。需结合节气与地区进一步核实。",
    [
      { title: "输入四柱", content: (f.pillars as string[]).join(" ") },
      {
        title: "使用说明",
        content:
          "1. 反查结果可能有多个候选时辰\n2. 需结合出生地、节气交接、家人回忆核实\n3. 时柱未知则三柱可推范围更大\n4. 确认时辰后建议做完整八字排盘",
      },
      { title: "结果说明", content: String(f.message) },
      synthesizeActionGuide("确认出生时间后，可进行八字、大运、合婚等完整测算。", "切勿仅凭反查结果做重大人生决定。"),
    ]
  );
  return { ...f, sections };
}

/** 易经类卦象模块：叠加小白导读与问事上下文 */
function enrichHexagram(f: Facts, introKey: string): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const q = questionContextBlock(
    f.question as string | undefined,
    "卦象不直接给出「是/否」，而是描述当前局面、发展趋势与应对之道，请结合所问灵活体会。"
  );
  const sections = withBeginnerGuide(MODULE_INTROS[introKey] ?? introKey, [
    ...(q ? [q] : []),
    ...existing,
    synthesizeActionGuide(
      String(f.advice ?? "顺势而为，守正持中。"),
      String(f.caution ?? ""),
      f.changingAnalysis ? `变卦提示：${f.changingAnalysis}` : undefined
    ),
  ]);
  return { ...f, sections };
}

function enrichYijing(f: Facts): Facts {
  return enrichHexagram(f, "yijing");
}
function enrichLiuyao(f: Facts): Facts {
  return enrichHexagram(f, "liuyao");
}
function enrichMeihua(f: Facts): Facts {
  return enrichHexagram(f, "meihua");
}

function enrichXiaoliuren(f: Facts): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const q = questionContextBlock(f.question as string | undefined, "小六壬以宫位速断吉凶，适合快速问事。");
  const sections = withBeginnerGuide(MODULE_INTROS.xiaoliuren, [
    ...(q ? [q] : []),
    ...existing,
    synthesizeActionGuide(String(f.timing ?? "宜观察时机"), "忌因一宫断死，宜结合实际情况。"),
  ]);
  return { ...f, sections };
}

function enrichLingqian(f: Facts): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const sections = withBeginnerGuide(MODULE_INTROS.lingqian, [
    ...existing,
    synthesizeActionGuide("签文为古人智慧总结，吉签勿骄，凶签勿惧，关键在修身行善。", "重大决定需结合现实条件。"),
  ]);
  return { ...f, sections };
}

function enrichQimen(f: Facts): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const q = questionContextBlock(f.question as string | undefined, "奇门以时空方位断事，宜在吉门吉方行事。");
  const sections = withBeginnerGuide(MODULE_INTROS.qimen, [...(q ? [q] : []), ...existing]);
  return { ...f, sections, caveat: f.caveat };
}

function enrichDaliuren(f: Facts): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const q = questionContextBlock(f.question as string | undefined, "六壬以课传递变断事之因果过程。");
  const sections = withBeginnerGuide(MODULE_INTROS.daliuren, [...(q ? [q] : []), ...existing]);
  return { ...f, sections };
}

function enrichTaiyi(f: Facts): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const q = questionContextBlock(f.question as string | undefined, "太乙主大局趋势，宜观天时再定人事。");
  const sections = withBeginnerGuide(MODULE_INTROS.taiyi, [...(q ? [q] : []), ...existing]);
  return { ...f, sections };
}

function enrichBeijiao(f: Facts): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const q = questionContextBlock(f.question as string | undefined, "掷杯问事，以神明应允与否为参考。");
  const sections = withBeginnerGuide(MODULE_INTROS.beijiao, [...(q ? [q] : []), ...existing]);
  return { ...f, sections };
}

function enrichDream(f: Facts): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const category = String(f.category ?? "未分类");
  const careerHint =
    category === "动物"
      ? "动物梦多象征本能与潜意识，宜关注直觉信号。"
      : category === "生活"
        ? "生活梦常反映现实焦虑或期待，宜对照近期事件。"
        : "象征梦宜从心理与文化双重角度理解。";
  const sections = withBeginnerGuide(MODULE_INTROS.dream, [
    {
      title: "梦境概览",
      content: `关键词：${f.keyword}\n分类：${category}\n${f.matched ? "已匹配词条" : "未精确匹配，以下为通用解读"}`,
    },
    ...existing,
    { title: "事业参考", content: `${careerHint}\n${String(f.advice ?? "")}` },
    {
      title: "感情与健康",
      content: "感情梦宜看梦中人物关系；身体类梦境宜关注对应部位保养，不必过度恐慌。",
    },
    synthesizeActionGuide(String(f.advice ?? "记录梦境，对照生活，以心理调适为主。"), "梦境非预言，勿因梦惊扰日常。"),
  ]);
  return { ...f, sections };
}

function enrichTarot(f: Facts): Facts {
  const existing = (f.sections as ReadingSection[] | undefined) ?? [];
  const q = questionContextBlock(f.question as string | undefined, "塔罗反映当下能量与潜意识，未来可因选择而改变。");
  const sections = withBeginnerGuide(MODULE_INTROS.tarot, [
    ...(q ? [q] : []),
    ...existing,
    synthesizeActionGuide("逆位多示能量受阻，宜内省调整；正位宜把握牌面所示机遇。", "塔罗为自我反思工具，非绝对预言。"),
  ]);
  return { ...f, sections };
}

function enrichBazi(f: Facts): Facts {
  return prependGuideIfMissing(f, MODULE_INTROS.bazi);
}

const ENRICHERS: Record<string, (f: Facts) => Facts> = {
  bazi: enrichBazi,
  chenggu: enrichChenggu,
  zodiac: enrichZodiac,
  name: enrichName,
  naming: enrichNaming,
  word: enrichWord,
  almanac: enrichAlmanac,
  match: enrichMatch,
  "bazi-dayun": enrichBaziDayun,
  "bazi-resolve": enrichBaziResolve,
  ziwei: enrichZiwei,
  heluo: enrichHeluo,
  qizheng: enrichQizheng,
  horoscope: enrichHoroscope,
  face: enrichFace,
  palm: enrichPalm,
  fengshui: enrichFengshui,
  numerology: enrichNumerology,
  vedic: enrichVedic,
  mbti: enrichMbti,
  yijing: enrichYijing,
  liuyao: enrichLiuyao,
  meihua: enrichMeihua,
  xiaoliuren: enrichXiaoliuren,
  lingqian: enrichLingqian,
  qimen: enrichQimen,
  daliuren: enrichDaliuren,
  taiyi: enrichTaiyi,
  beijiao: enrichBeijiao,
  dream: enrichDream,
  tarot: enrichTarot,
  "wuxing-ren": (f) => prependGuideIfMissing(f, MODULE_INTROS["wuxing-ren"]),
  tiaoyun: (f) => prependGuideIfMissing(f, MODULE_INTROS.tiaoyun),
};

export function enrichModuleFacts(moduleId: string, facts: Facts, locale: Locale = "zh"): Facts {
  const enricher = ENRICHERS[moduleId];
  let enriched = enricher
    ? enricher(facts)
    : MODULE_INTROS[moduleId]
      ? prependGuideIfMissing(facts, MODULE_INTROS[moduleId])
      : facts;

  if (locale === "en") {
    const sections = (enriched.sections as ReadingSection[] | undefined) ?? [];
    if (sections.length) {
      const localized = sections.map((s) => ({
        ...s,
        title: localizeSectionTitle("en", s.title),
      }));
      const hasNote = localized.some(
        (s) => s.title === "Note" || String(s.content).includes("Traditional terms")
      );
      enriched = {
        ...enriched,
        sections: hasNote
          ? localized
          : [...localized, { title: "Note", content: translateKey("en", "reading.termsNote") }],
        locale: "en",
      };
    }
  }

  return enriched;
}
