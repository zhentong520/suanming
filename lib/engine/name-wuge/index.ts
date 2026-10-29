import { loadContentJson } from "@/lib/content/catalog";
import type { BirthInput } from "../calendar";
import { computeBazi } from "../bazi";
import { uniqueCharPool, type NameChar } from "./char-pool";
import {
  analyzeSancai,
  getLuck,
  luckPoints,
  numberElement,
  reduceTo81,
  type WuXing,
  WUXING_MAP,
} from "./luck";

/** 康熙字典常用差异字（相对现代手写笔画） */
const KANGXI_OVERRIDES: Record<string, number> = {
  华: 14,
  葉: 15,
  叶: 15,
  门: 8,
  門: 8,
  马: 10,
  馬: 10,
  鸟: 16,
  鳥: 16,
  龙: 16,
  龍: 16,
  风: 9,
  風: 9,
  齐: 14,
  齊: 14,
  麦: 11,
  麥: 11,
  龟: 16,
  龜: 16,
  盐: 24,
  鹽: 24,
  郁: 13,
  衛: 16,
  卫: 16,
  发: 12,
  發: 12,
  髮: 15,
  萧: 18,
  蕭: 18,
  蒋: 17,
  蔣: 17,
  黄: 12,
  黃: 12,
  边: 19,
  邊: 19,
  达: 13,
  達: 13,
  过: 13,
  過: 13,
  这: 11,
  這: 11,
  还: 14,
  還: 14,
  运: 13,
  運: 13,
  远: 14,
  遠: 14,
  进: 12,
  進: 12,
  选: 16,
  選: 16,
  郑: 19,
  鄭: 19,
  邓: 19,
  鄧: 19,
  卢: 16,
  盧: 16,
  顾: 21,
  顧: 21,
  颜: 18,
  顏: 18,
  严: 20,
  嚴: 20,
  乐: 15,
  樂: 15,
  欢: 22,
  歡: 22,
  权: 22,
  權: 22,
  杨: 13,
  楊: 13,
  柳: 9,
  桃: 10,
  梅: 11,
  楠: 13,
  梓: 11,
  沐: 7,
  清: 11,
  泽: 17,
  澤: 17,
  润: 16,
  潤: 16,
  涵: 12,
  浩: 11,
  涛: 18,
  濤: 18,
  瀚: 19,
  轩: 10,
  軒: 10,
  宇: 6,
  宸: 10,
  睿: 14,
  哲: 10,
  嘉: 14,
  怡: 9,
  悦: 11,
  悅: 11,
  欣: 8,
  馨: 20,
  婷: 12,
  婉: 11,
  婧: 11,
  妍: 7,
  萱: 15,
  菲: 14,
  薇: 19,
  茜: 12,
  璐: 18,
  瑶: 14,
  瑤: 14,
  琪: 12,
  琳: 13,
  瑜: 13,
  璟: 16,
  琛: 12,
  瑾: 15,
  烨: 16,
  煜: 13,
  曦: 20,
  昊: 8,
  昕: 8,
  晖: 13,
  灿: 17,
  烁: 14,
  煊: 13,
  锐: 15,
  锋: 15,
  铭: 14,
  钧: 12,
  锦: 16,
  铮: 16,
  钰: 13,
  铠: 16,
  鉴: 22,
  澄: 15,
  渊: 11,
  澜: 20,
  潇: 17,
  澈: 15,
  垚: 9,
  垣: 9,
  峻: 10,
  诺: 16,
  希: 7,
  启: 11,
  承: 8,
  航: 10,
  翔: 12,
  飞: 9,
  飛: 9,
};

function getNameStrokes() {
  return loadContentJson<Record<string, number>>("name-strokes.json");
}

let kangxiCache: Record<string, number> | null | undefined;

function getKangxiStrokes(): Record<string, number> | null {
  if (kangxiCache !== undefined) return kangxiCache;
  try {
    kangxiCache = loadContentJson<Record<string, number>>("kangxi-strokes.json");
  } catch {
    kangxiCache = null;
  }
  return kangxiCache;
}

export type StrokeSource = "naming_override" | "kangxi_dict" | "table" | "estimated";

export function resolveStroke(char: string): { stroke: number; source: StrokeSource } {
  if (KANGXI_OVERRIDES[char] != null) {
    return { stroke: KANGXI_OVERRIDES[char], source: "naming_override" };
  }
  const kx = getKangxiStrokes();
  if (kx && kx[char] != null) {
    return { stroke: kx[char], source: "kangxi_dict" };
  }
  const strokes = getNameStrokes();
  if (strokes[char] != null) {
    return { stroke: strokes[char], source: "table" };
  }
  const code = char.codePointAt(0) ?? 0;
  return { stroke: (code % 20) + 1, source: "estimated" };
}

export type NameAnalysisOptions = {
  surnameLen?: number;
  /** 有档案时对照喜用神 */
  birth?: BirthInput;
};

function yongShenFit(
  grids: { renGe: { element: string }; diGe: { element: string }; zongGe: { element: string } },
  birth?: BirthInput
) {
  if (!birth) return null;
  try {
    const bazi = computeBazi(birth);
    const useful = (bazi.yongShen?.usefulGods ?? []) as WuXing[];
    const avoid = (bazi.yongShen?.avoidGods ?? []) as WuXing[];
    const nameEls = [grids.renGe.element, grids.diGe.element, grids.zongGe.element] as WuXing[];
    let bonus = 0;
    const notes: string[] = [];
    for (const el of nameEls) {
      if (useful.includes(el)) {
        bonus += 8;
        notes.push(`姓名${el}合喜用`);
      }
      if (avoid.includes(el)) {
        bonus -= 7;
        notes.push(`姓名${el}近忌神`);
      }
    }
    return {
      usefulGods: useful,
      avoidGods: avoid,
      dayMaster: bazi.dayMaster,
      strength: bazi.strength,
      bonus: Math.max(-20, Math.min(24, bonus)),
      desc: notes.length
        ? [...new Set(notes)].join("；")
        : `命局喜用${useful.join("、") || "—"}，姓名五行与喜用交叉中性。`,
    };
  } catch {
    return null;
  }
}

export function computeNameWuge(name: string, surnameLenOrOpts: number | NameAnalysisOptions = 1) {
  const opts: NameAnalysisOptions =
    typeof surnameLenOrOpts === "number" ? { surnameLen: surnameLenOrOpts } : surnameLenOrOpts;
  const surnameLen = opts.surnameLen ?? 1;

  const chars = [...name.trim()];
  if (chars.length < 2) throw new Error("姓名至少两个字");
  if (surnameLen < 1 || surnameLen >= chars.length) {
    throw new Error("姓氏字数须小于姓名总字数");
  }

  const resolved = chars.map((c) => ({ char: c, ...resolveStroke(c) }));
  const strokes = resolved.map((r) => r.stroke);
  const surnameStrokes = strokes.slice(0, surnameLen);
  const givenStrokes = strokes.slice(surnameLen);
  const givenChars = chars.slice(surnameLen);

  const tianGe = reduceTo81(surnameStrokes.reduce((a, b) => a + b, 0) + (surnameLen === 1 ? 1 : 0));
  const renGe = reduceTo81(surnameStrokes[surnameStrokes.length - 1] + (givenStrokes[0] ?? 0));
  const diGe = reduceTo81(givenStrokes.reduce((a, b) => a + b, 0) + (givenStrokes.length === 1 ? 1 : 0));
  const zongGe = reduceTo81(strokes.reduce((a, b) => a + b, 0));
  const waiGe = reduceTo81(
    surnameLen === 1
      ? (givenStrokes[givenStrokes.length - 1] ?? 0) + 1
      : surnameStrokes[0] + (givenStrokes[givenStrokes.length - 1] ?? 0)
  );

  const mk = (value: number) => {
    const luck = getLuck(value);
    return { value, ...luck, element: numberElement(value) };
  };

  const grids = {
    tianGe: mk(tianGe),
    renGe: mk(renGe),
    diGe: mk(diGe),
    waiGe: mk(waiGe),
    zongGe: mk(zongGe),
  };

  const sancai = analyzeSancai(grids.tianGe.element, grids.renGe.element, grids.diGe.element);
  const gridScore = Object.values(grids).reduce((acc, g) => acc + luckPoints(g.luck), 0);
  // 人格权重更高
  const weightedGrid =
    luckPoints(grids.renGe.luck) * 1.6 +
    luckPoints(grids.zongGe.luck) * 1.2 +
    luckPoints(grids.diGe.luck) +
    luckPoints(grids.tianGe.luck) * 0.7 +
    luckPoints(grids.waiGe.luck) * 0.8;

  const yong = yongShenFit(grids, opts.birth);
  const raw =
    weightedGrid * 0.55 +
    (sancai.score / 100) * 35 +
    (yong ? 10 + yong.bonus * 0.4 : 8) +
    (gridScore / 100) * 5;
  const totalScore = Math.max(28, Math.min(99, Math.round(raw)));

  const estimatedChars = resolved.filter((r) => r.source === "estimated").map((r) => r.char);
  const overrideChars = resolved.filter((r) => r.source === "naming_override").map((r) => r.char);
  const dictChars = resolved.filter((r) => r.source === "kangxi_dict").map((r) => r.char);

  const lifeStages = {
    early: `地格${grids.diGe.value}（${grids.diGe.luck}）主36岁前：${grids.diGe.desc}`,
    mid: `人格${grids.renGe.value}（${grids.renGe.luck}）主性格与中年根基：${grids.renGe.desc}`,
    late: `总格${grids.zongGe.value}（${grids.zongGe.luck}）主中晚年结果：${grids.zongGe.desc}`,
  };

  return {
    name,
    surname: chars.slice(0, surnameLen).join(""),
    givenName: givenChars.join(""),
    strokes,
    charStrokes: resolved,
    strokeStandard: "康熙字典全量表 + 姓名学差异字优先",
    estimatedChars,
    kangxiApplied: [...overrideChars, ...dictChars],
    needsVerification: estimatedChars.length > 0,
    verificationNote:
      estimatedChars.length > 0
        ? `以下生僻字笔画为估算，建议人工核对：${estimatedChars.join("、")}`
        : overrideChars.length > 0
          ? `已套用姓名学康熙差异：${overrideChars.join("、")}${dictChars.length ? `；字典：${dictChars.join("、")}` : ""}`
          : dictChars.length > 0
            ? `笔画来自康熙字典全量表：${dictChars.join("、")}`
            : "所用单字均在笔画表内。",
    grids,
    sancai,
    yongShenFit: yong,
    lifeStages,
    scores: {
      grids: Math.round(weightedGrid),
      sancai: sancai.score,
      yongShen: yong?.bonus ?? 0,
      total: totalScore,
    },
    totalScore,
    summary:
      totalScore >= 85
        ? `「${name}」五格与三才俱佳（${sancai.config}·${sancai.luck}），数理整体上乘。`
        : totalScore >= 70
          ? `「${name}」数理中上，三才${sancai.luck}，可微调用字再升格。`
          : totalScore >= 55
            ? `「${name}」吉凶参半，重点看人格与三才：${sancai.desc}`
            : `「${name}」数理偏弱（三才${sancai.luck}），建议调整名字用字。`,
  };
}

function genderOk(c: NameChar, gender?: string) {
  if (!gender) return true;
  if (gender === "男") return c.gender !== "f";
  if (gender === "女") return c.gender !== "m";
  return true;
}

function charMatchesWx(c: NameChar, preferred?: string | string[]) {
  if (!preferred || (Array.isArray(preferred) && preferred.length === 0)) return true;
  const list = Array.isArray(preferred) ? preferred : [preferred];
  const strokeWx = numberElement(resolveStroke(c.char).stroke);
  return list.some((w) => w === c.senseWx || w === strokeWx);
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function suggestNaming(params: {
  surname: string;
  preferredWuxing?: string;
  gender?: string;
  givenLen?: number;
  count?: number;
  birth?: BirthInput;
}) {
  const surname = params.surname.trim() || "张";
  const surnameChars = [...surname];
  const surnameLen = surnameChars.length;
  const givenLen = params.givenLen === 1 ? 1 : 2;
  const count = Math.min(12, Math.max(4, params.count ?? 8));
  const gender = params.gender ?? params.birth?.gender;

  let useful: WuXing[] = [];
  let avoid: WuXing[] = [];
  let baziHint = "";
  if (params.birth) {
    try {
      const bazi = computeBazi(params.birth);
      useful = (bazi.yongShen?.usefulGods ?? []) as WuXing[];
      avoid = (bazi.yongShen?.avoidGods ?? []) as WuXing[];
      baziHint = `日主${bazi.dayMaster}（${bazi.strength}），喜用${useful.join("、") || "—"}，忌${avoid.join("、") || "—"}`;
    } catch {
      baziHint = "";
    }
  }

  const preferredList: string[] = params.preferredWuxing
    ? [params.preferredWuxing]
    : useful.length
      ? useful
      : [];

  const pool = uniqueCharPool().filter((c) => genderOk(c, gender));
  let candidates = pool.filter((c) => charMatchesWx(c, preferredList));
  if (candidates.length < 8) candidates = pool;

  // 忌神字降权：尽量避开笔画/字义落在忌神
  const preferred = shuffle(candidates, hashSeed(surname + (gender ?? "") + preferredList.join("")));
  const meaningMap = new Map(pool.map((c) => [c.char, c.meaning]));

  type Cand = {
    fullName: string;
    given: string;
    score: number;
    reason: string;
    meanings: string[];
    sancai: string;
    gridsSummary: string;
  };

  const scored: Cand[] = [];
  const seen = new Set<string>();

  const tryName = (given: string) => {
    const fullName = surname + given;
    if (seen.has(fullName)) return;
    seen.add(fullName);
    try {
      const r = computeNameWuge(fullName, { surnameLen, birth: params.birth });
      // 忌神字额外扣分
      const givenWx = [...given].map((ch) => numberElement(resolveStroke(ch).stroke));
      let avoidPenalty = 0;
      for (const wx of givenWx) {
        if (avoid.includes(wx as WuXing)) avoidPenalty += 4;
      }
      const score = Math.max(20, r.totalScore - avoidPenalty);
      const meanings = [...given].map((ch) => `${ch}：${meaningMap.get(ch) ?? "寓意待品"}`);
      scored.push({
        fullName,
        given,
        score,
        reason: `五格${r.totalScore}·三才${r.sancai.config}（${r.sancai.luck}）${r.yongShenFit ? "·" + r.yongShenFit.desc : ""}`,
        meanings,
        sancai: `${r.sancai.config}（${r.sancai.luck}）`,
        gridsSummary: `天${r.grids.tianGe.value}${r.grids.tianGe.luck}/人${r.grids.renGe.value}${r.grids.renGe.luck}/地${r.grids.diGe.value}${r.grids.diGe.luck}/总${r.grids.zongGe.value}${r.grids.zongGe.luck}`,
      });
    } catch {
      /* skip invalid */
    }
  };

  // 单字名
  if (givenLen === 1) {
    for (const c of preferred.slice(0, 40)) tryName(c.char);
  } else {
    // 双字：优先喜用字在前/后各一轮，限制组合量
    const head = preferred.slice(0, 18);
    const tail = preferred.slice(0, 22);
    for (const a of head) {
      for (const b of tail) {
        if (a.char === b.char) continue;
        tryName(a.char + b.char);
        if (scored.length > 220) break;
      }
      if (scored.length > 220) break;
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, count);

  return {
    surname,
    gender: gender ?? "未指定",
    givenLen,
    preferredWuxing: preferredList.length ? preferredList.join("、") : "均衡（未限）",
    baziHint: baziHint || "未绑定八字，仅按数理与字义筛选。",
    suggestions: top.map((t) => t.fullName),
    candidates: top,
    note: "取名结合康熙笔画五格、三才配置与八字喜用（若有档案）；请再核读音谐音与家族辈分用字。",
  };
}

export { WUXING_MAP, getLuck, analyzeSancai, reduceTo81 };
