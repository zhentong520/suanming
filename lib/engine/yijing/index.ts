import {
  buildHexagramReading,
  hexagramNameFromTrigrams,
  HEXAGRAM_NAMES,
} from "../hexagram-lib";
import {
  buildLinesFromSeed,
  deriveHexagramsFromLines,
  hashString,
  seedFromDate,
  type YaoLine,
  valueToLineType,
} from "../shared/iching-lines";
import { lunarFromDate, xiaoliurenGong } from "../shared/lunar-advanced";
import { buildLiuyaoNajia, liuQinSummary } from "./liuyao-najia";
import { analyzeLiuyao } from "./liuyao-engine";

function hashQuestion(q: string): number {
  return hashString(q);
}

function linesFromManual(values: Array<6 | 7 | 8 | 9> | YaoLine[]): YaoLine[] {
  if (values.length !== 6) throw new Error("手动起卦需提供六爻（自下而上）");
  return values.map((item, i) => {
    if (typeof item === "object" && "value" in item) return item as YaoLine;
    const value = item as 6 | 7 | 8 | 9;
    const type = valueToLineType(value);
    return {
      position: i + 1,
      type,
      value,
      changing: value === 6 || value === 9,
      meaning:
        type === "老阴"
          ? "老阴动爻，阴极将变阳，事有转折。"
          : type === "老阳"
            ? "老阳动爻，阳极将变阴，盛极而衰。"
            : type === "少阳"
              ? "少阳静爻，阳气初生，势在未发。"
              : "少阴静爻，阴气内藏，宜静观其变。",
    };
  });
}

export function computeYijing(question?: string, date?: Date, manualLines?: YaoLine[] | Array<6 | 7 | 8 | 9>) {
  const d = date ?? new Date();
  const lines = manualLines ? linesFromManual(manualLines) : buildLinesFromSeed(seedFromDate(d, hashQuestion(question ?? "")));
  const { benGua, bianGua, changingYao } = deriveHexagramsFromLines(lines);

  return buildHexagramReading(benGua, {
    question,
    method: manualLines ? "周易手动装卦（铜钱录入）" : "周易三钱法（时问起卦）",
    changingHexagram: bianGua,
    changingYao,
    changingLines: lines,
  });
}

export function computeLiuyao(question?: string, date?: Date, manualLines?: YaoLine[] | Array<6 | 7 | 8 | 9>) {
  const d = date ?? new Date();
  const lines = manualLines
    ? linesFromManual(manualLines)
    : buildLinesFromSeed(seedFromDate(d, hashQuestion(question ?? "") + 7));
  const { benGua, bianGua, changingYao, dongYaoCount } = deriveHexagramsFromLines(lines);
  const lunar = lunarFromDate(d);
  const ec = lunar.getEightChar();
  const dayGan = ec.getDayGan();
  const dayZhi = ec.getDayZhi();
  const monthZhi = ec.getMonthZhi();
  const binaryLines = lines.map((l) => (l.value === 7 || l.value === 9 ? 1 : 0));
  const movingPositions = lines.filter((l) => l.changing).map((l) => l.position);
  const najia = buildLiuyaoNajia({
    lines: binaryLines,
    dayGan,
    dayZhi,
    changingYao: movingPositions,
  });

  // 断卦引擎（《增删卜易》四神 + 《卜筮正宗》歌诀）：变卦纳甲供回头生克/进退神
  const changedBinary = binaryLines.map((b, i) =>
    movingPositions.includes(i + 1) ? (b ? 0 : 1) : b
  );
  const changedNajia =
    movingPositions.length > 0
      ? buildLiuyaoNajia({ lines: changedBinary, dayGan, dayZhi }).yao
      : [];
  const duanGua = analyzeLiuyao({
    question: question ?? "",
    dayGan,
    dayZhi,
    monthZhi,
    najia,
    changedNajia,
  });

  const reading = buildHexagramReading(benGua, {
    question,
    method: manualLines ? "六爻手动装卦（纳甲六亲）" : "六爻三钱法（纳甲六亲）",
    changingHexagram: bianGua,
    changingYao,
    changingLines: lines,
  });

  const yaoTable = najia.yao
    .map(
      (y) =>
        `${y.name} ${y.liuQin}${y.najia}${y.isShi ? "〔世〕" : ""}${y.isYing ? "〔应〕" : ""}${y.moving ? "（动）" : ""}${y.fuShen ? `〔伏${y.fuShen.liuQin}${y.fuShen.najia}〕` : ""}`
    )
    .join("\n");

  const liuQinText = liuQinSummary(najia.yao, {
    fuShen: najia.fuShen,
    liuChongHe: najia.liuChongHe.note,
    dayChen: najia.dayChen,
  });

  return {
    ...reading,
    benGua: reading.hexagram,
    bianGua,
    method: manualLines ? "六爻手动装卦（纳甲六亲）" : "六爻三钱法（纳甲六亲）",
    lines,
    dongYaoCount,
    dayGan,
    dayZhi,
    upperGua: najia.upper,
    lowerGua: najia.lower,
    shiYao: najia.shi,
    yingYao: najia.ying,
    gongPalace: najia.palace,
    gongRole: najia.role,
    yaoDetail: najia.yao,
    fuShen: najia.fuShen,
    liuChongHe: najia.liuChongHe,
    dayChen: najia.dayChen,
    monthZhi,
    duanGua,
    manual: Boolean(manualLines),
    liuQin: {
      世应: `世在第${najia.shi}爻，应在第${najia.ying}爻（${najia.palace}宫${najia.role}）`,
      六亲: liuQinText,
      装卦: yaoTable,
    },
    sections: [
      ...(reading.sections ?? []),
      {
        title: "纳甲装卦",
        content: `内卦${najia.lower}、外卦${najia.upper}，属${najia.palace}宫${najia.role}，日干${dayGan}日支${dayZhi}。\n${yaoTable}`,
      },
      { title: "六亲世应", content: liuQinText },
      {
        title: "伏神与冲合",
        content: [
          najia.fuShen.length ? najia.fuShen.map((f) => f.note).join("；") : "六亲俱全，无明显伏神。",
          najia.liuChongHe.note,
          najia.dayChen,
        ].join("\n"),
      },
      {
        title: "断卦（《增删卜易》四神）",
        content: [
          `用神：${duanGua.yongShen.label}（${duanGua.yongShen.note}）${duanGua.yongNote ? `——${duanGua.yongNote}` : ""}`,
          duanGua.yong
            ? `用神${duanGua.yong.name}${duanGua.yong.liuQin}${duanGua.yong.najia} 旺衰评分 ${duanGua.yong.score}（${duanGua.yong.beast}临之）：${duanGua.yong.notes.join("；")}`
            : "用神取世爻参断",
          duanGua.yuan ? `元神（生用神者）${duanGua.yuan.name}${duanGua.yuan.liuQin} 评分 ${duanGua.yuan.score}` : "元神不上卦",
          duanGua.ji ? `忌神（克用神者）${duanGua.ji.name}${duanGua.ji.liuQin} 评分 ${duanGua.ji.score}${duanGua.ji.moving ? "（动）" : ""}` : "忌神不上卦",
          ...(duanGua.liLiang.length ? ["力量清单：" + duanGua.liLiang.join("；")] : []),
          ...duanGua.huaYao,
          `持世诀：${duanGua.chiShi}`,
          `结论【${duanGua.conclusion.level}】：${duanGua.conclusion.text}\n依据：${duanGua.conclusion.basis}`,
        ].join("\n"),
      },
    ],
    summary: `本卦${reading.hexagram}（${reading.fullName}），${dongYaoCount}爻动变${bianGua}。${liuQinText} 用神取${duanGua.yongShen.label}，卦断【${duanGua.conclusion.level}】。`,
  };
}

const BAGUA = ["", "乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];

/** 卦名 → 三爻位（初→上，1阳0阴） */
const TRIGRAM_BITS: Record<string, number[]> = {
  乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0],
  巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
};
const BITS_TO_GUA: Record<string, string> = {
  "111": "乾", "110": "兑", "101": "离", "100": "震",
  "011": "巽", "010": "坎", "001": "艮", "000": "坤",
};
const TRIGRAM_WX_MAP: Record<string, string> = {
  乾: "金", 兑: "金", 离: "火", 震: "木", 巽: "木", 坎: "水", 艮: "土", 坤: "土",
};
const ZHI_WX_MAP: Record<string, string> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};
const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export function computeMeihua(question?: string, numbers?: number[], date?: Date) {
  const d = date ?? new Date();
  const lunar = lunarFromDate(d);
  const n1 = numbers?.[0] ?? lunar.getYear() + lunar.getMonth();
  const n2 = numbers?.[1] ?? lunar.getDay() + d.getHours();
  const n3 = numbers?.[2] ?? d.getMinutes() + d.getSeconds() + hashQuestion(question ?? "");
  const upper = n1 % 8 || 8;
  const lower = n2 % 8 || 8;
  const changing = n3 % 6 || 6;
  const idx = (upper - 1) * 8 + (lower - 1);
  const tiGua = BAGUA[upper];
  const yongGua = BAGUA[lower];

  const benName = hexagramNameFromTrigrams(BAGUA[upper], BAGUA[lower]);
  const reading = buildHexagramReading(benName, {
    question,
    method: "梅花易数（时数起卦）",
    changingYao: changing,
  });

  // 互卦（234爻为下互、345爻为上互，表中间过程，互卦不论体用）+ 变卦 + 错卦综卦
  // 六爻自下而上：下卦三爻在前、上卦三爻在后
  const benBits = [...TRIGRAM_BITS[yongGua], ...TRIGRAM_BITS[tiGua]];
  const huLowerBits = [benBits[1], benBits[2], benBits[3]];
  const huUpperBits = [benBits[2], benBits[3], benBits[4]];
  const bitsToGuaNum = (bits: number[]) => BAGUA.indexOf(BITS_TO_GUA[bits.join("")]);
  const huLower = bitsToGuaNum(huLowerBits);
  const huUpper = bitsToGuaNum(huUpperBits);
  const huGuaName = hexagramNameFromTrigrams(BITS_TO_GUA[huUpperBits.join("")], BITS_TO_GUA[huLowerBits.join("")]);
  const bianBits = benBits.map((b, i) => (i === changing - 1 ? (b ? 0 : 1) : b));
  const bianGuaName = hexagramNameFromTrigrams(BITS_TO_GUA[bianBits.slice(3).join("")], BITS_TO_GUA[bianBits.slice(0, 3).join("")]);
  const cuoGuaName = hexagramNameFromTrigrams(
    BITS_TO_GUA[benBits.slice(3).map((b) => (b ? 0 : 1)).join("")],
    BITS_TO_GUA[benBits.slice(0, 3).map((b) => (b ? 0 : 1)).join("")]
  );
  // 综卦：上下颠倒（本卦上下卦互换即综的简化——严格综卦是整卦翻转）
  const zongGuaName = hexagramNameFromTrigrams(BAGUA[lower], BAGUA[upper]);

  // 卦气旺衰（体卦五行对月令：旺衰是吉凶的放大镜）
  const monthZhi = lunar.getEightChar().getMonthZhi();
  const tiWx = TRIGRAM_WX_MAP[tiGua];
  const monthWx = ZHI_WX_MAP[monthZhi];
  let guaQi = "";
  if (tiWx && monthWx) {
    if (tiWx === monthWx) guaQi = `体卦${tiGua}（${tiWx}）与月令${monthZhi}（${monthWx}）同气——体卦当令旺相，吉者愈吉。`;
    else if (SHENG[monthWx] === tiWx) guaQi = `月令生体卦，体卦得生旺——事有生机，吉力放大。`;
    else if (KE[monthWx] === tiWx) guaQi = `月令克体卦，体卦受囚——事多阻抑，凶者愈凶，宜缓图。`;
    else if (SHENG[tiWx] === monthWx) guaQi = `体卦生月令，泄气于时——事费力而少功，宜借人力。`;
    else guaQi = `体卦克月令，体旺可用——主动权在我，蛮干耗力。`;
  }

  const tiYongAnalysis = `体卦${tiGua}，用卦${yongGua}。体为主、用为事，${
    upper === lower
      ? "体用比和，事易成。"
      : upper % 2 === lower % 2
        ? "体用相生，有助力。"
        : "体用相克，多阻滞，宜变通。"
  }`;

  const waiYingGuide =
    "外应断法：起卦前后一念之间所见所闻（声、色、物、方位）皆可入断。如桃→逃/桃花，树有根→欲逃难脱，枝折→肢伤。同一外象，不同人感应侧面不同，故断语可异；刻意凑象则失准。亦可时间起卦、报数、测字、方位、声音起卦，体用生克仍为主干。";

  return {
    ...reading,
    numbers: [n1, n2, n3],
    upperGua: upper,
    lowerGua: lower,
    upperName: tiGua,
    lowerName: yongGua,
    changingYao: changing,
    tiYong: tiYongAnalysis,
    huGua: huGuaName,
    bianGuaName,
    cuoGua: cuoGuaName,
    zongGua: zongGuaName,
    guaQi,
    waiYingGuide,
    sections: [
      ...(reading.sections ?? []),
      { title: "体用分析", content: tiYongAnalysis },
      {
        title: "互卦与变卦",
        content: [
          `互卦${huGuaName}（二三四爻为下互、三四五爻为上互）——表中间过程，互卦不论体用，只取卦象。`,
          `变卦${bianGuaName}——表最终趋势。`,
          `错卦${cuoGuaName}（阴阳互换，反面对照）、综卦${zongGuaName}（上下颠倒）——事不明时可参其对反。`,
        ].join("\n"),
      },
      { title: "卦气旺衰", content: `${guaQi}\n旺衰是吉凶的放大镜：体宜旺、用宜衰；卦气不足，宜借月建生扶之方与时。` },
      { title: "起卦数", content: `上卦数${n1}，下卦数${n2}，动爻数${n3}（农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}）。` },
      { title: "外应心法", content: waiYingGuide },
    ],
    summary: `梅花易数得${reading.fullName}，${tiYongAnalysis} ${reading.overview}`,
  };
}

const GONG_DETAIL: Record<string, { nature: string; career: string; love: string; timing: string }> = {
  大安: {
    nature: "青龙木位，主安定吉祥",
    career: "事业平稳，宜守不宜攻，现有基础可保无虞。",
    love: "感情安稳，宜细水长流。",
    timing: "当下即可推进，但不宜急躁。",
  },
  留连: {
    nature: "玄武水位，主迟滞拖延",
    career: "事业进展缓慢，或有琐事缠身。",
    love: "感情易冷战或误会，需耐心化解。",
    timing: "宜等三至七日后再决。",
  },
  速喜: {
    nature: "朱雀火位，主快速喜庆",
    career: "有喜讯将至，宜把握短期机会。",
    love: "桃花运旺，宜主动表达。",
    timing: "近期即可见分晓。",
  },
  赤口: {
    nature: "白虎金位，主口舌是非",
    career: "谨防小人中伤，合同文书需细审。",
    love: "易因言语伤人，少说多听。",
    timing: "不宜今日决断，宜缓。",
  },
  小吉: {
    nature: "六合木位，主小有吉庆",
    career: "有小进益，适合合作小事。",
    love: "关系缓和，宜约会增进感情。",
    timing: "平稳推进即可。",
  },
  空亡: {
    nature: "勾陈土位，主落空无成",
    career: "计划易落空，宜另择方案。",
    love: "不宜表白或定亲，缘分未至。",
    timing: "宜静候，不宜行动。",
  },
};

export function computeXiaoliuren(question?: string, date?: Date) {
  const info = xiaoliurenGong(date);
  const gong = info.gong;
  const detail = GONG_DETAIL[gong];

  return {
    question: question ?? "一般问事",
    gong,
    index: info.index,
    hourZhi: info.hourZhi,
    liuYao: info.liuYao,
    jieQi: info.jieQi,
    ...detail,
    palm: `从大安起子时，顺数${info.hourZhi}时落${gong}宫。`,
    sections: [
      { title: "宫位", content: `${gong}（第${info.index}宫）` },
      { title: "宫意", content: detail.nature },
      { title: "时辰", content: `当前${info.hourZhi}时，六爻${info.liuYao}，${info.jieQi ? `节气${info.jieQi}` : ""}` },
      { title: "事业", content: detail.career },
      { title: "感情", content: detail.love },
      { title: "时机", content: detail.timing },
      { title: "掌诀", content: `从大安起子时，顺数${info.hourZhi}时落${gong}宫。` },
    ],
    summary: `小六壬落${gong}宫（${info.hourZhi}时）。${detail.nature}。${detail.career}`,
    caveat: "小六壬按时辰掌诀起课，同问同时结果一致。",
  };
}

export { HEXAGRAM_NAMES };
