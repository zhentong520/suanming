import { BirthInput, buildLunarFromBirth } from "../calendar";
import {
  julianDay,
  lahiriAyanamsa,
  moonLongitude,
  sunLongitude,
  planetTrueLongitude,
  lunarNodeLongitude,
  tropicalToSidereal,
  longitudeToNakshatra,
  longitudeToRashi,
  longitudeToTimeOffset,
  approximateLagna,
  EPHEMERIS_NOTE,
  NODE_NOTE,
  planetIsRetrograde,
} from "./astro";

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

const NAKSHATRA_CN = [
  "角宿", "亢宿", "氐宿", "房宿", "心宿", "尾宿",
  "箕宿", "斗宿", "女宿", "虚宿", "危宿", "室宿",
  "壁宿", "奎宿", "娄宿", "胃宿", "昴宿", "毕宿",
  "觜宿", "参宿", "井宿", "鬼宿", "柳宿", "星宿",
  "张宿", "翼宿", "轸宿",
];

const NAKSHATRA_MEANINGS: Record<string, string> = {
  Ashwini: "行动力快，宜开创启动。",
  Rohini: "丰饶稳定，宜积累资源。",
  Magha: "权威传统，宜承继祖业。",
  Hasta: "灵巧技艺，宜手工创作。",
  Swati: "独立自由，宜自主发展。",
  Anuradha: "合作友谊，宜团队协作。",
  Mula: "寻根究底，宜研究探索。",
  Shravana: "学习传播，宜教育沟通。",
  Revati: "慈悲守护，宜旅行迁移。",
};

const RASHIS = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
const RASHI_CN = ["白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手", "摩羯", "水瓶", "双鱼"];
const HOUSE_NAMES = ["命宫", "财帛", "兄弟", "父母", "子女", "奴仆", "配偶", "疾厄", "迁移", "事业", "朋友", "灾厄"];

/** Vimshottari 大运主星（按星宿分组） */
const NAKSHATRA_DASHA: Record<number, string> = {
  0: "Ketu", 1: "Venus", 2: "Sun", 3: "Moon", 4: "Mars", 5: "Rahu", 6: "Jupiter", 7: "Saturn", 8: "Mercury",
  9: "Ketu", 10: "Venus", 11: "Sun", 12: "Moon", 13: "Mars", 14: "Rahu", 15: "Jupiter", 16: "Saturn", 17: "Mercury",
  18: "Ketu", 19: "Venus", 20: "Sun", 21: "Moon", 22: "Mars", 23: "Rahu", 24: "Jupiter", 25: "Saturn", 26: "Mercury",
};

const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

/** Lahiri 岁差 + 整宫制 + 行星黄经 → 星宿、分宫、大运 */
export function computeVedic(input: BirthInput) {
  const { solar } = buildLunarFromBirth(input);
  const hour = input.hour ?? 12;
  const minute = input.minute ?? 0;
  const lon = input.longitude ?? 116.4;
  const lat = input.latitude ?? 39.9;

  const timeOffset = longitudeToTimeOffset(lon);
  const localHour = hour + minute / 60 + timeOffset;
  const jd = julianDay(solar.getYear(), solar.getMonth(), solar.getDay(), localHour);
  const ayanamsa = lahiriAyanamsa(solar.getYear(), solar.getMonth(), solar.getDay());

  const moonTropical = moonLongitude(jd);
  const sunTropical = sunLongitude(jd);
  const moonSidereal = tropicalToSidereal(moonTropical, ayanamsa);
  const sunSidereal = tropicalToSidereal(sunTropical, ayanamsa);

  const { index: nakIdx, pada } = longitudeToNakshatra(moonSidereal);
  const nakshatra = NAKSHATRAS[nakIdx];
  const moonRashiIdx = longitudeToRashi(moonSidereal);
  const sunRashiIdx = longitudeToRashi(sunSidereal);
  const rashi = RASHIS[moonRashiIdx];

  const lagna = approximateLagna(jd, lon, lat);
  const sid = (fn: () => number) => tropicalToSidereal(fn(), ayanamsa);
  const mercury = sid(() => planetTrueLongitude(jd, "mercury"));
  const venus = sid(() => planetTrueLongitude(jd, "venus"));
  const mars = sid(() => planetTrueLongitude(jd, "mars"));
  const jupiter = sid(() => planetTrueLongitude(jd, "jupiter"));
  const saturn = sid(() => planetTrueLongitude(jd, "saturn"));
  const rahuLon = tropicalToSidereal(lunarNodeLongitude(jd), ayanamsa);
  const mkPlanet = (
    name: string,
    cn: string,
    lonSid: number,
    retro?: boolean
  ) => ({
    name,
    cn,
    rashi: RASHI_CN[longitudeToRashi(lonSid)],
    house: HOUSE_NAMES[(longitudeToRashi(lonSid) - lagna + 12) % 12],
    retrograde: Boolean(retro),
  });
  const planets = [
    mkPlanet("Sun", "日", sunSidereal, false),
    mkPlanet("Moon", "月", moonSidereal, false),
    mkPlanet("Mercury", "水", mercury, planetIsRetrograde(jd, "mercury")),
    mkPlanet("Venus", "金", venus, planetIsRetrograde(jd, "venus")),
    mkPlanet("Mars", "火", mars, planetIsRetrograde(jd, "mars")),
    mkPlanet("Jupiter", "木", jupiter, planetIsRetrograde(jd, "jupiter")),
    mkPlanet("Saturn", "土", saturn, planetIsRetrograde(jd, "saturn")),
    mkPlanet("Rahu", "罗睺", rahuLon, true),
  ];

  const dashaLord = NAKSHATRA_DASHA[nakIdx] ?? "Moon";
  const dashaYears = DASHA_YEARS[dashaLord] ?? 10;
  const birthYear = solar.getYear();
  const dashaProgress = (moonSidereal % (360 / 27)) / (360 / 27);
  const dashaRemaining = Math.round(dashaYears * (1 - dashaProgress));

  return {
    nakshatra,
    nakshatraCn: NAKSHATRA_CN[nakIdx] ?? `第${nakIdx + 1}宿`,
    nakshatraPada: pada,
    rashi,
    rashiCn: RASHI_CN[moonRashiIdx],
    sunRashiCn: RASHI_CN[sunRashiIdx],
    lagnaCn: RASHI_CN[lagna],
    houses: HOUSE_NAMES.map((name, i) => ({
      house: name,
      rashi: RASHI_CN[(lagna + i) % 12],
    })),
    planets,
    currentDasha: dashaLord,
    dashaYears,
    dashaRemainingYears: dashaRemaining,
    moonSign: rashi,
    moonDegree: moonSidereal.toFixed(2),
    sunDegree: sunSidereal.toFixed(2),
    ayanamsa: ayanamsa.toFixed(2),
    location: input.location ?? `经${lon.toFixed(1)}° 纬${lat.toFixed(1)}°`,
    lunarDate: solar.toYmd(),
    meaning: NAKSHATRA_MEANINGS[nakshatra] ?? "宜顺应星象，修身养性。",
    ephemeris: "meeus-approx",
    summary: `上升${RASHI_CN[lagna]}，月亮${RASHI_CN[moonRashiIdx]} ${nakshatra}（${NAKSHATRA_CN[nakIdx]}第${pada}足），${dashaLord}大运约余${dashaRemaining}年。`,
    caveat: `${EPHEMERIS_NOTE}${NODE_NOTE}分宫为整宫制；Placidus 未启用。`,
  };
}
