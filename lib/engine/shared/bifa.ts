/**
 * 大六壬 · 毕法赋断语引擎（宋·凌福之《毕法赋》节选）
 *
 * 双轨制（保证真实）：
 *   source="原文" —— 引用《毕法赋》原句（仅收录有确切出处的条文）；
 *   source="通例" —— 课经通则释义（如空亡、驿马、六阳六阴），不冒称毕法原句。
 * 触发条件均为课传可判定的硬事实：三传空亡、驿马、贵人临传、递生链、六阳六阴、课体。
 * 仅供文化参考。
 */

import { BRANCHES } from "./lunar-advanced";

export interface BiFaHit {
  fa: string;
  source: "原文" | "通例";
  text: string;
}

/** 三合驿马：申子辰马在寅、寅午戌马在申、巳酉丑马在亥、亥卯未马在巳 */
export function maXingOf(dayZhi: string): string {
  const group = (["申", "子", "辰"].includes(dayZhi) && "申子辰")
    || (["寅", "午", "戌"].includes(dayZhi) && "寅午戌")
    || (["巳", "酉", "丑"].includes(dayZhi) && "巳酉丑")
    || "亥卯未";
  const map: Record<string, string> = {
    申子辰: "寅",
    寅午戌: "申",
    巳酉丑: "亥",
    亥卯未: "巳",
  };
  return map[group as string] ?? "寅";
}

export function evaluateBiFa(input: {
  keTi: string;
  sanChuanZhi: string[];
  xunKong: string[] | string;
  shenJiang: Array<{ general: string; branch: string }>;
  isDayKe: boolean;
  dayGanZhi: string;
  siKe?: Array<{ zhi: string }>;
}): BiFaHit[] {
  const hits: BiFaHit[] = [];
  const [chu, zhong, mo] = input.sanChuanZhi;
  const kong = Array.isArray(input.xunKong) ? input.xunKong : String(input.xunKong ?? "").split("");

  // —— 课体条（通例） ——
  const KE_TI_FA: Record<string, string> = {
    元首课: "元首课：以臣谏君，柔而能正——尊卑有序，事体光明，谋望多吉。",
    重审课: "重审课：以卑抗尊，事宜再审——先难后易，反复详审则成。",
    知一课: "知一课：比而是用，允执厥中——嫌疑两端，择一而从。",
    涉害课: "涉害课：度难归家，险中求成——所谋艰难，历尽波折。",
    蒿矢课: "蒿矢课：神遥克日——事由远来，其势弱缓，防暗箭。",
    弹射课: "弹射课：日遥克神——弹射远方，虚多实少。",
    "昴星课（虎视）": "昴星虎视：阳日仰取酉上——惊疑之象，宜守不宜进。",
    "昴星课（冬蛇掩目）": "昴星冬蛇掩目：阴日俯取酉下——伏匿之象，静待为佳。",
    别责课: "别责课：四课不全——孤单欠缺，事借外力乃成。",
    八专课: "八专课：干支同位——内外不分，事体混杂纠缠。",
    "伏吟课（不虞）": "伏吟不虞：天地不动，事出意外——静中生动，忧疑不决。",
    "伏吟课（自任）": "伏吟自任：刚日取干上——自任其劳，事由己起。",
    "伏吟课（自信）": "伏吟自信：柔日取支上——自信自处，事由内起。",
    "伏吟课（杜传）": "伏吟杜传：初传自刑——杜塞不行，事由内阻。",
    "返吟课（无依）": "返吟无依：天地对冲——去而复返，动极思静，反复之象。",
    "返吟课（井栏射）": "返吟井栏射：冲开罗网——久困之局，动中得解。",
  };
  if (KE_TI_FA[input.keTi]) {
    hits.push({ fa: `课体·${input.keTi}`, source: "通例", text: KE_TI_FA[input.keTi] });
  }

  // —— 空亡条（通例） ——
  if (kong.includes(chu)) {
    hits.push({ fa: "初传空亡", source: "通例", text: "发用空亡：事之初段有名无实，虚多实少，待出旬（或冲空之日）方有实绩。" });
  }
  if (kong.includes(zhong)) {
    hits.push({ fa: "中传空亡", source: "通例", text: "中传空亡：事之中途生变，进程有始无终之嫌。" });
  }
  if (kong.includes(mo)) {
    hits.push({ fa: "末传空亡", source: "通例", text: "末传空亡：结果落空——究竟无功，宜另择时日再举。" });
  }

  // —— 驿马条（通例·毕法「催官使者赴官期」之象） ——
  const dayZhi = input.dayGanZhi.slice(1);
  const ma = maXingOf(dayZhi);
  if (input.sanChuanZhi.includes(ma)) {
    hits.push({
      fa: "驿马入传",
      source: "原文",
      text: `催官使者赴官期——日之驿马${ma}临三传，变动出行之象：利赴任、出行、迁移，谋事主快。`,
    });
  }

  // —— 贵人临传（通例） ——
  const guiRen = input.shenJiang.find((s) => s.general === "贵人");
  if (guiRen && input.sanChuanZhi.includes(guiRen.branch)) {
    hits.push({
      fa: "贵人临传",
      source: "通例",
      text: `天乙贵人（${guiRen.branch}）临三传——得贵人扶助，危事可解，利谒贵求名。`,
    });
  }

  // —— 昼夜贵人（通例） ——
  hits.push({
    fa: input.isDayKe ? "昼贵司事" : "夜贵司事",
    source: "通例",
    text: input.isDayKe
      ? "昼课（旦贵司权）：宜公开行事、面谒贵人、正途经营。"
      : "夜课（暮贵司权）：宜暗处谋划、私事私了，不宜张扬。",
  });

  // —— 三传递生（原文） ——
  const wxOf = (z: string) => {
    const WX: Record<string, string> = {
      子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
      午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
    };
    return WX[z] ?? "土";
  };
  const sheng = (a: string, b: string) => {
    const chain: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
    return chain[a] === b;
  };
  if (sheng(wxOf(chu), wxOf(zhong)) && sheng(wxOf(zhong), wxOf(mo))) {
    hits.push({
      fa: "三传递生",
      source: "原文",
      text: "三传递生人举荐——初中末递相生扶，有人举荐提携、上下相生之喜。",
    });
  }

  // —— 六阳 / 六阴（通例） ——
  const YANG = ["子", "寅", "辰", "午", "申", "戌"];
  if (input.sanChuanZhi.every((z) => YANG.includes(z))) {
    hits.push({ fa: "六阳俱备", source: "通例", text: "三传俱阳支——公事公开之象，利公门谋事，不宜阴私。" });
  }
  if (input.sanChuanZhi.every((z) => !YANG.includes(z))) {
    hits.push({ fa: "六阴俱备", source: "通例", text: "三传俱阴支——阴私暗昧之象，利私谋，不宜公开。" });
  }

  return hits;
}

export { BRANCHES };
