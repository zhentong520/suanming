import { BirthInput } from "../calendar";
import { computeBazi } from "../bazi";
import { lunarFromDate } from "../shared/lunar-advanced";
import type { ReadingSection } from "../shared/reading";

export type WuXingEl = "木" | "火" | "土" | "金" | "水";

const ZHI_WX: Record<string, WuXingEl> = {
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
  子: "水",
  丑: "土",
};

/** 我生之五行 → 穿衣最吉色（小说：日支五行所生之色） */
const SHENG_NEXT: Record<WuXingEl, WuXingEl> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

const COLOR: Record<WuXingEl, { color: string; tip: string }> = {
  木: { color: "青绿 / 翠绿", tip: "属木色，利生发、沟通与仁慈表达" },
  火: { color: "红 / 橙 / 紫", tip: "属火色，利礼仪、热情与曝光" },
  土: { color: "黄 / 咖 / 米", tip: "属土色，利稳重、包容与消化脾胃气场" },
  金: { color: "白 / 金 / 浅灰", tip: "属金色，利决断、收成与条理" },
  水: { color: "黑 / 深蓝 / 玄色", tip: "属水色，利智慧、流动与静心" },
};

const TYPE_META: Record<
  WuXingEl,
  {
    look: string;
    yang: string;
    yin: string;
    organ: string;
    traits: string;
    risks: string;
    remedy: string;
  }
> = {
  木: {
    look: "脸型偏窄长，身材瘦直，四肢细长，肩耸背直，穿衣有型。",
    yang: "甲木：仁厚正直、有担当、能忍辱。",
    yin: "乙木：宁折不屈、言辞硬、不受管束（亢上）。",
    organ: "主肝胆；木旺易肝火、较劲；乙木亦主颈项。",
    traits: "向上生长、重原则；善则仁礼，过则执拗。",
    risks: "木过旺易多挫；亢上可伤双亲象；常见脾胃受克、颈椎紧、入睡难。",
    remedy: "拨阴取阳：心存仁、行以礼；木去生火，泄旺木气。少较劲，多讲理。",
  },
  火: {
    look: "面色偏红润或尖额，眼神亮，语速快，体态偏热情外放。",
    yang: "丙火：光明磊落、感染力强。",
    yin: "丁火：细腻敏感、内热藏锋。",
    organ: "主心与小肠；火旺易口舌、心悸不安或失眠躁。",
    traits: "礼仪、表达、曝光欲强；善则温暖，过则急躁虚火。",
    risks: "口舌是非、情绪起伏；过燥伤阴，注意眼睛与口腔。",
    remedy: "火生土：落地做事、稳住节奏；饮食清润，少熬夜逞强。",
  },
  土: {
    look: "面阔或鼻丰，体态敦厚，步履沉稳，给人可靠感。",
    yang: "戊土：厚重承载、讲信用。",
    yin: "己土：细腻务实、善经营。",
    organ: "主脾胃；土壅易迟滞、思虑过多。",
    traits: "包容、信用、储蓄倾向；善则稳，过则固执迟钝。",
    risks: "思虑伤脾、湿困；财路稳但进取偏慢。",
    remedy: "土生金：立规矩、断舍离；适度运动排湿，少过度操心。",
  },
  金: {
    look: "骨感清晰，五官棱角分明，气场肃整，着装偏净。",
    yang: "庚金：果断刚毅、执行力强。",
    yin: "辛金：精致敏锐、审美高。",
    organ: "主肺与大肠；金旺易燥咳、皮肤紧绷或苛责。",
    traits: "义、决断、秩序；善则清正，过则苛刻冷硬。",
    risks: "人际关系易伤；秋季情绪低落；呼吸道敏感。",
    remedy: "金生水：多学习沉淀、柔软沟通；忌锋芒过露。",
  },
  水: {
    look: "面偏圆润或眼神深，体态柔韧，反应快，喜流动变化。",
    yang: "壬水：开阔智慧、善于变通。",
    yin: "癸水：细腻直觉、内敛多思。",
    organ: "主肾与泌尿生殖；水旺易畏寒、思虑多梦。",
    traits: "智、流动、适应力；善则聪慧，过则散漫多虑。",
    risks: "意志摇摆、睡眠浅；下元虚寒倾向需养护。",
    remedy: "水生木：立目标、种习惯；作息规律，忌长时间空转焦虑。",
  },
};

const GAN_TO_WX: Record<string, WuXingEl> = {
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

function dayZhiOf(date: Date): string {
  const lunar = lunarFromDate(date);
  return lunar.getEightChar().getDayZhi();
}

export function dressColorForDayZhi(zhi: string): {
  dayZhi: string;
  dayWuXing: WuXingEl;
  bestWuXing: WuXingEl;
  color: string;
  tip: string;
  mnemonic: string;
} {
  const dayWuXing = ZHI_WX[zhi] ?? "土";
  const bestWuXing = SHENG_NEXT[dayWuXing];
  const meta = COLOR[bestWuXing];
  return {
    dayZhi: zhi,
    dayWuXing,
    bestWuXing,
    color: meta.color,
    tip: meta.tip,
    mnemonic:
      "口诀：寅卯日红、辰日白、巳午日黄、未日白、申酉日黑、戌日白、亥子日绿、丑日白（取「我生」色）。",
  };
}

export function computeWuxingRen(input: {
  bodyType?: string;
  date?: string;
  birth?: BirthInput;
}) {
  const date = input.date
    ? new Date(input.date.includes("T") ? input.date : `${input.date}T12:00:00`)
    : new Date();

  let source: "body" | "dayMaster" | "default" = "default";
  let element: WuXingEl = "木";
  let dayMaster = "";
  let usefulGods: string[] = [];
  let avoidGods: string[] = [];

  const body = String(input.bodyType ?? "").trim() as WuXingEl | "";
  if (body && TYPE_META[body as WuXingEl]) {
    element = body as WuXingEl;
    source = "body";
  } else if (input.birth) {
    const bazi = computeBazi(input.birth);
    dayMaster = bazi.dayMaster;
    element = (GAN_TO_WX[dayMaster] ?? (bazi.dayMasterElement as WuXingEl) ?? "土") as WuXingEl;
    usefulGods = bazi.yongShen?.usefulGods ?? [];
    avoidGods = bazi.yongShen?.avoidGods ?? [];
    source = "dayMaster";
  }

  const meta = TYPE_META[element];
  const zhi = dayZhiOf(date);
  const dress = dressColorForDayZhi(zhi);
  const yongColor =
    usefulGods.length > 0
      ? usefulGods
          .filter((g): g is WuXingEl => g in COLOR)
          .map((g) => `${g}→${COLOR[g].color}`)
          .join("；")
      : "";

  const sections: ReadingSection[] = [
    {
      title: "小白导读",
      content:
        "五行人=以形神对应木火土金水看性情与身体倾向；助运穿衣=按当日地支取「我生」之色借天时。有档案时再用八字喜用兼顾（天地人各一分，能兼顾最好）。",
    },
    {
      title: "五行人判定",
      content: `类型：【${element}型人】\n判定来源：${
        source === "body" ? "您选择的体貌五行" : source === "dayMaster" ? `档案日主「${dayMaster}」属${element}` : "默认示例（请选体型或档案）"
      }\n形神特征：${meta.look}`,
    },
    {
      title: "阴阳细分",
      content: `${meta.yang}\n${meta.yin}\n\n性情：${meta.traits}`,
    },
    {
      title: "身心倾向",
      content: `${meta.organ}\n\n需留意：${meta.risks}`,
    },
    {
      title: "调和建议",
      content: meta.remedy,
    },
    {
      title: "今日助运穿衣（天时）",
      content: `日支${dress.dayZhi}（${dress.dayWuXing}）→ 最吉穿「${dress.bestWuXing}」色：${dress.color}\n${dress.tip}\n\n${dress.mnemonic}`,
    },
    ...(yongColor
      ? [
          {
            title: "八字喜用穿衣（人命）",
            content: `喜用五行配色：${yongColor}\n忌神：${avoidGods.join("、") || "—"}\n\n天时色与喜用色能兼顾最好；不能兼顾时，重要场合唱喜用，日常可跟天时。二者如数学与英语，没有谁可以完全替代谁。`,
          },
        ]
      : [
          {
            title: "八字喜用穿衣（人命）",
            content: "选择出生档案后，可叠加喜用神配色建议，与天时穿衣对照。",
          },
        ]),
    {
      title: "改命提示",
      content:
        "小说强调：积德、包容、和善、爱惜自己。相由心生——心境变，形神与运势倾向也会慢慢跟着变。本解读供文化研习，不替代医疗与专业建议。",
    },
  ];

  return {
    element,
    source,
    dayMaster: dayMaster || undefined,
    usefulGods,
    avoidGods,
    look: meta.look,
    traits: meta.traits,
    risks: meta.risks,
    remedy: meta.remedy,
    dress,
    date: date.toISOString().slice(0, 10),
    sections,
    summary: `${element}型人。今日（${dress.dayZhi}日）宜穿${dress.color}借天时。${meta.remedy}`,
    caveat: "形神五行与穿衣助运为传统文化象征体系，请结合现实与医嘱，勿迷信。",
  };
}
