/**
 * 六爻断卦引擎（《增删卜易》野鹤老人·清 + 《卜筮正宗》王洪绪·清）
 *
 * 四神体系：用神（所占之事）→ 元神（生用神者）→ 忌神（克用神者）→ 仇神（生忌神克元神者）。
 * 旺衰评分：月建（±2）+ 日辰（±1）+ 动爻生克（±1.5/条）+ 旬空（-2）。
 * 力量清单（《增删卜易》原文可穷举）：
 *   忌神能克用神者五：旺动 / 动化回头生 / 旺动临空化空 / 长生帝旺与日辰 / 与仇神同动；
 *   忌神不能克用神者七（v1 实现四种）：休囚不动被日月克 / 静临空破 / 动化回头克 / 与元神同动（贪生忘克）。
 *   用神无根，元神有力亦难生。
 * 发货口径：结论为文化参考，每条断语附原文出处。
 */

import { KE, SHENG, ZHI_WX } from "./liuyao-najia";
import type { YaoDetail } from "./liuyao-najia";

export const CHONG_PAIRS: Array<[string, string]> = [
  ["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];

/** 六兽起法（《卜筮正宗》）：甲乙青龙、丙丁朱雀、戊勾陈、己螣蛇、庚辛白虎、壬癸玄武，自初爻上行 */
const BEAST_START: Record<string, string> = {
  甲: "青龙", 乙: "青龙", 丙: "朱雀", 丁: "朱雀",
  戊: "勾陈", 己: "螣蛇", 庚: "白虎", 辛: "白虎",
  壬: "玄武", 癸: "玄武",
};
const BEAST_ORDER = ["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"];
const BEAST_NOTE: Record<string, string> = {
  青龙: "吉庆和喜庆之事，临用神增吉。",
  朱雀: "口舌文书、信息音讯。",
  勾陈: "田土牵连、迟滞缠绵。",
  螣蛇: "怪异虚惊、缠绕多变。",
  白虎: "凶伤疾病、威权肃杀。",
  玄武: "暗昧私情、盗失阴私。",
};

/** 六兽起法：按日干定初爻之兽，逐爻上行 */
export function assignBeasts(dayGan: string): Array<{ position: number; beast: string; note: string }> {
  const start = BEAST_START[dayGan] ?? "青龙";
  const startIdx = BEAST_ORDER.indexOf(start);
  return Array.from({ length: 6 }, (_, i) => {
    const beast = BEAST_ORDER[(startIdx + i) % 6];
    return { position: i + 1, beast, note: BEAST_NOTE[beast] };
  });
}

/** 旬空：以日干支定位所在旬，旬中两支落空 */
export function xunKong(dayGan: string, dayZhi: string): string[] {
  const GANS = "甲乙丙丁戊己庚辛壬癸";
  const ZHIS = "子丑寅卯辰巳午未申酉戌亥";
  const gi = GANS.indexOf(dayGan);
  const zi = ZHIS.indexOf(dayZhi);
  if (gi < 0 || zi < 0) return [];
  // 六十甲子中满足 n%10=gi, n%12=zi 的 n（中国剩余）
  let n = -1;
  for (let k = 0; k < 60; k++) {
    if (k % 10 === gi && k % 12 === zi) { n = k; break; }
  }
  if (n < 0) return [];
  const xunStart = n - (n % 10);
  const kong1 = (xunStart + 10) % 12;
  const kong2 = (xunStart + 11) % 12;
  return [ZHIS[kong1], ZHIS[kong2]];
}

function isChong(a: string, b: string): boolean {
  return CHONG_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

/** 五行十二支序列（进神/退神判定用；土无进退，经典以四季论） */
const ZHI_SEQUENCE: Record<string, string[]> = {
  木: ["寅", "卯"],
  火: ["巳", "午"],
  金: ["申", "酉"],
  水: ["亥", "子"],
};

export interface YongShenRef {
  /** 所取用神六亲，或"世爻" */
  label: string;
  /** 匹配的占类关键词 */
  matchedKeys?: string[];
  note: string;
}

const YONG_RULES: Array<{ keys: string[]; label: string; note: string }> = [
  { keys: ["求财", "财运", "生意", "买卖", "投资", "做生意", "生意经", "生意经"], label: "妻财", note: "占财以妻财为用神（《增删卜易》用神分类）" },
  { keys: ["事业", "工作", "求职", "升迁", "官运", "功名", "考试", "官司", "诉讼", "官非"], label: "官鬼", note: "占功名官讼以官鬼为用神" },
  { keys: ["文书", "合同", "房屋", "买房", "买车", "长辈", "父母", "学业"], label: "父母", note: "占文书房屋长辈以父母为用神" },
  { keys: ["子女", "孩子", "生育", "宠物", "医药"], label: "子孙", note: "占子女医药以子孙为用神，子孙亦为解忧之神" },
  { keys: ["朋友", "合伙", "同事", "竞争", "兄弟姐妹"], label: "兄弟", note: "占朋友兄弟以兄弟为用神" },
  { keys: ["婚姻", "结婚", "感情", "恋爱", "对象"], label: "妻财", note: "婚姻男占以妻财为用、女占以官鬼为用（默认按男命取财，可在断语说明）" },
  { keys: ["病", "健康", "身体"], label: "世爻", note: "自占疾病以世爻为用，官鬼为病症、子孙为医药（《增删卜易》）" },
];

export function pickYongShen(question: string): YongShenRef {
  const q = question ?? "";
  for (const rule of YONG_RULES) {
    if (rule.keys.some((k) => q.includes(k))) {
      return { label: rule.label, matchedKeys: rule.keys.filter((k) => q.includes(k)), note: rule.note };
    }
  }
  return { label: "世爻", note: "未明占类，自占以世爻为用（《增删卜易》：占自己吉凶以世爻为用神）" };
}

export interface YaoScore {
  position: number;
  name: string;
  liuQin: string;
  najia: string;
  wx: string;
  score: number;
  moving: boolean;
  kong: boolean;
  notes: string[];
  beast: string;
}

export interface DuanGuaResult {
  yongShen: YongShenRef;
  yong: YaoScore | null;
  yuan: YaoScore | null;
  ji: YaoScore | null;
  chou: YaoScore | null;
  /** 用神两现/伏神说明 */
  yongNote?: string;
  /** 元神/忌神力量清单评估（《增删卜易》条文） */
  liLiang: string[];
  conclusion: {
    level: "吉" | "平" | "凶" | "吉中带阻";
    text: string;
    basis: string;
  };
  /** 《卜筮正宗》持世诀 */
  chiShi: string;
  /** 动爻化爻（回头生克/进退神）说明 */
  huaYao: string[];
  verses: string[];
}

function wxOf(yao: { zhi: string }): string {
  return ZHI_WX[yao.zhi] ?? "土";
}

function scoreYao(params: {
  yao: { position: number; name: string; liuQin: string; najia: string; zhi: string; moving: boolean };
  monthZhi: string;
  dayZhi: string;
  kong: string[];
  moversWx: Array<{ wx: string; name: string }>;
  beast: string;
}): YaoScore {
  const wx = ZHI_WX[params.yao.zhi] ?? "土";
  const monthWx = ZHI_WX[params.monthZhi] ?? "土";
  const dayWx = ZHI_WX[params.dayZhi] ?? "土";
  let score = 0;
  const notes: string[] = [];

  if (monthWx === wx) { score += 2; notes.push(`月建${params.monthZhi}扶助（同五行），当令旺相`); }
  else if (SHENG[monthWx] === wx) { score += 2; notes.push(`月建${params.monthZhi}生扶，得月气`); }
  else if (KE[monthWx] === wx) { score -= 2; notes.push(`月建${params.monthZhi}克，月令失时`); }

  if (dayWx === wx) { score += 1; notes.push(`日辰${params.dayZhi}比和`); }
  else if (SHENG[dayWx] === wx) { score += 1; notes.push(`日辰${params.dayZhi}生之，得日生助`); }
  else if (KE[dayWx] === wx) { score -= 1; notes.push(`日辰${params.dayZhi}克之，日建克伤`); }
  else if (isChong(params.dayZhi, params.yao.zhi)) { score -= 1; notes.push(`日辰${params.dayZhi}冲之（暗动/日破之嫌）`); }

  const kong = params.kong.includes(params.yao.zhi);
  if (kong) { score -= 2; notes.push(`旬空（${params.kong.join("、")}空）——发动逢冲不谓空，静空遇克却为空`); }

  for (const m of params.moversWx) {
    if (m.wx === wx) continue;
    if (SHENG[m.wx] === wx) { score += 1.5; notes.push(`动爻${m.name}生之`); }
    else if (KE[m.wx] === wx) { score -= 1.5; notes.push(`动爻${m.name}克之`); }
  }

  return {
    position: params.yao.position,
    name: params.yao.name,
    liuQin: params.yao.liuQin,
    najia: params.yao.najia,
    wx,
    score,
    moving: params.yao.moving,
    kong,
    notes,
    beast: params.beast,
  };
}

function pickYongYao(
  yong: YongShenRef,
  najia: { yao: YaoDetail[]; fuShen: { liuQin: string; najia: string; note: string }[] }
): { yao: YaoDetail | null; note?: string } {
  if (yong.label === "世爻") {
    const shi = najia.yao.find((y) => y.isShi);
    return { yao: null, note: shi ? undefined : undefined };
  }
  const candidates = najia.yao.filter((y) => y.liuQin === yong.label);
  if (!candidates.length) {
    const fu = najia.fuShen.find((f) => f.liuQin === yong.label);
    return {
      yao: null,
      note: fu
        ? `用神不上卦，以伏神${yong.label}${fu.najia}为用——「正卦如无变又无，就将首卦六亲攻」（卜筮正宗·用神不上卦诀）`
        : "用神六亲不现且无伏神，以世爻参断",
    };
  }
  if (candidates.length > 1) {
    // 两现：舍其空破，取其旺相（动者优先）
    const sorted = [...candidates].sort((a, b) => Number(b.moving) - Number(a.moving));
    return { yao: sorted[0], note: `用神两现，取${sorted[0].name}${sorted[0].najia}（动者为主）` };
  }
  return { yao: candidates[0] };
}

/** 六亲发动诀（《卜筮正宗》）：动爻六亲 → 首句断语 */
const FA_DONG: Record<string, string> = {
  父母: "父母动当头克子孙，文书书信之象。",
  子孙: "子孙发动伤官鬼，占病求医身便痊，解忧之象。",
  官鬼: "官鬼从来克兄弟，功名最喜世当权，病讼为凶。",
  妻财: "妻财发动克文书，将本经营为大吉。",
  兄弟: "兄弟交重克了财，应举夺标为忌客。",
};

/** 持世诀（《卜筮正宗·诸爻持世》） */
const CHI_SHI: Record<string, string> = {
  父母: "父母持世主身劳，求嗣难招，官动财旺宜赴试。",
  子孙: "子孙持世事无忧，有生无克诸般吉。",
  官鬼: "官鬼持世事难安，占身不病也遭官，功名最喜世当权。",
  妻财: "财爻持世益财荣，兄若交重不可逢。",
  兄弟: "兄弟持世莫求财，官兴须虑祸将来。",
};

/** 变爻分析：回头生克 / 进神退神 */
function huaYaoAnalysis(params: {
  movers: YaoDetail[];
  changedNajia: YaoDetail[];
  dayGan: string;
}): string[] {
  const out: string[] = [];
  for (const m of params.movers) {
    const changed = params.changedNajia.find((c) => c.position === m.position);
    if (!changed) continue;
    const mWx = ZHI_WX[m.zhi] ?? "土";
    const cWx = ZHI_WX[changed.zhi] ?? "土";
    if (SHENG[cWx] === mWx) out.push(`${m.name}${m.liuQin}${m.najia}动化${changed.najia}回头生，动而有力。`);
    else if (KE[cWx] === mWx) out.push(`${m.name}${m.liuQin}${m.najia}动化${changed.najia}回头克，动而受伤（忌神化克尤吉、用神化克则凶）。`);
    else if (cWx === mWx) {
      const seq = ZHI_SEQUENCE[mWx];
      if (seq && seq.includes(m.zhi) && seq.includes(changed.zhi)) {
        const dir = seq.indexOf(changed.zhi) > seq.indexOf(m.zhi) ? "化进神，其势渐进" : "化退神，其势渐退";
        out.push(`${m.name}${m.liuQin}${m.najia}动化${changed.najia}，同五行${dir}。`);
      } else {
        out.push(`${m.name}${m.liuQin}${m.najia}动化${changed.najia}，五行比和。`);
      }
    }
  }
  return out;
}

/** 生我者（元神方向）与克我者（忌神方向） */
function shengMe(wx: string): string {
  return Object.keys(SHENG).find((k) => SHENG[k] === wx) ?? "土";
}
function keMe(wx: string): string {
  return Object.keys(KE).find((k) => KE[k] === wx) ?? "木";
}

export function analyzeLiuyao(input: {
  question: string;
  dayGan: string;
  dayZhi: string;
  monthZhi: string;
  najia: {
    yao: YaoDetail[];
    fuShen: Array<{ liuQin: string; najia: string; note: string }>;
    shi: number;
  };
  changedNajia: YaoDetail[];
}): DuanGuaResult {
  const yong = pickYongShen(input.question);
  const beasts = assignBeasts(input.dayGan);
  const beastOf = (pos: number) => beasts.find((b) => b.position === pos)?.beast ?? "青龙";
  const kong = xunKong(input.dayGan, input.dayZhi);
  const movers = input.najia.yao.filter((y) => y.moving);
  const moversWx = movers.map((m) => ({ wx: ZHI_WX[m.zhi] ?? "土", name: `${m.name}${m.liuQin}` }));

  const pick = pickYongYao(yong, input.najia);
  const shiYao = input.najia.yao.find((y) => y.isShi)!;
  const yongBase = pick.yao ?? shiYao; // 世爻为用 或 伏神回退用世爻参断
  const yongWx = wxOf(yongBase);
  const yuanWx = shengMe(yongWx); // 生用神者＝元神
  const jiWx = keMe(yongWx); // 克用神者＝忌神
  const chouWx = shengMe(jiWx); // 生忌神者＝仇神

  const scoreOf = (yao: YaoDetail): YaoScore =>
    scoreYao({
      yao,
      monthZhi: input.monthZhi,
      dayZhi: input.dayZhi,
      kong,
      moversWx,
      beast: beastOf(yao.position),
    });

  // 用神：正取六亲爻；无则用伏神（以伏神地支五行评分，位置标伏）
  let yongScore: YaoScore;
  if (pick.yao) {
    yongScore = scoreOf(pick.yao);
  } else {
    const fu = input.najia.fuShen.find((f) => f.liuQin === yong.label);
    if (fu) {
      const fake: YaoDetail = {
        ...shiYao,
        zhi: fu.najia[1],
        najia: fu.najia,
        liuQin: yong.label,
        moving: false,
        isShi: false,
        isYing: false,
      };
      yongScore = scoreOf(fake);
      yongScore.notes.unshift("用神伏藏，以伏神评旺衰（伏藏爻与静爻同论）");
    } else {
      yongScore = scoreOf(shiYao);
    }
  }

  // 元神：用神爻之外，取生用神五行之爻（优先动爻）
  const yuanCandidates = input.najia.yao.filter((y) => (ZHI_WX[y.zhi] ?? "土") === yuanWx && y.position !== yongScore.position);
  const jiCandidates = input.najia.yao.filter((y) => (ZHI_WX[y.zhi] ?? "土") === jiWx && y.position !== yongScore.position);
  const chouCandidates = input.najia.yao.filter((y) => (ZHI_WX[y.zhi] ?? "土") === chouWx);
  const pickPriority = (arr: YaoDetail[]) => [...arr].sort((a, b) => Number(b.moving) - Number(a.moving))[0];
  const yuan = yuanCandidates.length ? scoreOf(pickPriority(yuanCandidates)) : null;
  const ji = jiCandidates.length ? scoreOf(pickPriority(jiCandidates)) : null;
  const chou = chouCandidates.length ? scoreOf(pickPriority(chouCandidates)) : null;

  // 力量清单（《增删卜易》）
  const liLiang: string[] = [];
  const yongYouGen = yongScore.score > -2;
  if (ji) {
    const jiPowerful: string[] = [];
    if (ji.score >= 2 && ji.moving) jiPowerful.push("忌神旺动（如斧戟在前，诸占大凶）");
    if (ji.score >= 2 && !ji.moving) jiPowerful.push("忌神旺相静守，伺机而发");
    if (ji.moving && ji.score > 0) jiPowerful.push("忌神动而得月生扶");
    if (jiPowerful.length) liLiang.push(`忌神能克用神：${jiPowerful.join("；")}`);

    const jiWeak: string[] = [];
    if (ji.score < 0 && !ji.moving) jiWeak.push("忌神休囚不动，又被日月克伤");
    if (ji.kong && !ji.moving) jiWeak.push("忌神静临空亡（忌神最喜逢空吉）");
    if (yuan && yuan.moving && yuan.score > 0 && ji.moving) jiWeak.push("忌神与元神同动，贪生忘克（忌神反生元神，接续相生）");
    if (jiWeak.length) liLiang.push(`忌神不能克用神：${jiWeak.join("；")}`);
  }
  if (yuan) {
    if (yuan.score >= 2 || (yuan.moving && yuan.score > 0)) liLiang.push("元神有力：得月生扶或发动有气，用神有源。");
    else if (yuan.score <= -2) liLiang.push("元神休囚受制：纵发动亦难生用（用神无根，元神有力亦难生）。");
  }
  if (!yongYouGen) liLiang.push("用神无根：虽元神有力亦难生（如树无根，寒谷不回春）。");

  // 结论
  let level: DuanGuaResult["conclusion"]["level"] = "平";
  let text = "";
  let basis = "";
  if (yongScore.score >= 2 && (!ji || ji.score <= 0 || !ji.moving)) {
    level = "吉";
    text = "用神旺相有力，忌神无力克伤，所谋多有可成之势。";
    basis = "用爻发动在宫中，纵值休囚亦不凶，更得生扶兼旺相，管教作事永亨通（卜筮正宗·用神发动诀）";
  } else if (yongScore.score >= 2 && ji && ji.moving && ji.score > 0) {
    level = "吉中带阻";
    text = "用神旺而忌神亦动，事可成而中间多一番阻滞争夺。";
    basis = "忌神急要逢伤克，若遇生扶用受刑（卜筮正宗·忌神歌）";
  } else if (yongScore.score <= -2 && ji && ji.score >= 2 && ji.moving) {
    level = "凶";
    text = "用神失时无根，忌神旺动克伤，所谋难成，宜退守避其锋。";
    basis = "忌神旺动，如斧戟之在前，诸占大凶（增删卜易）";
  } else {
    level = "平";
    text = "用神旺衰参半，事有阻节，成败在于人为调停与应期。";
    basis = "卦遇六爻安静当看用与日辰；日辰克用及相刑，作事宜当谨慎（卜筮正宗·六爻安静诀）";
  }

  const chiShi = CHI_SHI[shiYao.liuQin] ?? "";
  const huaYao = huaYaoAnalysis({
    movers,
    changedNajia: input.changedNajia,
    dayGan: input.dayGan,
  });

  const verses = [
    "看卦先须看忌神，忌神宜静不宜兴（卜筮正宗·忌神歌）",
    "原神发动志扬扬，用伏藏兮也不妨（卜筮正宗·原神歌）",
    "用神无根，元神有力亦难生（增删卜易）",
  ];

  return {
    yongShen: yong,
    yong: yongScore,
    yuan,
    ji,
    chou,
    yongNote: pick.note,
    liLiang,
    conclusion: { level, text, basis },
    chiShi,
    huaYao,
    verses,
  };
}
