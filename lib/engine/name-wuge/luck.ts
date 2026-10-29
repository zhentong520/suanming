/** 五格 81 数理吉凶（姓名学通行表） */
export const LUCK_MAP: Record<number, { luck: "大吉" | "吉" | "半吉" | "平" | "凶"; desc: string }> = {
  1: { luck: "大吉", desc: "太极之数，万物开泰，生发顺利。" },
  2: { luck: "凶", desc: "两仪未分，分离变动，根基不稳。" },
  3: { luck: "大吉", desc: "三才成形，立身出世，家庭兴盛。" },
  4: { luck: "凶", desc: "四象破败，多劳少成，宜守勿躁。" },
  5: { luck: "大吉", desc: "五行俱全，福禄长寿，富贵荣华。" },
  6: { luck: "大吉", desc: "六爻安稳，天德贵人，余庆绵长。" },
  7: { luck: "吉", desc: "七政光明，刚健进取，勤勉有成。" },
  8: { luck: "吉", desc: "八卦周全，意志刚强，发展稳健。" },
  9: { luck: "凶", desc: "九限将尽，兴后转困，宜防损耗。" },
  10: { luck: "凶", desc: "十成终局，满则易亏，事多阻滞。" },
  11: { luck: "大吉", desc: "旱苗得雨，枯木逢春，贵人提携。" },
  12: { luck: "凶", desc: "薄弱之象，孤立无助，宜结善缘。" },
  13: { luck: "大吉", desc: "春日牡丹，才艺出众，名利双收。" },
  14: { luck: "凶", desc: "漂泊不定，家庭缘薄，宜定心立业。" },
  15: { luck: "大吉", desc: "福寿圆满，贵人得助，家道兴隆。" },
  16: { luck: "大吉", desc: "厚德载物，安富尊荣，晚景更佳。" },
  17: { luck: "半吉", desc: "刚柔相济，先难后易，贵在坚持。" },
  18: { luck: "大吉", desc: "铁铸铜浇，权威稳健，事业可成。" },
  19: { luck: "凶", desc: "多难兴邦，智谋不足时易挫，宜谦慎。" },
  20: { luck: "凶", desc: "空亡破运，波折频繁，宜积德缓进。" },
  21: { luck: "大吉", desc: "明月中天，光风霁月，清贵显达。" },
  22: { luck: "凶", desc: "秋草逢霜，怀才不遇，宜改换赛道。" },
  23: { luck: "大吉", desc: "旭日东升，壮丽可观，前程开阔。" },
  24: { luck: "大吉", desc: "掘藏得金，家门余庆，财帛渐丰。" },
  25: { luck: "大吉", desc: "资性英敏，才能颖异，学业事业皆利。" },
  26: { luck: "凶", desc: "变怪起伏，是非较多，宜守正避险。" },
  27: { luck: "半吉", desc: "增长之象，先争后和，可成于协作。" },
  28: { luck: "凶", desc: "家亲缘薄，离群独处，宜广结人缘。" },
  29: { luck: "半吉", desc: "智谋出众，功名可期，忌骄矜。" },
  30: { luck: "半吉", desc: "非业破运夹杂，成中有败，宜稳扎稳打。" },
  31: { luck: "大吉", desc: "智勇得志，统领众人，领导运旺。" },
  32: { luck: "大吉", desc: "宝马金鞍，权贵显达，名利双收。" },
  33: { luck: "大吉", desc: "旭日升天，鸾凤和鸣，喜庆兴旺。" },
  34: { luck: "凶", desc: "破耗之数，事倍功半，宜量力而行。" },
  35: { luck: "吉", desc: "温良通达，智虑周全，人缘财运皆可。" },
  36: { luck: "凶", desc: "风波暗涌，是非口舌，宜谨言慎行。" },
  37: { luck: "大吉", desc: "权威忠烈，热诚进取，可成大事。" },
  38: { luck: "半吉", desc: "艺文之象，才名可传，财运平平。" },
  39: { luck: "大吉", desc: "富贵荣华，变化无穷，机遇较多。" },
  40: { luck: "凶", desc: "退守之数，进取受阻，宜守成修德。" },
  41: { luck: "大吉", desc: "德高望重，事事如意，晚运昌隆。" },
  42: { luck: "凶", desc: "艰难辛苦，宜防小人，稳中求进。" },
  43: { luck: "凶", desc: "花开易谢，虚名虚利，宜务实。" },
  44: { luck: "凶", desc: "坎坷曲折，劳心费力，宜耐心。" },
  45: { luck: "大吉", desc: "顺风扬帆，新生泰和，诸事可成。" },
  46: { luck: "凶", desc: "冷淡消沉，进取不足，宜振奋精神。" },
  47: { luck: "大吉", desc: "开花结果，权威进取，成果丰硕。" },
  48: { luck: "大吉", desc: "德智兼备，出身清贵，名实相符。" },
  49: { luck: "半吉", desc: "吉凶参半，成败在人，贵在抉择。" },
  50: { luck: "平", desc: "小成之数，平稳有余，大运不足。" },
  51: { luck: "半吉", desc: "盛衰交替，先盛后衰或反之，宜审时。" },
  52: { luck: "大吉", desc: "先见之明，稳健成功，财官皆利。" },
  53: { luck: "凶", desc: "内外不和，事多反复，宜调和人际关系。" },
  54: { luck: "凶", desc: "破败离散，心力交瘁，宜休养生息。" },
  55: { luck: "半吉", desc: "暗藏转机，先困后通，坚持有望。" },
  56: { luck: "凶", desc: "守成困难，变故较多，宜防意外。" },
  57: { luck: "大吉", desc: "寒雪青松，晚年昌盛，厚积薄发。" },
  58: { luck: "半吉", desc: "先苦后甘，中年后渐佳。" },
  59: { luck: "凶", desc: "无力动荡，理想难成，宜脚踏实地。" },
  60: { luck: "凶", desc: "暗淡无光，运势低迷，宜修身养德、稳中求进。" },
  61: { luck: "大吉", desc: "名利双收，繁荣之象，可担重任。" },
  62: { luck: "凶", desc: "衰败之象，进退两难，宜守勿进。" },
  63: { luck: "大吉", desc: "舟楫得水，事业畅达，贵人助力。" },
  64: { luck: "凶", desc: "骨肉分离，事多不顺，宜修身齐家。" },
  65: { luck: "大吉", desc: "天长地久，福寿双全，家运长久。" },
  66: { luck: "凶", desc: "内外不和，暗中损耗，宜防口舌。" },
  67: { luck: "大吉", desc: "独步青云，志得意满，前程远大。" },
  68: { luck: "大吉", desc: "思虑周详，成功可期，稳健发展。" },
  69: { luck: "凶", desc: "进退维谷，压力较大，宜减负。" },
  70: { luck: "凶", desc: "空虚无实，徒有其表，宜务本。" },
  71: { luck: "半吉", desc: "寒梅晚香，晚年渐佳。" },
  72: { luck: "凶", desc: "劳而无功，付出难偿，宜换方向。" },
  73: { luck: "半吉", desc: "守成有余，进取不足，宜稳健经营。" },
  74: { luck: "凶", desc: "半途而废，事难圆满，宜有始有终。" },
  75: { luck: "半吉", desc: "守旧安稳，不宜冒险。" },
  76: { luck: "凶", desc: "内外逼迫，压力重重，宜求援。" },
  77: { luck: "半吉", desc: "喜忧参半，成中有败。" },
  78: { luck: "凶", desc: "困难重重，宜耐心等待时机。" },
  79: { luck: "凶", desc: "穷途末路之象，宜改弦更张。" },
  80: { luck: "凶", desc: "悲忧困苦，运势低迷，宜积善。" },
  81: { luck: "大吉", desc: "还原归真，循环再起，圆满有成。" },
};

export type WuXing = "金" | "木" | "水" | "火" | "土";

export const WUXING_MAP: Record<number, WuXing> = {
  1: "木",
  2: "木",
  3: "火",
  4: "火",
  5: "土",
  6: "土",
  7: "金",
  8: "金",
  9: "水",
  0: "水",
};

const SHENG: Record<WuXing, WuXing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<WuXing, WuXing> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export function reduceTo81(n: number): number {
  while (n > 81) n -= 80;
  return n || 1;
}

export function getLuck(num: number) {
  const n = reduceTo81(num);
  return LUCK_MAP[n] ?? { luck: "平" as const, desc: "数理平常，宜勤勉以补。" };
}

export function numberElement(n: number): WuXing {
  return WUXING_MAP[reduceTo81(n) % 10];
}

function relation(a: WuXing, b: WuXing): "生" | "同" | "泄" | "克" | "被克" {
  if (a === b) return "同";
  if (SHENG[a] === b) return "生";
  if (SHENG[b] === a) return "泄";
  if (KE[a] === b) return "克";
  return "被克";
}

/** 经典三才配置评分：天人、人地两段 */
export function analyzeSancai(tian: WuXing, ren: WuXing, di: WuXing) {
  const tr = relation(tian, ren);
  const rd = relation(ren, di);

  let score = 55;
  const notes: string[] = [];

  // 天生人 / 人生地最佳
  if (tr === "生") {
    score += 18;
    notes.push(`天(${tian})生人(${ren})，先天得助`);
  } else if (tr === "同") {
    score += 10;
    notes.push(`天人同属${ren}，气势连贯`);
  } else if (tr === "泄") {
    score += 4;
    notes.push(`人泄天，才华外发但耗祖泽`);
  } else if (tr === "被克") {
    score -= 14;
    notes.push(`天克人，压力与约束偏重`);
  } else {
    score -= 8;
    notes.push(`人克天，个性强而易顶撞长辈`);
  }

  if (rd === "生") {
    score += 18;
    notes.push(`人(${ren})生地(${di})，事业根基得展`);
  } else if (rd === "同") {
    score += 10;
    notes.push(`人地同气，落地稳`);
  } else if (rd === "泄") {
    score += 2;
    notes.push(`地泄人，付出多回收慢`);
  } else if (rd === "被克") {
    score -= 14;
    notes.push(`地克人，早年或环境多磨`);
  } else {
    score -= 8;
    notes.push(`人克地，进取有余而根基不稳`);
  }

  // 三才同气或连环相生加分
  if (tian === ren && ren === di) {
    score += 6;
    notes.push("三才一气，格局纯粹");
  }
  if (SHENG[tian] === ren && SHENG[ren] === di) {
    score += 10;
    notes.push("三才连环相生，大吉配置");
  }

  score = Math.max(20, Math.min(98, score));
  const luck = score >= 82 ? "大吉" : score >= 68 ? "吉" : score >= 52 ? "平" : "凶";
  const config = `${tian}${ren}${di}`;

  return {
    config,
    tian,
    ren,
    di,
    tianRen: tr,
    renDi: rd,
    score,
    luck,
    desc: notes.join("；") || "三才关系中性。",
  };
}

export function luckPoints(luck: string): number {
  if (luck === "大吉") return 20;
  if (luck === "吉") return 15;
  if (luck === "半吉") return 12;
  if (luck === "平") return 9;
  return 4;
}
