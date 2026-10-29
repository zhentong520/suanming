/**
 * 玄空飞星：运盘 + 年飞星 + 朝向入中
 */

const PALACE_ORDER = ["中", "乾", "兑", "艮", "离", "坎", "坤", "震", "巽"] as const;
/** 洛书九宫方位：1北 2西南 3东 4东南 6西北 7西 8东北 9南；5中 */
const LUO_SHU: Record<number, string> = {
  1: "北",
  2: "西南",
  3: "东",
  4: "东南",
  5: "中",
  6: "西北",
  7: "西",
  8: "东北",
  9: "南",
};

const STAR_NATURE: Record<number, { name: string; nature: string; tip: string }> = {
  1: { name: "一白贪狼", nature: "水·偏吉", tip: "利文昌桃花，宜静水、书房。" },
  2: { name: "二黑巨门", nature: "土·病符", tip: "宜化病符，忌长期坐卧。" },
  3: { name: "三碧禄存", nature: "木·是非", tip: "防口舌是非，宜静不宜争。" },
  4: { name: "四绿文曲", nature: "木·文昌", tip: "利学业考试、文书。" },
  5: { name: "五黄廉贞", nature: "土·大凶", tip: "五黄关煞，宜静不宜动土。" },
  6: { name: "六白武曲", nature: "金·偏吉", tip: "利权威财位，宜金属。" },
  7: { name: "七赤破军", nature: "金·盗贼", tip: "九运退气，防破耗口舌。" },
  8: { name: "八白左辅", nature: "土·当旺财", tip: "八运当令财星，宜旺之。" },
  9: { name: "九紫右弼", nature: "火·喜庆", tip: "九运当令，利喜庆名声。" },
};

export function periodOfYear(year: number): { period: number; name: string; range: string } {
  // 下元：七运1984-2003，八运2004-2023，九运2024-2043
  if (year >= 2024 && year <= 2043) return { period: 9, name: "下元九运", range: "2024–2043" };
  if (year >= 2004 && year <= 2023) return { period: 8, name: "下元八运", range: "2004–2023" };
  if (year >= 1984 && year <= 2003) return { period: 7, name: "下元七运", range: "1984–2003" };
  if (year >= 1964 && year <= 1983) return { period: 6, name: "中元六运", range: "1964–1983" };
  if (year >= 2044 && year <= 2063) return { period: 1, name: "上元一运", range: "2044–2063" };
  // fallback by 20-year blocks from 1864
  const idx = Math.floor((year - 1864) / 20) % 9;
  const period = ((idx % 9) + 9) % 9 || 9;
  return { period, name: `${period}运`, range: `${1864 + idx * 20}–${1863 + (idx + 1) * 20}` };
}

/** 年飞星入中（已知 2024→3） */
export function yearFlyingStar(year: number): number {
  let s = 3 - (year - 2024);
  while (s <= 0) s += 9;
  while (s > 9) s -= 9;
  return s;
}

/** 逆飞九宫：中宫起 star，按洛书路径 */
const FLY_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4]; // 中→西北→西→东北→南→北→西南→东→东南（玄空常用入中飞布）

export function flyStars(centerStar: number, forward = false): Array<{ palace: number; star: number; direction: string }> {
  const result: Array<{ palace: number; star: number; direction: string }> = [];
  for (let i = 0; i < 9; i++) {
    const palace = FLY_PATH[i];
    const star = forward
      ? ((centerStar - 1 + i) % 9) + 1
      : ((((centerStar - 1 - i) % 9) + 9) % 9) + 1;
    result.push({ palace, star, direction: LUO_SHU[palace] });
  }
  return result;
}

const FACING_TO_PALACE: Record<string, number> = {
  北: 1,
  西南: 2,
  东: 3,
  东南: 4,
  中: 5,
  西北: 6,
  西: 7,
  东北: 8,
  南: 9,
};

export function normalizeFacing(facing?: string): string {
  if (!facing) return "南";
  const f = facing.trim();
  if (FACING_TO_PALACE[f]) return f;
  if (/南|北|东|西/.test(f)) {
    if (f.includes("东南")) return "东南";
    if (f.includes("东北")) return "东北";
    if (f.includes("西南")) return "西南";
    if (f.includes("西北")) return "西北";
    if (f.includes("南")) return "南";
    if (f.includes("北")) return "北";
    if (f.includes("东")) return "东";
    if (f.includes("西")) return "西";
  }
  return "南";
}

export function computeFeixingChart(input: {
  year?: number;
  facing?: string;
  sitting?: string;
}) {
  const year = input.year ?? new Date().getFullYear();
  const period = periodOfYear(year);
  const yStar = yearFlyingStar(year);
  const facing = normalizeFacing(input.facing);
  const sitting =
    input.sitting && FACING_TO_PALACE[input.sitting]
      ? input.sitting
      : oppositeDir(facing);

  // 运盘：当运星入中
  const yunPan = flyStars(period.period, false);
  // 年盘：年星入中
  const nianPan = flyStars(yStar, false);

  const facingPalace = FACING_TO_PALACE[facing] ?? 9;
  const facingYun = yunPan.find((p) => p.palace === facingPalace);
  const facingNian = nianPan.find((p) => p.palace === facingPalace);
  const centerNian = nianPan.find((p) => p.palace === 5);

  const mountainPalace = FACING_TO_PALACE[sitting] ?? 1;
  const mountainYun = yunPan.find((p) => p.palace === mountainPalace);

  const starsAtFacing = {
    yun: facingYun?.star ?? period.period,
    nian: facingNian?.star ?? yStar,
  };

  const advice = buildFacingAdvice(starsAtFacing.yun, starsAtFacing.nian, period.period);

  return {
    year,
    period,
    yearStar: yStar,
    facing,
    sitting,
    yunPan: yunPan.map((p) => ({
      ...p,
      ...STAR_NATURE[p.star],
    })),
    nianPan: nianPan.map((p) => ({
      ...p,
      ...STAR_NATURE[p.star],
    })),
    facingStars: starsAtFacing,
    mountainYunStar: mountainYun?.star,
    centerYearStar: centerNian?.star,
    advice,
    summary: `${period.name}（${period.range}），${year}年飞星${yStar}入中；向${facing}座${sitting}，向首运星${starsAtFacing.yun}·年星${starsAtFacing.nian}。`,
  };
}

function oppositeDir(dir: string): string {
  const map: Record<string, string> = {
    南: "北",
    北: "南",
    东: "西",
    西: "东",
    东南: "西北",
    西北: "东南",
    东北: "西南",
    西南: "东北",
  };
  return map[dir] ?? "北";
}

function buildFacingAdvice(yunStar: number, nianStar: number, period: number): string {
  const parts: string[] = [];
  const wang = period; // 当令
  if (yunStar === wang || yunStar === 8 || (period === 9 && yunStar === 9)) {
    parts.push("向首逢当令旺星，大门/客厅朝此较利纳气。");
  } else if (yunStar === 5 || yunStar === 2) {
    parts.push("向首逢病符五黄类，门口宜整洁少动土，可置金属饰品以调匀气场。");
  } else {
    parts.push("向首星非最旺，宜保持通风采光，以家具布局补吉。");
  }
  const nInfo = STAR_NATURE[nianStar];
  if (nInfo) parts.push(`本年向首年星为${nInfo.name}（${nInfo.nature}）：${nInfo.tip}`);
  return parts.join("");
}

export { LUO_SHU, STAR_NATURE, PALACE_ORDER };
