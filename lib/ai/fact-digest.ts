/**
 * 把引擎 facts 压成「关键事实清单」，供 AI 锚定，避免整包 JSON 幻觉。
 */

import { buildKnowledgeContext } from "@/lib/db/knowledge";
import { getModuleDefinition } from "@/lib/hub/module-registry";

function pick(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") out[k] = obj[k];
  }
  return out;
}

function truncate(s: string, n = 400): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function buildAiFactDigest(moduleId: string, facts: Record<string, unknown>): string {
  const modName = getModuleDefinition(moduleId)?.name ?? moduleId;
  const lines: string[] = [`模块: ${modName}(${moduleId})`];

  const common = pick(facts, [
    "solarDate",
    "lunarDate",
    "ganZhiYear",
    "ganZhiMonth",
    "ganZhiDay",
    "ganZhiTime",
    "dayMaster",
    "dayMasterElement",
    "strength",
    "strengthScore",
    "dstNote",
    "trueSolarNote",
    "hexagram",
    "fullName",
    "overview",
    "summary",
  ]);
  for (const [k, v] of Object.entries(common)) {
    lines.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
  }

  const yong = facts.yongShen as
    | { usefulGods?: string[]; avoidGods?: string[]; summary?: string; usefulTenGodsHint?: string }
    | undefined;
  if (yong) {
    lines.push(`喜用神: ${(yong.usefulGods ?? []).join("、")}`);
    lines.push(`忌神: ${(yong.avoidGods ?? []).join("、")}`);
    if (yong.summary) lines.push(`用神总论: ${yong.summary}`);
    if (yong.usefulTenGodsHint) lines.push(`十神提示: ${yong.usefulTenGodsHint}`);
  }

  if (Array.isArray(facts.tenGods)) lines.push(`十神: ${(facts.tenGods as string[]).join("、")}`);
  if (facts.elementCount) lines.push(`五行统计: ${JSON.stringify(facts.elementCount)}`);
  if (Array.isArray(facts.missingElements) && (facts.missingElements as string[]).length) {
    lines.push(`缺五行: ${(facts.missingElements as string[]).join("、")}`);
  }

  // 子平经典要素：格局成败 + 干支关系网 + 十二长生 + 调候
  const gj = facts.geJu as {
    name?: string;
    monthZhi?: string;
    monthQi?: string;
    tenGod?: string;
    takenFrom?: string;
    shanE?: string;
    usage?: string;
    xiangShen?: string;
    broken?: boolean;
    brokenReason?: string;
    summary?: string;
    successFactors?: string[];
    breakFactors?: string[];
    rescue?: string[];
    useGodHint?: string;
  } | undefined;
  if (gj?.name) {
    const src = gj.takenFrom === "透干" ? "透干取格" : "本气取格";
    lines.push(
      `格局: ${gj.name}（月令${gj.monthZhi ?? "?"}·${src}·${gj.monthQi ?? "?"}·${gj.tenGod ?? "?"}·${gj.shanE ?? ""}神${gj.usage ?? ""}）${gj.broken ? "【破格】" : "【成格】"}`
    );
    if (gj.summary) lines.push(`格局总论: ${gj.summary}`);
    if (gj.successFactors?.length) lines.push(`成格要点: ${gj.successFactors.join("；")}`);
    if (gj.breakFactors?.length) lines.push(`破格风险: ${gj.breakFactors.join("；")}`);
    if (gj.rescue?.length) lines.push(`救应: ${gj.rescue.join("；")}`);
    if (gj.brokenReason) lines.push(`破格原因: ${gj.brokenReason}`);
    if (gj.useGodHint) lines.push(`格局用神: ${gj.useGodHint}`);
    if (gj.xiangShen) lines.push(`相神: ${gj.xiangShen}`);
  }

  const th = facts.tiaoHou as
    | { primary?: string; secondary?: string[]; monthZhi?: string; note?: string }
    | undefined;
  if (th?.primary) {
    lines.push(
      `调候用神(穷通宝鉴): ${th.primary}${th.secondary?.length ? `（辅:${th.secondary.join("")}）` : ""}——${th.note ?? ""}`
    );
  }

  const sl = facts.siLing as
    | { gan?: string; dayOffset?: number; jie?: string; note?: string }
    | undefined;
  if (sl?.gan) {
    lines.push(`司令分野(滴天髓): ${sl.jie}后第${sl.dayOffset}日，${sl.gan}司令用事——${sl.note ?? ""}`);
  }

  const gx = facts.ganZhiGuanXi as
    | {
        ganHe?: Array<{ detail?: string }>;
        liuHe?: Array<{ detail?: string }>;
        sanHe?: Array<{ detail?: string }>;
        chong?: Array<{ detail?: string }>;
        xing?: Array<{ detail?: string }>;
        hai?: Array<{ detail?: string }>;
        summary?: string;
      }
    | undefined;
  if (gx?.summary) {
    lines.push(`干支关系: ${gx.summary}`);
    const relParts: string[] = [];
    const pushRel = (label: string, list?: Array<{ detail?: string }>) => {
      if (list?.length) {
        const details = list.map((r) => r.detail ?? "").filter(Boolean);
        if (details.length) relParts.push(`${label}:${details.join("、")}`);
      }
    };
    pushRel("天干五合", gx.ganHe);
    pushRel("六合", gx.liuHe);
    pushRel("三合", gx.sanHe);
    pushRel("六冲", gx.chong);
    pushRel("刑", gx.xing);
    pushRel("害", gx.hai);
    if (relParts.length) lines.push(`干支关系明细: ${relParts.join("；")}`);
  }

  const ds = facts.diShi as Array<{ pillar: string; diShi: string }> | undefined;
  if (ds?.length) lines.push(`十二长生: ${ds.map((d) => `${d.pillar}${d.diShi}`).join("、")}`);

  // 子平三柱一空：胎元/命宫/身宫/旬空亡
  const sj = facts.sanJia as
    | {
        taiYuan?: string;
        mingGong?: string;
        shenGong?: string;
        xunKong?: Array<{ pillar?: string; kong?: string }>;
        notes?: string[];
      }
    | undefined;
  if (sj?.taiYuan) {
    lines.push(
      `胎元: ${sj.taiYuan} · 命宫: ${sj.mingGong} · 身宫: ${sj.shenGong}`
    );
    if (sj.xunKong?.length) {
      lines.push(`四柱旬空: ${sj.xunKong.map((x) => `${x.pillar ?? ""}${x.kong ?? ""}`).join("、")}`);
    }
    if (sj.notes?.length) lines.push(`三柱空亡义理: ${truncate(sj.notes.join("；"), 260)}`);
  }

  // 神煞清单（名+落柱，取前 14 条防超长）
  if (Array.isArray(facts.shenSha) && (facts.shenSha as Array<{ name: string; pillar: string }>).length) {
    const ss = (facts.shenSha as Array<{ name: string; pillar: string }>).slice(0, 14);
    lines.push(`神煞: ${ss.map((s) => `${s.name}(${s.pillar})`).join("、")}`);
  }

  // 黄历择日（协纪辨方书三档裁定）
  const xjz = facts.xieJi as
    | {
        dayGZ?: string;
        jianChu?: { name?: string };
        jiShen?: Array<{ name?: string }>;
        xiongSha?: Array<{ name?: string }>;
        verdict?: { level?: string; basis?: string };
      }
    | undefined;
  if (xjz?.verdict?.level) {
    lines.push(
      `协纪择日: ${xjz.dayGZ ?? ""}日，建除${xjz.jianChu?.name ?? "—"}，裁定【${xjz.verdict.level}】；吉神:${(xjz.jiShen ?? []).map((s) => s.name).join("、") || "无"}；凶煞:${(xjz.xiongSha ?? []).map((s) => s.name).join("、") || "无"}`
    );
  }

  if (Array.isArray(facts.daYun)) {
    const cur = (facts.daYun as Array<Record<string, unknown>>).find((d) => d.isCurrent);
    if (cur) {
      let dyLine = `当前大运: ${cur.ganZhi} ${cur.startYear}-${cur.endYear} 评定:${cur.yongShenLabel ?? "—"}(${cur.yongShenScore ?? "—"})`;
      if (cur.geJuLabel) {
        dyLine += ` 格局互动:${cur.geJuLabel}${cur.geJuReason ? `(${cur.geJuReason})` : ""}`;
      }
      lines.push(dyLine);
      if (typeof cur.advice === "string") lines.push(`大运建议: ${truncate(cur.advice, 160)}`);
    }
  }

  if (Array.isArray(facts.liuNian)) {
    const thisYear = new Date().getFullYear();
    const curLn = (facts.liuNian as Array<Record<string, unknown>>).find((l) => l.year === thisYear);
    if (curLn) {
      let lnLine = `当前流年: ${curLn.year} ${curLn.ganZhi} 评定:${curLn.yongShenLabel ?? "—"}`;
      if (curLn.geJuLabel) {
        lnLine += ` 格局互动:${curLn.geJuLabel}${curLn.geJuReason ? `(${curLn.geJuReason})` : ""}`;
      }
      lines.push(lnLine);
    }
  }

  if (Array.isArray(facts.stars)) {
    const ming = (facts.stars as Array<{ palace: string; star: string; brightness?: string }>).filter(
      (s) => s.palace === "命宫" || s.palace === facts.mingGongPalace
    );
    if (ming.length) lines.push(`命宫主星: ${ming.map((s) => `${s.star}${s.brightness ?? ""}`).join("、")}`);
  }
  if (Array.isArray(facts.siHua)) {
    lines.push(
      `四化: ${(facts.siHua as Array<{ star: string; hua: string; palace?: string }>)
        .map((s) => `${s.star}化${s.hua}${s.palace ? `@${s.palace}` : ""}`)
        .join("、")}`
    );
  }

  // 紫微全量星曜（iztro 桥接，乙级星+杂耀+亮度+生年化）
  if (Array.isArray(facts.palaces)) {
    const fullLines = (facts.palaces as Array<{ palace: string; starsFull?: string[] }>)
      .filter((p) => (p.starsFull ?? []).length > 0)
      .map((p) => `${p.palace}：${(p.starsFull ?? []).join("、")}`);
    if (fullLines.length) lines.push(`十二宫全量星曜:\n${fullLines.join("\n")}`);
  }
  if (typeof facts.mingZhu === "string") {
    lines.push(`命主星: ${facts.mingZhu} · 身主星: ${facts.shenZhu ?? "—"} · 五行局: ${facts.wuXingJu ?? "—"}`);
  }

  // 紫微四组十二神（长生/博士/岁前/将前）
  const godGroups: Array<[string, unknown]> = [
    ["长生十二神", facts.changSheng12Zw],
    ["博士十二神", facts.boShi12Zw],
    ["岁前十二星", facts.suiQian12],
    ["将前十二星", facts.jiangQian12],
  ];
  for (const [label, arr] of godGroups) {
    if (Array.isArray(arr) && arr.length) {
      lines.push(
        `${label}: ${(arr as Array<{ star: string; branch: string }>).map((x) => `${x.star}${x.branch}`).join("、")}`
      );
    }
  }

  // 紫微三层流曜（年/月/日）+ 各层四化（iztro horoscope）
  const lyx = facts.liuYaoXing as
    | {
        liuNianGanZhi?: string;
        liuNianMutagen?: string[];
        liuNianStars?: Array<{ branch: string; stars: string[] }>;
        liuYueGanZhi?: string;
        liuYueMutagen?: string[];
        liuYueStars?: Array<{ branch: string; stars: string[] }>;
        liuRiGanZhi?: string;
        liuRiMutagen?: string[];
        liuRiStars?: Array<{ branch: string; stars: string[] }>;
      }
    | undefined;
  if (lyx?.liuNianGanZhi) {
    const layer = (label: string, gz?: string, mu?: string[], stars?: Array<{ branch: string; stars: string[] }>) =>
      `${label}:${gz}，四化${(mu ?? []).join("/")}，流曜${(stars ?? [])
        .map((x) => `${x.branch}${x.stars.join("")}`)
        .join(" ")}`;
    lines.push(
      `三层流曜: ${layer("流年", lyx.liuNianGanZhi, lyx.liuNianMutagen, lyx.liuNianStars)}\n${layer("流月", lyx.liuYueGanZhi, lyx.liuYueMutagen, lyx.liuYueStars)}\n${layer("流日", lyx.liuRiGanZhi, lyx.liuRiMutagen, lyx.liuRiStars)}`
    );
  }

  if (facts.benGua || facts.bianGua) {
    lines.push(`本卦: ${facts.benGua ?? facts.hexagram} 变卦: ${facts.bianGua ?? "—"}`);
  }
  if (facts.liuQin && typeof facts.liuQin === "object") {
    lines.push(`六亲摘要: ${JSON.stringify(facts.liuQin)}`);
  }

  // 六爻断卦引擎（《增删卜易》四神 + 《卜筮正宗》歌诀）
  const dg = facts.duanGua as {
    yongShen?: { label?: string; note?: string };
    yong?: { name?: string; liuQin?: string; najia?: string; score?: number; notes?: string[] };
    yuan?: { name?: string; liuQin?: string; najia?: string; score?: number } | null;
    ji?: { name?: string; liuQin?: string; najia?: string; score?: number; moving?: boolean } | null;
    liLiang?: string[];
    huaYao?: string[];
    conclusion?: { level?: string; text?: string; basis?: string };
    chiShi?: string;
  } | undefined;
  if (dg?.conclusion) {
    if (dg.yongShen?.label) {
      lines.push(
        `断卦用神: ${dg.yongShen.label}${dg.yong?.name ? `（${dg.yong.name}${dg.yong.liuQin}${dg.yong.najia}·旺衰评分${dg.yong.score}）` : ""}`
      );
    }
    if (dg.yong?.notes?.length) lines.push(`用神旺衰明细: ${dg.yong.notes.join("；")}`);
    if (dg.yuan) lines.push(`元神: ${dg.yuan.name}${dg.yuan.liuQin}（评分${dg.yuan.score}）`);
    if (dg.ji) lines.push(`忌神: ${dg.ji.name}${dg.ji.liuQin}（评分${dg.ji.score}${dg.ji.moving ? "·动" : ""}）`);
    if (dg.liLiang?.length) lines.push(`力量清单(增删卜易): ${dg.liLiang.join("；")}`);
    if (dg.huaYao?.length) lines.push(`动爻变化: ${dg.huaYao.join("；")}`);
    if (dg.chiShi) lines.push(`持世诀: ${dg.chiShi}`);
    lines.push(`卦断【${dg.conclusion.level}】: ${dg.conclusion.text}（依据：${dg.conclusion.basis}）`);
  }

  // 大六壬课体与毕法断语
  if (facts.keTi) {
    lines.push(`六壬课体: ${facts.keTi}（${(facts as { keTiNature?: string }).keTiNature ?? ""}）`);
  }
  const bf = facts.biFa as Array<{ fa?: string; source?: string; text?: string }> | undefined;
  if (bf?.length) {
    lines.push(`毕法断语(凌福之·节选): ${bf.map((b) => `【${b.fa}】${b.text}`).join("；")}`);
  }

  // 奇门十干克应格局（烟波钓叟歌）
  const qg = facts.qiMenGeJu as {
    geJuList?: Array<{ palace?: string; tianGan?: string; diGan?: string; name?: string; kind?: string; note?: string }>;
    sanDun?: string[];
    ganGe?: string[];
    xingWang?: string[];
    summary?: string;
  } | undefined;
  if (qg?.summary) {
    if (qg.geJuList?.length) {
      lines.push(
        `十干克应: ${qg.geJuList.map((g) => `${g.palace}宫${g.tianGan}加${g.diGan}【${g.kind}】${g.name}`).join("；")}`
      );
      for (const g of qg.geJuList) {
        if (g.note) lines.push(`格局注: ${g.name}——${g.note}`);
      }
    }
    if (qg.sanDun?.length) lines.push(`三遁: ${qg.sanDun.join("；")}`);
    if (qg.ganGe?.length) lines.push(`干格: ${qg.ganGe.join("；")}`);
    if (qg.xingWang?.length) lines.push(`九星旺衰: ${qg.xingWang.join("；")}`);
    lines.push(`格局总论: ${qg.summary}`);
  }

  if (typeof facts.scores === "object" && facts.scores) {
    lines.push(`评分: ${JSON.stringify(facts.scores)}`);
  }
  if (typeof facts.totalScore === "number") lines.push(`总分: ${facts.totalScore}`);

  // 西洋古典占星：Lilly 五级尊贵计分
  const wc = facts.westernChart as {
    isDayChart?: boolean;
    planets?: Array<{ body?: string; sign?: string; degreeInSign?: number; score?: number; dignities?: string[]; condition?: string }>;
    summary?: string;
  } | undefined;
  if (wc?.planets?.length) {
    lines.push(
      `西洋占星(昼夜盘·Lilly计分): ${wc.planets.map((p) => `${p.body}${p.sign}${p.degreeInSign}°(${p.score}分${p.dignities?.[0] ?? ""})`).join("；")}`
    );
    lines.push(`星象总论: ${wc.summary ?? ""}`);
  }

  // 吠陀 Vimshottari 大运
  const vim = facts.vimshottari as {
    mahadashas?: Array<{ lord?: string; lordCn?: string; startAge?: number; endAge?: number }>;
    current?: { mahadasha?: string; antardasha?: string; antardashaCn?: string; startAge?: number; endAge?: number };
  } | undefined;
  if (vim?.current?.mahadasha) {
    lines.push(
      `吠陀大运: 当前${vim.current.mahadasha}大运·${vim.current.antardasha}（${vim.current.antardashaCn}）子运 ${vim.current.startAge}-${vim.current.endAge} 岁；${(vim.mahadashas ?? []).map((m) => `${m.lordCn ?? m.lord}${m.startAge}-${m.endAge}`).join("、")}`
    );
  }

  // 数字命理：Lo Shu / 业债数
  const ls = facts.loShu as
    | { missing?: number[]; repeated?: number[]; note?: string }
    | undefined;
  if (ls?.note) {
    lines.push(`洛书九宫: ${ls.note}`);
    if (facts.karmicDebt) {
      const kd = facts.karmicDebt as { number?: number; note?: string };
      if (kd.note) lines.push(`业债数: ${kd.note}`);
    }
  }

  if (facts.grids && typeof facts.grids === "object") {
    const g = facts.grids as Record<string, { value?: number; luck?: string; element?: string }>;
    lines.push(
      `五格: 天${g.tianGe?.value}${g.tianGe?.luck}/${g.tianGe?.element} 人${g.renGe?.value}${g.renGe?.luck}/${g.renGe?.element} 地${g.diGe?.value}${g.diGe?.luck}/${g.diGe?.element} 外${g.waiGe?.value}${g.waiGe?.luck} 总${g.zongGe?.value}${g.zongGe?.luck}`
    );
  }
  if (facts.sancai && typeof facts.sancai === "object") {
    const s = facts.sancai as { config?: string; luck?: string; desc?: string };
    lines.push(`三才: ${s.config}（${s.luck}） ${s.desc ?? ""}`);
  }
  if (facts.yongShenFit && typeof facts.yongShenFit === "object") {
    lines.push(`姓名×喜用: ${JSON.stringify(facts.yongShenFit)}`);
  }
  if (Array.isArray(facts.candidates)) {
    lines.push(
      `取名候选: ${(facts.candidates as Array<{ fullName: string; score: number; sancai?: string }>)
        .slice(0, 8)
        .map((c) => `${c.fullName}(${c.score}/${c.sancai ?? ""})`)
        .join("、")}`
    );
  }
  if (typeof facts.baziHint === "string") lines.push(`八字提示: ${facts.baziHint}`);

  if (typeof facts.summary === "string") lines.push(`引擎摘要: ${truncate(facts.summary, 280)}`);

  // 《协纪辨方书》择日打分（黄历模块）
  const xj = facts.xieJi as {
    dayGZ?: string;
    jianChu?: { name?: string; yi?: string };
    jiShen?: Array<{ name?: string; note?: string }>;
    xiongSha?: Array<{ name?: string; note?: string }>;
    verdict?: { level?: string; basis?: string };
    perActivity?: Array<{ activity?: string; level?: string }>;
  } | undefined;
  if (xj?.verdict) {
    if (xj.jianChu?.name) lines.push(`建除十二神: ${xj.jianChu.name}（宜${xj.jianChu.yi ?? ""}）`);
    if (xj.jiShen?.length) lines.push(`吉神: ${xj.jiShen.map((x) => `${x.name}(${x.note ?? ""})`).join("；")}`);
    if (xj.xiongSha?.length) lines.push(`凶煞: ${xj.xiongSha.map((x) => `${x.name}(${x.note ?? ""})`).join("；")}`);
    lines.push(`择日裁定【${xj.verdict.level}】: ${xj.verdict.basis}`);
    if (xj.perActivity?.length) {
      lines.push(`分用事: ${xj.perActivity.map((a) => `${a.activity}=${a.level}`).join("、")}`);
    }
  }

  // 控制长度
  let text = lines.join("\n");
  if (text.length > 2600) text = `${text.slice(0, 2600)}\n…(已截断)`;
  return text;
}

/** 按模块族定制的 prompt 风格：结构 / 语气 / 深挖方向 */
interface PromptStyle {
  structure: string;
  tone: string;
  focus: string;
  structureEn: string;
  toneEn: string;
  focusEn: string;
}

const STYLE_BAZI: PromptStyle = {
  structure: "格局成败 → 性格气质 → 事业 → 财官 → 大运流年趋势 → 行动建议",
  tone: "以子平命理师的口吻论断，论据必须挂钩格局成败、喜忌冲合、调候、十二长生等具体要素，而非泛谈运势",
  focus: "把清单中的「格局/成格要点/破格风险/救应/相神/干支关系/十二长生/调候用神/喜用忌神」喂进论述：每谈一个领域，先引用对应硬事实再作推断；格局有破应指出风险与救应方向，调候与扶抑冲突时说明取舍",
  structureEn: "structure success/failure → temperament → career → wealth & authority → luck-cycle trends → actionable advice",
  toneEn: "reason like a classical Zi Ping master: every claim must hook onto specific hard facts (ge-ju success/break factors, rescue gods, clashes and combinations, climate adjustment, life stages), never generic fortune talk",
  focusEn: "weave the ge-ju success/break/rescue factors, branch relations, climate-adjustment gods, and life-stage cycle into each domain: cite the hard fact first, then infer",
};

const STYLE_ZIWEI: PromptStyle = {
  structure: "命宫主星定调 → 重点宫位（财帛/官禄/夫妻） → 四化飞星走向 → 行动建议",
  tone: "紫微斗数论命口吻，紧扣主星庙旺与四化落宫，不混入子平术语",
  focus: "把「命宫主星亮度、四化(化禄/权/科/忌)落宫」作为每段论断的锚点",
  structureEn: "life-palace stars → key palaces (wealth/career/spouse) → four transformations → actionable advice",
  toneEn: "reason strictly within Zi Wei Dou Shu: anchor claims on star brightness and transformation placements, do not mix in Ba Zi terms",
  focusEn: "anchor every claim on the life-palace stars and the four transformations with their palaces",
};

const STYLE_DIVINATION: PromptStyle = {
  structure: "所问之事复述 → 卦象/牌面/课体分析 → 趋势与应期 → 行动建议",
  tone: "断事口吻：就事论事，紧扣卦爻、世应、用神或牌面正逆位，不泛谈人生整体",
  focus: "把「本卦/变卦、六亲、断卦引擎的用神旺衰/元神忌神力量清单/动爻变化/卦断结论」作为推断依据，结论落到「此事当下怎么做」",
  structureEn: "restate the question → hexagram/spread analysis → trend and timing → actionable advice",
  toneEn: "answer the specific question: stick to hexagram lines, relevant spirits, or spread positions; avoid general life readings",
  focusEn: "base the reading on the primary/changed hexagram, six relatives, the yong-shen strength verdict, and the engine conclusion; land on what to do now",
};

const STYLE_NAME: PromptStyle = {
  structure: "五格三才速览 → 字义音形 → 与八字喜用对照 → 建议",
  tone: "姓名学顾问口吻，把五格吉凶与喜用神对照讲清楚，能量化处量化",
  focus: "把「五格数值与吉凶、三才配置、姓名×喜用适配度」逐项展开，避免笼统的好/不好",
  structureEn: "five-grid overview → meaning and sound → fit with useful gods → suggestions",
  toneEn: "speak as a naming consultant: map five-grid luck and three-talent config onto the useful gods, quantify where possible",
  focusEn: "expand on each grid number, three-talent configuration, and name-vs-useful-god fit; avoid vague good/bad verdicts",
};

const STYLE_FORTUNE: PromptStyle = {
  structure: "当下状态速评 → 分领域短评 → 近期趋势 → 可执行建议",
  tone: "轻松但有依据的运势播报口吻，每个说法都要能指回清单里的分数、星级或关键词",
  focus: "把「评分/星级/宜忌/吉时吉色」具体化，建议落到当天或近期可执行的小事",
  structureEn: "current snapshot → short takes per domain → near-term trend → executable suggestions",
  toneEn: "a grounded fortune-brief voice: every statement must trace back to a score, rating, or keyword in the list",
  focusEn: "turn scores, ratings, do/don't items, and lucky colors/hours into concrete near-term actions",
};

const DEFAULT_STYLE: PromptStyle = {
  structure: "性格气质 → 事业 → 财运 → 感情 → 健康 → 行动建议",
  tone: "沉稳、具体、有文化底蕴，论断有据，不做空泛鸡汤",
  focus: "紧扣清单中的硬事实展开，避免与清单无关的泛论",
  structureEn: "temperament → career → wealth → relationships → health → actionable advice",
  toneEn: "grounded and specific, claims tied to the fact list, no empty platitudes",
  focusEn: "stick to hard facts in the list; avoid generic filler",
};

const PROMPT_STYLES: Record<string, PromptStyle> = {
  bazi: STYLE_BAZI,
  ziwei: STYLE_ZIWEI,
  divination: STYLE_DIVINATION,
  name: STYLE_NAME,
  fortune: STYLE_FORTUNE,
};

/** 模块 → 风格族映射（未列出的走默认风格） */
const MODULE_STYLE_MAP: Record<string, string> = {
  bazi: "bazi",
  "bazi-dayun": "bazi",
  "bazi-resolve": "bazi",
  ziwei: "ziwei",
  yijing: "divination",
  liuyao: "divination",
  meihua: "divination",
  qimen: "divination",
  daliuren: "divination",
  xiaoliuren: "divination",
  taiyi: "divination",
  beijiao: "divination",
  tarot: "divination",
  lingqian: "divination",
  dream: "divination",
  word: "divination",
  name: "name",
  naming: "name",
  match: "name",
  almanac: "fortune",
  zodiac: "fortune",
  horoscope: "fortune",
  "wuxing-ren": "fortune",
  tiaoyun: "fortune",
  numerology: "fortune",
  vedic: "fortune",
  mbti: "fortune",
  heluo: "fortune",
  qizheng: "fortune",
  chenggu: "fortune",
  fengshui: "fortune",
  face: "fortune",
  palm: "fortune",
};

function getPromptStyle(moduleId: string): PromptStyle {
  return PROMPT_STYLES[MODULE_STYLE_MAP[moduleId] ?? ""] ?? DEFAULT_STYLE;
}

export function buildAiEnhancePrompt(
  moduleId: string,
  facts: Record<string, unknown>,
  templateReport: string,
  locale: "zh" | "en" = "zh"
): string {
  const digest = buildAiFactDigest(moduleId, facts);
  const reportClip = truncate(templateReport, 1800);
  // RAG：按模块与事实摘要检索知识库，命中才注入
  const knowledgeClip = buildKnowledgeContext(`${moduleId} ${digest}`, moduleId);
  const style = getPromptStyle(moduleId);
  if (locale === "en") {
    return `You are a senior interpreter of classical Chinese metaphysics for a general audience. Using the FACT LIST and BASE REPORT below, write a 500–800 word English supplement.

Hard rules:
1. Do not invent or contradict pillars, hexagrams, scores, useful gods, luck cycles, or star names in the fact list
2. Do not invent specifics not present in the list
3. Structure: ${style.structureEn} (omit N/A sections)
4. Voice: ${style.toneEn}
5. Depth: ${style.focusEn}
6. Keep traditional Chinese terms in Chinese with a short English gloss in parentheses when first used
7. Anti-cliché rules: open with a concrete hard fact from the list (a pillar, star, hexagram, score, or structure name) — never with generic lines like "In traditional Chinese culture..."; never start a paragraph with "In summary / Overall / All in all"; delete any claim that cannot be traced to an item in the list; no strings of ornamental adjectives or blanket blessings
8. End with: "For cultural entertainment only."
9. Compliance: no fortune-telling service promises (luck-changing, disaster-warding rituals); no absolute fate claims — use trend language instead
${knowledgeClip ? `\n[KNOWLEDGE BASE REFERENCES (for context; never present general theory as the client's actual situation)]\n${knowledgeClip}\n` : ""}
[FACT LIST]
${digest}

[BASE REPORT EXCERPT]
${reportClip}`;
  }

  return `你是精通传统命理文化的资深解读师，正在为「${getModuleDefinition(moduleId)?.name ?? moduleId}」撰写深度补充解读（500-800字）。

硬性约束：
1. 不得修改、编造或否定清单中的四柱、卦名、分数、喜用神、大运干支、星曜等硬事实
2. 清单未给出的信息，不要臆造具体干支/宫位/星名
3. 结构按「${style.structure}」展开（不适用可省略）
4. 语气与视角：${style.tone}
5. 深挖方向：${style.focus}
6. 末尾注明「以上仅供文化娱乐参考」
7. 合规要求：不得出现「改运、改命、消灾、破灾、开光、法事、转运」等玄学服务承诺表述；不得使用「必定、注定、百分之百」等绝对化断语；一律采用「倾向于、往往会、可留意」等趋势性措辞

去套话铁律：
- 开篇第一句必须直接引用清单中至少一个具体硬事实（干支、星曜、卦名、分数、格局名等），禁止以「在中国传统文化中」「人生如同」「命运长河」类空话开场
- 任何段落不得以「总体而言／综上所述／总的来说／从整体来看」开头
- 每个论断应能对应清单中的某个要素，对应不上的泛泛而谈直接删除
- 不堆砌四字排比与形容词，不写万能祝福语（如「祝你幸福美满」）
${knowledgeClip ? `\n【知识库参考（检索所得，仅供引用理论依据，不得将泛论直接断言为命主实情）】\n${knowledgeClip}\n` : ""}
【关键事实清单】
${digest}

【基础报告（节选）】
${reportClip}`;
}
