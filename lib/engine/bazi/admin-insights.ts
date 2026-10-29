/**
 * 后台内部洞察：流年事件倾向 + 六亲时间线 + 行业倾向
 * 仅写入 facts.adminInsights，不进入客户 sections / 模板报告。
 */

export type EventCategory =
  | "婚恋"
  | "事业"
  | "财运"
  | "迁移"
  | "健康"
  | "父母"
  | "子女"
  | "人际"
  | "破耗"
  | "贵人";

export interface TimelineEvent {
  year: number;
  age?: number;
  period: string;
  ganZhi: string;
  categories: EventCategory[];
  tendency: "吉" | "平" | "凶";
  note: string;
  basis: string;
}

export interface LiuQinPeriod {
  relation: "父母" | "兄弟" | "配偶" | "子女";
  ageRange: string;
  note: string;
  basis: string;
}

export interface CareerIndustryHint {
  /** 适合/常见方向，非现职探测 */
  industries: string[];
  currentJobDetectable: false;
  currentLikelihoodNote: string;
  note: string;
  basis: string;
}

export interface AdminInsights {
  version: 1;
  disclaimer: string;
  timeline: TimelineEvent[];
  liuqin: LiuQinPeriod[];
  careerHint: CareerIndustryHint;
}

const STEM_WX: Record<string, string> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const BRANCH_WX: Record<string, string> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

const INDUSTRY_BY_WX: Record<string, string[]> = {
  金: ["金融", "法律", "军警安保", "机械五金", "珠宝", "审计风控"],
  木: ["教育培训", "文化出版", "园林农林", "医药健康", "设计策划", "环保"],
  水: ["贸易物流", "传媒资讯", "互联网", "旅游酒店", "咨询研究", "航运"],
  火: ["餐饮娱乐", "能源电力", "美妆时尚", "公关广告", "演艺传媒", "电子"],
  土: ["地产建筑", "农业矿产", "仓储物流", "行政管理", "陶瓷建材", "信托保险"],
};

const GEJU_INDUSTRY: Record<string, string[]> = {
  正官格: ["体制内", "大型企业管理", "法务合规"],
  七杀格: ["竞争行业", "军警", "销售冲刺", "创业"],
  正印格: ["教育科研", "文书编辑", "咨询顾问"],
  偏印格: ["技术研发", "玄学艺术", "特种工艺"],
  正财格: ["财务会计", "实业经营", "稳定贸易"],
  偏财格: ["投资贸易", "销售", "资源中介"],
  食神格: ["餐饮美食", "技艺表演", "创意产品"],
  伤官格: ["创意设计", "自由职业", "技术突破"],
  建禄格: ["专业深耕", "自立门户"],
  羊刃格: ["高压岗位", "执法安保", "手术外科类"],
};

function tendencyFromLabel(label?: string): "吉" | "平" | "凶" {
  if (label === "吉") return "吉";
  if (label === "凶") return "凶";
  return "平";
}

function categoriesForPillar(
  ganZhi: string,
  useful: string[],
  avoid: string[],
  tenGods: string[],
  tendency: "吉" | "平" | "凶"
): EventCategory[] {
  const gan = ganZhi[0] ?? "";
  const zhi = ganZhi[1] ?? "";
  const gWx = STEM_WX[gan];
  const zWx = BRANCH_WX[zhi];
  const cats = new Set<EventCategory>();

  if (gWx && useful.includes(gWx)) cats.add("贵人");
  if (zWx && useful.includes(zWx)) cats.add("贵人");
  if (gWx && avoid.includes(gWx)) cats.add("破耗");
  if (zWx && avoid.includes(zWx)) cats.add("破耗");

  if (["寅", "申", "巳", "亥"].includes(zhi)) cats.add("迁移");
  if (["子", "午", "卯", "酉"].includes(zhi) && tendency !== "凶") cats.add("婚恋");
  if (["辰", "戌", "丑", "未"].includes(zhi)) cats.add("财运");

  if (tenGods.some((t) => t.includes("官") || t.includes("杀"))) {
    if (gWx === "金" || gWx === "土" || useful.includes(gWx ?? "")) cats.add("事业");
  }
  if (tenGods.some((t) => t.includes("财"))) cats.add("财运");
  if (tenGods.some((t) => t.includes("印"))) cats.add("父母");
  if (tenGods.some((t) => t.includes("食") || t.includes("伤"))) cats.add("子女");

  if (tendency === "凶") {
    cats.add("健康");
    if (!cats.has("破耗")) cats.add("破耗");
  }
  if (tendency === "吉") {
    cats.add("事业");
    cats.add("人际");
  }

  if (cats.size === 0) cats.add("人际");
  return [...cats].slice(0, 4);
}

function noteFor(cats: EventCategory[], tendency: "吉" | "平" | "凶"): string {
  const head = cats.slice(0, 2).join("、") || "综合";
  if (tendency === "吉") return `倾向偏吉，主题偏「${head}」，宜主动推进相关事务（象征推断）。`;
  if (tendency === "凶") return `倾向偏紧，主题偏「${head}」，宜守成、体检与财务审慎（象征推断）。`;
  return `平稳之年，主题偏「${head}」，宜按部就班（象征推断）。`;
}

export function buildCareerIndustryHint(input: {
  dayMasterElement: string;
  usefulGods?: string[];
  geJuName?: string;
  tenGods?: string[];
}): CareerIndustryHint {
  const el = input.dayMasterElement.replace(/[^金木水火土]/g, "") || "土";
  const useful = input.usefulGods ?? [];
  const industries = new Set<string>();
  for (const x of INDUSTRY_BY_WX[el] ?? []) industries.add(x);
  for (const u of useful) {
    for (const x of INDUSTRY_BY_WX[u] ?? []) industries.add(x);
  }
  const ge = input.geJuName ?? "";
  for (const [k, list] of Object.entries(GEJU_INDUSTRY)) {
    if (ge.includes(k.replace("格", "")) || ge === k) list.forEach((x) => industries.add(x));
  }
  if (input.tenGods?.some((t) => t.includes("食") || t.includes("伤"))) {
    industries.add("创意内容");
    industries.add("技术产品");
  }
  if (input.tenGods?.some((t) => t.includes("官"))) {
    industries.add("管理岗");
  }

  const list = [...industries].slice(0, 8);
  return {
    industries: list,
    currentJobDetectable: false,
    currentLikelihoodNote:
      "无法从出生时间探测「当前实际从事行业」。仅能给出命理象征下的适合/常见方向，需档案或用户自述才能对照现职。",
    note: `日主属${el}${useful.length ? `，喜用偏${useful.join("、")}` : ""}${ge ? `，格局${ge}` : ""}，行业倾向见列表。`,
    basis: "日主五行 + 喜用神 + 月令格局十神倾向映射表",
  };
}

export function buildLiuQinTimeline(input: {
  tenGods: string[];
  gender?: string;
  strength?: string;
}): LiuQinPeriod[] {
  const gods = input.tenGods ?? [];
  const has = (k: string) => gods.some((t) => t.includes(k));
  const periods: LiuQinPeriod[] = [];

  periods.push({
    relation: "父母",
    ageRange: "约 0–18 岁（早年）",
    note: has("印")
      ? "印星透干，早年得长辈照料/学业提携的象征较强；具体家庭事实需核实。"
      : has("财") && !has("印")
        ? "财星显而印弱，早年或更早自立、与长辈观念有距离的象征（非定论）。"
        : "父母缘平看大运流年引发，早年宜看印星是否得气。",
    basis: `十神：${gods.join("、") || "—"}`,
  });

  periods.push({
    relation: "兄弟",
    ageRange: "约 12–30 岁（同辈互动）",
    note: has("比") || has("劫")
      ? "比劫显，同辈竞争/合伙主题较显，宜边界清晰。"
      : "比劫不显，手足同事缘多看流年引发。",
    basis: "比劫为兄弟/同事象",
  });

  const spouseGod = input.gender === "女" ? "官杀" : "财";
  periods.push({
    relation: "配偶",
    ageRange: "约 22–40 岁（婚恋窗口象征）",
    note:
      input.gender === "女"
        ? has("官") || has("杀")
          ? "官杀透干，婚恋信息较显，窗口多落在该年龄段大运引发时。"
          : "官星不显，婚恋多待大运流年引动。"
        : has("财")
          ? "财星透干，妻缘/合作对象信息较显。"
          : "财星不显，婚恋多待大运流年引动。",
    basis: `性别取象：${spouseGod}；当前十神 ${gods.join("、")}`,
  });

  periods.push({
    relation: "子女",
    ageRange: "约 28–50 岁",
    note: has("食") || has("伤")
      ? "食伤显，子女/作品/创意产出主题较显。"
      : "子女缘多看食伤是否在大运浮出。",
    basis: "食伤为子女/表达象",
  });

  return periods;
}

export function buildEventTimeline(input: {
  daYun?: Array<{
    ganZhi: string;
    startYear: number;
    endYear: number;
    startAge?: number;
    endAge?: number;
    yongShenLabel?: string;
    isCurrent?: boolean;
  }>;
  liuNian?: Array<{
    year: number;
    ganZhi: string;
    age?: number;
    yongShenLabel?: string;
  }>;
  usefulGods?: string[];
  avoidGods?: string[];
  tenGods?: string[];
}): TimelineEvent[] {
  const useful = (input.usefulGods ?? []) as string[];
  const avoid = (input.avoidGods ?? []) as string[];
  const tenGods = input.tenGods ?? [];
  const events: TimelineEvent[] = [];

  for (const dy of input.daYun ?? []) {
    const tendency = tendencyFromLabel(dy.yongShenLabel);
    const cats = categoriesForPillar(dy.ganZhi, useful, avoid, tenGods, tendency);
    events.push({
      year: dy.startYear,
      age: dy.startAge,
      period: `大运${dy.ganZhi}（${dy.startYear}-${dy.endYear}）`,
      ganZhi: dy.ganZhi,
      categories: cats,
      tendency,
      note: noteFor(cats, tendency),
      basis: `大运${dy.ganZhi} 喜用标注${dy.yongShenLabel ?? "平"}`,
    });
  }

  for (const ln of (input.liuNian ?? []).slice(0, 12)) {
    const tendency = tendencyFromLabel(ln.yongShenLabel);
    const cats = categoriesForPillar(ln.ganZhi, useful, avoid, tenGods, tendency);
    events.push({
      year: ln.year,
      age: ln.age,
      period: `流年${ln.year}`,
      ganZhi: ln.ganZhi,
      categories: cats,
      tendency,
      note: noteFor(cats, tendency),
      basis: `流年${ln.ganZhi} 喜用标注${ln.yongShenLabel ?? "平"}`,
    });
  }

  return events;
}

export function buildBaziAdminInsights(input: {
  dayMasterElement: string;
  tenGods?: string[];
  usefulGods?: string[];
  avoidGods?: string[];
  geJuName?: string;
  gender?: string;
  strength?: string;
  daYunList?: Array<{
    ganZhi: string;
    startYear: number;
    endYear: number;
    startAge?: number;
    endAge?: number;
    yongShenLabel?: string;
    isCurrent?: boolean;
  }>;
  liuNianList?: Array<{
    year: number;
    ganZhi: string;
    age?: number;
    yongShenLabel?: string;
  }>;
}): AdminInsights {
  const timeline = buildEventTimeline({
    daYun: input.daYunList,
    liuNian: input.liuNianList,
    usefulGods: input.usefulGods,
    avoidGods: input.avoidGods,
    tenGods: input.tenGods,
  });
  const liuqin = buildLiuQinTimeline({
    tenGods: input.tenGods ?? [],
    gender: input.gender,
    strength: input.strength,
  });
  const careerHint = buildCareerIndustryHint({
    dayMasterElement: input.dayMasterElement,
    usefulGods: input.usefulGods,
    geJuName: input.geJuName,
    tenGods: input.tenGods,
  });

  return {
    version: 1,
    disclaimer:
      "内部象征推演，仅供管理员参考。不可当作已发生事实或未来必然事件；禁止原样展示给客户作为断言。",
    timeline,
    liuqin,
    careerHint,
  };
}

/** 从客户可见 facts 中移除后台字段 */
export function stripAdminInsights<T extends Record<string, unknown>>(facts: T): T {
  if (!facts || typeof facts !== "object") return facts;
  const { adminInsights: _a, ...rest } = facts as T & { adminInsights?: unknown };
  return rest as T;
}
