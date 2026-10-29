import { BirthInput, CalendarResult, buildLunarFromBirth } from "../calendar";
import { buildBirthChartCore } from "../shared/birth-chart";
import { buildBaziInterpretation } from "./interpretation";
import {
  analyzeDayMasterStrength,
  analyzeTongGenTouGan,
  deriveYongShen,
  scoreGanZhiAgainstYongShen,
  scoreGanZhiAgainstGeJu,
  type YongShenResult,
} from "./strength";
import { computeShenSha, type ShenShaItem } from "./shensha";
import { computeGeJu, type GeJuResult } from "./geju";
import { Solar } from "lunar-typescript";

export interface BaziResult extends CalendarResult {
  dayMaster: string;
  dayMasterElement: string;
  tenGods: string[];
  hiddenStems: string[][];
  elementCount: Record<string, number>;
  missingElements: string[];
  strength: string;
  strengthScore?: number;
  yongShen?: YongShenResult;
  shenSha?: ShenShaItem[];
  geJu?: GeJuResult;
  tongGen?: ReturnType<typeof analyzeTongGenTouGan>;
  sections?: Array<{ title: string; content: string }>;
  summary?: string;
}

const ELEMENTS = ["金", "木", "水", "火", "土"];

function countElements(wuXing: string[]): Record<string, number> {
  const count: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  for (const wx of wuXing) {
    for (const el of ELEMENTS) {
      if (wx.includes(el)) count[el]++;
    }
  }
  return count;
}

function pillarParts(gz: string): { gan: string; zhi: string } {
  return { gan: gz[0] ?? "", zhi: gz[1] ?? "" };
}

export function computeBazi(input: BirthInput): BaziResult {
  const chart = buildBirthChartCore(input);
  const { calendar, lunar, eightChar } = chart;
  const dayMaster = chart.dayMaster;
  const dayMasterElement = eightChar.getDayWuXing().replace(/[^金木水火土]/g, "") || "土";

  const elementCount = countElements(calendar.wuXing);
  const missingElements = ELEMENTS.filter((e) => elementCount[e] === 0);

  const y = pillarParts(calendar.ganZhiYear);
  const m = pillarParts(calendar.ganZhiMonth);
  const d = pillarParts(calendar.ganZhiDay);
  const t = calendar.timeKnown ? pillarParts(calendar.ganZhiTime) : { gan: "", zhi: "" };

  const detail = analyzeDayMasterStrength({
    dayGan: dayMaster,
    yearGan: y.gan,
    monthGan: m.gan,
    timeGan: t.gan || null,
    yearZhi: y.zhi,
    monthZhi: m.zhi,
    dayZhi: d.zhi,
    timeZhi: t.zhi || null,
  });
  const yongShen = deriveYongShen(detail, dayMaster, missingElements);

  const shenSha = computeShenSha({
    yearGanZhi: calendar.ganZhiYear,
    monthGanZhi: calendar.ganZhiMonth,
    dayGanZhi: calendar.ganZhiDay,
    timeGanZhi: calendar.timeKnown ? calendar.ganZhiTime : undefined,
  });
  const geJu = computeGeJu({
    dayGan: dayMaster,
    monthZhi: m.zhi,
    yearGan: y.gan,
    monthGan: m.gan,
    timeGan: t.gan || undefined,
    strength: yongShen.strength,
  });
  const tongGen = analyzeTongGenTouGan({
    dayGan: dayMaster,
    yearGan: y.gan,
    monthGan: m.gan,
    timeGan: t.gan || undefined,
    yearZhi: y.zhi,
    monthZhi: m.zhi,
    dayZhi: d.zhi,
    timeZhi: t.zhi || undefined,
  });

  return {
    ...calendar,
    dayMaster,
    dayMasterElement,
    tenGods: [
      eightChar.getYearShiShenGan(),
      eightChar.getMonthShiShenGan(),
      eightChar.getDayShiShenGan(),
      calendar.timeKnown ? eightChar.getTimeShiShenGan() : "未知",
    ],
    hiddenStems: [
      eightChar.getYearHideGan(),
      eightChar.getMonthHideGan(),
      eightChar.getDayHideGan(),
      calendar.timeKnown ? eightChar.getTimeHideGan() : [],
    ],
    elementCount,
    missingElements,
    strength: yongShen.strength,
    strengthScore: yongShen.strengthScore,
    yongShen,
    shenSha,
    geJu,
    tongGen,
  };
}

export function computeBaziWithReading(input: BirthInput): BaziResult {
  const bazi = computeBazi(input);
  const reading = buildBaziInterpretation(bazi, input.gender);
  return { ...bazi, ...reading };
}

export function computeBaziDayun(input: BirthInput) {
  const bazi = computeBazi(input);
  const { lunar } = buildLunarFromBirth(input);
  const eightChar = lunar.getEightChar();
  const yun = eightChar.getYun(input.gender === "女" ? 0 : 1);
  const daYunList = yun.getDaYun();
  const daYun = daYunList.slice(1, 9);

  const useful = bazi.yongShen?.usefulGods ?? [];
  const avoid = bazi.yongShen?.avoidGods ?? [];
  const geJuName = bazi.geJu?.name ?? "杂气格";
  const geJuBroken = bazi.geJu?.broken;

  const daYunScored = daYun.map((dy) => {
    const ganZhi = dy.getGanZhi();
    const scored = scoreGanZhiAgainstYongShen(ganZhi, useful, avoid);
    const geJuHit = scoreGanZhiAgainstGeJu(ganZhi, geJuName, geJuBroken);
    const advice =
      scored.label === "吉"
        ? `此运喜用得力，宜进取拓展、考试升迁、投资布局；重大决策可择流年吉年推进。`
        : scored.label === "凶"
          ? `此运忌神加重，宜守成积淀、规避高风险合作与盲目扩张；感情与财务宜谨慎。`
          : `此运平稳，宜按部就班深耕本职，逢流年吉凶再细分进退。`;
    const geJuAdvice =
      geJuHit.label === "破格"
        ? `格局提示：${geJuHit.reason}，此运宜避锋芒。`
        : geJuHit.label === "成格" || geJuHit.label === "扶身"
          ? `格局提示：${geJuHit.reason}。`
          : "";
    return {
      ganZhi,
      startAge: dy.getStartAge(),
      endAge: dy.getEndAge(),
      startYear: dy.getStartYear(),
      endYear: dy.getEndYear(),
      isCurrent:
        new Date().getFullYear() >= dy.getStartYear() && new Date().getFullYear() <= dy.getEndYear(),
      yongShenScore: scored.score,
      yongShenLabel: scored.label,
      yongShenReason: scored.reason,
      geJuLabel: geJuHit.label,
      geJuReason: geJuHit.reason,
      advice: `${advice}${geJuAdvice ? " " + geJuAdvice : ""}`,
    };
  });

  const current = daYunScored.find((d) => d.isCurrent) ?? daYunScored[0];
  const liuNianSource = (current
    ? daYunList.find((dy) => dy.getGanZhi() === current.ganZhi)
    : daYunList[1]
  )?.getLiuNian() ?? daYunList[1]?.getLiuNian() ?? [];

  const liuNian = liuNianSource.slice(0, 12).map((ln) => {
    const ganZhi = ln.getGanZhi();
    const scored = scoreGanZhiAgainstYongShen(ganZhi, useful, avoid);
    const geJuHit = scoreGanZhiAgainstGeJu(ganZhi, geJuName, geJuBroken);
    return {
      year: ln.getYear(),
      ganZhi,
      age: ln.getAge(),
      yongShenScore: scored.score,
      yongShenLabel: scored.label,
      yongShenReason: scored.reason,
      geJuLabel: geJuHit.label,
      geJuReason: geJuHit.reason,
    };
  });

  return {
    startAge: daYunList[1]?.getStartAge() ?? 0,
    startYear: yun.getStartYear(),
    dayMaster: bazi.dayMaster,
    strength: bazi.strength,
    strengthScore: bazi.strengthScore,
    yongShen: bazi.yongShen,
    geJu: bazi.geJu,
    tongGen: bazi.tongGen,
    trueSolarNote: bazi.trueSolarNote,
    daYun: daYunScored,
    liuNian,
    summary: bazi.yongShen
      ? `${bazi.yongShen.summary} 格局${geJuName}${geJuBroken ? "（有破格风险）" : ""}。大运/流年已交叉喜用与成破。`
      : undefined,
  };
}

export function resolveBaziFromPillars(pillars: string) {
  const parts = pillars.replace(/\s+/g, "").split(/[-,，]/).filter(Boolean);
  if (parts.length !== 4) {
    throw new Error("请输入完整四柱，格式如：甲子-乙丑-丙寅-丁卯");
  }
  const [yearGz, monthGz, dayGz, timeGz] = parts;
  const candidates = Solar.fromBaZi(yearGz, monthGz, dayGz, timeGz, 2, 1800)
    .slice(0, 8)
    .map((solar) => {
      const lunar = solar.getLunar();
      const ec = lunar.getEightChar();
      return {
        solarDate: solar.toYmdHms(),
        lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
        pillars: `${ec.getYear()} ${ec.getMonth()} ${ec.getDay()} ${ec.getTime()}`,
        shengXiao: lunar.getYearShengXiao(),
        note: "历法库匹配候选，请结合出生地进一步核实",
      };
    });

  return {
    pillars: parts,
    message:
      candidates.length > 0
        ? `找到 ${candidates.length} 个匹配的公历时刻（展示前 ${candidates.length} 条）。`
        : "未找到匹配公历时刻，请检查四柱是否正确或是否超出检索范围（1800年至今）。",
    candidates:
      candidates.length > 0
        ? candidates
        : [{ solarDate: "—", lunarDate: "—", pillars: parts.join(" "), note: "无匹配结果" }],
  };
}
