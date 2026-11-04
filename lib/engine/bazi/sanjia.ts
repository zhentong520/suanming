import type { EightChar } from "lunar-typescript";

/**
 * 子平三柱一空：胎元、命宫、身宫 + 四柱旬空亡。
 * 干支计算取自 lunar-typescript（6tail 系开源库，与本项目引擎同源），
 * 义理依据：《渊海子平》《三命通会》通行说法。
 */
export interface XunKongItem {
  pillar: string;
  ganZhi: string;
  xun: string;
  kong: string;
}

export interface SanJiaResult {
  taiYuan: string;
  taiYuanNote: string;
  mingGong: string;
  mingGongNote: string;
  shenGong: string;
  shenGongNote: string;
  xunKong: XunKongItem[];
  notes: string[];
}

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

function branchOf(gz: string): string {
  return gz[1] ?? "";
}

/** 命宫地支在三合局中的本气五行（粗断），用于与日主生克简评 */
function palaceElement(gz: string): string {
  const zhi = branchOf(gz);
  const map: Record<string, string> = {
    寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土",
    申: "金", 酉: "金", 戌: "土", 亥: "水", 子: "水", 丑: "土",
  };
  return map[zhi] ?? "土";
}

function relation(dayEl: string, palaceEl: string): string {
  const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
  if (dayEl === palaceEl) return "与日主比和，心性趋同，主性格内外一致。";
  if (SHENG[dayEl] === palaceEl) return "命宫泄日主之气，主才华外发，宜防劳心。";
  if (SHENG[palaceEl] === dayEl) return "命宫生日主，主后天得助，根基有靠。";
  if (KE[dayEl] === palaceEl) return "命宫受日主所克，主自我约束力强，操劳而有所成。";
  if (KE[palaceEl] === dayEl) return "命宫克日主，主环境压力促人奋进，逆境能起。";
  return "命宫与日主五行异气，主性情多面。";
}

export function computeSanJia(ec: EightChar, dayElement: string, timeKnown: boolean): SanJiaResult {
  const taiYuan = ec.getTaiYuan();
  const mingGong = ec.getMingGong();
  const shenGong = ec.getShenGong();

  const xunKong: XunKongItem[] = [
    { pillar: "年柱", ganZhi: ec.getYear(), xun: ec.getYearXun?.() ?? "", kong: ec.getYearXunKong() },
    { pillar: "月柱", ganZhi: ec.getMonth(), xun: ec.getMonthXun?.() ?? "", kong: ec.getMonthXunKong() },
    { pillar: "日柱", ganZhi: ec.getDay(), xun: ec.getDayXun?.() ?? "", kong: ec.getDayXunKong() },
  ];
  if (timeKnown) {
    xunKong.push({
      pillar: "时柱",
      ganZhi: ec.getTime(),
      xun: ec.getTimeXun?.() ?? "",
      kong: ec.getTimeXunKong(),
    });
  }

  const taiYuanNote =
    "胎元为受气之月，主先天禀赋；胎元干支补四柱所缺五行者，先天根基更厚。";
  const mingGongNote = `命宫主一生趋向与心性底色，命宫五行${palaceElement(mingGong)}。${relation(dayElement, palaceElement(mingGong))}`;
  const shenGongNote = "身宫主后天造化与用神所栖，身宫与命宫同宫者一生趋向专一。";

  const notes: string[] = [
    `胎元${taiYuan}：${taiYuanNote}`,
    `命宫${mingGong}：${mingGongNote}`,
    `身宫${shenGong}：${shenGongNote}`,
  ];

  const dayKong = xunKong.find((x) => x.pillar === "日柱")?.kong ?? "";
  if (dayKong) {
    const hitPillars = [
      ec.getYear(),
      ec.getMonth(),
      ...(timeKnown ? [ec.getTime()] : []),
    ].filter((gz) => gz && dayKong.includes(branchOf(gz)));
    notes.push(
      hitPillars.length > 0
        ? `日柱旬空${dayKong}，${hitPillars.join("、")}柱地支逢空：逢空之柱吉凶之力打折，忌神逢空反喜，用神逢空须岁运填实。`
        : `日柱旬空${dayKong}，四柱地支皆不逢空，吉凶照常论。`,
    );
  }

  return { taiYuan, taiYuanNote, mingGong, mingGongNote, shenGong, shenGongNote, xunKong, notes };
}
