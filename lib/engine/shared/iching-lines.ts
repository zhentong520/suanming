/**
 * 易经六爻起卦：三钱法 + 卦象推导
 */
import { HEXAGRAM_NAMES, hexagramIndexToName } from "../hexagram-lib";

export type LineType = "老阴" | "少阳" | "少阴" | "老阳";

export interface YaoLine {
  position: number;
  type: LineType;
  value: 6 | 7 | 8 | 9;
  changing: boolean;
  meaning: string;
}

const LINE_MEANING: Record<LineType, string> = {
  老阴: "老阴动爻，阴极将变阳，事有转折。",
  老阳: "老阳动爻，阳极将变阴，盛极而衰。",
  少阳: "少阳静爻，阳气初生，势在未发。",
  少阴: "少阴静爻，阴气内藏，宜静观其变。",
};

/** 三钱掷爻：随机面 0=字 1=背，背为阳。统计背数定爻象 */
export function tossLine(rng: () => number): YaoLine["value"] {
  let backs = 0;
  for (let i = 0; i < 3; i++) {
    if (rng() > 0.5) backs++;
  }
  if (backs === 3) return 9; // 老阳
  if (backs === 2) return 8; // 少阴
  if (backs === 1) return 7; // 少阳
  return 6; // 老阴
}

export function valueToLineType(v: 6 | 7 | 8 | 9): LineType {
  if (v === 9) return "老阳";
  if (v === 8) return "少阴";
  if (v === 7) return "少阳";
  return "老阴";
}

/** 六爻自下而上，7/9 为阳爻，6/8 为阴爻 */
export function linesToTrigram(lines: YaoLine[], start: 0 | 3): number {
  let bits = 0;
  for (let i = 0; i < 3; i++) {
    const v = lines[start + i].value;
    const yang = v === 7 || v === 9;
    if (yang) bits |= 1 << i;
  }
  return bits;
}

/** 先天八卦数 1乾2兑3离4震5巽6坎7艮8坤 → 64卦索引 */
const TRIGRAM_TO_INDEX: Record<number, number> = {
  7: 0,
  0: 1,
  4: 2,
  1: 3,
  6: 4,
  3: 5,
  5: 6,
  2: 7,
};

export function trigramsToHexIndex(lower: number, upper: number): number {
  const lowerIdx = TRIGRAM_TO_INDEX[lower] ?? 0;
  const upperIdx = TRIGRAM_TO_INDEX[upper] ?? 0;
  return upperIdx * 8 + lowerIdx;
}

export function buildLinesFromSeed(seed: number): YaoLine[] {
  let s = seed >>> 0;
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  return Array.from({ length: 6 }, (_, i) => {
    const value = tossLine(rng);
    const type = valueToLineType(value);
    return {
      position: i + 1,
      type,
      value,
      changing: value === 6 || value === 9,
      meaning: LINE_MEANING[type],
    };
  });
}

export function deriveHexagramsFromLines(lines: YaoLine[]) {
  const lower = linesToTrigram(lines, 0);
  const upper = linesToTrigram(lines, 3);
  const benIdx = trigramsToHexIndex(lower, upper);

  const changedLines = lines.map((l) => ({
    ...l,
    value: (l.changing
      ? l.value === 9
        ? 8
        : 7
      : l.value) as 6 | 7 | 8 | 9,
  })) as YaoLine[];
  const bianLower = linesToTrigram(changedLines, 0);
  const bianUpper = linesToTrigram(changedLines, 3);
  const bianIdx = trigramsToHexIndex(bianLower, bianUpper);

  const changing = lines.filter((l) => l.changing);
  const changingYao =
    changing.length === 1
      ? ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"][changing[0].position - 1]
      : changing.length > 1
        ? `${changing.length}爻动`
        : undefined;

  return {
    benGua: hexagramIndexToName(benIdx),
    bianGua: hexagramIndexToName(bianIdx),
    benIdx,
    bianIdx,
    changingYao,
    dongYaoCount: changing.length,
  };
}

export function seedFromDate(date: Date, salt = 0): number {
  return (
    date.getFullYear() * 100000000 +
    (date.getMonth() + 1) * 1000000 +
    date.getDate() * 10000 +
    date.getHours() * 100 +
    date.getMinutes() +
    salt
  );
}

export function hashString(q: string): number {
  let h = 0;
  for (let i = 0; i < q.length; i++) h = (h * 31 + q.charCodeAt(i)) >>> 0;
  return h;
}

/** Mulberry-style LCG from seed */
export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  const rng = createSeededRng(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export { HEXAGRAM_NAMES };
