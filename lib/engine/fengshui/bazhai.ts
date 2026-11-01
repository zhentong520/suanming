/**
 * 八宅 · 大游年歌引擎（《八宅明镜》《八宅十书》）
 *
 * 大游年歌八句（伏位起，顺时针布七星于余宫）：
 *   乾六天五祸绝延生　坎五天生延绝祸六
 *   艮六绝祸生延天五　震延生祸绝五天六
 *   巽天五六祸生绝延　离六五绝延祸生天
 *   坤天延绝生祸五六　兑生祸延绝六五天
 * 九星星性：生气贪狼木上吉、延年武曲金上吉、天医巨门土中吉、伏位辅弼木小吉；
 *           绝命破军金大凶、五鬼廉贞火大凶、祸害禄存土次凶、六煞文曲水次凶。
 * 应期：「生气辅弼亥卯未，延年绝命巳酉丑；天医四土宫，五鬼寅午戌，六煞申子辰。」
 * 门主灶三要：门纳气、主居卧、灶坐凶向吉。
 * 仅供文化参考。
 */

export type BaZhaiStar =
  | "生气" | "天医" | "延年" | "伏位"
  | "绝命" | "五鬼" | "祸害" | "六煞";

export const STAR_ELEMENT: Record<BaZhaiStar, string> = {
  生气: "木", 延年: "金", 天医: "土", 伏位: "木",
  绝命: "金", 五鬼: "火", 祸害: "土", 六煞: "水",
};

export const STAR_GRADE: Record<BaZhaiStar, { kind: "吉" | "凶"; grade: string }> = {
  生气: { kind: "吉", grade: "上吉（贪狼木星）" },
  延年: { kind: "吉", grade: "上吉（武曲金星）" },
  天医: { kind: "吉", grade: "中吉（巨门土星）" },
  伏位: { kind: "吉", grade: "小吉（辅弼木星）" },
  绝命: { kind: "凶", grade: "大凶（破军金星）" },
  五鬼: { kind: "凶", grade: "大凶（廉贞火星）" },
  祸害: { kind: "凶", grade: "次凶（禄存土星）" },
  六煞: { kind: "凶", grade: "次凶（文曲水星）" },
};

/** 应期三合（九星兴废年） */
export const STAR_YING_QI: Record<BaZhaiStar, string> = {
  生气: "亥卯未", 伏位: "亥卯未",
  延年: "巳酉丑", 绝命: "巳酉丑",
  天医: "辰戌丑未", 祸害: "辰戌丑未",
  五鬼: "寅午戌", 六煞: "申子辰",
};

/** 大游年歌：伏位卦 → 七字（按宫序「伏位下一位起顺时针」布） */
const DAYOU_NIAN: Record<string, string> = {
  乾: "六天五祸绝延生",
  坎: "五天生延绝祸六",
  艮: "六绝祸生延天五",
  震: "延生祸绝五天六",
  巽: "天五六祸生绝延",
  离: "六五绝延祸生天",
  坤: "天延绝生祸五六",
  兑: "生祸延绝六五天",
};

const CHAR_TO_STAR: Record<string, BaZhaiStar> = {
  生: "生气", 天: "天医", 延: "延年", 六: "六煞",
  五: "五鬼", 祸: "祸害", 绝: "绝命",
};

/** 顺时针宫序（自北起）：伏位下一位从此序列取 */
const PALACE_ORDER = ["坎", "艮", "震", "巽", "离", "坤", "兑", "乾"];

export interface BaZhaiPalace {
  direction: string;
  palace: string;
  star: BaZhaiStar;
  kind: "吉" | "凶";
  grade: string;
  element: string;
  yingQi: string;
  usage: string;
}

const STAR_USAGE: Record<BaZhaiStar, string> = {
  生气: "最宜大门、书房、儿童房（旺丁旺才利智力）",
  天医: "宜主卧、年轻夫妇房（健康和合）",
  延年: "宜老人房、主卧（寿命和睦）",
  伏位: "宜神位、静修",
  绝命: "只宜厨房、厕所（常加火炼可化）",
  五鬼: "只宜厕所、碾磨、仓库",
  祸害: "宜储物、厕浴",
  六煞: "宜浴室、储藏",
};

export interface BaZhaiResult {
  zhaiGua: string;
  fuWei: string;
  eastFour: boolean;
  palaces: BaZhaiPalace[];
  sanYao: string;
  note: string;
}

/**
 * 八宅大游年：按宅卦（或命卦代宅）布九星于八方。
 * zhaiGua ∈ 乾坤艮兑坎离震巽。
 */
export function computeBazhai(zhaiGua: string): BaZhaiResult {
  const verse = DAYOU_NIAN[zhaiGua];
  if (!verse) throw new Error(`未知宅卦：${zhaiGua}`);
  const startIdx = PALACE_ORDER.indexOf(zhaiGua);
  const palaces: BaZhaiPalace[] = [
    {
      direction: directionOf(zhaiGua),
      palace: zhaiGua,
      star: "伏位",
      kind: "吉",
      grade: STAR_GRADE["伏位"].grade,
      element: STAR_ELEMENT["伏位"],
      yingQi: STAR_YING_QI["伏位"],
      usage: STAR_USAGE["伏位"],
    },
  ];
  for (let i = 0; i < 7; i++) {
    const palace = PALACE_ORDER[(startIdx + 1 + i) % 8];
    const star = CHAR_TO_STAR[verse[i]] as BaZhaiStar;
    palaces.push({
      direction: directionOf(palace),
      palace,
      star,
      kind: STAR_GRADE[star].kind,
      grade: STAR_GRADE[star].grade,
      element: STAR_ELEMENT[star],
      yingQi: STAR_YING_QI[star],
      usage: STAR_USAGE[star],
    });
  }

  const eastFour = ["坎", "震", "巽", "离"].includes(zhaiGua);
  const luckyStars = palaces.filter((p) => p.kind === "吉").map((p) => `${p.direction}${p.star}`);

  return {
    zhaiGua,
    fuWei: directionOf(zhaiGua),
    eastFour,
    palaces,
    sanYao:
      "门主灶三要：大门（纳气口）、主卧（久居之所）宜落生气/延年/天医吉方；灶宜坐凶向吉——坐绝命五鬼压住煞气，灶口朝生气纳吉气。",
    note: `${eastFour ? "东四" : "西四"}宅（${zhaiGua}），吉方：${luckyStars.join("、")}。东四命宜东四宅，西四命宜西四宅，门主灶同归一类为全吉。`,
  };
}

function directionOf(gua: string): string {
  const map: Record<string, string> = {
    坎: "北", 艮: "东北", 震: "东", 巽: "东南",
    离: "南", 坤: "西南", 兑: "西", 乾: "西北",
  };
  return map[gua] ?? gua;
}

export { PALACE_ORDER, DAYOU_NIAN };
