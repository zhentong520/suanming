/**
 * 六十四卦知识库与详细解读生成
 */
import { loadContentJson } from "@/lib/content/catalog";

export const HEXAGRAM_NAMES = [
  "乾", "坤", "屯", "蒙", "需", "讼", "师", "比", "小畜", "履",
  "泰", "否", "同人", "大有", "谦", "豫", "随", "蛊", "临", "观",
  "噬嗑", "贲", "剥", "复", "无妄", "大畜", "颐", "大过", "坎", "离",
  "咸", "恒", "遁", "大壮", "晋", "明夷", "家人", "睽", "蹇", "解",
  "损", "益", "夬", "姤", "萃", "升", "困", "井", "革", "鼎",
  "震", "艮", "渐", "归妹", "丰", "旅", "巽", "兑", "涣", "节",
  "中孚", "小过", "既济", "未济",
] as const;

export type HexagramName = (typeof HEXAGRAM_NAMES)[number];

interface HexagramDetail {
  fullName: string;
  guaCi: string;
  xiangCi: string;
  overview: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
  timing: string;
  advice: string;
  caution: string;
}

type HexagramDataFile = Record<string, HexagramDetail>;

const YAO_NAMES = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

const YAO_HINTS: Record<string, string> = {
  初爻: "事在起始，宜谨慎布局，勿躁进。",
  二爻: "渐有基础，宜稳中求进，借力而行。",
  三爻: "进退之间，多有反复，需防小人掣肘。",
  四爻: "近君之位，宜审时度势，谨慎决策。",
  五爻: "得位之中，机会显现，可积极作为。",
  上爻: "物极将变，宜知止知足，防过犹不及。",
};

/** 爻位细读：结合本卦象义 */
export function getYaoLineReading(hexagram: string, position: number, lineType?: string): string {
  const pos = YAO_NAMES[position - 1] ?? `第${position}爻`;
  const detail = getHexagramDetail(hexagram);
  const base = YAO_HINTS[pos] ?? "宜灵活应对。";
  const typeHint =
    lineType === "老阳"
      ? "老阳发动，盛极将转，宜见好就收。"
      : lineType === "老阴"
        ? "老阴发动，阴极生阳，宜静极思变。"
        : lineType
          ? `${lineType}静爻，以本爻位义为主。`
          : "";
  return `${pos}（${hexagram}卦）：${base}${typeHint ? typeHint : ""} 本卦提示：${detail.advice}`;
}

export function getHexagramDetail(name: string): HexagramDetail {
  const data = loadContentJson<HexagramDataFile>("hexagrams.json");
  return (
    data[name] ?? {
      fullName: `${name}卦`,
      guaCi: "观卦象以明吉凶。",
      xiangCi: "君子以自强不息。",
      overview: `${name}卦象征特定时势，需结合所问之事灵活体会。`,
      career: "事业宜观察形势，不可盲目冒进。",
      wealth: "财运平稳，宜守成积累。",
      love: "感情需真诚沟通，循序渐进。",
      health: "注意作息规律，避免过劳。",
      timing: "时机尚未完全成熟，宜耐心等待。",
      advice: "顺势而为，守正持中。",
      caution: "忌急躁妄动，忌意气用事。",
    }
  );
}

export interface HexagramReadingOptions {
  question?: string;
  method?: string;
  changingHexagram?: string;
  changingYao?: number | string;
  changingLines?: Array<{ position: number; type: string; changing: boolean }>;
}

export function buildHexagramReading(hexagram: string, options: HexagramReadingOptions = {}) {
  const detail = getHexagramDetail(hexagram);
  const changingDetail = options.changingHexagram
    ? getHexagramDetail(options.changingHexagram)
    : null;

  let changingYaoText = "";
  if (typeof options.changingYao === "number") {
    changingYaoText = YAO_NAMES[options.changingYao - 1] ?? `第${options.changingYao}爻`;
  } else if (typeof options.changingYao === "string") {
    changingYaoText = options.changingYao;
  }

  const changingLines = options.changingLines?.filter((l) => l.changing) ?? [];
  const changingAnalysis = changingDetail
    ? `本卦${hexagram}象征当下局面，变卦${options.changingHexagram}提示发展趋势。${changingYaoText ? `动爻在${changingYaoText}，${YAO_HINTS[changingYaoText] ?? "宜观变而调整策略。"}` : ""}变后之势：${changingDetail.overview}`
  : changingYaoText
    ? `动爻在${changingYaoText}。${YAO_HINTS[changingYaoText]}`
    : "卦象静而不变，以本卦卦义为主。";

  const lineAnalysis =
    changingLines.length > 0
      ? changingLines
          .map((l) => getYaoLineReading(hexagram, l.position, l.type))
          .join("\n")
      : "";

  return {
    question: options.question ?? "一般问事",
    method: options.method ?? "易经",
    hexagram,
    ...detail,
    changingHexagram: options.changingHexagram,
    changingYao: changingYaoText || undefined,
    changingAnalysis,
    lineAnalysis: lineAnalysis || undefined,
    sections: [
      { title: "卦辞", content: detail.guaCi },
      { title: "象辞", content: detail.xiangCi },
      { title: "总论", content: detail.overview },
      { title: "事业", content: detail.career },
      { title: "财运", content: detail.wealth },
      { title: "感情", content: detail.love },
      { title: "健康", content: detail.health },
      { title: "时机", content: detail.timing },
      { title: "变卦分析", content: changingAnalysis },
      ...(lineAnalysis ? [{ title: "动爻细读", content: lineAnalysis }] : []),
      { title: "建议", content: detail.advice },
      { title: "注意事项", content: detail.caution },
    ],
    summary: `得${detail.fullName}。${detail.guaCi} ${detail.overview}`,
  };
}

export function hexagramIndexToName(idx: number): string {
  return HEXAGRAM_NAMES[idx % 64] ?? "乾";
}
