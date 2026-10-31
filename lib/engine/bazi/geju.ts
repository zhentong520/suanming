/** 月令取格 + 成格/破格细则 */

import { MONTH_HIDDEN_STEMS } from "./hidden-stems";

export type GeJuName =
  | "正官格"
  | "七杀格"
  | "正印格"
  | "偏印格"
  | "正财格"
  | "偏财格"
  | "食神格"
  | "伤官格"
  | "建禄格"
  | "羊刃格"
  | "杂气格";

export interface GeJuResult {
  name: GeJuName;
  monthZhi: string;
  monthQi: string;
  tenGod: string;
  /** 取格依据：透干（《子平真诠》透干优先）或月令本气 */
  takenFrom: "透干" | "本气";
  /** 善神顺用 / 恶神逆用（《子平真诠》顺逆法则） */
  shanE: "善" | "恶" | "中";
  usage: "顺用" | "逆用" | "顺势";
  /** 相神提示：格之成立所赖之神，相神受损甚于伤用 */
  xiangShen: string;
  broken: boolean;
  brokenReason?: string;
  /** 败中有成，全凭救应（《子平真诠·论用神成败救应》） */
  rescue?: string[];
  successFactors: string[];
  breakFactors: string[];
  useGodHint: string;
  summary: string;
}

const BRANCH_MAIN_STEM: Record<string, string> = {
  子: "癸",
  丑: "己",
  寅: "甲",
  卯: "乙",
  辰: "戊",
  巳: "丙",
  午: "丁",
  未: "己",
  申: "庚",
  酉: "辛",
  戌: "戊",
  亥: "壬",
};

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

const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

function tenGodOf(dayGan: string, otherGan: string): string {
  if (dayGan === otherGan) return "比肩";
  const a = STEM_WX[dayGan];
  const b = STEM_WX[otherGan];
  if (!a || !b) return "未知";
  const samePolarity = "甲丙戊庚壬".includes(dayGan) === "甲丙戊庚壬".includes(otherGan);
  if (a === b) return samePolarity ? "比肩" : "劫财";
  if (SHENG[b] === a) return samePolarity ? "偏印" : "正印";
  if (SHENG[a] === b) return samePolarity ? "食神" : "伤官";
  if (KE[a] === b) return samePolarity ? "偏财" : "正财";
  if (KE[b] === a) return samePolarity ? "七杀" : "正官";
  return "未知";
}

const TEN_TO_GE: Record<string, GeJuName> = {
  正官: "正官格",
  七杀: "七杀格",
  正印: "正印格",
  偏印: "偏印格",
  正财: "正财格",
  偏财: "偏财格",
  食神: "食神格",
  伤官: "伤官格",
  比肩: "建禄格",
  劫财: "羊刃格",
};

const USE_HINT: Record<GeJuName, string> = {
  正官格: "宜用印护官、财生官，忌伤官见官。",
  七杀格: "宜杀印相生或食神制杀，忌杀重无制。",
  正印格: "宜官杀生印，忌财破印太过。",
  偏印格: "宜有食伤泄秀或官杀卫印，忌枭神夺食。",
  正财格: "宜身财两停，忌比劫夺财、财多身弱。",
  偏财格: "宜身强任财，忌劫财争财。",
  食神格: "宜食神生财，忌枭神夺食。",
  伤官格: "宜伤官配印或伤官生财，忌伤官见官。",
  建禄格: "宜财官食伤流通，忌比劫太旺无制。",
  羊刃格: "宜官杀制刃，忌刃旺无制。",
  杂气格: "宜透干取清，忌混杂无用。",
};

/** 善神顺用、恶神逆用（《子平真诠》：财官印食为善，杀伤枭刃为恶） */
const GE_NATURE: Record<GeJuName, { shanE: "善" | "恶" | "中"; usage: "顺用" | "逆用" | "顺势" }> = {
  正官格: { shanE: "善", usage: "顺用" },
  正印格: { shanE: "善", usage: "顺用" },
  正财格: { shanE: "善", usage: "顺用" },
  偏财格: { shanE: "善", usage: "顺用" },
  食神格: { shanE: "善", usage: "顺用" },
  七杀格: { shanE: "恶", usage: "逆用" },
  伤官格: { shanE: "恶", usage: "逆用" },
  偏印格: { shanE: "恶", usage: "逆用" },
  羊刃格: { shanE: "恶", usage: "逆用" },
  建禄格: { shanE: "中", usage: "顺势" },
  杂气格: { shanE: "中", usage: "顺势" },
};

/** 相神提示（《子平真诠》：格之成败系于相神，伤相甚于伤用） */
const XIANG_SHEN: Record<GeJuName, string> = {
  正官格: "以印为相（官印相生），财星生官亦可",
  七杀格: "以食神制杀或印化杀为相",
  正印格: "以官杀生印为相",
  偏印格: "以食伤泄秀或财星制枭为相",
  正财格: "以官星护财为相",
  偏财格: "以官星护财为相，食伤生财亦可",
  食神格: "以财星为相（食神生财）",
  伤官格: "以印制伤或财星引化为相",
  建禄格: "以官杀制禄、财官流通为相",
  羊刃格: "以官杀制刃为相",
  杂气格: "以透干取清为相",
};

export function computeGeJu(input: {
  dayGan: string;
  monthZhi: string;
  yearGan: string;
  monthGan: string;
  timeGan?: string;
  strength?: string;
}): GeJuResult {
  const stems = [input.yearGan, input.monthGan, input.timeGan].filter(Boolean) as string[];

  // 《子平真诠》「八字用神，专求月令」+ 《渊海子平·宝法》透干取用：
  // 月令藏干透出年/月/时干者优先取格（透干为比劫者不取，顺延其他透干；
  // 皆不透则取月令本气）。多透依藏干表顺序（本气→中气→余气）取本气最强。
  const hidden = MONTH_HIDDEN_STEMS[input.monthZhi] ?? [];
  const transparent = hidden.filter((h) => stems.includes(h));
  let monthQi = BRANCH_MAIN_STEM[input.monthZhi] ?? "戊";
  let takenFrom: "透干" | "本气" = "本气";
  const isBiJie = (s: string) => tenGodOf(input.dayGan, s) === "比肩" || tenGodOf(input.dayGan, s) === "劫财";
  const transNonBiJie = transparent.find((h) => !isBiJie(h));
  if (transNonBiJie) {
    monthQi = transNonBiJie;
    takenFrom = "透干";
  } else if (transparent.length && isBiJie(monthQi)) {
    // 只透比劫且本气即比劫：仍取本气（建禄/羊刃格）
    monthQi = BRANCH_MAIN_STEM[input.monthZhi] ?? "戊";
    takenFrom = "本气";
  }

  const tenGod = tenGodOf(input.dayGan, monthQi);
  let name: GeJuName = TEN_TO_GE[tenGod] ?? "杂气格";
  if (["辰", "戌", "丑", "未"].includes(input.monthZhi) && !TEN_TO_GE[tenGod]) name = "杂气格";

  const gods = stems.map((g) => tenGodOf(input.dayGan, g));
  const has = (g: string) => gods.includes(g);
  const count = (g: string) => gods.filter((x) => x === g).length;

  const nature = GE_NATURE[name];
  const xiangShen = XIANG_SHEN[name];

  const successFactors: string[] = [];
  const breakFactors: string[] = [];
  const rescue: string[] = [];

  // 成格
  if (name === "正官格" && has("正印")) successFactors.push("官印相生，官格较清。");
  if (name === "七杀格" && (has("正印") || has("偏印"))) successFactors.push("杀印相生，杀威得化。");
  if (name === "七杀格" && has("食神")) successFactors.push("食神制杀，才华可展。");
  if (name === "食神格" && (has("正财") || has("偏财"))) successFactors.push("食神生财，财源有气。");
  if (name === "伤官格" && (has("正印") || has("偏印"))) successFactors.push("伤官配印，锋芒得收。");
  if (name === "伤官格" && (has("正财") || has("偏财"))) successFactors.push("伤官生财，以才致富。");
  if (name === "正财格" && has("正官")) successFactors.push("财官双美，利求名求职。");
  if (name === "正印格" && (has("正官") || has("七杀"))) successFactors.push("官杀生印，学问事业有靠。");
  if ((name === "建禄格" || name === "羊刃格") && (has("正官") || has("七杀"))) {
    successFactors.push("禄刃有官杀制衡，可担权责。");
  }
  if (!successFactors.length) successFactors.push("月令取格成立，宜按格用神顺势而行。");

  // 破格
  if (name === "正官格" && has("伤官")) breakFactors.push("官逢伤官，官星受制，格局易破。");
  if (name === "食神格" && has("偏印")) breakFactors.push("食神逢枭，食神被夺，才华难展。");
  if (name === "伤官格" && has("正官")) breakFactors.push("伤官见官，是非口舌，功名易挫。");
  if ((name === "正财格" || name === "偏财格") && count("比肩") + count("劫财") >= 2) {
    breakFactors.push("财多比劫争夺，财星难守。");
  }
  if ((name === "正财格" || name === "偏财格") && input.strength === "偏弱") {
    breakFactors.push("财多身弱，难任财官，宜先扶身。");
  }
  if (name === "正印格" && (has("正财") || has("偏财")) && !has("正官") && !has("七杀")) {
    breakFactors.push("财星破印，学业靠山易损。");
  }
  if (name === "七杀格" && !has("正印") && !has("偏印") && !has("食神") && !has("伤官")) {
    breakFactors.push("杀重无制无化，压力过猛。");
  }
  if (name === "羊刃格" && !has("正官") && !has("七杀")) {
    breakFactors.push("羊刃无制，刚猛易惹事端。");
  }

  // 救应（《子平真诠·论用神成败救应》：「败中有成，全凭救应」）
  if (name === "正官格" && has("伤官") && (has("正印") || has("偏印"))) {
    rescue.push("伤官有印制伏，败中有成，官星得护。");
  }
  if (name === "伤官格" && has("正官") && (has("正印") || has("偏印"))) {
    rescue.push("印能制伤护官，伤官见官有救。");
  }
  if (name === "食神格" && has("偏印") && (has("偏财") || has("正财"))) {
    rescue.push("财能制枭护食，枭神夺食有救。");
  }
  if ((name === "正财格" || name === "偏财格") && count("比肩") + count("劫财") >= 2 && (has("食神") || has("伤官"))) {
    rescue.push("食伤通关化劫生财，比劫争夺有救。");
  }
  if ((name === "正财格" || name === "偏财格") && input.strength === "偏弱" && (has("正印") || has("偏印"))) {
    rescue.push("印星扶身，身弱任财有望。");
  }

  const broken = breakFactors.length > 0 && rescue.length === 0;
  const brokenReason = breakFactors[0];
  const useGodHint = USE_HINT[name];

  const takenDesc =
    takenFrom === "透干"
      ? `月支${input.monthZhi}藏干透出${monthQi}为${tenGod}，透干取格`
      : `月支${input.monthZhi}本气${monthQi}为${tenGod}，本气取格`;
  const rescueDesc = rescue.length ? ` 带忌有救：${rescue.join("；")}` : "";
  const summary = broken
    ? `${takenDesc}取${name}（${nature.shanE}神${nature.usage}）。破格：${breakFactors.join("；")}${rescueDesc} 相神宜${xiangShen}。用神提示：${useGodHint}`
    : `${takenDesc}取${name}（${nature.shanE}神${nature.usage}）。成格：${successFactors.join("；")}${rescueDesc} 相神宜${xiangShen}。用神提示：${useGodHint}`;

  return {
    name,
    monthZhi: input.monthZhi,
    monthQi,
    tenGod,
    takenFrom,
    shanE: nature.shanE,
    usage: nature.usage,
    xiangShen,
    broken,
    brokenReason,
    rescue: rescue.length ? rescue : undefined,
    successFactors,
    breakFactors,
    useGodHint,
    summary,
  };
}
