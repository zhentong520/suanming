/**
 * 八字干支关系网（子平体系）：
 * - 天干五合（甲己/乙庚/丙辛/丁壬/戊癸）
 * - 地支六合 / 三合局 / 六冲 / 相刑 / 相害
 * - 十二长生（日主在各支所处状态，lunar-typescript getDiShi）
 */
import type { EightChar } from "lunar-typescript";

const GAN_HE: Record<string, string> = { 甲: "己", 己: "甲", 乙: "庚", 庚: "乙", 丙: "辛", 辛: "丙", 丁: "壬", 壬: "丁", 戊: "癸", 癸: "戊" };
const GAN_HE_ELEMENT: Record<string, string> = { 甲己: "土", 乙庚: "金", 丙辛: "水", 丁壬: "木", 戊癸: "火" };

const ZHI_LIU_HE: Record<string, string> = { 子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯", 辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午" };
const ZHI_CHONG: Record<string, string> = { 子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅", 卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳" };
const SAN_HE: Array<{ name: string; branches: string[]; element: string }> = [
  { name: "申子辰", branches: ["申", "子", "辰"], element: "水" },
  { name: "寅午戌", branches: ["寅", "午", "戌"], element: "火" },
  { name: "巳酉丑", branches: ["巳", "酉", "丑"], element: "金" },
  { name: "亥卯未", branches: ["亥", "卯", "未"], element: "木" },
];
const XING: Array<{ pair: [string, string]; note: string }> = [
  { pair: ["子", "卯"], note: "无礼之刑" },
  { pair: ["寅", "巳"], note: "恃势之刑" },
  { pair: ["巳", "申"], note: "恃势之刑" },
  { pair: ["寅", "申"], note: "恃势之刑" },
  { pair: ["丑", "戌"], note: "无恩之刑" },
  { pair: ["戌", "未"], note: "无恩之刑" },
  { pair: ["丑", "未"], note: "无恩之刑" },
];
const ZI_XING = ["辰", "午", "酉", "亥"];
const HAI: Record<string, string> = { 子: "未", 未: "子", 丑: "午", 午: "丑", 寅: "巳", 巳: "寅", 卯: "辰", 辰: "卯", 申: "亥", 亥: "申", 酉: "戌", 戌: "酉" };

export interface StemBranchRelation {
  type: string;
  detail: string;
  note: string;
}

const PILLAR_LABEL: Record<string, string> = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" };

/** 干支关系网：四柱两两扫描 */
export function computeGanZhiRelations(eightChar: EightChar, timeKnown: boolean): {
  ganHe: StemBranchRelation[];
  liuHe: StemBranchRelation[];
  sanHe: StemBranchRelation[];
  chong: StemBranchRelation[];
  xing: StemBranchRelation[];
  hai: StemBranchRelation[];
  summary: string;
} {
  const pillars: Array<{ key: string; gan: string; zhi: string }> = [
    { key: "year", gan: eightChar.getYear()[0], zhi: eightChar.getYear()[1] },
    { key: "month", gan: eightChar.getMonth()[0], zhi: eightChar.getMonth()[1] },
    { key: "day", gan: eightChar.getDay()[0], zhi: eightChar.getDay()[1] },
    ...(timeKnown ? [{ key: "hour", gan: eightChar.getTime()[0], zhi: eightChar.getTime()[1] }] : []),
  ];

  const ganHe: StemBranchRelation[] = [];
  const liuHe: StemBranchRelation[] = [];
  const chong: StemBranchRelation[] = [];
  const xing: StemBranchRelation[] = [];
  const hai: StemBranchRelation[] = [];

  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const a = pillars[i];
      const b = pillars[j];
      const la = PILLAR_LABEL[a.key];
      const lb = PILLAR_LABEL[b.key];

      // 天干五合（日主参与优先展示）
      if (GAN_HE[a.gan] === b.gan) {
        const el = GAN_HE_ELEMENT[`${a.gan}${b.gan}`] ?? "";
        ganHe.push({ type: "天干五合", detail: `${la}${a.gan} — ${lb}${b.gan}`, note: `甲己合化${el}之类，两干相合，情意向${el}。` });
      }
      // 地支六合
      if (ZHI_LIU_HE[a.zhi] === b.zhi) {
        liuHe.push({ type: "地支六合", detail: `${la}${a.zhi} — ${lb}${b.zhi}`, note: "六合相合，主和顺亲近、暗中相助。" });
      }
      // 六冲
      if (ZHI_CHONG[a.zhi] === b.zhi) {
        chong.push({ type: "六冲", detail: `${la}${a.zhi} — ${lb}${b.zhi}`, note: "对冲相战，主动荡变化，吉凶应事较急。" });
      }
      // 相刑（含自刑）
      if (a.zhi === b.zhi && ZI_XING.includes(a.zhi)) {
        xing.push({ type: "自刑", detail: `${la}${a.zhi} — ${lb}${b.zhi}`, note: "同支自刑，主内耗纠结、自我苛求。" });
      } else {
        const x = XING.find((r) => (r.pair[0] === a.zhi && r.pair[1] === b.zhi) || (r.pair[0] === b.zhi && r.pair[1] === a.zhi));
        if (x) xing.push({ type: "相刑", detail: `${la}${a.zhi} — ${lb}${b.zhi}`, note: `${x.note}，主摩擦是非，宜以柔化之。` });
      }
      // 相害
      if (HAI[a.zhi] === b.zhi) {
        hai.push({ type: "相害", detail: `${la}${a.zhi} — ${lb}${b.zhi}`, note: "六害相损，主暗伤掣肘，防小人暗中作梗。" });
      }
    }
  }

  // 三合局：四柱地支中出现同一三合局的任意三支
  const branches = pillars.map((p) => p.zhi);
  const sanHe: StemBranchRelation[] = [];
  for (const sh of SAN_HE) {
    const hit = sh.branches.filter((z) => branches.includes(z));
    if (hit.length === 3) {
      const where = pillars.filter((p) => sh.branches.includes(p.zhi)).map((p) => PILLAR_LABEL[p.key]).join("、");
      sanHe.push({ type: "三合局", detail: `${sh.name}（${sh.element}局）`, note: `${where}三支会${sh.element}局，${sh.element}性大旺，气势成局。` });
    }
  }

  const parts: string[] = [];
  if (ganHe.length) parts.push(`天干五合${ganHe.length}组`);
  if (sanHe.length) parts.push(`三合局${sanHe.length}组`);
  if (liuHe.length) parts.push(`六合${liuHe.length}组`);
  if (chong.length) parts.push(`六冲${chong.length}组`);
  if (xing.length) parts.push(`刑${xing.length}组`);
  if (hai.length) parts.push(`害${hai.length}组`);
  const summary = parts.length ? parts.join("、") : "四柱干支未见明显合冲刑害，以旺衰喜用为断。";

  return { ganHe, liuHe, sanHe, chong, xing, hai, summary };
}

/** 十二长生：日主在四柱地支的状态（getDiShi 参数为地支序号：子0…亥11） */
export function computeDiShi(eightChar: EightChar, timeKnown: boolean): Array<{ pillar: string; diShi: string; note: string }> {
  const DI_SHI_NOTE: Record<string, string> = {
    长生: "生机初萌，学习力与适应力强。",
    沐浴: "桃花之地，感性敏锐，易受情感牵动。",
    冠带: "渐入佳境，自尊心与上进心并起。",
    临官: "如人壮年，进可攻退可守，稳中有成。",
    帝旺: "气势极盛，魄力足而防过刚。",
    衰: "由盛转敛，宜守成蓄力。",
    病: "力有不逮，宜借力行事。",
    死: "气机沉静，宜静不宜躁。",
    墓: "收藏入库，厚积而缓发。",
    绝: "气数断续，绝处逢生须外力。",
    胎: "孕育待时，宜酝酿不宜急进。",
    养: "休养生息，蓄势待发。",
  };
  const out: Array<{ pillar: string; diShi: string; note: string }> = [];
  const ZHI_ORDER = "子丑寅卯辰巳午未申酉戌亥";
  const entries: Array<[string, string]> = [
    ["年柱", "year"],
    ["月柱", "month"],
    ["日柱", "day"],
    ...(timeKnown ? ([["时柱", "hour"]] as Array<[string, string]>) : []),
  ];
  for (const [label, key] of entries) {
    const zhi = pillarsFor(eightChar, timeKnown)[key];
    if (!zhi) continue;
    const diShi = eightChar.getDiShi(ZHI_ORDER.indexOf(zhi));
    out.push({ pillar: label, diShi, note: DI_SHI_NOTE[diShi] ?? "" });
  }
  return out;
}

/** 取四柱地支 */
function pillarsFor(eightChar: EightChar, timeKnown: boolean): Record<string, string> {
  return {
    year: eightChar.getYear()[1],
    month: eightChar.getMonth()[1],
    day: eightChar.getDay()[1],
    hour: timeKnown ? eightChar.getTime()[1] : "",
  };
}
