/**
 * 奇门遁甲 · 十干克应格局引擎（《烟波钓叟歌》原文条目）
 *
 * 十干克应 = 天盘干加地盘干的组合格局。原文（歌诀逐句对应）：
 *   吉：「丙加甲兮鸟跌穴，甲加丙兮龙返首。只此二者是吉神，为事如意十八九。」
 *        （甲遁于戊仪：戊加丙＝青龙返首，丙加戊＝飞鸟跌穴）
 *   凶：「六庚加丙白入荧，六丙加庚荧入白。白入荧兮贼即来，荧入白兮贼须灭。」
 *      「庚加日干为伏干，日干加庚飞干格。」
 *      「庚加癸兮为大格，加己为刑最不宜。加壬之时为上格。」
 *      「六癸加丁蛇夭矫，六丁加癸雀投江。六乙加辛龙逃走，六辛加乙虎猖狂。」
 *   三遁：「生门六丙合六丁，此为天遁自分明。开门六乙合六己，地遁如斯而已矣。
 *          休门六丁共太阴，欲求人遁无过此。」
 *   九星旺衰：「与我同行即为相，我生之月诚为旺。废于父母休于财，囚于鬼兮真不妄。」
 *   门迫：「宫制其门不为迫，门制其宫是迫雄。」
 *
 * 仅供文化参考。
 */

const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export interface QiMenPalaceInput {
  palace: string;
  tianGan: string;
  diGan: string;
  gate?: string;
  god?: string;
  star?: string;
}

export interface QiMenGeJuItem {
  palace: string;
  tianGan: string;
  diGan: string;
  name: string;
  kind: "吉" | "凶";
  verse: string;
  note: string;
}

/** 十干克应表：天盘干 + 地盘干 → 格局 */
export const SHI_GAN_KE_YING: Record<string, { name: string; kind: "吉" | "凶"; verse: string; note: string }> = {
  "戊丙": { name: "青龙返首", kind: "吉", verse: "甲加丙兮龙返首", note: "大吉之格，为事如意十有八九，利行动进取" },
  "丙戊": { name: "飞鸟跌穴", kind: "吉", verse: "丙加甲兮鸟跌穴", note: "大吉之格，谋事百发百中，机缘速至" },
  "庚丙": { name: "白入荧", kind: "凶", verse: "六庚加丙白入荧", note: "白入荧兮贼即来——防外敌来犯、破财小人" },
  "丙庚": { name: "荧入白", kind: "凶", verse: "六丙加庚荧入白", note: "荧入白兮贼须灭——荧惑入太白，事有反复终可制" },
  "庚癸": { name: "大格", kind: "凶", verse: "庚加癸兮为大格", note: "格则不通，出行车马阻隔，谋事不通" },
  "庚己": { name: "刑格", kind: "凶", verse: "加己为刑最不宜", note: "刑格主官非刑罚、内部纷争" },
  "庚壬": { name: "上格", kind: "凶", verse: "加壬之时为上格", note: "上格不利远行谋事，宜守" },
  "癸丁": { name: "蛇夭矫", kind: "凶", verse: "六癸加丁蛇夭矫", note: "腾蛇夭矫，主虚惊怪异、文书官司" },
  "丁癸": { name: "雀投江", kind: "凶", verse: "六丁加癸雀投江", note: "朱雀投江，文书口舌沉没，音信阻隔" },
  "乙辛": { name: "龙逃走", kind: "凶", verse: "六乙加辛龙逃走", note: "青龙逃走，主逃亡走失、事体离散" },
  "辛乙": { name: "虎猖狂", kind: "凶", verse: "六辛加乙虎猖狂", note: "白虎猖狂，主凶伤残害、家宅不宁" },
};

/** 三遁吉格：门 + 天盘干 + 地盘干（人遁另需太阴神） */
function detectSanDun(p: QiMenPalaceInput): string | null {
  if (p.gate === "生" && p.tianGan === "丙" && p.diGan === "丁") {
    return `${p.palace}宫天遁（生门六丙合六丁，此为天遁自分明）——藏形遁迹、上策之位`;
  }
  if (p.gate === "开" && p.tianGan === "乙" && p.diGan === "己") {
    return `${p.palace}宫地遁（开门六乙合六己）——地利之位，利安营守成`;
  }
  if (p.gate === "休" && p.tianGan === "丁" && p.god === "太阴") {
    return `${p.palace}宫人遁（休门六丁共太阴）——人和之位，利隐秘谋事`;
  }
  return null;
}

/** 九星旺衰（《烟波钓叟歌》：与我同行即为相，我生之月诚为旺，废于父母休于财，囚于鬼兮真不妄） */
export const STAR_WX: Record<string, string> = {
  天蓬: "水", 天芮: "土", 天冲: "木", 天辅: "木",
  天禽: "土", 天心: "金", 天柱: "金", 天任: "土", 天英: "火",
};
const ZHI_WX: Record<string, string> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

export function starXingWang(star: string, monthZhi: string): { state: string; note: string } | null {
  const starWx = STAR_WX[star];
  const monthWx = ZHI_WX[monthZhi];
  if (!starWx || !monthWx) return null;
  if (starWx === monthWx) return { state: "相", note: `${star}（${starWx}）与月令同行，旺相有力` };
  if (SHENG[starWx] === monthWx) return { state: "旺", note: `${star}生月令，我生之月诚为旺` };
  if (SHENG[monthWx] === starWx) return { state: "废", note: `月令生${star}，废于父母，力量泄尽` };
  if (KE[starWx] === monthWx) return { state: "休", note: `${star}克月令，休于财，用力而少功` };
  return { state: "囚", note: `月令克${star}，囚于鬼，受制最凶` };
}

/** 门迫与门制：门克宫为迫（凶），宫克门为制 */
const GATE_WX: Record<string, string> = {
  开: "金", 休: "水", 生: "土", 伤: "木", 杜: "木", 景: "火", 死: "土", 惊: "金",
};
const PALACE_WX: Record<string, string> = {
  坎: "水", 艮: "土", 震: "木", 巽: "木", 中: "土", 乾: "金", 兑: "金", 离: "火", 坤: "土",
};
export function menPoCheck(p: QiMenPalaceInput): string | null {
  if (!p.gate) return null;
  const gateWx = GATE_WX[p.gate];
  const palaceWx = PALACE_WX[p.palace];
  if (!gateWx || !palaceWx) return null;
  if (KE[gateWx] === palaceWx) return `${p.palace}宫${p.gate}门：门克宫为「迫」——门制其宫是迫雄，吉门迫则吉事减半，凶门迫则凶事更凶`;
  if (KE[palaceWx] === gateWx) return `${p.palace}宫${p.gate}门：宫克门为「制」——宫制其门不为迫，凶门受制反吉`;
  return null;
}

export interface QiMenGeJuResult {
  /** 十干克应格局清单（按宫） */
  geJuList: QiMenGeJuItem[];
  /** 三遁吉格 */
  sanDun: string[];
  /** 门迫/门制明细 */
  menPoDetail: string[];
  /** 九星旺衰（按宫） */
  xingWang: string[];
  /** 伏干/飞干格说明 */
  ganGe: string[];
  /** 汇总一句话 */
  summary: string;
}

export function analyzeQiMenGeJu(
  palaces: QiMenPalaceInput[],
  opts: { timeGan?: string; monthZhi?: string }
): QiMenGeJuResult {
  const geJuList: QiMenGeJuItem[] = [];
  const sanDun: string[] = [];
  const menPoDetail: string[] = [];
  const xingWang: string[] = [];
  const ganGe: string[] = [];

  for (const p of palaces) {
    const key = `${p.tianGan}${p.diGan}`;
    const hit = SHI_GAN_KE_YING[key];
    if (hit) {
      geJuList.push({ palace: p.palace, tianGan: p.tianGan, diGan: p.diGan, ...hit });
    }
    // 伏干/飞干格（庚 vs 时干）
    if (opts.timeGan) {
      if (p.tianGan === "庚" && p.diGan === opts.timeGan) {
        ganGe.push(`${p.palace}宫天盘庚加时干${opts.timeGan}，伏干格——「庚加日干为伏干」，事体暗伏阻滞`);
      } else if (p.tianGan === opts.timeGan && p.diGan === "庚") {
        ganGe.push(`${p.palace}宫时干${opts.timeGan}加地盘庚，飞干格——「日干加庚飞干格」，事体外露生变`);
      }
    }
    const dun = detectSanDun(p);
    if (dun) sanDun.push(dun);
    const po = menPoCheck(p);
    if (po) menPoDetail.push(po);
    if (opts.monthZhi && p.star) {
      const xw = starXingWang(p.star, opts.monthZhi);
      if (xw) xingWang.push(`${p.palace}宫${p.star}：${xw.state}——${xw.note}`);
    }
  }

  const jiList = geJuList.filter((g) => g.kind === "吉").map((g) => g.name);
  const xiongList = geJuList.filter((g) => g.kind === "凶").map((g) => g.name);
  const summary =
    geJuList.length || ganGe.length
      ? `格局：${[...jiList, ...xiongList, ...ganGe.map(() => "干格")].join("、") || "无成格"}。` +
        (jiList.length ? `吉格${jiList.join("、")}可用为进取之机；` : "") +
        (xiongList.length ? `凶格${xiongList.join("、")}宜避其方位时辰。` : "") +
        (sanDun.length ? `三遁得${sanDun.length}处，遁藏大吉。` : "")
      : "本局无十干克应成格，以门星神旺衰与门迫为准。";

  return { geJuList, sanDun, menPoDetail, xingWang, ganGe, summary };
}
