import { BirthInput, buildLunarFromBirth, computeCalendar, eightCharFromBirth } from "../calendar";
import {
  julianDay,
  lahiriAyanamsa,
  sunLongitude,
  moonLongitude,
  planetTrueLongitude,
  lunarNodeLongitude,
  tropicalToSidereal,
  longitudeToRashi,
  longitudeToTimeOffset,
  EPHEMERIS_NOTE,
} from "../vedic/astro";

const GUA_NAMES = ["", "坎", "坤", "震", "巽", "中", "乾", "兑", "艮", "离"];
const GUA_WUXING = ["", "水", "土", "木", "木", "土", "金", "金", "土", "火"];

/** 河洛理数：先天命卦 + 后天运卦 */
export function computeHeluo(input: BirthInput) {
  const cal = computeCalendar(input);
  const { lunar } = buildLunarFromBirth(input);
  const eightChar = eightCharFromBirth(lunar, input);

  const mingGong = eightChar.getMingGong();
  const taiYuan = eightChar.getTaiYuan();
  const mingZhi = mingGong.slice(-1);
  const taiZhi = taiYuan.slice(-1);
  const yearZhi = eightChar.getYearZhi();
  const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const upper = (branches.indexOf(mingZhi) % 8) + 1;
  const lower = (branches.indexOf(taiZhi) % 8) + 1;
  const guaIndex = ((upper + lower - 1) % 9) + 1;

  const yearZhiIdx = branches.indexOf(yearZhi);
  const houUpper = ((upper + yearZhiIdx) % 8) + 1;
  const houLower = ((lower + lunar.getMonth()) % 8) + 1;
  const houGuaIndex = ((houUpper + houLower - 1) % 9) + 1;

  return {
    pillars: `${eightChar.getYear()} ${eightChar.getMonth()} ${eightChar.getDay()} ${eightChar.getTime()}`,
    mingGong,
    taiYuan,
    mingGongNaYin: eightChar.getMingGongNaYin(),
    taiYuanNaYin: eightChar.getTaiYuanNaYin(),
    upperGua: GUA_NAMES[upper],
    lowerGua: GUA_NAMES[lower],
    mingGua: GUA_NAMES[guaIndex],
    wuxing: GUA_WUXING[guaIndex],
    houTianGua: GUA_NAMES[houGuaIndex],
    houTianWuXing: GUA_WUXING[houGuaIndex],
    houUpperGua: GUA_NAMES[houUpper],
    houLowerGua: GUA_NAMES[houLower],
    shengXiao: cal.shengXiao,
    summary: `先天${GUA_NAMES[guaIndex]}（${GUA_WUXING[guaIndex]}），后天${GUA_NAMES[houGuaIndex]}（${GUA_WUXING[houGuaIndex]}）。命宫${mingGong}、胎元${taiYuan}。`,
    caveat: "已含先天命卦与后天运卦，流年卦变可结合当前干支进一步推演。",
  };
}

const PLANET_MEANINGS: Record<string, string> = {
  日: "太阳主权威、父亲、事业光明显达。",
  月: "太阴主母亲、情绪、内在需求。",
  金: "金星主财帛、艺术、审美与享受。",
  木: "木星主扩展、仁慈、成长机遇。",
  水: "水星主智慧、沟通、流动变化。",
  火: "火星主行动、竞争、冲动与能量。",
  土: "土星主责任、限制、耐力与守成。",
  罗睺: "罗睺主欲望、非传统、突变。",
  计都: "计都主解脱、隐忧、业力课题。",
};

const RASHI_CN = ["白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手", "摩羯", "水瓶", "双鱼"];

/** 七政四余：接天文经度 + 八字宫位 */
export function computeQizheng(input: BirthInput) {
  const cal = computeCalendar(input);
  const { lunar, solar } = buildLunarFromBirth(input);
  const eightChar = eightCharFromBirth(lunar, input);
  const hour = input.hour ?? 12;
  const minute = input.minute ?? 0;
  const lon = input.longitude ?? 116.4;
  const lat = input.latitude ?? 39.9;

  const timeOffset = longitudeToTimeOffset(lon);
  const localHour = hour + minute / 60 + timeOffset;
  const jd = julianDay(solar.getYear(), solar.getMonth(), solar.getDay(), localHour);
  const ayanamsa = lahiriAyanamsa(solar.getYear(), solar.getMonth(), solar.getDay());

  const sunSidereal = tropicalToSidereal(sunLongitude(jd), ayanamsa);
  const moonSidereal = tropicalToSidereal(moonLongitude(jd), ayanamsa);
  const mercury = tropicalToSidereal(planetTrueLongitude(jd, "mercury"), ayanamsa);
  const venus = tropicalToSidereal(planetTrueLongitude(jd, "venus"), ayanamsa);
  const mars = tropicalToSidereal(planetTrueLongitude(jd, "mars"), ayanamsa);
  const jupiter = tropicalToSidereal(planetTrueLongitude(jd, "jupiter"), ayanamsa);
  const saturn = tropicalToSidereal(planetTrueLongitude(jd, "saturn"), ayanamsa);
  const rahu = tropicalToSidereal(lunarNodeLongitude(jd), ayanamsa);
  const ketu = (rahu + 180) % 360;

  const sunRashi = longitudeToRashi(sunSidereal);
  const moonRashi = longitudeToRashi(moonSidereal);

  const planetPositions = [
    { name: "日", rashi: RASHI_CN[sunRashi], degree: sunSidereal.toFixed(1) },
    { name: "月", rashi: RASHI_CN[moonRashi], degree: moonSidereal.toFixed(1) },
    { name: "水", rashi: RASHI_CN[longitudeToRashi(mercury)], degree: mercury.toFixed(1) },
    { name: "金", rashi: RASHI_CN[longitudeToRashi(venus)], degree: venus.toFixed(1) },
    { name: "火", rashi: RASHI_CN[longitudeToRashi(mars)], degree: mars.toFixed(1) },
    { name: "木", rashi: RASHI_CN[longitudeToRashi(jupiter)], degree: jupiter.toFixed(1) },
    { name: "土", rashi: RASHI_CN[longitudeToRashi(saturn)], degree: saturn.toFixed(1) },
    { name: "罗睺", rashi: RASHI_CN[longitudeToRashi(rahu)], degree: rahu.toFixed(1) },
    { name: "计都", rashi: RASHI_CN[longitudeToRashi(ketu)], degree: ketu.toFixed(1) },
  ];

  const mainStar = "日";
  const secondary = "月";

  const monthZhiIdx = "子丑寅卯辰巳午未申酉戌亥".indexOf(eightChar.getMonthZhi());
  const houses = ["命宫", "财帛", "官禄", "迁移", "夫妻", "疾厄", "福德", "田宅"];
  const house = houses[monthZhiIdx % houses.length];
  const element = eightChar.getDayWuXing().replace(/[^金木水火土]/g, "") || "土";

  return {
    solarDate: cal.solarDate,
    lunarDate: cal.lunarDate,
    location: input.location ?? (lon !== 116.4 ? `经${lon.toFixed(1)}°纬${lat.toFixed(1)}°` : "默认东经116°（北京）"),
    mingGong: house,
    mainStar,
    secondaryStar: secondary,
    element,
    dayGanZhi: eightChar.getDay(),
    monthGanZhi: eightChar.getMonth(),
    sunRashi: RASHI_CN[sunRashi],
    moonRashi: RASHI_CN[moonRashi],
    rahuHouse: RASHI_CN[longitudeToRashi(rahu)],
    ketuHouse: RASHI_CN[longitudeToRashi(ketu)],
    ayanamsa: ayanamsa.toFixed(2),
    planetPositions,
    mainMeaning: PLANET_MEANINGS[mainStar],
    secondaryMeaning: PLANET_MEANINGS[secondary],
    ephemeris: "meeus-approx",
    summary: `七政：${house}；日${RASHI_CN[sunRashi]}月${RASHI_CN[moonRashi]}，木${RASHI_CN[longitudeToRashi(jupiter)]}土${RASHI_CN[longitudeToRashi(saturn)]}，罗睺${RASHI_CN[longitudeToRashi(rahu)]}。`,
    caveat: `${EPHEMERIS_NOTE}命宫暂以月支宫位体系辅助，非完整分宫制。`,
  };
}
