import { BirthInput, buildLunarFromBirth, computeCalendar } from "../calendar";
import { computeBazi } from "../bazi";
import { BRANCH_MAIN_WX, type WuXing } from "../bazi/strength";
import { getZodiacRelation } from "../zodiac";
import { computeZiwei } from "../ziwei";
import { compareDualSiHua, type SiHuaLite } from "./sihua-compare";

const SHENG: Record<string, string> = { 金: "水", 水: "木", 木: "火", 火: "土", 土: "金" };
const KE: Record<string, string> = { 金: "木", 木: "土", 土: "水", 水: "火", 火: "金" };

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const LIU_HE: Record<string, string> = {
  子: "丑",
  丑: "子",
  寅: "亥",
  亥: "寅",
  卯: "戌",
  戌: "卯",
  辰: "酉",
  酉: "辰",
  巳: "申",
  申: "巳",
  午: "未",
  未: "午",
};

const LIU_CHONG: Record<string, string> = {
  子: "午",
  午: "子",
  丑: "未",
  未: "丑",
  寅: "申",
  申: "寅",
  卯: "酉",
  酉: "卯",
  辰: "戌",
  戌: "辰",
  巳: "亥",
  亥: "巳",
};

/** 纳音五行末字 */
function naYinElement(naYin: string): string {
  const m = naYin.match(/[金木水火土]/);
  return m?.[0] ?? "土";
}

function naYinRelation(nyA: string, nyB: string): { score: number; desc: string } {
  const a = naYinElement(nyA);
  const b = naYinElement(nyB);
  if (a === b) return { score: 78, desc: `纳音同属${a}，气质相近，宜防固执。` };
  if (SHENG[a] === b) return { score: 88, desc: `纳音${nyA}生${nyB}，一方滋养，缘分较顺。` };
  if (SHENG[b] === a) return { score: 86, desc: `纳音${nyB}生${nyA}，得对方助力。` };
  if (KE[a] === b || KE[b] === a) return { score: 45, desc: `纳音${nyA}与${nyB}相克，需多包容。` };
  return { score: 68, desc: `纳音${nyA}与${nyB}关系平和。` };
}

function tenGodRelation(a: string, b: string): { score: number; desc: string } {
  if (SHENG[a] === b) return { score: 88, desc: `${a}生${b}，一方付出滋养，宜互相扶持。` };
  if (SHENG[b] === a) return { score: 86, desc: `${b}生${a}，得对方助力，缘分较佳。` };
  if (a === b) return { score: 72, desc: "同五行日主，性情相近，宜防过于相似而缺互补。" };
  if (KE[a] === b || KE[b] === a) return { score: 48, desc: "日主相克，需多包容，避免争强。" };
  return { score: 68, desc: "日主关系平和，可长期磨合。" };
}

function dayBranchRelation(zhiA: string, zhiB: string): { type: string; score: number; desc: string } {
  if (!zhiA || !zhiB) return { type: "未知", score: 60, desc: "日支不全，夫妻宫暂略。" };
  if (zhiA === zhiB) return { type: "日支同气", score: 78, desc: "夫妻宫同支，习性相近，宜防固执。" };
  if (LIU_HE[zhiA] === zhiB) return { type: "日支六合", score: 92, desc: "夫妻宫六合，感情黏合度高，宜珍惜经营。" };
  if (LIU_CHONG[zhiA] === zhiB) return { type: "日支六冲", score: 38, desc: "夫妻宫六冲，争执易起，需制度与沟通补足。" };
  return { type: "日支平和", score: 66, desc: "夫妻宫无大冲合，重在日常相处。" };
}

function yongShenCross(
  usefulA: WuXing[],
  avoidA: WuXing[],
  elementB: string,
  dayZhiB: string
): { score: number; desc: string } {
  const zWx = BRANCH_MAIN_WX[dayZhiB] as WuXing | undefined;
  const elB = elementB as WuXing;
  let score = 55;
  const notes: string[] = [];
  if (usefulA.includes(elB)) {
    score += 18;
    notes.push(`对方日主${elB}正好是我方喜用`);
  }
  if (avoidA.includes(elB)) {
    score -= 16;
    notes.push(`对方日主${elB}接近我方忌神，需磨合`);
  }
  if (zWx && usefulA.includes(zWx)) {
    score += 12;
    notes.push(`对方日支${dayZhiB}(${zWx})助我方喜用`);
  }
  if (zWx && avoidA.includes(zWx)) {
    score -= 10;
    notes.push(`对方日支加重我方忌神，宜缓冲突`);
  }
  score = Math.max(25, Math.min(95, score));
  return {
    score,
    desc: notes.length ? notes.join("；") : "双方喜用交叉中性，以包容沟通为主。",
  };
}

/** 男看财星、女看官星是否透出 */
function spouseStarHint(tenGods: string[], gender?: string): string {
  const g = gender === "女" ? "女" : "男";
  if (g === "男") {
    const has = tenGods.some((t) => t === "正财" || t === "偏财");
    return has ? "男方命局财星透干，妻缘信息较显。" : "男方财星不显，妻缘多看大运流年引发。";
  }
  const has = tenGods.some((t) => t === "正官" || t === "七杀");
  return has ? "女方命局官杀透干，夫缘信息较显。" : "女方官星不显，夫缘多看大运流年引发。";
}

function ziweiSpouseStars(input: BirthInput): {
  text: string;
  score: number;
  siHua: SiHuaLite[];
} {
  try {
    const zw = computeZiwei(input);
    const palaces = zw.palaces as Array<{ palace: string; text: string; mainStars?: string[] }>;
    const fu = palaces?.find((p) => p.palace === "夫妻");
    const sihua = ((zw.siHua as SiHuaLite[]) ?? []).map((s) => ({
      star: s.star,
      hua: s.hua,
      palace: s.palace,
    }));
    const huaInFu = sihua.filter((s) => s.palace === "夫妻");
    let score = 65;
    if (huaInFu.some((h) => h.hua === "禄" || h.hua === "科")) score += 12;
    if (huaInFu.some((h) => h.hua === "忌")) score -= 15;
    if (fu?.text?.includes("庙") || fu?.text?.includes("旺")) score += 8;
    if (fu?.text?.includes("陷")) score -= 8;
    return {
      text: `紫微夫妻宫：${fu?.text ?? "—"}${huaInFu.length ? `；四化：${huaInFu.map((h) => `${h.star}化${h.hua}`).join("、")}` : ""}`,
      score: Math.max(30, Math.min(95, score)),
      siHua: sihua,
    };
  } catch {
    return { text: "紫微夫妻宫暂未能排", score: 60, siHua: [] };
  }
}

export function computeMatchmaking(profileA: BirthInput, profileB: BirthInput) {
  const calA = computeCalendar(profileA);
  const calB = computeCalendar(profileB);
  const baziA = computeBazi(profileA);
  const baziB = computeBazi(profileB);
  const { lunar: lunarA } = buildLunarFromBirth(profileA);
  const { lunar: lunarB } = buildLunarFromBirth(profileB);
  const nyA = lunarA.getDayNaYin();
  const nyB = lunarB.getDayNaYin();
  const naYinRel = naYinRelation(nyA, nyB);

  const zodiacRel = getZodiacRelation(calA.shengXiao, calB.shengXiao);
  const dayZhiA = baziA.ganZhiDay?.[1] ?? "";
  const dayZhiB = baziB.ganZhiDay?.[1] ?? "";
  const spousePalace = dayBranchRelation(dayZhiA, dayZhiB);

  const elementsA = baziA.elementCount;
  const elementsB = baziB.elementCount;
  const complementScore = (() => {
    let score = 60;
    for (const el of ["金", "木", "水", "火", "土"]) {
      if ((elementsA[el] === 0 && elementsB[el] > 0) || (elementsB[el] === 0 && elementsA[el] > 0)) {
        score += 8;
      }
    }
    return Math.min(95, score);
  })();

  const dayRel = tenGodRelation(baziA.dayMasterElement, baziB.dayMasterElement);
  const usefulA = (baziA.yongShen?.usefulGods ?? []) as WuXing[];
  const avoidA = (baziA.yongShen?.avoidGods ?? []) as WuXing[];
  const usefulB = (baziB.yongShen?.usefulGods ?? []) as WuXing[];
  const avoidB = (baziB.yongShen?.avoidGods ?? []) as WuXing[];

  const crossAB = yongShenCross(usefulA, avoidA, baziB.dayMasterElement, dayZhiB);
  const crossBA = yongShenCross(usefulB, avoidB, baziA.dayMasterElement, dayZhiA);
  const yongShenScore = Math.round((crossAB.score + crossBA.score) / 2);

  const zwA = ziweiSpouseStars(profileA);
  const zwB = ziweiSpouseStars(profileB);
  const sihuaCompare = compareDualSiHua(zwA.siHua, zwB.siHua, "A", "B");
  const ziweiScore = Math.round((zwA.score + zwB.score) / 2 * 0.55 + sihuaCompare.score * 0.45);

  const starHintA = spouseStarHint(baziA.tenGods, profileA.gender);
  const starHintB = spouseStarHint(baziB.tenGods, profileB.gender);

  const sharedMissing = baziA.missingElements.filter((e) => baziB.missingElements.includes(e));
  const complementMissing = [
    ...baziA.missingElements.filter((e) => (elementsB[e] ?? 0) > 0),
    ...baziB.missingElements.filter((e) => (elementsA[e] ?? 0) > 0),
  ];
  const uniqueMissing = [...new Set(complementMissing)];

  const totalScore = Math.round(
    zodiacRel.score * 0.12 +
      complementScore * 0.12 +
      dayRel.score * 0.15 +
      spousePalace.score * 0.18 +
      yongShenScore * 0.15 +
      naYinRel.score * 0.13 +
      ziweiScore * 0.15
  );

  return {
    personA: {
      zodiac: calA.shengXiao,
      dayMaster: baziA.dayMaster,
      dayPillar: baziA.ganZhiDay,
      dayNaYin: nyA,
      element: baziA.dayMasterElement,
      strength: baziA.strength,
      usefulGods: usefulA,
      avoidGods: avoidA,
      tenGods: baziA.tenGods,
      ziweiSpouse: zwA.text,
      siHua: zwA.siHua,
    },
    personB: {
      zodiac: calB.shengXiao,
      dayMaster: baziB.dayMaster,
      dayPillar: baziB.ganZhiDay,
      dayNaYin: nyB,
      element: baziB.dayMasterElement,
      strength: baziB.strength,
      usefulGods: usefulB,
      avoidGods: avoidB,
      tenGods: baziB.tenGods,
      ziweiSpouse: zwB.text,
      siHua: zwB.siHua,
    },
    scores: {
      zodiac: zodiacRel.score,
      wuxingComplement: complementScore,
      dayMaster: dayRel.score,
      spousePalace: spousePalace.score,
      yongShenCross: yongShenScore,
      naYin: naYinRel.score,
      ziweiSpouse: ziweiScore,
      sihuaCompare: sihuaCompare.score,
      total: totalScore,
    },
    zodiacRelation: zodiacRel,
    spousePalaceRelation: spousePalace,
    naYinRelation: naYinRel,
    dayMasterRelation: dayRel.desc,
    spouseStarHints: `${starHintA} ${starHintB}`,
    yongShenCross: {
      aSeesB: crossAB,
      bSeesA: crossBA,
    },
    yongShenHint:
      uniqueMissing.length > 0
        ? `双方可互补缺失五行「${uniqueMissing.join("、")}」。${crossAB.desc}；${crossBA.desc}`
        : `${crossAB.desc}；${crossBA.desc}`,
    sharedMissingElements: sharedMissing,
    sihuaCompare,
    summary:
      totalScore >= 80
        ? `整体匹配度较高：生肖、纳音、夫妻宫与喜用交叉较协调。${sihuaCompare.summary}`
        : totalScore >= 60
          ? `匹配度中等，纳音/日支/喜用有互补也有摩擦，需互相理解。${sihuaCompare.summary}`
          : `匹配度偏低，冲克或忌神交叉较显，建议重视沟通与边界。${sihuaCompare.summary}`,
    details: [
      `生肖关系：${zodiacRel.type}，${zodiacRel.desc}`,
      `纳音：${nyA} × ${nyB}，${naYinRel.desc}`,
      `夫妻宫（日支）：${spousePalace.type}，${spousePalace.desc}`,
      `喜用交叉：A看B ${crossAB.score}分；B看A ${crossBA.score}分`,
      starHintA,
      starHintB,
      `A ${zwA.text}`,
      `B ${zwB.text}`,
      `四化对照：${sihuaCompare.summary}`,
      ...sihuaCompare.notes,
      `五行互补：${complementScore}分`,
      `日主关系：${dayRel.score}分，${dayRel.desc}`,
    ],
  };
}
