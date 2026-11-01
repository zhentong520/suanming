/**
 * 大六壬 · 九宗门取三传引擎（《大六壬大全》《六壬指南》《毕法赋》）
 *
 * 九宗门：贼克（元首/重审）→ 比用（知一）→ 涉害 → 遥克（蒿矢/弹射）→
 *         昴星（虎视/冬蛇掩目）→ 别责 → 八专 → 伏吟 → 返吟。
 *
 * 歌诀（《大六壬大全·九宗门》）：
 *   「取课先从下贼呼，若无下贼上克初。初传之上名中次，中上加临是末居。」（贼克）
 *   「下贼或二三四侵，若逢上克亦同云。常将天日比神用，阳日用阳阴用阴。」（比用）
 *   「涉害行来本家止，路逢多克为用取。孟深仲浅季当休，复等柔辰刚日宜。」（涉害）
 *   「四课无克号为遥，日与神兮递互招。先取神遥克其日，如无方取日来遥。」（遥克）
 *   「无遥无克昴星穷，阳仰阴俯酉位中。刚日先辰而后日，柔日先日而后辰。」（昴星）
 *   「四课不全三课备，无遥无克别责例。刚日干合上头神，柔日支前三合取。」（别责）
 *   「两课无克号八专，阳日日阳顺行三。阴日辰阴逆三位，中末总向日上眠。」（八专）
 *   「伏吟有克还为用，无克刚干柔取辰。迤逦刑之作中末。」（伏吟）
 *   「返吟有克亦为用，无克别有井栏名。」（返吟）
 *
 * 课体基调（《六壬指南》）：元首/重审多吉；涉害/八专/伏吟/返吟多曲折。
 * 仅供文化参考。
 */

import { BRANCHES, WX, controls } from "./lunar-advanced";

/** 天干五行（遥克与日干论克用） */
export const STEM_WX: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

export interface SiKeRow {
  name: string;
  shang: string; // 上神（天盘）
  xia: string; // 下（地盘）
}

export interface JiuZongMenResult {
  keTi: string;
  /** 课体基调说明 */
  keTiNature: string;
  /** 初/中/末传（地支索引） */
  chuan: [number, number, number];
  method: string;
  notes: string[];
}

const ZHI_IDX = (z: string) => BRANCHES.indexOf(z as (typeof BRANCHES)[number]);

/** 三刑：寅刑巳、巳刑申、申刑寅；丑刑戌、戌刑未、未刑丑；子刑卯；辰午酉亥自刑 */
export function xingOf(z: string): string {
  const pairs: Record<string, string> = {
    寅: "巳", 巳: "申", 申: "寅",
    丑: "戌", 戌: "未", 未: "丑",
    子: "卯",
  };
  return pairs[z] ?? z; // 辰午酉亥自刑
}

/** 冲 */
const CHONG: Record<string, string> = {
  子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅",
  卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳",
};

const YANG_DAYS = ["甲", "丙", "戊", "庚", "壬"];
const isYangDay = (dayGan: string) => YANG_DAYS.includes(dayGan);
const isYangZhi = (z: string) => ["子", "寅", "辰", "午", "申", "戌"].includes(z);

/** 孟（寅申巳亥）仲（子午卯酉）季（辰戌丑未）——涉害「孟深仲浅季当休」 */
function mengWeight(z: string): number {
  if (["寅", "申", "巳", "亥"].includes(z)) return 3;
  if (["子", "午", "卯", "酉"].includes(z)) return 2;
  return 1;
}

/** 涉害深浅：上神自临位归本家，沿途数受下神所克（含起点，不含本家终点步） */
function sheHaiDepth(shang: string, lin: string): number {
  const sWx = WX[shang];
  let depth = 0;
  let cur = ZHI_IDX(lin);
  const home = ZHI_IDX(shang);
  for (let step = 0; step < 12; step++) {
    const ground = BRANCHES[cur];
    if (controls(WX[ground], sWx)) depth += 1;
    if (cur === home) break;
    cur = (cur + 1) % 12;
  }
  return depth;
}

/** 干合（五合） */
const GAN_HE: Record<string, string> = {
  甲: "己", 己: "甲", 乙: "庚", 庚: "乙", 丙: "辛",
  辛: "丙", 丁: "壬", 壬: "丁", 戊: "癸", 癸: "戊",
};

/** 三合局：申子辰水、亥卯未木、寅午戌火、巳酉丑金 */
function sanHePrev(z: string): string {
  const groups: string[][] = [
    ["申", "子", "辰"],
    ["亥", "卯", "未"],
    ["寅", "午", "戌"],
    ["巳", "酉", "丑"],
  ];
  for (const g of groups) {
    const i = g.indexOf(z);
    if (i >= 0) return g[(i + 2) % 3]; // 前一支
  }
  return z;
}

export function liuRenSanChuan(input: {
  dayGan: string;
  dayZhi: string;
  timeZhi: string;
  monthJiangIdx: number;
  timeZhiIdx: number;
  siKeRaw: SiKeRow[];
  tianPan: number[];
  ganPalace: number;
}): JiuZongMenResult {
  const { dayGan, dayZhi, timeZhi, siKeRaw, tianPan, ganPalace } = input;
  const dayWx = STEM_WX[dayGan] ?? "土";
  const notes: string[] = [];
  const yangDay = isYangDay(dayGan);
  const ganShangIdx = ZHI_IDX(siKeRaw[0].shang); // 干上神
  const zhiShangIdx = ZHI_IDX(siKeRaw[2].shang); // 支上神

  // 1) 伏吟 / 返吟（天地盘重合 / 对冲）
  const fuYin = input.timeZhiIdx === input.monthJiangIdx;
  const fanYin = (input.timeZhiIdx - input.monthJiangIdx + 12) % 12 === 6;
  if (fuYin || fanYin) {
    return specialFuFanYin({ fuYin, fanYin, dayGan, dayZhi, siKeRaw, ganShangIdx, zhiShangIdx, notes });
  }

  // 2) 四课克贼判定
  type Hit = { shangIdx: number; kind: "贼" | "克"; keName: string };
  const zei: Hit[] = [];
  const shangKe: Hit[] = [];
  for (const k of siKeRaw) {
    const sWx = WX[k.shang];
    const xWx = WX[k.xia];
    if (controls(xWx, sWx)) zei.push({ shangIdx: ZHI_IDX(k.shang), kind: "贼", keName: k.name });
    else if (controls(sWx, xWx)) shangKe.push({ shangIdx: ZHI_IDX(k.shang), kind: "克", keName: k.name });
  }

  const chuanFromHit = (hit: { shangIdx: number }): [number, number, number] => {
    const chu = hit.shangIdx;
    const zhong = yinShenOf(tianPan, chu);
    const mo = yinShenOf(tianPan, zhong);
    return [chu, zhong, mo];
  };

  // 贼克：一下贼上=元首，一上克下=重审
  if (zei.length === 1) {
    const [c, z, m] = chuanFromHit(zei[0]);
    notes.push("元首课：一上克下？以下贼上取用——「取课先从下贼呼」。尊卑有序，事体光明，多吉。");
    return { keTi: "元首课", keTiNature: "大吉之课，天地得位", chuan: [c, z, m], method: "贼克·下贼上发用", notes };
  }
  if (zei.length === 0 && shangKe.length === 1) {
    const [c, z, m] = chuanFromHit(shangKe[0]);
    notes.push("重审课：一上克下取用——以臣诤君，详审而行，先难后易。");
    return { keTi: "重审课", keTiNature: "先难后易，详审则吉", chuan: [c, z, m], method: "贼克·上克下发用", notes };
  }

  const pool = zei.length ? zei : shangKe;
  if (pool.length > 1) {
    // 比用：取与日干阴阳比和之上神（阳日用阳支，阴日用阴支）
    const bi = pool.filter((h) => isYangZhi(BRANCHES[h.shangIdx]) === yangDay);
    if (bi.length === 1) {
      const [c, z, m] = chuanFromHit(bi[0]);
      notes.push("比用（知一）课：多贼克取与日干比和者——「常将天日比神用，阳日用阳阴用阴」。嫌疑两端，择一而从。");
      return { keTi: "知一课", keTiNature: "择比而用，允执厥中", chuan: [c, z, m], method: "比用取传", notes };
    }
    // 涉害：俱比或俱不比，历克深者用；数同取孟深仲浅；再同取干上（缀瑕）
    const depths = (bi.length ? bi : pool).map((h) => {
      const k = siKeRaw.find((x) => ZHI_IDX(x.shang) === h.shangIdx)!;
      return {
        hit: h,
        depth: sheHaiDepth(k.shang, k.xia),
        meng: mengWeight(k.shang),
      };
    });
    const maxDepth = Math.max(...depths.map((d) => d.depth));
    let finals = depths.filter((d) => d.depth === maxDepth);
    if (finals.length > 1) {
      const maxMeng = Math.max(...finals.map((d) => d.meng));
      finals = finals.filter((d) => d.meng === maxMeng);
      notes.push(`涉害：路逢多克为用取，孟深仲浅季当休（${maxDepth}克、孟仲权${maxMeng}）`);
    }
    // 再同取干上神（缀瑕）
    finals.sort((a, b) => (a.hit.shangIdx === ganShangIdx ? -1 : b.hit.shangIdx === ganShangIdx ? 1 : 0));
    const [c, z, m] = chuanFromHit(finals[0].hit);
    notes.push("涉害课：俱比俱不比，度难归家深浅逢——艰难涉历，险中求成。");
    return { keTi: "涉害课", keTiNature: "艰难涉历，险中求成", chuan: [c, z, m], method: `涉害取传（历克${maxDepth}）`, notes };
  }

  // 3) 四课不全判定（上下组合去重）
  const uniqueKe = new Set(siKeRaw.map((k) => `${k.shang}-${k.xia}`));
  const ganZhiSame = ganPalace === ZHI_IDX(dayZhi);

  // 4) 遥克（四课有克贼吗——此处 pool 为空说明四课无克）：神遥克日（蒿矢）优先，日遥克神（弹射）
  if (uniqueKe.size >= 4 || (!ganZhiSame && uniqueKe.size === 3)) {
    const shangKeDay = siKeRaw.find((k) => controls(WX[k.shang], dayWx));
    const dayKeShang = siKeRaw.find((k) => controls(dayWx, WX[k.shang]));
    if (shangKeDay || dayKeShang) {
      const hitRow = shangKeDay ?? dayKeShang!;
      const chu = ZHI_IDX(hitRow.shang);
      const [c, z, m] = chuanFromHit({ shangIdx: chu, kind: "克" } as Hit);
      notes.push(
        shangKeDay
          ? "遥克·蒿矢课：神遥克日——「先取神遥克其日」，事由远来，势弱而缓。"
          : "遥克·弹射课：日遥克神——「如无方取日来遥」，弹射之力，事在远方。"
      );
      return { keTi: shangKeDay ? "蒿矢课" : "弹射课", keTiNature: "遥克势轻，事在远方", chuan: [c, z, m], method: "遥克取传", notes };
    }

    // 5) 昴星（无遥无克，四课全备）
    if (uniqueKe.size >= 4) {
      const youIdx = ZHI_IDX("酉");
      let finalChu: number;
      if (yangDay) {
        finalChu = tianPan[youIdx]; // 阳日：地盘酉上神（仰视）
      } else {
        // 阴日：天盘酉下神——天盘酉所临地盘位的下一位上的天盘神（俯视）
        const groundOfYou = tianPan.indexOf(youIdx);
        finalChu = tianPan[(groundOfYou + 1) % 12];
      }
      let zhong: number;
      let mo: number;
      if (yangDay) {
        zhong = zhiShangIdx; // 刚日先辰而后日
        mo = ganShangIdx;
      } else {
        zhong = ganShangIdx; // 柔日先日而后辰
        mo = zhiShangIdx;
      }
      notes.push(
        yangDay
          ? "昴星·虎视课：阳日仰取地盘酉上神，中末先辰后日——虎视眈眈，惊疑之象。"
          : "昴星·冬蛇掩目课：阴日俯取天盘酉下神，中末先日后辰——掩目无伤，伏匿之象。"
      );
      return { keTi: yangDay ? "昴星课（虎视）" : "昴星课（冬蛇掩目）", keTiNature: "惊疑伏匿，动中藏险", chuan: [finalChu, zhong, mo], method: "昴星取传（阳仰阴俯）", notes };
    }

    // 6) 别责（三课无克）
    if (uniqueKe.size === 3) {
      const chu = yangDay
        ? tianPan[ZHI_IDX(STEM_HE_GONG(GAN_HE[dayGan]))] // 刚日干合上头神
        : ZHI_IDX(sanHePrev(dayZhi)); // 柔日支前三合
      const ganUp = ganShangIdx;
      notes.push(
        yangDay
          ? "别责课：刚日取干合上头神——「刚日干合上头神」，孤单欠缺，独力难支。"
          : "别责课：柔日取支前三合——「柔日支前三合取」，芜淫之象。"
      );
      return { keTi: "别责课", keTiNature: "孤单欠缺，事多外助", chuan: [chu, ganUp, ganUp], method: "别责取传（中末归干上）", notes };
    }
  }

  // 7) 八专（干支同位，两课，无克）
  if (ganZhiSame) {
    let chu: number;
    if (yangDay) {
      chu = (ganShangIdx + 2) % 12; // 顺行三（连本位）
    } else {
      chu = (zhiShangIdx - 2 + 12) % 12; // 逆行三
    }
    notes.push(
      yangDay
        ? "八专课：阳日干上神顺行三位——「阳日日阳顺行三」，内外不分，事体混杂。"
        : "八专课：阴日支上神逆行三位——「阴日辰阴逆三位」，纠缠不清。"
    );
    return { keTi: "八专课", keTiNature: "混杂纠缠，内外难分", chuan: [chu, ganShangIdx, ganShangIdx], method: "八专取传（中末归干上）", notes };
  }

  // 8) 兜底：干上神发用
  notes.push("兜底：干上神发用（未入九宗门典型格，以干上神为初传）。");
  return { keTi: "干上发用", keTiNature: "以干上神为初传", chuan: [ganShangIdx, yinShenOf(tianPan, ganShangIdx), yinShenOf(tianPan, yinShenOf(tianPan, ganShangIdx))], method: "干上发用", notes };
}

function STEM_HE_GONG(heGan: string): string {
  // 干寄宫：甲寅 乙辰 丙巳 丁未 戊巳 己未 庚申 辛戌 壬亥 癸丑
  const map: Record<string, string> = {
    甲: "寅", 乙: "辰", 丙: "巳", 丁: "未", 戊: "巳",
    己: "未", 庚: "申", 辛: "戌", 壬: "亥", 癸: "丑",
  };
  return map[heGan] ?? "寅";
}

function yinShenOf(tianPan: number[], groundIdx: number): number {
  return tianPan[groundIdx];
}

/** 伏吟 / 返吟 */
function specialFuFanYin(input: {
  fuYin: boolean;
  fanYin: boolean;
  dayGan: string;
  dayZhi: string;
  siKeRaw: SiKeRow[];
  ganShangIdx: number;
  zhiShangIdx: number;
  notes: string[];
}): JiuZongMenResult {
  const { fuYin, dayGan, siKeRaw, ganShangIdx, zhiShangIdx, notes } = input;
  const yangDay = isYangDay(dayGan);

  // 有克取克
  type Hit = { shangIdx: number; keName: string };
  const hits: Hit[] = [];
  for (const k of siKeRaw) {
    const sWx = WX[k.shang];
    const xWx = WX[k.xia];
    if (controls(xWx, sWx) || controls(sWx, xWx)) {
      hits.push({ shangIdx: ZHI_IDX(k.shang), keName: k.name });
    }
  }

  if (fuYin) {
    if (hits.length) {
      const chuIdx = hits[0].shangIdx;
      const chuZhi = BRANCHES[chuIdx];
      const xing = xingOf(chuZhi);
      if (xing === chuZhi) {
        // 自刑：中取支上，中又自刑则末取中冲
        const zhong = zhiShangIdx;
        const zhongZhi = BRANCHES[zhong];
        const mo = xingOf(zhongZhi) === zhongZhi ? ZHI_IDX(CHONG[zhongZhi]) : ZHI_IDX(xingOf(zhongZhi));
        notes.push("伏吟·杜传：初传自刑，中取支上，中又自刑冲取末——「杜传」不行，事由内阻。");
        return { keTi: "伏吟课（杜传）", keTiNature: "静伏忧疑，事由内阻", chuan: [chuIdx, zhong, mo], method: "伏吟有克发用（杜传）", notes };
      }
      const zhong = ZHI_IDX(xing);
      const mo = ZHI_IDX(xingOf(BRANCHES[zhong]));
      notes.push("伏吟·不虞课：有克还为用，迤逦刑之作中末——静中生动，事涉迟滞。");
      return { keTi: "伏吟课（不虞）", keTiNature: "天地俱不动，忧疑不决", chuan: [chuIdx, zhong, mo], method: "伏吟有克发用（刑作中末）", notes };
    }
    // 无克：刚日取干上（自任），柔日取支上（自信）
    const chu = yangDay ? ganShangIdx : zhiShangIdx;
    const chuZhi = BRANCHES[chu];
    const xing = xingOf(chuZhi);
    let zhong: number;
    let mo: number;
    if (xing === chuZhi) {
      zhong = yangDay ? zhiShangIdx : ganShangIdx;
      const zhongZhi = BRANCHES[zhong];
      mo = xingOf(zhongZhi) === zhongZhi ? ZHI_IDX(CHONG[zhongZhi]) : ZHI_IDX(xingOf(zhongZhi));
    } else {
      zhong = ZHI_IDX(xing);
      mo = ZHI_IDX(xingOf(BRANCHES[zhong]));
    }
    notes.push(
      yangDay
        ? "伏吟·自任课：无克刚日取干上——「无克刚干柔取辰」，自任其劳。"
        : "伏吟·自信课：无克柔日取支上——自信自处，事多自内起。"
    );
    return { keTi: yangDay ? "伏吟课（自任）" : "伏吟课（自信）", keTiNature: "静伏不动，忧疑不决", chuan: [chu, zhong, mo], method: "伏吟无克（刑作中末）", notes };
  }

  // 返吟
  if (hits.length) {
    const chu = hits[0].shangIdx;
    const zhong = yinShenOf2(chu);
    const mo = yinShenOf2(zhong);
    notes.push("返吟·无依课：有克往来取——「返吟有克亦为用」，去而复返，动极思静，反复之象。");
    return { keTi: "返吟课（无依）", keTiNature: "动荡反复，驿马奔冲", chuan: [chu, zhong, mo], method: "返吟有克发用", notes };
  }
  // 无克井栏射（仅丁己辛丑未六日）：取支驿马发用，中取支上，末取干上
  const ma: Record<string, string> = {
    子: "寅", 午: "申", 卯: "巳", 酉: "亥",
    寅: "申", 申: "寅", 巳: "亥", 亥: "巳",
    辰: "戌", 戌: "辰", 丑: "未", 未: "丑",
  };
  const chu = ZHI_IDX(ma[input.dayZhi] ?? "申");
  notes.push("返吟·井栏射课：无克取支驿马——「无克别有井栏名」（丁己辛丑未日），冲开罗网，动中得解。");
  return { keTi: "返吟课（井栏射）", keTiNature: "冲开罗网，动中得解", chuan: [chu, zhiShangIdx, ganShangIdx], method: "返吟无克（井栏射）", notes };
}

function yinShenOf2(groundIdx: number): number {
  // 返吟时中末：取初传所临地盘位之上神——返吟天地对冲，阴神即初传之冲位天盘？
  // 通行：返吟有克，中末同贼克法（初之上神、中之上神）。此处天地盘对冲，上神即地盘位之冲支。
  const ground = BRANCHES[groundIdx];
  return ZHI_IDX(CHONG[ground] ?? ground);
}
