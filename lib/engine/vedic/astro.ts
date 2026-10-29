/** 吠陀/七政：Julian 日、Lahiri 岁差、astronomy-engine 地心黄经 */

import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  MakeTime,
  SiderealTime,
} from "astronomy-engine";

const NAKSHATRA_ARC = 360 / 27;
const RASHI_ARC = 30;
const DEG = Math.PI / 180;

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function timeFromJd(jd: number) {
  const ms = (jd - 2440587.5) * 86400000;
  return MakeTime(new Date(ms));
}

function geoEclipticLon(body: Body, jd: number): number {
  const t = timeFromJd(jd);
  const vec = GeoVector(body, t, true);
  return norm360(Ecliptic(vec).elon);
}

/** Lahiri 岁差（度） */
export function lahiriAyanamsa(year: number, month: number, day: number): number {
  const y = year + (month - 1 + (day - 1) / 30) / 12;
  return 23.85 + (y - 2000) * 0.013888;
}

/** Julian Day (UTC) */
export function julianDay(year: number, month: number, day: number, hour = 12, minute = 0): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const frac = (hour + minute / 60) / 24;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + frac;
}

/** 本地恒星时（度） */
export function localSiderealTime(jd: number, longitude: number): number {
  const t = timeFromJd(jd);
  const gstHours = SiderealTime(t);
  return norm360(gstHours * 15 + longitude);
}

/** 太阳地心黄经 */
export function sunLongitude(jd: number): number {
  return geoEclipticLon(Body.Sun, jd);
}

/** 月亮地心黄经 */
export function moonLongitude(jd: number): number {
  const t = timeFromJd(jd);
  return norm360(EclipticGeoMoon(t).lon);
}

type PlanetKey = "mercury" | "venus" | "mars" | "jupiter" | "saturn";

const PLANET_BODY: Record<PlanetKey, Body> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
};

/** 行星地心黄经（astronomy-engine） */
export function planetTrueLongitude(jd: number, planet: PlanetKey): number {
  return geoEclipticLon(PLANET_BODY[planet], jd);
}

/** 行星是否逆行：比较 jd 与 jd+1 日黄经 */
export function planetIsRetrograde(jd: number, planet: PlanetKey): boolean {
  const a = planetTrueLongitude(jd, planet);
  const b = planetTrueLongitude(jd + 1, planet);
  let delta = b - a;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

/** @deprecated 使用 planetTrueLongitude */
export function planetMeanLongitude(jd: number, planet: PlanetKey): number {
  return planetTrueLongitude(jd, planet);
}

/** 升交点（罗睺）— 仍用解析近似 */
export function lunarNodeLongitude(jd: number): number {
  const n = jd - 2451545.0;
  return norm360(125.0445479 - 0.05295376 * n);
}

export function wholeSignHouses(lagnaRashi: number): string[] {
  const names = ["命宫", "财帛", "兄弟", "父母", "子女", "奴仆", "配偶", "疾厄", "迁移", "事业", "朋友", "灾厄"];
  return Array.from({ length: 12 }, (_, i) => names[(i - lagnaRashi + 12) % 12] ?? names[i]);
}

/** 上升黄道经度（地方恒星时 + 黄赤交角公式） */
export function approximateLagnaLongitude(jd: number, longitude: number, latitude = 30): number {
  const ramc = localSiderealTime(jd, longitude) * DEG;
  const eps = 23.4392911 * DEG;
  const lat = latitude * DEG;
  // ASC = atan2(-cos(RAMC), sin(RAMC)cos(ε)+tan(φ)sin(ε))
  const y = -Math.cos(ramc);
  const x = Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);
  return norm360(Math.atan2(y, x) / DEG);
}

/** 上升点落入星座（整宫） */
export function approximateLagna(jd: number, longitude: number, latitude = 30): number {
  return longitudeToRashi(approximateLagnaLongitude(jd, longitude, latitude));
}

export function tropicalToSidereal(tropical: number, ayanamsa: number): number {
  return norm360(tropical - ayanamsa);
}

export function longitudeToNakshatra(siderealMoon: number): { index: number; pada: number; degree: number } {
  const index = Math.floor(siderealMoon / NAKSHATRA_ARC);
  const inNak = siderealMoon % NAKSHATRA_ARC;
  const pada = Math.floor(inNak / (NAKSHATRA_ARC / 4)) + 1;
  return { index: index % 27, pada, degree: siderealMoon };
}

export function longitudeToRashi(sidereal: number): number {
  return Math.floor(sidereal / RASHI_ARC) % 12;
}

export function longitudeToTimeOffset(longitude: number, standardMeridian = 120): number {
  return (longitude - standardMeridian) / 15;
}

export const EPHEMERIS_NOTE =
  "星历使用 astronomy-engine 地心黄经 + Lahiri 岁差（整宫制）；上升黄经按恒星时公式计算，非 Placidus。文化排盘可用。";

export const NODE_NOTE = "罗睺/计都仍用解析近似升交点，非瑞士星历节点。";

export { NAKSHATRA_ARC, RASHI_ARC };
