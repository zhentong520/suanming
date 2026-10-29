/**
 * 面相/手相 → 人生主题倾向；若有出生盘则与八字洞察合并，提高象征精度。
 */

import {
  buildBaziAdminInsights,
  type AdminInsights,
  type EventCategory,
  type LiuQinPeriod,
  type TimelineEvent,
} from "../bazi/admin-insights";

const FACE_THEME: Array<{ keys: string[]; categories: EventCategory[]; note: string }> = [
  { keys: ["印堂", "额头", "天庭"], categories: ["贵人", "事业"], note: "上停/命宫特征偏早年学业与贵人。" },
  { keys: ["鼻", "财帛", "法令"], categories: ["财运", "事业"], note: "中停/财帛法令偏中年事业财运。" },
  { keys: ["地阁", "下巴"], categories: ["子女", "人际"], note: "下停偏晚年与居家守成。" },
  { keys: ["夫妻", "嘴角", "唇"], categories: ["婚恋"], note: "口相/夫妻宫偏感情表达。" },
  { keys: ["气色暗", "印堂有纹", "川字"], categories: ["健康", "破耗"], note: "气色与心事纹偏压力健康主题。" },
];

const PALM_THEME: Array<{ keys: string[]; categories: EventCategory[]; note: string }> = [
  { keys: ["生命线"], categories: ["健康"], note: "生命线主体质节奏与压力承受。" },
  { keys: ["智慧线"], categories: ["事业", "人际"], note: "智慧线主思维决策与专业路径。" },
  { keys: ["感情线", "婚姻线"], categories: ["婚恋"], note: "感情/婚姻线主情感投入与关系。" },
  { keys: ["事业线", "太阳线"], categories: ["事业", "贵人"], note: "事业/太阳线主上升与名声。" },
  { keys: ["财运线", "水星丘"], categories: ["财运"], note: "财运线与水星丘主理财与商务。" },
  { keys: ["木星丘", "拇指"], categories: ["事业"], note: "木星丘/拇指主进取与执行。" },
];

function matchThemes(
  module: "face" | "palm",
  features: string[]
): { categories: EventCategory[]; notes: string[] } {
  const table = module === "face" ? FACE_THEME : PALM_THEME;
  const cats = new Set<EventCategory>();
  const notes: string[] = [];
  for (const row of table) {
    if (features.some((f) => row.keys.some((k) => f.includes(k)))) {
      row.categories.forEach((c) => cats.add(c));
      notes.push(row.note);
    }
  }
  return { categories: [...cats], notes };
}

export function buildFacePalmAdminInsights(input: {
  module: "face" | "palm";
  features: string[];
  combos?: Array<{ title: string; meaning: string }>;
  /** 有出生信息时传入八字洞察以合并 */
  birthInsights?: AdminInsights | null;
}): AdminInsights {
  const { categories, notes } = matchThemes(input.module, input.features);
  const nowY = new Date().getFullYear();

  const visionTimeline: TimelineEvent[] = [
    {
      year: nowY,
      period: `${input.module === "face" ? "面相" : "手相"}综合（当下观察）`,
      ganZhi: "—",
      categories: categories.length ? categories : ["人际"],
      tendency: categories.includes("破耗") || categories.includes("健康") ? "平" : "平",
      note:
        notes.slice(0, 2).join(" ") ||
        "以当前观察特征归纳主题倾向，非编年史事件（象征推断）。",
      basis: `特征：${input.features.slice(0, 8).join("、")}`,
    },
  ];

  if (input.combos?.length) {
    visionTimeline.push({
      year: nowY,
      period: "特征组合",
      ganZhi: "—",
      categories: categories.slice(0, 3),
      tendency: "平",
      note: input.combos.map((c) => `【${c.title}】${c.meaning}`).join(" "),
      basis: "本地组合断规则",
    });
  }

  const liuqin: LiuQinPeriod[] = [
    {
      relation: "配偶",
      ageRange: "观察象征",
      note: categories.includes("婚恋")
        ? "相学特征提示感情主题较显，宜结合沟通与边界（非定婚否）。"
        : "感情主题不突出，宜看组合与出生盘交叉。",
      basis: "面相口/夫妻宫或手相感情婚姻线",
    },
    {
      relation: "父母",
      ageRange: "早年象征",
      note: categories.includes("贵人") || input.features.some((f) => /印堂|额头|天庭/.test(f))
        ? "上停/命宫类特征偏早年贵人与学业象。"
        : "父母缘需结合出生盘印星细看。",
      basis: "三停上停 / 印堂",
    },
    {
      relation: "子女",
      ageRange: "中晚年象征",
      note: input.features.some((f) => /地阁|下巴|子女/.test(f))
        ? "下停或子女宫类特征偏子女/守成主题。"
        : "子女主题平看，宜结合出生盘食伤。",
      basis: "下停/地阁",
    },
    {
      relation: "兄弟",
      ageRange: "同辈象征",
      note: "相学对兄弟象较弱，优先参考出生盘比劫与流年。",
      basis: "相学局限说明",
    },
  ];

  const base: AdminInsights = {
    version: 1,
    disclaimer:
      "面相手相为观察象征；若叠加出生盘可提高主题一致性，仍非事实还原。仅供管理员或已授权解锁用户参考。",
    timeline: visionTimeline,
    liuqin,
    careerHint: {
      industries: categories.includes("财运")
        ? ["商务销售", "财务相关", "自主经营"]
        : categories.includes("事业")
          ? ["专业管理", "创意表达", "服务行业"]
          : ["综合发展"],
      currentJobDetectable: false,
      currentLikelihoodNote:
        "面相手相不能探测现职。有出生年月日时辰时，以八字行业倾向为准、相学作气质补充。",
      note: `${input.module === "face" ? "面相" : "手相"}主题偏：${categories.join("、") || "综合"}。`,
      basis: "观察特征关键词映射",
    },
  };

  if (!input.birthInsights) return base;

  // 合并：时间线以出生盘为主，相学主题作补充注释
  const mergedTimeline = [
    ...input.birthInsights.timeline,
    ...base.timeline.map((t) => ({
      ...t,
      note: `【相学补充】${t.note}`,
    })),
  ];
  const mergedLiuqin = input.birthInsights.liuqin.map((q) => {
    const vis = base.liuqin.find((x) => x.relation === q.relation);
    return vis
      ? { ...q, note: `${q.note}；相学：${vis.note}` }
      : q;
  });

  return {
    version: 1,
    disclaimer:
      "出生盘（大运流年/六亲）+ 面相手相交叉。精度高于单看相学，仍属文化象征，禁止当作已发生/必将发生事实。",
    timeline: mergedTimeline,
    liuqin: mergedLiuqin,
    careerHint: {
      ...input.birthInsights.careerHint,
      note: `${input.birthInsights.careerHint.note}；相学补充：${base.careerHint.note}`,
      currentLikelihoodNote:
        "交叉后仍无法探测现职；出生盘给行业方向，相学给气质与表达风格。",
      basis: `${input.birthInsights.careerHint.basis} + 相学特征`,
    },
  };
}

export function buildBirthInsightsForProfile(
  birth: Parameters<typeof buildBaziAdminInsights>[0]
): AdminInsights {
  return buildBaziAdminInsights(birth);
}
