import { BirthInput } from "../calendar";
import { buildBirthChartCore } from "../shared/birth-chart";
import { Solar } from "lunar-typescript";
import { naYinToJu, placeMainStars, BRANCHES, mingGongPalaceIndex } from "./placement";
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

export function computeZiwei(input: BirthInput) {
  const chart = buildBirthChartCore(input);
  const { lunar, solar, eightChar } = chart;
  const mingGongGz = eightChar.getMingGong();
  const shenGongGz = eightChar.getShenGong();
  const mingNaYin = eightChar.getMingGongNaYin();
  const ju = naYinToJu(mingNaYin);
  const lunarDay = lunar.getDay();
  const yearGan = eightChar.getYearGan();
  const yearZhiIdx = BRANCHES.indexOf(eightChar.getYearZhi() as (typeof BRANCHES)[number]);
  const hourZhiIdx = BRANCHES.indexOf(eightChar.getTimeZhi() as (typeof BRANCHES)[number]);
  const mingIdx = mingGongPalaceIndex(mingGongGz);

  const { stars: mainStars, ziweiBranch, tianfuBranch, juName } = placeMainStars(
    lunarDay,
    ju,
    mingGongGz
  );
  const auxStars = placeAuxiliaryStars(
    yearGan,
    yearZhiIdx >= 0 ? yearZhiIdx : 0,
    lunar.getMonth(),
    hourZhiIdx >= 0 ? hourZhiIdx : 0,
    mingGongGz,
    lunarDay
  );

  const allStars = [
    ...mainStars,
    ...auxStars.map((a) => ({ star: a.star, palace: a.palace, branch: a.branch, brightness: "辅" })),
  ];
  const sihua = attachSiHuaPalace(getSiHua(yearGan), allStars);

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
  const liuYue = computeLiuYue(liuNianIdx, todayMonth, mingIdx, todayEc.getMonth());
  const liuYueIdx = (liuNianIdx + (todayMonth - 1) + 120) % 12;
  const liuRi = computeLiuRi(liuYueIdx, todayDay, mingIdx, todayEc.getDay());

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
  const mainInMing = mingStars.map((s) => `${s.star}(${s.brightness})`).join("、");

  const palaceOrder = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "仆役", "官禄", "田宅", "福德", "父母"];
  const palaces = palaceOrder.map((name) => {
    const main = mainStars.filter((s) => s.palace === name).map((s) => `${s.star}(${s.brightness})`);
    const aux = auxStars.filter((a) => a.palace === name).map((a) => a.star);
    const hua = sihua.filter((s) => s.palace === name).map((s) => `${s.star}化${s.hua}`);
    const stem = palaceStems.find((p) => p.palace === name);
    return {
      palace: name,
      ganZhi: stem?.ganZhi,
      mainStars: main,
      auxStars: aux,
      siHua: hua,
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
    mingZhu: mingStars[0]?.star ?? "无主星",
    shenZhu: auxStars.find((a) => a.star === "天马")?.star ?? mainStars[6]?.star ?? "天府",
    stars: mainStars,
    auxiliaryStars: auxStars,
    palaces,
    palaceStems,
    siHua: sihua,
    daXianSiHua: fei.daXianSiHua,
    liuNianSiHua: fei.liuNianSiHua,
    liuYueSiHua: fei.liuYueSiHua,
    liuRiSiHua: fei.liuRiSiHua,
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
    summary: `命宫${mingGongGz}，${juName}，紫微在${ziweiBranch}。命宫：${mainInMing || "空宫借对宫"}。四化：${sihua.map((s) => `${s.star}化${s.hua}`).join("、")}。流月落${liuYue.palace}，流日落${liuRi.palace}。`,
    caveat:
      "已安十四主星、扩展辅星（含天哭虚龙凤三台八座）、生年/大限/流年/流月/流日四化飞星、十二宫干。流月流日按今日农历。",
  };
}
