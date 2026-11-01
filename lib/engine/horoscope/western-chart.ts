/**
 * 西洋古典占星 · Lilly 五级尊贵计分
 * （Ptolemy《Tetrabiblos》II.17-21 → William Lilly《Christian Astrology》1647, p.104/115）
 *
 * 计分（Lilly 表）：Domicile +5 / Exaltation +4 / Triplicity +3 / Face +1；
 *                  Detriment −5 / Fall −4；逆行 −5；燃烧（距日 ≤8.5°）−5。
 * Triplicity 用 Dorothean 表（昼/夜/参与三分主星）；Term（埃及界表，120 段）v1 未计入。
 * 昼/夜盘按出生时刻近似（6-18 时为昼）。
 * 仅供文化参考。
 */

import { Body, Ecliptic, GeoVector, MakeTime } from "astronomy-engine";
import { BirthInput } from "../calendar";

const SIGNS = [
  "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
  "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座",
];

const norm360 = (x: number) => ((x % 360) + 360) % 360;

function eclipticLon(body: Body, date: Date): number {
  const vec = GeoVector(body, MakeTime(date), true);
  return norm360(Ecliptic(vec).elon);
}

/** 入庙表 */
const DOMICILE: Record<string, string[]> = {
  太阳: ["狮子座"], 月亮: ["巨蟹座"], 水星: ["双子座", "处女座"],
  金星: ["金牛座", "天秤座"], 火星: ["白羊座", "天蝎座"],
  木星: ["射手座", "双鱼座"], 土星: ["摩羯座", "水瓶座"],
};
/** 入旺表（含旺度） */
const EXALTATION: Record<string, { sign: string; degree: number }> = {
  太阳: { sign: "白羊座", degree: 19 }, 月亮: { sign: "金牛座", degree: 3 },
  水星: { sign: "处女座", degree: 15 }, 金星: { sign: "双鱼座", degree: 27 },
  火星: { sign: "摩羯座", degree: 28 }, 木星: { sign: "巨蟹座", degree: 15 },
  土星: { sign: "天秤座", degree: 21 },
};
/** Dorothean 三分主星（昼/夜/参与）：火土风水四元素组 */
const TRIPLICITY: Array<{ signs: string[]; day: string; night: string; part: string }> = [
  { signs: ["白羊座", "狮子座", "射手座"], day: "太阳", night: "木星", part: "土星" },
  { signs: ["金牛座", "处女座", "摩羯座"], day: "金星", night: "月亮", part: "火星" },
  { signs: ["双子座", "天秤座", "水瓶座"], day: "土星", night: "水星", part: "木星" },
  { signs: ["巨蟹座", "天蝎座", "双鱼座"], day: "金星", night: "火星", part: "月亮" },
];
/** Face：Chaldean 序（土-木-火-日-金-水-月）自白羊 0° 起循环，每 10° 一位 */
const CHALDEAN = ["土星", "木星", "火星", "太阳", "金星", "水星", "月亮"];

export interface WesternPlanet {
  body: string;
  lon: number;
  sign: string;
  degreeInSign: number;
  retro: boolean;
  combust: boolean;
  dignities: string[];
  score: number;
  condition: string;
}

const BODIES: Array<{ key: Body; name: string }> = [
  { key: Body.Sun, name: "太阳" },
  { key: Body.Moon, name: "月亮" },
  { key: Body.Mercury, name: "水星" },
  { key: Body.Venus, name: "金星" },
  { key: Body.Mars, name: "火星" },
  { key: Body.Jupiter, name: "木星" },
  { key: Body.Saturn, name: "土星" },
];

export function computeWesternChart(date: Date, hour?: number | null): {
  isDayChart: boolean;
  planets: WesternPlanet[];
  summary: string;
} {
  const isDayChart = hour == null ? true : hour >= 6 && hour < 18;
  const sunLon = eclipticLon(Body.Sun, date);

  const planets: WesternPlanet[] = BODIES.map(({ key, name }) => {
    const lon = eclipticLon(key, date);
    const signIdx = Math.floor(lon / 30);
    const sign = SIGNS[signIdx];
    const degreeInSign = Number((lon % 30).toFixed(2));

    const dignities: string[] = [];
    let score = 0;

    if (DOMICILE[name]?.includes(sign)) { score += 5; dignities.push("入庙(+5)"); }
    else if (DOMICILE[name]?.some((s) => SIGNS[(SIGNS.indexOf(s) + 6) % 12] === sign)) {
      score -= 5; dignities.push("失势(−5)");
    }
    const ex = EXALTATION[name];
    if (ex && ex.sign === sign) { score += 4; dignities.push(`入旺(+4，旺点${ex.degree}°)`); }
    else if (ex && SIGNS[(SIGNS.indexOf(ex.sign) + 6) % 12] === sign) {
      score -= 4; dignities.push("落陷(−4)");
    }
    const tri = TRIPLICITY.find((t) => t.signs.includes(sign));
    if (tri) {
      const ruler = isDayChart ? tri.day : tri.night;
      if (ruler === name) { score += 3; dignities.push("三分主星·昼/夜(+3)"); }
      else if (tri.part === name) { score += 1; dignities.push("参与三分主星(+1)"); }
    }
    const faceIdx = Math.floor((lon % 30) / 10);
    const faceIdxInSign = Math.floor(lon / 10) % 7;
    const faceRuler = CHALDEAN[faceIdxInSign];
    if (faceRuler === name) { score += 1; dignities.push("外观 Face(+1)"); }
    void faceIdx;

    const retro = key !== Body.Sun && key !== Body.Moon
      ? eclipticLon(key, new Date(date.getTime() + 86400000)) < lon
      : false;
    if (retro) { score -= 5; dignities.push("逆行(−5)"); }
    const combust = name !== "太阳" && Math.abs(norm360(lon - sunLon + 180) - 180) <= 8.5;
    if (combust) { score -= 5; dignities.push("燃烧 Combust(−5，距日≤8.5°)"); }
    if (dignities.length === 0) { dignities.push("Peregrine（无尊贵）"); }

    const condition =
      score >= 4 ? "尊贵有力，能兑现其承诺" :
      score >= 1 ? "略得尊贵，功能可用" :
      score <= -4 ? "失势受困，表达受阻或走非常之路" :
      "条件平平（Peregrine 或近中性）";

    return { body: name, lon: Number(lon.toFixed(2)), sign, degreeInSign, retro, combust, dignities, score, condition };
  });

  const strongest = [...planets].sort((a, b) => b.score - a.score)[0];
  const summary =
    `${isDayChart ? "昼盘" : "夜盘"}（Dorothean 三分主星分昼夜）。` +
    `最尊贵行星：${strongest.body}（${strongest.sign} ${strongest.degreeInSign}°，${strongest.score} 分，${strongest.dignities.join("/")}）。` +
    `计分口径：Lilly《Christian Astrology》(1647) p.115；埃及界表(Terms) v1 未计入。`;

  return { isDayChart, planets, summary };
}
