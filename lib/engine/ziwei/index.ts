import { BirthInput } from "../calendar";
import { buildBirthChartCore } from "../shared/birth-chart";
import { Solar } from "lunar-typescript";
import { naYinToJu, naYinOfGanZhi, placeMainStars, BRANCHES, douShuMingShenGong } from "./placement";
import { placeAuxiliaryStars } from "./auxiliary";
import {
  getSiHua,
  computeDaXian,
  attachSiHuaPalace,
  computeLiuNian,
  computeLiuYue,
  computeLiuRi,
  liuNianPalaceIndex,
} from "./sihua-daxian";
import {
  computeFeiXingBundle,
  computePalaceStems,
  formatFeiXingSummary,
  interpretFeiXingClash,
} from "./feixing";
import { computeBoShiShiErShen, formatBoShiSummary } from "./boshi";
import { computeIztroAstrolabe, computeLiuYaoXing } from "./iztro-bridge";
import {
  normalizeSihuaSchool,
  SIHUA_SCHOOL_META,
  schoolAffectsGan,
} from "./sihua-schools";
import {
  normalizeBrightnessSchool,
  BRIGHTNESS_SCHOOL_META,
  brightnessFnForSchool,
  schoolMainBrightness,
  brightnessSchoolAffects,
} from "./brightness-schools";
import {
  normalizeGengSihua,
  normalizeKuiyueSchool,
  normalizeLeapMonthSchool,
  normalizeTianmaSchool,
  GENG_SI_HUA_META,
  KUIYUE_SCHOOL_META,
  LEAP_MONTH_META,
  TIANMA_SCHOOL_META,
  effectiveDouMonth,
  type GengSihua,
} from "./zayao-schools";

export function computeZiwei(input: BirthInput) {
  const sihuaSchool = normalizeSihuaSchool(input.ziweiSihuaSchool);
  const brightnessSchool = normalizeBrightnessSchool(input.ziweiBrightnessSchool);
  const gengVariant = normalizeGengSihua(input.ziweiGengSihua);
  const tianmaSchool = normalizeTianmaSchool(input.ziweiTianmaSchool);
  const kuiyueSchool = normalizeKuiyueSchool(input.ziweiKuiyueSchool);
  const leapSchool = normalizeLeapMonthSchool(input.ziweiLeapMonth);
  const chart = buildBirthChartCore(input);
  const { lunar, solar, eightChar } = chart;
  // 斗数命宫/身宫：《全书》安命身宫诀（寅起正月顺数生月，月宫起子逆/顺数生时），
  // 不得混用八字体系的命宫——五行局、安星全链依赖此宫
  // 斗数年干支：紫微斗数为农历体系，年干支按农历正月初一换年（与 iztro/主流排盘一致）；
  // 八字立春界的年干支不用于斗数安星（年界口径如需立春派可另行配置）
  const douYearGZ = lunar.getYearInGanZhi();
  const yearGan = douYearGZ[0];
  const yearZhiIdx = BRANCHES.indexOf(douYearGZ[1] as (typeof BRANCHES)[number]);
  const hourZhiIdx = BRANCHES.indexOf(eightChar.getTimeZhi() as (typeof BRANCHES)[number]);
  // 闰月归属口径 → 斗数有效月序（命宫与月系星共用）
  const douMonth = effectiveDouMonth(lunar.getMonth(), lunar.getDay(), leapSchool);
  const gong = douShuMingShenGong(
    douMonth,
    hourZhiIdx >= 0 ? hourZhiIdx : 0,
    yearGan
  );
  const mingGongGz = gong.mingGz;
  const shenGongGz = gong.shenGz;
  const mingNaYin = naYinOfGanZhi(mingGongGz);
  const ju = naYinToJu(mingNaYin);
  const lunarDay = lunar.getDay();
  const mingIdx = gong.mingIdx;

  const { stars: mainStars, ziweiBranch, tianfuBranch, juName } = placeMainStars(
    lunarDay,
    ju,
    mingGongGz
  );
  const auxStars = placeAuxiliaryStars(
    yearGan,
    yearZhiIdx >= 0 ? yearZhiIdx : 0,
    douMonth,
    hourZhiIdx >= 0 ? hourZhiIdx : 0,
    mingGongGz,
    lunarDay,
    { tianma: tianmaSchool, kuiyue: kuiyueSchool }
  );

  const allStars = [
    ...mainStars,
    ...auxStars.map((a) => ({ star: a.star, palace: a.palace, branch: a.branch, brightness: "辅" })),
  ];
  const sihua = attachSiHuaPalace(getSiHua(yearGan, sihuaSchool, gengVariant), allStars);

  const birthYear = solar.getYear();
  const currentAge = new Date().getFullYear() - birthYear + 1;
  const gender = input.gender ?? "男";
  const daXian = computeDaXian(ju, gender, yearGan, mingIdx, currentAge);
  const yangGan = ["甲", "丙", "戊", "庚", "壬"].includes(yearGan);
  const forward = (yangGan && gender === "男") || (!yangGan && gender === "女");

  const yun = eightChar.getYun(gender === "女" ? 0 : 1);
  const liuNianGanZhi =
    yun
      .getDaYun()[1]
      ?.getLiuNian()
      .slice(0, 12)
      .map((ln) => ({ year: ln.getYear(), ganZhi: ln.getGanZhi() })) ?? [];
  const liuNian = computeLiuNian(birthYear, mingIdx, liuNianGanZhi, forward);
  const now = new Date();
  const currentYear = now.getFullYear();
  const liuNianIdx = liuNianPalaceIndex(birthYear, currentYear, forward);

  // 流月流日按「今天」农历与干支，而非出生月日
  const todayLunar = Solar.fromDate(now).getLunar();
  const todayEc = todayLunar.getEightChar();
  const todayMonth = Math.abs(todayLunar.getMonth()) || 1;
  const todayDay = todayLunar.getDay();
  const liuYue = computeLiuYue(liuNianIdx, todayMonth, mingIdx, todayEc.getMonth(), sihuaSchool, gengVariant);
  const liuYueIdx = (liuNianIdx + (todayMonth - 1) + 120) % 12;
  const liuRi = computeLiuRi(liuYueIdx, todayDay, mingIdx, todayEc.getDay(), sihuaSchool, gengVariant);

  const currentDaXian = daXian.find((d) => d.isCurrent);
  const palaceStems = computePalaceStems(yearGan, mingIdx, forward);
  const currentDaXianStem =
    palaceStems.find((p) => p.palace === currentDaXian?.palace)?.stem ?? yearGan;
  const currentLiuNian = liuNian.find((l) => l.year === currentYear) ?? liuNian[0];
  const liuNianGan = currentLiuNian?.ganZhi?.[0] ?? yearGan;

  const fei = computeFeiXingBundle({
    yearGan,
    daXianGan: currentDaXianStem,
    liuNianGan,
    liuYueGan: liuYue.gan,
    liuRiGan: liuRi.gan,
    allStars,
    school: sihuaSchool,
    gengVariant,
  });
  const liuYueWithHua = {
    ...liuYue,
    siHua: attachSiHuaPalace(liuYue.siHua ?? [], allStars),
  };
  const liuRiWithHua = {
    ...liuRi,
    siHua: attachSiHuaPalace(liuRi.siHua ?? [], allStars),
  };

  const mingStars = mainStars.filter((s) => {
    const bIdx = BRANCHES.indexOf(s.branch as (typeof BRANCHES)[number]);
    return bIdx === mingIdx;
  });
  // 博士十二神：禄存起博士，阳男阴女顺、阴男阳女逆（《全书》通行安法）
  const boShiShiErShen = computeBoShiShiErShen(yearGan, gender, mingIdx);
  // iztro（MIT 开源）全量星曜桥接：乙级星/截空旬空/长生·博士·岁前·将前十二神，覆盖 100+ 颗
  // 非通行本四化流派时重标 [生年化]；非默认亮度流派时按所选派别重标主星亮度
  const gengAffects = yearGan === "庚" && gengVariant !== "GYWYT";
  const iztro = computeIztroAstrolabe({
    solarYmd: solar.toYmd(),
    hourZhiIdx: hourZhiIdx >= 0 ? hourZhiIdx : 0,
    gender,
    mutagenOverride:
      schoolAffectsGan(yearGan, sihuaSchool) || gengAffects
        ? Object.fromEntries(
            getSiHua(yearGan, sihuaSchool, gengVariant).map((s) => [s.star, s.hua])
          )
        : undefined,
    brightnessFn: brightnessSchoolAffects(brightnessSchool)
      ? brightnessFnForSchool(brightnessSchool)
      : undefined,
  });
  // 亮度口径：默认以 iztro（=《全书》卷二口径）为准修正自研表；选了其他亮度流派则按所选派别表
  for (const m of mainStars) {
    if (brightnessSchoolAffects(brightnessSchool)) {
      const bIdx = BRANCHES.indexOf(m.branch as (typeof BRANCHES)[number]); // BRANCHES 子起 0
      const bySchool = schoolMainBrightness(m.star, bIdx, brightnessSchool);
      if (bySchool) {
        m.brightness = bySchool;
        continue;
      }
    }
    const iz = iztro.brightness[m.star];
    if (iz && iz !== m.brightness) m.brightness = iz;
  }
  // 流曜十星 + 流年四化（iztro horoscope，与本项目自算流年四化互为交叉验证）
  const liuYaoXing = computeLiuYaoXing({
    solarYmd: solar.toYmd(),
    hourZhiIdx: hourZhiIdx >= 0 ? hourZhiIdx : 0,
    gender,
  });
  const mainInMing = mingStars.map((s) => `${s.star}(${s.brightness})`).join("、");

  const palaceOrder = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "仆役", "官禄", "田宅", "福德", "父母"];
  const palaces = palaceOrder.map((name) => {
    const main = mainStars.filter((s) => s.palace === name).map((s) => `${s.star}(${s.brightness})`);
    const aux = auxStars.filter((a) => a.palace === name).map((a) => a.star);
    const hua = sihua.filter((s) => s.palace === name).map((s) => `${s.star}化${s.hua}`);
    const stem = palaceStems.find((p) => p.palace === name);
    const starsFull = iztro.palaceFullStars[name] ?? [];
    return {
      palace: name,
      ganZhi: stem?.ganZhi,
      mainStars: main,
      auxStars: aux,
      siHua: hua,
      starsFull,
      text: [...main, ...aux, ...hua].join("、") || "空宫",
    };
  });

  return {
    mingGong: `命宫（${mingGongGz}）`,
    mingGongPalace: "命宫",
    shenGong: shenGongGz,
    mingGongNaYin: mingNaYin,
    wuXingJu: juName,
    ziweiPos: ziweiBranch,
    tianfuPos: tianfuBranch,
    lunarDay,
    mingZhu: iztro.soulStar,
    shenZhu: iztro.bodyStar,
    stars: mainStars,
    auxiliaryStars: auxStars,
    palaces,
    palaceStems,
    siHua: sihua,
    sihuaSchool: sihuaSchool,
    sihuaSchoolName: SIHUA_SCHOOL_META[sihuaSchool].name,
    gengSihuaVariant: gengVariant,
    gengSihuaName: gengAffects ? GENG_SI_HUA_META[gengVariant].name : undefined,
    brightnessSchool: brightnessSchool,
    brightnessSchoolName: BRIGHTNESS_SCHOOL_META[brightnessSchool].name,
    tianmaSchoolName: TIANMA_SCHOOL_META[tianmaSchool].name,
    kuiyueSchoolName: KUIYUE_SCHOOL_META[kuiyueSchool].name,
    leapMonthSchoolName: leapSchool === "split" ? undefined : LEAP_MONTH_META[leapSchool].name,
    siHuaNote:
      gengAffects
        ? `庚年四化按${GENG_SI_HUA_META[gengVariant].name}变体取法（${GENG_SI_HUA_META[gengVariant].basis}）。生年/大限/流年/流月/流日四化与全量星曜生年化标签均已统一。`
        : schoolAffectsGan(yearGan, sihuaSchool)
          ? `${yearGan}年生年四化按${SIHUA_SCHOOL_META[sihuaSchool].name}取法（${SIHUA_SCHOOL_META[sihuaSchool].source}）：${SIHUA_SCHOOL_META[sihuaSchool].diffNote}。生年/大限/流年/流月/流日四化与全量星曜生年化标签均已按该派别统一。`
          : sihuaSchool !== "tongxing"
            ? `所选${SIHUA_SCHOOL_META[sihuaSchool].name}对${yearGan}干无差异（四化流派分歧仅集中在戊、庚、壬三干），本盘与通行本一致。`
            : undefined,
    daXianSiHua: fei.daXianSiHua,
    liuNianSiHua: fei.liuNianSiHua,
    liuYueSiHua: fei.liuYueSiHua,
    liuRiSiHua: fei.liuRiSiHua,
    boShiShiErShen,
    boShiSummary: formatBoShiSummary(boShiShiErShen),
    // iztro 全量扩展
    mingZhuStar: iztro.soulStar,
    shenZhuStar: iztro.bodyStar,
    changSheng12Zw: iztro.changSheng12,
    boShi12Zw: iztro.boShi12,
    suiQian12: iztro.suiQian12,
    jiangQian12: iztro.jiangQian12,
    liuYaoXing,
    fullStarCount: new Set(Object.values(iztro.palaceFullStars).flat().map((s) => s.replace(/\(.*\)|\[.*\]/g, ""))).size,
    feiXing: fei.feiXing,
    feiXingSummary: formatFeiXingSummary(fei.feiXing),
    feiXingClash: interpretFeiXingClash(fei.feiXing),
    daXian,
    currentDaXian: currentDaXian
      ? `${currentDaXian.palace}（${currentDaXian.startAge}-${currentDaXian.endAge}岁）`
      : undefined,
    liuNian,
    liuYue: liuYueWithHua,
    liuRi: liuRiWithHua,
    summary: `命宫${mingGongGz}，${juName}，紫微在${ziweiBranch}。命宫：${mainInMing || "空宫借对宫"}。四化：${sihua.map((s) => `${s.star}化${s.hua}`).join("、")}。亮度流派：${BRIGHTNESS_SCHOOL_META[brightnessSchool].name}。流月落${liuYue.palace}，流日落${liuRi.palace}。`,
    caveat:
      "已安十四主星、扩展辅星（含天哭虚龙凤三台八座）、生年/大限/流年/流月/流日四化飞星、十二宫干。流月流日按今日农历。",
  };
}
