import { BirthInput } from "../calendar";
import { computeBazi } from "../bazi";
import { dressColorForDayZhi } from "../wuxing-ren";
import { lunarFromDate } from "../shared/lunar-advanced";
import type { ReadingSection } from "../shared/reading";

export type TiaoyunConcern =
  | "body"
  | "emotion"
  | "luck"
  | "home"
  | "avatar"
  | "general";

/** 先天八卦数（象数取数用）→ 部位与五行示意 */
const XIAN_TIAN: Record<
  number,
  { gua: string; element: string; parts: string; note: string }
> = {
  1: { gua: "乾", element: "金", parts: "头、大肠、右足等", note: "天、健、领袖气。" },
  2: { gua: "兑", element: "金", parts: "口、肺、咽喉、右臂肋、齿等", note: "说、悦；呼吸系统象。" },
  3: { gua: "离", element: "火", parts: "目、心、小肠、血等", note: "明、热、曝光。" },
  4: { gua: "震", element: "木", parts: "足、肝、筋爪、左臂肋", note: "动、雷、疏泄。" },
  5: { gua: "巽", element: "木", parts: "股、胆、左肩背、胸气管", note: "风、入、通气。" },
  6: { gua: "坎", element: "水", parts: "耳、肾、膀胱、腰脊、下窍", note: "险、流、寒湿象。" },
  7: { gua: "艮", element: "土", parts: "手、胃、骨关节、鼻、左足", note: "止、山、结石象常借艮。" },
  8: { gua: "坤", element: "土", parts: "脾胃、腹、肌、右肩", note: "载、暖、子宫宫格相关讨论常借坤。" },
};

const CONCERN_LABEL: Record<TiaoyunConcern, string> = {
  body: "身心倾向（文化调理思路）",
  emotion: "情绪与能量状态",
  luck: "运势阻滞感",
  home: "居家风水环境",
  avatar: "头像 / 昵称气场",
  general: "综合调运总览",
};

function parseConcern(raw?: string): TiaoyunConcern {
  const v = String(raw ?? "general").trim() as TiaoyunConcern;
  return v in CONCERN_LABEL ? v : "general";
}

function fiveBathSections(): ReadingSection {
  return {
    title: "五行能量净化（生活方式）",
    content: [
      "小说：人与万物皆五行构成，可从五行汲取能量、清理负面负荷。",
      "· 水浴：洗澡本身可作净化；阳气弱时避开伤阳时段，理清「何时洗」比争论快慢更重要。",
      "· 风浴：户外清风、深呼吸、适度出汗运动（人体基本风水是呼吸，憋气是对抗、耗能）。",
      "· 火浴：日照、温暖、红色系环境或艾灸等「火」象（以安全与医嘱为前提）。",
      "· 土浴：赤脚触地、园艺、稳定作息与厚实饮食节律。",
      "· 金浴：整理断舍离、金属质感整洁空间、清晰规则与边界。",
      "原则：不偏执、不执迷某一法；药物、休息、修行、象数皆可为用，排斥与迷信都偏。",
    ].join("\n"),
  };
}

function energyGuideSection(): ReadingSection {
  return {
    title: "能量引导术（心理层面）",
    content: [
      "靠意志力硬扛＝压制＝持续耗能；耗尽后故态复萌。",
      "臣服与夸张接纳：先承认「我就是累/懒/慌」，反复接纳到对抗消失，能量回到「我」。",
      "「受了就了」：接纳才能放下。越排斥什么，越容易粘上什么。",
      "此为心理能量管理的文化表述，抑郁焦虑等请寻求专业心理/医疗帮助。",
    ].join("\n"),
  };
}

function xiangshuPrinciple(): ReadingSection {
  return {
    title: "八卦象数：原理（非医疗处方）",
    content: [
      "象数＝「数」取先天八卦，「象」用后天八卦（先天为体，后天为用）。",
      "损有余而补不足：用生克疏泄过旺、补益不足；象义可延伸，不固定死抠单一脏器。",
      "示例口诀仅作文化说明：晕车曾用默念「070」；组合需自行对照象义，人人体质不同。",
      "【硬性声明】本站不提供治病处方，不替代医师诊断与用药。急重症、持续不适必须就医。祝由、符咒、隔空等仅作小说/民俗介绍，产品不做「灵治操作」。",
    ].join("\n"),
  };
}

function xiangshuBodyMap(): ReadingSection {
  const lines = Object.entries(XIAN_TIAN).map(
    ([n, v]) => `${n}${v.gua}（${v.element}）：${v.parts}｜${v.note}`
  );
  return {
    title: "先天数 · 部位对照（自学地图）",
    content: `查公开象数配方时，先核对象义是否与自身感受相符，再决定是否试用。\n\n${lines.join("\n")}`,
  };
}

function gaimingChannels(): ReadingSection {
  return {
    title: "改命两渠道与十层面",
    content: [
      "一命二运三风水，四积阴德五读书，六名七相八敬神，九交贵人十养生。",
      "命与运（出身、时代周期）难改；其余皆有选择权。",
      "小说强调快速改命两大渠道：①读书（提升自己）②积德（创造价值/善行）。",
      "预测准≠宿命：条件变化或人为干预（如人工影响天气之喻）会改变结果——「貌似不准，可能是无意中化解了」。",
    ].join("\n"),
  };
}

function adjustLayers(): ReadingSection {
  return {
    title: "调整的几个层面",
    content: [
      "看得见的维度：天时 · 地利（风水）· 人和——人和居首。",
      "跨越维度说法：上（天）· 下（地）· 中（人可选的一切，含天时地利人和）。",
      "外求易乱心；镜花水月不如自修。法器手串等最多辅助净化磁场，不能治病背业。",
      "业力是内因，风水是外因；打破业力靠言行心念，厚德才能载福。",
    ].join("\n"),
  };
}

function foYiNote(): ReadingSection {
  return {
    title: "「医」的文化框架（道/佛医简述）",
    content: [
      "山医命相卜中，「医」含药方、针灸、推拿、及小说所称灵治等；正统路径仍以安全与循证医疗为先。",
      "佛医分说：四大不调（坚湿暖动）与业力病；后者侧重忏悔与布施（财/法/无畏），法布施功德尤重。",
      "中医望闻问切可分阴阳：色泽鲜明/晦暗，声洪/低微，脉浮大滑/沉迟涩等——先辨阴阳再谈调。",
      "音乐、声音亦可致病或调神（声煞与乐疗记载）；选址避噪音亦属风水。",
      "任何身体症状：先医院，后文化调养。本模块绝非诊疗。",
    ].join("\n"),
  };
}

function avatarTips(): ReadingSection {
  return {
    title: "头像 / 昵称调运提示",
    content: [
      "头像如微型宅：人与「框」比例失当、顶边压迫、阴暗凌乱，气场观感偏弱。",
      "宜干净明亮、阴阳平衡；忌颓废压抑图与消极字义昵称（字载心意）。",
      "可与居家风水九宫对照：头像局部阴影亦可能被读作某宫受压（文化象征）。",
    ].join("\n"),
  };
}

function homeTips(): ReadingSection {
  return {
    title: "居家调运入口",
    content: [
      "先找看得见的风水问题，再谈抽象灵治——简单、可验证、不易执迷。",
      "卧室坐向、噪音（声煞）、光线、厕所与财务通道等，见「风水」模块细排。",
      "调整宅运可参考黄历日九星择日；人宅不合时，换位比硬扛更务实。",
    ].join("\n"),
  };
}

export function computeTiaoyun(input: {
  concern?: string;
  focus?: string;
  birth?: BirthInput;
}) {
  const concern = parseConcern(input.concern);
  const focus = String(input.focus ?? "").trim();

  let usefulGods: string[] = [];
  let dayMaster = "";
  let dressNote = "";
  if (input.birth) {
    const bazi = computeBazi(input.birth);
    dayMaster = bazi.dayMaster;
    usefulGods = bazi.yongShen?.usefulGods ?? [];
    const zhi = lunarFromDate(new Date()).getEightChar().getDayZhi();
    const dress = dressColorForDayZhi(zhi);
    dressNote = `今日${dress.dayZhi}日宜借「${dress.bestWuXing}」色：${dress.color}；喜用${usefulGods.join("、") || "—"}（能兼顾最好）。详见「五行人·助运」。`;
  }

  const sections: ReadingSection[] = [
    {
      title: "小白导读",
      content:
        "本模块整理小说中的「医」与「灵治调运」思路：预测可化解、象数原理、五行净化、能量引导、改命渠道与调整层面。全部为传统文化与自我管理参考，不构成医疗、心理或法律建议。",
    },
    {
      title: "本次关注",
      content: `主题：${CONCERN_LABEL[concern]}${focus ? `\n补充说明：${focus}` : ""}${
        dayMaster ? `\n档案日主：${dayMaster}；喜用：${usefulGods.join("、") || "—"}` : "\n未绑定档案：可稍后结合八字喜用与五行人模块。"
      }`,
    },
    foYiNote(),
  ];

  if (concern === "body" || concern === "general") {
    sections.push(xiangshuPrinciple(), xiangshuBodyMap());
  }
  if (concern === "emotion" || concern === "general") {
    sections.push(energyGuideSection());
  }
  if (concern === "body" || concern === "emotion" || concern === "general") {
    sections.push(fiveBathSections());
  }
  if (concern === "luck" || concern === "general") {
    sections.push(gaimingChannels(), adjustLayers());
    if (dressNote) sections.push({ title: "今日天时穿衣", content: dressNote });
  }
  if (concern === "home" || concern === "general") {
    sections.push(homeTips());
    if (concern === "home") sections.push(adjustLayers());
  }
  if (concern === "avatar" || concern === "general") {
    sections.push(avatarTips());
  }

  if (concern !== "general" && concern !== "luck") {
    sections.push(gaimingChannels());
  }

  sections.push({
    title: "推荐联动模块",
    content: [
      "· 五行人·助运：形神五行 + 穿衣借天时",
      "· 八字 / 大运流年：喜用与阶段地图",
      "· 风水：地利与化解入口",
      "· 黄历：日九星与宜忌",
      "· 姓名 / 起名：六名层面",
      "急症与慢性病：请先就医；文化调养只作辅助心态与生活习惯参考。",
    ].join("\n"),
  });

  sections.push({
    title: "声明",
    content:
      "不诊断、不处方、不承诺改命结果。象数数字组合请自行检索公开资料并谨慎试用；持续不适、孕妇、儿童、精神心理问题务必专业诊疗。",
  });

  return {
    concern,
    concernLabel: CONCERN_LABEL[concern],
    focus: focus || undefined,
    dayMaster: dayMaster || undefined,
    usefulGods,
    sections,
    summary: `【${CONCERN_LABEL[concern]}】以人和为先，兼顾天时地利：读书与积德为改命主渠道；象数与五行净化仅供文化自学；身体问题优先医疗。`,
    caveat: "文化研习与自我反思参考，非医疗/灵异服务。",
  };
}
