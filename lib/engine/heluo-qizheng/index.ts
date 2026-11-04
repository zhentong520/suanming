import { BirthInput, buildLunarFromBirth, computeCalendar, eightCharFromBirth } from "../calendar";
import {
  julianDay,
  lahiriAyanamsa,
  sunLongitude,
  moonLongitude,
  planetTrueLongitude,
  lunarNodeLongitude,
  moonApogeeLongitude,
  tropicalToSidereal,
  longitudeToRashi,
  longitudeToTimeOffset,
  EPHEMERIS_NOTE,
  NODE_NOTE,
} from "../vedic/astro";
import { hexagramNameFromTrigrams } from "../hexagram-lib";

const GUA_NAMES = ["", "坎", "坤", "震", "巽", "中", "乾", "兑", "艮", "离"];
const GUA_WUXING = ["", "水", "土", "木", "木", "土", "金", "金", "土", "火"];

/**
 * 河洛理数 · 真法起卦（陈希夷一脉通行法）：
 * 四柱干支化数（甲己子午九、乙庚丑未八、丙辛寅申七、丁壬卯酉六、戊癸辰戌五、巳亥四），
 * 天干数和为天局、地支数和为地局；
 * 天局定上卦、地局定下卦（先天序 乾一兑二离三震四巽五坎六艮七坤八，余八者为八卦）；
 * 天地总数模六定动爻，动爻阴阳反转为变卦。
 */
const HELUO_NUM: Record<string, number> = {
  甲: 9, 己: 9, 子: 9, 午: 9,
  乙: 8, 庚: 8, 丑: 8, 未: 8,
  丙: 7, 辛: 7, 寅: 7, 申: 7,
  丁: 6, 壬: 6, 卯: 6, 酉: 6,
  戊: 5, 癸: 5, 辰: 5, 戌: 5,
  巳: 4, 亥: 4,
};
const XIAN_TIAN = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
/** 三爻 bits（bit0=初爻，1=阳）→ 卦名，与 hexagram-lib 约定一致 */
const BITS_TO_TRIGRAM = ["坤", "艮", "坎", "巽", "震", "离", "兑", "乾"];
const TRIGRAM_TO_BITS: Record<string, number> = { 坤: 0, 艮: 1, 坎: 2, 巽: 3, 震: 4, 离: 5, 兑: 6, 乾: 7 };

/** 河洛理数：真法定先天命卦（含动爻与变卦） */
export function computeHeluo(input: BirthInput) {
  const cal = computeCalendar(input);
  const { lunar } = buildLunarFromBirth(input);
  const eightChar = eightCharFromBirth(lunar, input);

  const pillarGz = [eightChar.getYear(), eightChar.getMonth(), eightChar.getDay(), eightChar.getTime()];
  const ganNums = pillarGz.map((gz) => HELUO_NUM[gz[0] ?? ""] ?? 0);
  const zhiNums = pillarGz.map((gz) => HELUO_NUM[gz[1] ?? ""] ?? 0);
  const tianJu = ganNums.reduce((a, b) => a + b, 0);
  const diJu = zhiNums.reduce((a, b) => a + b, 0);
  const total = tianJu + diJu;

  const upper = XIAN_TIAN[(tianJu % 8 || 8) - 1];
  const lower = XIAN_TIAN[(diJu % 8 || 8) - 1];
  const benGua = hexagramNameFromTrigrams(upper, lower);

  const changingYao = (total % 6 || 6);
  // 动爻反转 → 变卦（库约定 bit0=上爻、bit2=初爻；六爻自下而上：初=下卦初爻）
  const upperBits = TRIGRAM_TO_BITS[upper];
  const lowerBits = TRIGRAM_TO_BITS[lower];
  const lines = [
    (lowerBits >> 2) & 1, (lowerBits >> 1) & 1, lowerBits & 1,
    (upperBits >> 2) & 1, (upperBits >> 1) & 1, upperBits & 1,
  ];
  const flipped = lines.map((v, i) => (i + 1 === changingYao ? 1 - v : v));
  const bianLower = (flipped[2] | (flipped[1] << 1) | (flipped[0] << 2)) as number;
  const bianUpper = (flipped[5] | (flipped[4] << 1) | (flipped[3] << 2)) as number;
  const bianGua = hexagramNameFromTrigrams(BITS_TO_TRIGRAM[bianUpper], BITS_TO_TRIGRAM[bianLower]);

  const pillarDetail = pillarGz
    .map((gz, i) => `${gz}(干${ganNums[i]}支${zhiNums[i]})`)
    .join(" ");

  return {
    solarDate: cal.solarDate,
    lunarDate: cal.lunarDate,
    pillars: pillarGz.join(" "),
    pillarDetail,
    tianJu,
    diJu,
    total,
    upperGua: upper,
    lowerGua: lower,
    benGua,
    changingYao,
    bianGua,
    benYao: `${changingYao}爻动`,
    summary: `四柱化数：${pillarDetail}。天局${tianJu}定上卦${upper}，地局${diJu}定下卦${lower}，得${benGua}（${changingYao}爻动），变${bianGua}。`,
    caveat: "河洛理数化数取通行定数表（甲己子午九等），上卦天局、下卦地局、总数动爻为通行起法；卦义断辞可结合变卦参看。仅供文化参考。",
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
  月孛: "月孛主暗昧、隐疾、纠缠之事（远地点之象）。",
};

const RASHI_CN = ["白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手", "摩羯", "水瓶", "双鱼"];

/** 七政十二宫（从命宫起顺布） */
const QIZHENG_HOUSES = [
  "命宫", "财帛", "兄弟", "父母", "子女", "奴仆",
  "配偶", "疾厄", "迁移", "官禄", "福德", "相貌",
];
const BRANCH_ORDER = "子丑寅卯辰巳午未申酉戌亥";

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
  const yuebei = tropicalToSidereal(moonApogeeLongitude(jd), ayanamsa);

  // 安命：沿用卯起法命宫（lunar-typescript 安命，与子平/七政通行一致），整宫顺布十二宫
  const mingGongGz = eightChar.getMingGong();
  const mingBranch = mingGongGz.slice(-1);
  const mingIdx = BRANCH_ORDER.indexOf(mingBranch);
  const palaceOf = (rashi: number): string => {
    const rashiBranch = BRANCH_ORDER[(rashi - mingIdx + 12) % 12];
    const offset = BRANCH_ORDER.indexOf(rashiBranch);
    return QIZHENG_HOUSES[offset] ?? "?";
  };

  const sunRashi = longitudeToRashi(sunSidereal);
  const moonRashi = longitudeToRashi(moonSidereal);

  const planetPositions = [
    { name: "日", rashi: RASHI_CN[sunRashi], house: palaceOf(sunRashi), degree: sunSidereal.toFixed(1) },
    { name: "月", rashi: RASHI_CN[moonRashi], house: palaceOf(moonRashi), degree: moonSidereal.toFixed(1) },
    { name: "水", rashi: RASHI_CN[longitudeToRashi(mercury)], house: palaceOf(longitudeToRashi(mercury)), degree: mercury.toFixed(1) },
    { name: "金", rashi: RASHI_CN[longitudeToRashi(venus)], house: palaceOf(longitudeToRashi(venus)), degree: venus.toFixed(1) },
    { name: "火", rashi: RASHI_CN[longitudeToRashi(mars)], house: palaceOf(longitudeToRashi(mars)), degree: mars.toFixed(1) },
    { name: "木", rashi: RASHI_CN[longitudeToRashi(jupiter)], house: palaceOf(longitudeToRashi(jupiter)), degree: jupiter.toFixed(1) },
    { name: "土", rashi: RASHI_CN[longitudeToRashi(saturn)], house: palaceOf(longitudeToRashi(saturn)), degree: saturn.toFixed(1) },
    { name: "罗睺", rashi: RASHI_CN[longitudeToRashi(rahu)], house: palaceOf(longitudeToRashi(rahu)), degree: rahu.toFixed(1) },
    { name: "计都", rashi: RASHI_CN[longitudeToRashi(ketu)], house: palaceOf(longitudeToRashi(ketu)), degree: ketu.toFixed(1) },
    { name: "月孛", rashi: RASHI_CN[longitudeToRashi(yuebei)], house: palaceOf(longitudeToRashi(yuebei)), degree: yuebei.toFixed(1) },
  ];

  const element = eightChar.getDayWuXing().replace(/[^金木水火土]/g, "") || "土";

  return {
    solarDate: cal.solarDate,
    lunarDate: cal.lunarDate,
    location: input.location ?? (lon !== 116.4 ? `经${lon.toFixed(1)}°纬${lat.toFixed(1)}°` : "默认东经116°（北京）"),
    mingGong: `${mingGongGz}（安命卯起法）`,
    element,
    dayGanZhi: eightChar.getDay(),
    monthGanZhi: eightChar.getMonth(),
    sunRashi: RASHI_CN[sunRashi],
    sunHouse: palaceOf(sunRashi),
    moonRashi: RASHI_CN[moonRashi],
    moonHouse: palaceOf(moonRashi),
    rahuHouse: palaceOf(longitudeToRashi(rahu)),
    ketuHouse: palaceOf(longitudeToRashi(ketu)),
    yuebeiHouse: palaceOf(longitudeToRashi(yuebei)),
    ayanamsa: ayanamsa.toFixed(2),
    planetPositions,
    // 身命二曜通行简化口径：日为命之曜、月为身之曜（完整宫主制依《果老》各派不一，暂不列）
    mainStar: "日",
    secondaryStar: "月",
    mainStarNote: "身命二曜取通行简化口径（日命月身）；七政庙旺限度表流派分歧较大，暂不列。",
    mainMeaning: PLANET_MEANINGS["日"],
    secondaryMeaning: PLANET_MEANINGS["月"],
    ephemeris: "astronomy-engine",
    summary: `命宫${mingGongGz}；日${RASHI_CN[sunRashi]}（${palaceOf(sunRashi)}）月${RASHI_CN[moonRashi]}（${palaceOf(moonRashi)}），木${RASHI_CN[longitudeToRashi(jupiter)]}土${RASHI_CN[longitudeToRashi(saturn)]}，罗睺${RASHI_CN[longitudeToRashi(rahu)]}计都${RASHI_CN[longitudeToRashi(ketu)]}月孛${RASHI_CN[longitudeToRashi(yuebei)]}。`,
    caveat: `${EPHEMERIS_NOTE} ${NODE_NOTE} 安命沿用卯起法，整宫顺布十二宫。`,
  };
}
