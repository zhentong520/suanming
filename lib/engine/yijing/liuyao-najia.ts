/**
 * 六爻纳甲 · 六亲 · 京房八宫世应 · 伏神 · 六冲合 · 日辰生克
 */

const STEM_WX: Record<string, string> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

const ZHI_WX: Record<string, string> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

/** 八卦纳甲：自初爻至上爻 */
const NAJIA: Record<string, string[]> = {
  乾: ["甲子", "甲寅", "甲辰", "壬午", "壬申", "壬戌"],
  坤: ["乙未", "乙巳", "乙卯", "癸丑", "癸亥", "癸酉"],
  震: ["庚子", "庚寅", "庚辰", "庚午", "庚申", "庚戌"],
  巽: ["辛丑", "辛亥", "辛酉", "辛未", "辛巳", "辛卯"],
  坎: ["戊寅", "戊辰", "戊午", "戊申", "戊戌", "戊子"],
  离: ["己卯", "己丑", "己亥", "己酉", "己未", "己巳"],
  艮: ["丙辰", "丙午", "丙申", "丙戌", "丙子", "丙寅"],
  兑: ["丁巳", "丁卯", "丁丑", "丁亥", "丁酉", "丁未"],
};

const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

/** 八纯卦爻阴阳（初→上，1阳0阴） */
const PURE_LINES: Record<string, number[]> = {
  乾: [1, 1, 1, 1, 1, 1],
  坤: [0, 0, 0, 0, 0, 0],
  震: [1, 0, 0, 1, 0, 0],
  巽: [0, 1, 1, 0, 1, 1],
  坎: [0, 1, 0, 0, 1, 0],
  离: [1, 0, 1, 1, 0, 1],
  艮: [0, 0, 1, 0, 0, 1],
  兑: [1, 1, 0, 1, 1, 0],
};

const SHI_BY_ROLE: Record<string, number> = {
  本宫: 6,
  一世: 1,
  二世: 2,
  三世: 3,
  四世: 4,
  五世: 5,
  游魂: 4,
  归魂: 3,
};

const LIU_CHONG_PAIRS: Array<[string, string]> = [
  ["乾", "坤"],
  ["震", "巽"],
  ["坎", "离"],
  ["艮", "兑"],
];

const LIU_HE_PAIRS: Array<[string, string]> = [
  ["乾", "兑"],
  ["坤", "艮"],
  ["震", "坎"],
  ["巽", "离"],
];

function flip(lines: number[], idx: number): number[] {
  const next = [...lines];
  next[idx] = next[idx] ? 0 : 1;
  return next;
}

function linesKey(lines: number[]): string {
  return lines.join("");
}

/** 预生成八宫六十四卦 → 宫位角色 */
function buildPalaceLookup(): Map<string, { palace: string; role: string }> {
  const map = new Map<string, { palace: string; role: string }>();
  for (const [palace, pure] of Object.entries(PURE_LINES)) {
    const gens: Array<{ role: string; lines: number[] }> = [{ role: "本宫", lines: [...pure] }];
    let cur = [...pure];
    for (let i = 0; i < 5; i++) {
      cur = flip(cur, i);
      gens.push({ role: `${["一", "二", "三", "四", "五"][i]}世`, lines: [...cur] });
    }
    // 游魂：五世后再变第四爻（索引3）
    const youHun = flip(gens[5].lines, 3);
    gens.push({ role: "游魂", lines: youHun });
    // 归魂：游魂变内卦三爻回本宫内卦
    let gui = [...youHun];
    for (let i = 0; i < 3; i++) gui = flip(gui, i);
    // 归魂内卦应等于本宫内卦
    gui = [...pure.slice(0, 3), ...youHun.slice(3)];
    gens.push({ role: "归魂", lines: gui });

    for (const g of gens) {
      map.set(linesKey(g.lines), { palace, role: g.role });
    }
  }
  return map;
}

const PALACE_LOOKUP = buildPalaceLookup();

export function linesToTrigrams(lines: number[]): { upper: string; lower: string } {
  const names = ["坤", "震", "坎", "兑", "艮", "离", "巽", "乾"];
  const lowerBits = (lines[0] ?? 0) + ((lines[1] ?? 0) << 1) + ((lines[2] ?? 0) << 2);
  const upperBits = (lines[3] ?? 0) + ((lines[4] ?? 0) << 1) + ((lines[5] ?? 0) << 2);
  return { lower: names[lowerBits] ?? "坤", upper: names[upperBits] ?? "乾" };
}

export function liuQinOf(dayGan: string, yaoGan: string): string {
  const dm = STEM_WX[dayGan] ?? "土";
  const ox = STEM_WX[yaoGan] ?? "土";
  if (dm === ox) return "兄弟";
  if (SHENG[dm] === ox) return "子孙";
  if (KE[dm] === ox) return "妻财";
  if (KE[ox] === dm) return "官鬼";
  if (SHENG[ox] === dm) return "父母";
  return "兄弟";
}

/** 京房八宫世应 */
export function shiYingPositions(
  upper: string,
  lower: string,
  lines?: number[]
): { shi: number; ying: number; palace: string; role: string } {
  if (lines && lines.length === 6) {
    const hit = PALACE_LOOKUP.get(linesKey(lines));
    if (hit) {
      const shi = SHI_BY_ROLE[hit.role] ?? 6;
      const ying = ((shi + 2) % 6) + 1;
      return { shi, ying, palace: hit.palace, role: hit.role };
    }
  }
  // 回退：内外同为八纯
  if (upper === lower) return { shi: 6, ying: 3, palace: upper, role: "本宫" };
  return { shi: 3, ying: 6, palace: upper, role: "三世" };
}

export interface FuShen {
  liuQin: string;
  najia: string;
  gan: string;
  zhi: string;
  underPosition: number;
  note: string;
}

export interface YaoDetail {
  position: number;
  name: string;
  najia: string;
  gan: string;
  zhi: string;
  liuQin: string;
  moving: boolean;
  isShi: boolean;
  isYing: boolean;
  fuShen?: FuShen;
}

export function detectLiuChongHe(upper: string, lower: string): { chong: boolean; he: boolean; note: string } {
  const chong = LIU_CHONG_PAIRS.some(
    ([a, b]) => (upper === a && lower === b) || (upper === b && lower === a)
  );
  const he = LIU_HE_PAIRS.some(
    ([a, b]) => (upper === a && lower === b) || (upper === b && lower === a)
  );
  const note = chong
    ? `内外卦${upper}${lower}六冲，事多反复波折。`
    : he
      ? `内外卦${upper}${lower}六合，事易和合顺利。`
      : `内外卦${upper}${lower}无直接六冲六合。`;
  return { chong, he, note };
}

/** 伏神：本宫纯卦六亲中，飞象所无者，伏于对应爻下 */
export function findFuShen(
  palace: string,
  dayGan: string,
  flying: YaoDetail[]
): FuShen[] {
  const pureNa = NAJIA[palace];
  if (!pureNa) return [];
  const flyingQin = new Set(flying.map((y) => y.liuQin));
  const allQin = ["父母", "兄弟", "子孙", "妻财", "官鬼"];
  const missing = allQin.filter((q) => !flyingQin.has(q));
  const result: FuShen[] = [];
  for (const q of missing) {
    for (let i = 0; i < 6; i++) {
      const najia = pureNa[i];
      const gan = najia[0];
      const zhi = najia[1];
      if (liuQinOf(dayGan, gan) === q) {
        result.push({
          liuQin: q,
          najia,
          gan,
          zhi,
          underPosition: i + 1,
          note: `${q}${najia}伏于第${i + 1}爻下（本宫${palace}）`,
        });
        break;
      }
    }
  }
  return result;
}

export function dayChenRelation(
  dayZhi: string,
  yao: YaoDetail[]
): string {
  const dayWx = ZHI_WX[dayZhi] ?? "土";
  const moving = yao.filter((y) => y.moving);
  if (!moving.length) {
    const shi = yao.find((y) => y.isShi);
    if (!shi) return `日辰${dayZhi}，无动爻，以日辰与世爻参看。`;
    const shiWx = ZHI_WX[shi.zhi] ?? "土";
    if (dayWx === shiWx) return `日辰${dayZhi}与世爻比和，事有根基。`;
    if (SHENG[dayWx] === shiWx) return `日辰${dayZhi}生日世，得日生助。`;
    if (KE[dayWx] === shiWx) return `日辰${dayZhi}克世，当日压力偏大。`;
    if (KE[shiWx] === dayWx) return `世克日辰，宜主动作为。`;
    return `日辰${dayZhi}与世爻${shi.zhi}平平。`;
  }
  return moving
    .map((y) => {
      const wx = ZHI_WX[y.zhi] ?? "土";
      if (dayWx === wx) return `日辰比和动爻${y.name}${y.liuQin}`;
      if (SHENG[dayWx] === wx) return `日辰生${y.name}${y.liuQin}，动而有气`;
      if (KE[dayWx] === wx) return `日辰克${y.name}${y.liuQin}，动而受制`;
      if (KE[wx] === dayWx) return `${y.name}${y.liuQin}克日，变中带冲`;
      if (SHENG[wx] === dayWx) return `${y.name}${y.liuQin}生日，泄气于日`;
      return `日辰与${y.name}平平`;
    })
    .join("；");
}

export function buildLiuyaoNajia(input: {
  lines: number[];
  dayGan: string;
  dayZhi?: string;
  changingYao?: number[];
}): {
  yao: YaoDetail[];
  upper: string;
  lower: string;
  shi: number;
  ying: number;
  palace: string;
  role: string;
  fuShen: FuShen[];
  liuChongHe: { chong: boolean; he: boolean; note: string };
  dayChen: string;
} {
  const { upper, lower } = linesToTrigrams(input.lines);
  const { shi, ying, palace, role } = shiYingPositions(upper, lower, input.lines);
  const lowerNa = NAJIA[lower] ?? NAJIA.坤;
  const upperNa = NAJIA[upper] ?? NAJIA.乾;
  const moving = new Set(input.changingYao ?? []);

  const yao: YaoDetail[] = [];
  for (let i = 0; i < 6; i++) {
    const najia = i < 3 ? lowerNa[i] : upperNa[i];
    const gan = najia[0];
    const zhi = najia[1];
    const pos = i + 1;
    yao.push({
      position: pos,
      name: ["初", "二", "三", "四", "五", "上"][i] + (input.lines[i] ? "九" : "六"),
      najia,
      gan,
      zhi,
      liuQin: liuQinOf(input.dayGan, gan),
      moving: moving.has(pos),
      isShi: pos === shi,
      isYing: pos === ying,
    });
  }

  const fuShen = findFuShen(palace, input.dayGan, yao);
  for (const f of fuShen) {
    const host = yao[f.underPosition - 1];
    if (host) host.fuShen = f;
  }

  const liuChongHe = detectLiuChongHe(upper, lower);
  const dayChen = dayChenRelation(input.dayZhi ?? "子", yao);

  return { yao, upper, lower, shi, ying, palace, role, fuShen, liuChongHe, dayChen };
}

export function liuQinSummary(yao: YaoDetail[], extra?: { fuShen?: FuShen[]; liuChongHe?: string; dayChen?: string }): string {
  const moving = yao.filter((y) => y.moving);
  const shi = yao.find((y) => y.isShi);
  const ying = yao.find((y) => y.isYing);
  const parts = [
    `世爻在${shi?.name}（${shi?.liuQin}${shi?.najia}），应爻在${ying?.name}（${ying?.liuQin}${ying?.najia}）。`,
  ];
  if (moving.length) {
    parts.push(
      `动爻：${moving.map((y) => `${y.name}${y.liuQin}${y.najia}`).join("、")}。动而有变，以动爻所主六亲断事。`
    );
  } else {
    parts.push("无动爻，以世应比和与静卦六亲旺衰断。");
  }
  if (extra?.fuShen?.length) {
    parts.push(`伏神：${extra.fuShen.map((f) => f.note).join("；")}。`);
  }
  if (extra?.liuChongHe) parts.push(extra.liuChongHe);
  if (extra?.dayChen) parts.push(extra.dayChen);
  return parts.join("");
}

export { NAJIA, ZHI_WX };

function guaFromTrigramBits(upper: number, lower: number): { upper: string; lower: string } {
  const names = ["", "乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];
  return { upper: names[upper] ?? "乾", lower: names[lower] ?? "坤" };
}

export { guaFromTrigramBits };
