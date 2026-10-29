/** 奇门遁甲三元：值符值使、地盘天盘干、中宫寄坤、日空马星 */
import { Lunar, Solar } from "lunar-typescript";

const GATES = ["休", "生", "伤", "杜", "景", "死", "惊", "开"] as const;
const STARS = ["天蓬", "天芮", "天冲", "天辅", "天禽", "天心", "天柱", "天任", "天英"] as const;
const GODS = ["值符", "螣蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"] as const;
const PALACES = ["坎", "坤", "震", "巽", "中", "乾", "兑", "艮", "离"] as const;
const POSITIONS = ["北", "西南", "东", "东南", "中", "西北", "西", "东北", "南"];
/** 三奇六仪（阳遁顺布顺序） */
const LIU_YI = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"] as const;

const YANG_JU: Record<string, [number, number, number]> = {
  冬至: [1, 7, 4],
  小寒: [2, 8, 5],
  大寒: [3, 9, 6],
  立春: [8, 5, 2],
  雨水: [9, 6, 3],
  惊蛰: [1, 7, 4],
  春分: [3, 9, 6],
  清明: [4, 1, 7],
  谷雨: [5, 2, 8],
  立夏: [4, 1, 7],
  小满: [5, 2, 8],
  芒种: [6, 3, 9],
};

const YIN_JU: Record<string, [number, number, number]> = {
  夏至: [9, 3, 6],
  小暑: [8, 2, 5],
  大暑: [7, 1, 4],
  立秋: [2, 5, 8],
  处暑: [1, 4, 7],
  白露: [9, 3, 6],
  秋分: [7, 1, 4],
  寒露: [6, 9, 3],
  霜降: [5, 8, 2],
  立冬: [6, 9, 3],
  小雪: [5, 8, 2],
  大雪: [4, 7, 1],
};

const YANG_TERMS = Object.keys(YANG_JU);
const YIN_TERMS = Object.keys(YIN_JU);

export interface QimenPlateCell {
  palace: string;
  gate: string;
  star: string;
  god: string;
  position: string;
  diGan: string;
  tianGan: string;
  isZhiFu?: boolean;
  isZhiShi?: boolean;
  isJiGong?: boolean;
  menPo?: boolean;
  jiXing?: boolean;
}

export interface QimenPlate {
  jieQi: string;
  yuan: "上元" | "中元" | "下元";
  pattern: "阳遁" | "阴遁";
  ju: number;
  juName: string;
  hourZhi: string;
  timeGan: string;
  zhiFu: string;
  zhiShi: string;
  kongWang: string;
  jiGong: string;
  maXing: string;
  menPo?: string[];
  jiXing?: string[];
  plate: QimenPlateCell[];
}

function daysSinceJieQi(lunar: Lunar, jieQiName: string): number {
  const table = lunar.getJieQiTable();
  const jqSolar = table[jieQiName];
  if (!jqSolar) return 0;
  const current = Solar.fromDate(new Date(lunar.getSolar().toYmdHms().replace(/-/g, "/")));
  const jq = Solar.fromYmd(jqSolar.getYear(), jqSolar.getMonth(), jqSolar.getDay());
  const diff = Math.floor(
    (Date.parse(current.toYmd()) - Date.parse(jq.toYmd())) / 86400000
  );
  return Math.max(0, Math.min(14, diff));
}

function resolveJieQiYuan(lunar: Lunar) {
  const current = lunar.getCurrentJieQi()?.getName();
  const prev = lunar.getPrevJieQi(true)?.getName() ?? "冬至";
  const jieQi = current ?? prev;
  const isYang = YANG_TERMS.includes(jieQi) || (!YIN_TERMS.includes(jieQi) && !current);
  const pattern: "阳遁" | "阴遁" = isYang ? "阳遁" : "阴遁";
  const table = isYang ? YANG_JU : YIN_JU;
  const key = table[jieQi] ? jieQi : isYang ? "冬至" : "夏至";
  const days = daysSinceJieQi(lunar, key);
  const yuanIdx = days < 5 ? 0 : days < 10 ? 1 : 2;
  const yuan: "上元" | "中元" | "下元" = ["上元", "中元", "下元"][yuanIdx] as "上元";
  const ju = table[key][yuanIdx];
  return { jieQi: key, yuan, pattern, ju };
}

/** 地盘六仪：阳顺阴逆，戊落局数宫；中宫寄坤 */
function placeDiGan(ju: number, pattern: "阳遁" | "阴遁"): string[] {
  const di = Array(9).fill("");
  const forward = pattern === "阳遁";
  const start = ((ju - 1) % 9 + 9) % 9;
  for (let i = 0; i < 9; i++) {
    const idx = forward ? (start + i) % 9 : (start - i + 9) % 9;
    di[idx] = LIU_YI[i];
  }
  // 中宫寄坤：中宫干与坤宫同用坤位干，标记寄
  di[4] = di[1];
  return di;
}

/** 天盘干：以时干为值符，六仪随值符宫旋转 */
function placeTianGan(diGan: string[], timeGan: string, zhiFuPalace: number): string[] {
  const tian = Array(9).fill("");
  let srcIdx = diGan.findIndex((g, i) => g === timeGan && i !== 4);
  if (srcIdx < 0) srcIdx = diGan.indexOf(timeGan);
  if (srcIdx < 0) srcIdx = zhiFuPalace;
  const offset = (zhiFuPalace - srcIdx + 9) % 9;
  for (let i = 0; i < 9; i++) {
    tian[i] = diGan[(i - offset + 9) % 9] || diGan[i];
  }
  tian[4] = tian[1];
  return tian;
}

function dayMaXing(dayZhi: string): string {
  const groups: Array<{ zhi: string[]; ma: string }> = [
    { zhi: ["申", "子", "辰"], ma: "寅" },
    { zhi: ["寅", "午", "戌"], ma: "申" },
    { zhi: ["亥", "卯", "未"], ma: "巳" },
    { zhi: ["巳", "酉", "丑"], ma: "亥" },
  ];
  return groups.find((g) => g.zhi.includes(dayZhi))?.ma ?? "寅";
}

/** 宫五行（中宫土） */
const PALACE_WX: Record<string, string> = {
  坎: "水",
  坤: "土",
  震: "木",
  巽: "木",
  中: "土",
  乾: "金",
  兑: "金",
  艮: "土",
  离: "火",
};

const GATE_WX: Record<string, string> = {
  休: "水",
  生: "土",
  伤: "木",
  杜: "木",
  景: "火",
  死: "土",
  惊: "金",
  开: "金",
};

/** 击刑：门落宫常见表 */
const JI_XING: Array<{ gate: string; palace: string }> = [
  { gate: "伤", palace: "震" },
  { gate: "杜", palace: "巽" },
  { gate: "景", palace: "离" },
  { gate: "死", palace: "坤" },
  { gate: "惊", palace: "兑" },
  { gate: "开", palace: "乾" },
  { gate: "休", palace: "坎" },
  { gate: "生", palace: "艮" },
];

export function detectMenPo(gate: string, palace: string): boolean {
  const g = GATE_WX[gate];
  const p = PALACE_WX[palace];
  if (!g || !p) return false;
  // 门克宫为门迫
  const ke: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
  return ke[g] === p;
}

export function detectJiXing(gate: string, palace: string): boolean {
  return JI_XING.some((x) => x.gate === gate && x.palace === palace);
}

function buildPlate(ju: number, pattern: "阳遁" | "阴遁", hourZhiIdx: number, timeGan: string) {
  const forward = pattern === "阳遁";
  const zhiFuPalace = ((ju - 1) % 9 + 9) % 9;
  const zhiShiGateIdx = hourZhiIdx % 8;
  const zhiFuStarIdx = (ju - 1) % 9;
  const diGan = placeDiGan(ju, pattern);
  const tianGan = placeTianGan(diGan, timeGan, zhiFuPalace);

  const plate: QimenPlateCell[] = Array.from({ length: 9 }, (_, palaceIdx) => {
    const step = forward
      ? (palaceIdx - zhiFuPalace + 9) % 9
      : (zhiFuPalace - palaceIdx + 9) % 9;
    const gateStep = step;
    const gateIdx =
      palaceIdx === 4
        ? zhiShiGateIdx
        : (zhiShiGateIdx + (gateStep > 4 ? gateStep - 1 : gateStep)) % 8;
    const starIdx = (zhiFuStarIdx + step) % 9;
    const godIdx = step % 8;
    const gate = GATES[gateIdx];
    const palace = PALACES[palaceIdx];
    return {
      palace,
      gate,
      star: STARS[starIdx],
      god: GODS[godIdx],
      position: POSITIONS[palaceIdx],
      diGan: diGan[palaceIdx],
      tianGan: tianGan[palaceIdx],
      isZhiFu: palaceIdx === zhiFuPalace,
      isZhiShi: false,
      isJiGong: palaceIdx === 4,
      menPo: detectMenPo(gate, palace),
      jiXing: detectJiXing(gate, palace),
    };
  });

  // 值使：值使门所在宫（优先非中宫）
  const zhiShiGate = GATES[zhiShiGateIdx];
  const zhiShiCell =
    plate.find((p) => p.gate === zhiShiGate && p.palace !== "中") ??
    plate.find((p) => p.gate === zhiShiGate);
  if (zhiShiCell) zhiShiCell.isZhiShi = true;

  return {
    plate,
    zhiFuStar: STARS[zhiFuStarIdx],
    zhiShiGate,
    zhiShiPalace: zhiShiCell?.palace ?? plate[zhiFuPalace]?.palace ?? "坎",
    jiGong: "中宫寄坤",
  };
}

export function computeQimenSanYuan(date?: Date): QimenPlate {
  const solar = Solar.fromDate(date ?? new Date());
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const { jieQi, yuan, pattern, ju } = resolveJieQiYuan(lunar);
  const zhiList = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const hourZhiIdx = zhiList.indexOf(ec.getTimeZhi());
  const timeGan = ec.getTimeGan();
  const { plate, zhiFuStar, zhiShiGate, zhiShiPalace, jiGong } = buildPlate(
    ju,
    pattern,
    hourZhiIdx >= 0 ? hourZhiIdx : 0,
    timeGan
  );
  const focus = plate.find((p) => p.isZhiFu) ?? plate[0];
  const dayZhi = ec.getDayZhi();
  const menPoList = plate.filter((p) => p.menPo).map((p) => `${p.gate}门迫${p.palace}`);
  const jiXingList = plate.filter((p) => p.jiXing).map((p) => `${p.gate}门击刑于${p.palace}`);

  return {
    jieQi,
    yuan,
    pattern,
    ju,
    juName: `${pattern}${ju}局`,
    hourZhi: ec.getTimeZhi(),
    timeGan,
    zhiFu: `${zhiFuStar}（${focus.palace}）`,
    zhiShi: `${zhiShiGate}门（${zhiShiPalace}）`,
    kongWang: typeof ec.getDayXunKong === "function" ? String(ec.getDayXunKong()) : "",
    jiGong,
    maXing: dayMaXing(dayZhi),
    menPo: menPoList,
    jiXing: jiXingList,
    plate,
  };
}

export { GATES, STARS, GODS, PALACES, LIU_YI };
