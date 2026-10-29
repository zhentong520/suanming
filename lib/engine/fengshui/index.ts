import { BirthInput, computeCalendar } from "../calendar";
import { computeFeixingChart, STAR_NATURE } from "./feixing";

const GUA_INFO: Record<number, { name: string; element: string; group: string; lucky: string[]; unlucky: string[] }> = {
  1: { name: "坎", element: "水", group: "东四命", lucky: ["北", "东", "东南", "南"], unlucky: ["西南", "西北", "西", "东北"] },
  2: { name: "坤", element: "土", group: "西四命", lucky: ["西南", "西北", "西", "东北"], unlucky: ["北", "东", "东南", "南"] },
  3: { name: "震", element: "木", group: "东四命", lucky: ["北", "东", "东南", "南"], unlucky: ["西南", "西北", "西", "东北"] },
  4: { name: "巽", element: "木", group: "东四命", lucky: ["北", "东", "东南", "南"], unlucky: ["西南", "西北", "西", "东北"] },
  6: { name: "乾", element: "金", group: "西四命", lucky: ["西南", "西北", "西", "东北"], unlucky: ["北", "东", "东南", "南"] },
  7: { name: "兑", element: "金", group: "西四命", lucky: ["西南", "西北", "西", "东北"], unlucky: ["北", "东", "东南", "南"] },
  8: { name: "艮", element: "土", group: "西四命", lucky: ["西南", "西北", "西", "东北"], unlucky: ["北", "东", "东南", "南"] },
  9: { name: "离", element: "火", group: "东四命", lucky: ["北", "东", "东南", "南"], unlucky: ["西南", "西北", "西", "东北"] },
};

function calcMingGua(year: number, gender: string): number {
  const yy = year % 100;
  const isPost2000 = year >= 2000;
  let gua: number;
  if (gender === "女") {
    gua = isPost2000 ? (yy + 6) % 9 : (yy + 5) % 9;
  } else {
    gua = isPost2000 ? (99 - yy) % 9 : (100 - yy) % 9;
  }
  if (gua === 0) gua = gender === "女" && !isPost2000 ? 8 : gender === "女" ? 8 : 9;
  if (gua === 5) gua = gender === "女" ? 8 : 2;
  return gua;
}

export function computeFengshui(
  input: BirthInput,
  params?: { facing?: string; sitting?: string; houseYear?: number }
) {
  const cal = computeCalendar(input);
  const guaNum = calcMingGua(input.year, input.gender ?? "男");
  const info = GUA_INFO[guaNum];
  const houseYear = params?.houseYear ? Number(params.houseYear) : new Date().getFullYear();
  const feixing = computeFeixingChart({
    year: houseYear,
    facing: params?.facing,
    sitting: params?.sitting,
  });

  const facingIsLucky = info.lucky.includes(feixing.facing);
  const comboNote = facingIsLucky
    ? `向首${feixing.facing}亦属本命吉方，八宅与飞星较合。`
    : `向首${feixing.facing}不在八宅吉方（吉方：${info.lucky.join("、")}），布局上宜以飞星化煞、八宅择床位互补。`;

  const nianLines = feixing.nianPan
    .filter((p) => p.palace !== 5)
    .map((p) => `${p.direction}：${p.star}${STAR_NATURE[p.star]?.name ?? ""}`)
    .join("；");

  return {
    mingGua: `${info.name}卦（${guaNum}）`,
    element: info.element,
    group: info.group,
    shengXiao: cal.shengXiao,
    luckyDirections: info.lucky,
    unluckyDirections: info.unlucky,
    bedroomTip: `卧室宜选${info.lucky[0]}、${info.lucky[1]}方位。`,
    deskTip: `书桌宜面向${info.lucky[2]}或${info.lucky[3]}。`,
    facing: feixing.facing,
    sitting: feixing.sitting,
    houseYear,
    periodName: feixing.period.name,
    periodRange: feixing.period.range,
    yearStar: feixing.yearStar,
    facingYunStar: feixing.facingStars.yun,
    facingNianStar: feixing.facingStars.nian,
    feixingAdvice: feixing.advice,
    feixingSummary: feixing.summary,
    nianPanText: nianLines,
    yunPan: feixing.yunPan,
    nianPan: feixing.nianPan,
    comboNote,
    summary: `本命${info.name}卦（${info.group}）。${feixing.summary}${comboNote}`,
    caveat: "八宅+玄空年飞星综合参考；精确到宅需实测坐向与楼层，动土装修请另择日。",
  };
}
