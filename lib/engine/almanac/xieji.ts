/**
 * 《协纪辨方书》（清·允禄等奉敕修，共录 432 神煞）择日打分引擎 v1。
 *
 * 总纲（卷十原文，本引擎的取舍法则）：
 *   「凡吉足胜凶，从宜不从忌；
 *     凡吉凶相抵，德喜之事仍忌；
 *     吉不足胜凶，则从忌不从宜。」
 * 权变：大煞避之，中煞制之或化之，小煞取吉星照临即可。
 *
 * v1 实现的确定性查表（均为月支/日干支/农历日可推的硬规则）：
 *   凶煞：月破（日支冲月支）、月厌、四废、往亡、归忌（按用事）、月忌日（初五十四廿三）、
 *         四离四绝（二分二至/四立之前一日）、建除十二神之破危闭；
 *   吉神：月德/月德合、天德/天德合、天赦（春戊寅夏甲午秋戊申冬甲子）、建除吉星（成开定收满）。
 *
 * 仅供文化参考。
 */

import { Solar } from "lunar-typescript";

const ZHIS = "子丑寅卯辰巳午未申酉戌亥";
const zhiIdx = (z: string) => ZHIS.indexOf(z);

export interface XieJiSha {
  name: string;
  kind: "吉" | "凶";
  weight: number;
  /** 该神煞所忌/所宜的用事范围，"*"=全部 */
  scope: string;
  note: string;
}

export interface XieJiActivity {
  activity: string;
  level: "宜" | "平" | "忌";
  note: string;
}

export interface XieJiResult {
  date: string;
  dayGZ: string;
  monthZhi: string;
  lunarDay: number;
  jianChu: { name: string; yi: string; ji: string; weight: number };
  jiShen: XieJiSha[];
  xiongSha: XieJiSha[];
  /** 吉分 / 凶分（按用事无关的全局项） */
  score: { ji: number; xiong: number };
  /** 总纲三档裁定（不分子项）：宜=从宜不从忌；平=吉凶相抵；忌=从忌不从宜 */
  verdict: { level: "宜" | "平" | "忌"; basis: string };
  perActivity: XieJiActivity[];
}

const ACTIVITIES = ["嫁娶", "开市", "出行", "移徙", "修造", "安葬", "祭祀", "求医"];

/** 月德：三合月局之阳干 */
const YUE_DE: Record<string, string> = {
  寅: "丙", 午: "丙", 戌: "丙",
  申: "壬", 子: "壬", 辰: "壬",
  亥: "甲", 卯: "甲", 未: "甲",
  巳: "庚", 酉: "庚", 丑: "庚",
};
const GAN_HE: Record<string, string> = {
  甲: "己", 己: "甲", 乙: "庚", 庚: "乙", 丙: "辛",
  辛: "丙", 丁: "壬", 壬: "丁", 戊: "癸", 癸: "戊",
};

/** 天德：正月丁、二月申、三月壬、四月辛、五月亥、六月甲、七月癸、八月寅、九月丙、十月乙、十一月巳、十二月庚（按节气月支） */
const TIAN_DE: Record<string, string> = {
  寅: "丁", 卯: "申", 辰: "壬", 巳: "辛",
  午: "亥", 未: "甲", 申: "癸", 酉: "寅",
  戌: "丙", 亥: "乙", 子: "巳", 丑: "庚",
};

/** 月厌（忌嫁娶出行移徙）：寅月起戌逆行 */
const YUE_YAN: Record<string, string> = {
  寅: "戌", 卯: "酉", 辰: "申", 巳: "未",
  午: "午", 未: "巳", 申: "辰", 酉: "卯",
  戌: "寅", 亥: "丑", 子: "子", 丑: "亥",
};

/** 四废日（按季节）：百事不宜 */
const SI_FEI: Record<string, string[]> = {
  春: ["庚申", "辛酉"],
  夏: ["壬子", "癸亥"],
  秋: ["甲寅", "乙卯"],
  冬: ["丙午", "丁巳"],
};

/** 往亡（忌上任出行远行嫁娶）：正月寅起 */
const WANG_WANG: Record<string, string> = {
  寅: "寅", 卯: "巳", 辰: "申", 巳: "亥",
  午: "卯", 未: "午", 申: "酉", 酉: "子",
  戌: "辰", 亥: "未", 子: "戌", 丑: "丑",
};

/** 归忌（忌远行归家移徙娶妇）：孟月丑、仲月寅、季月子（按农历月） */
function guiJiZhi(lunarMonth: number): string {
  const m = ((lunarMonth - 1) % 3) + 1; // 孟=1 仲=2 季=0
  return m === 1 ? "丑" : m === 2 ? "寅" : "子";
}

/** 建除十二神：月支起建，日支顺排 */
const JIAN_CHU: Record<string, { yi: string; ji: string; weight: number }> = {
  建: { yi: "出行、上任、谒贵", ji: "动土开仓", weight: 0 },
  除: { yi: "除旧布新、疗病祭祀", ji: "嫁娶", weight: 1 },
  满: { yi: "祈福、纳财", ji: "安葬", weight: 1 },
  平: { yi: "修整、平治道涂", ji: "词讼", weight: 0 },
  定: { yi: "冠带、安床、签约", ji: "词讼出行", weight: 1 },
  执: { yi: "捕捉、修造", ji: "移徙", weight: 0 },
  破: { yi: "破屋坏垣", ji: "诸事不宜", weight: -3 },
  危: { yi: "安床", ji: "登高冒险", weight: -1 },
  成: { yi: "成就诸事、嫁娶开市", ji: "词讼", weight: 2 },
  收: { yi: "纳财、收纳", ji: "开市放债", weight: 1 },
  开: { yi: "开市、开业、求医", ji: "安葬", weight: 1 },
  闭: { yi: "埋葬、筑堤", ji: "开市出行", weight: -1 },
};

/** 用事 → 相关凶煞的适用性（scope 内才计分） */
const ACTIVITY_SCOPE: Record<string, string[]> = {
  嫁娶: ["往亡", "归忌", "月厌"],
  出行: ["往亡", "归忌"],
  移徙: ["往亡", "归忌", "月厌"],
  修造: [],
  安葬: [],
  开市: [],
  祭祀: [],
  求医: [],
};

const ZONG_GANG = "凡吉足胜凶，从宜不从忌；凡吉凶相抵，德喜之事仍忌；吉不足胜凶，则从忌不从宜（《协纪辨方书·卷十》）";

function seasonOf(monthZhi: string): "春" | "夏" | "秋" | "冬" {
  if (["寅", "卯", "辰"].includes(monthZhi)) return "春";
  if (["巳", "午", "未"].includes(monthZhi)) return "夏";
  if (["申", "酉", "戌"].includes(monthZhi)) return "秋";
  return "冬";
}

/** 明日是否为二分二至（四离）或四立（四绝） */
function isSiLiSiJue(date: Date): "四离" | "四绝" | null {
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tmSolar = Solar.fromDate(tomorrow);
  const lunar = tmSolar.getLunar();
  const table = lunar.getJieQiTable();
  const ymd = tmSolar.toYmd();
  for (const [name, solar] of Object.entries(table)) {
    if (!["冬至", "夏至", "春分", "秋分", "立春", "立夏", "立秋", "立冬"].includes(name)) continue;
    if (solar.toYmd() === ymd) {
      return name.startsWith("立") ? "四绝" : "四离";
    }
  }
  return null;
}

export function computeXieJi(date: Date): XieJiResult {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const dayGZ = ec.getDay();
  const dayGan = ec.getDayGan();
  const dayZhi = ec.getDayZhi();
  const monthZhi = ec.getMonthZhi();
  const lunarDay = lunar.getDay();
  const lunarMonth = Math.abs(lunar.getMonth());
  const season = seasonOf(monthZhi);

  const jiShen: XieJiSha[] = [];
  const xiongSha: XieJiSha[] = [];

  // ---- 建除十二神 ----
  const offset = ((zhiIdx(dayZhi) - zhiIdx(monthZhi)) % 12 + 12) % 12;
  const jianChuName = Object.keys(JIAN_CHU)[offset];
  const jianChu = JIAN_CHU[jianChuName];
  if (jianChu.weight > 0) {
    jiShen.push({ name: `建除·${jianChuName}`, kind: "吉", weight: jianChu.weight, scope: "*", note: `宜${jianChu.yi}` });
  } else if (jianChu.weight < 0) {
    xiongSha.push({ name: `建除·${jianChuName}`, kind: "凶", weight: jianChu.weight, scope: "*", note: `忌${jianChu.ji}` });
  }

  // ---- 月德 / 月德合 ----
  const yueDe = YUE_DE[monthZhi];
  if (dayGan === yueDe) {
    jiShen.push({ name: "月德", kind: "吉", weight: 3, scope: "*", note: `月德临日（${monthZhi}月月德在${yueDe}），能解诸凶` });
  } else if (dayGan === GAN_HE[yueDe]) {
    jiShen.push({ name: "月德合", kind: "吉", weight: 2, scope: "*", note: `月德合临日，吉力稍逊月德` });
  }

  // ---- 天德 / 天德合 ----
  const tianDe = TIAN_DE[monthZhi];
  if ("甲乙丙丁庚壬癸".includes(tianDe)) {
    if (dayGan === tianDe) {
      jiShen.push({ name: "天德", kind: "吉", weight: 3, scope: "*", note: "天德临日，众煞自伏" });
    } else if (dayGan === GAN_HE[tianDe]) {
      jiShen.push({ name: "天德合", kind: "吉", weight: 2, scope: "*", note: "天德合临日" });
    }
  }

  // ---- 天赦 ----
  const tianShe: Record<string, string> = { 春: "戊寅", 夏: "甲午", 秋: "戊申", 冬: "甲子" };
  if (dayGZ === tianShe[season]) {
    jiShen.push({ name: "天赦", kind: "吉", weight: 4, scope: "*", note: `${season}季天赦日（${tianShe[season]}），百煞潜藏，最吉` });
  }

  // ---- 月破 ----
  const chongMonthZhi = ZHIS[(zhiIdx(monthZhi) + 6) % 12];
  if (dayZhi === chongMonthZhi) {
    xiongSha.push({ name: "月破", kind: "凶", weight: 5, scope: "*", note: `日支${dayZhi}冲月支${monthZhi}，月破大凶，诸事不宜` });
  }

  // ---- 月厌 ----
  if (dayZhi === YUE_YAN[monthZhi]) {
    xiongSha.push({ name: "月厌", kind: "凶", weight: 3, scope: "*", note: "月厌临日，忌嫁娶出行移徙" });
  }

  // ---- 四废 ----
  if ((SI_FEI[season] ?? []).includes(dayGZ)) {
    xiongSha.push({ name: "四废", kind: "凶", weight: 5, scope: "*", note: `${season}季四废日（${dayGZ}），干支俱绝，百事不宜` });
  }

  // ---- 往亡（用事相关） ----
  if (dayZhi === WANG_WANG[monthZhi]) {
    xiongSha.push({ name: "往亡", kind: "凶", weight: 2, scope: "出行/移徙/嫁娶/上任", note: "往亡临日，忌出行赴任远行嫁娶" });
  }

  // ---- 归忌（按农历月） ----
  if (dayZhi === guiJiZhi(lunarMonth)) {
    xiongSha.push({ name: "归忌", kind: "凶", weight: 2, scope: "出行/移徙/嫁娶", note: "归忌临日，忌远行归家移徙娶妇" });
  }

  // ---- 月忌日（初五、十四、廿三） ----
  if (lunarDay === 5 || lunarDay === 14 || lunarDay === 23) {
    xiongSha.push({ name: "月忌", kind: "凶", weight: 2, scope: "*", note: "月忌日（初五、十四、廿三），平民凡事避之" });
  }

  // ---- 四离四绝 ----
  const liJue = isSiLiSiJue(date);
  if (liJue) {
    xiongSha.push({ name: liJue, kind: "凶", weight: 4, scope: "*", note: `${liJue}日（节气前一 日），阴阳交替，忌出军征伐、出门远行` });
  }

  // ---- 打分与总纲裁定 ----
  const jiScore = jiShen.reduce((s, x) => s + x.weight, 0);
  const xiongScore = xiongSha.reduce((s, x) => s + Math.abs(x.weight), 0);
  const hardVeto = xiongSha.some((x) => ["月破", "四废", "四离", "四绝"].includes(x.name));

  let level: XieJiResult["verdict"]["level"];
  let basis: string;
  if (hardVeto || xiongScore > jiScore + 3) {
    level = "忌";
    basis = hardVeto
      ? `大凶之日（${xiongSha.map((x) => x.name).join("、")}），诸事皆忌——「凶又逢凶，遇德仍诸事皆忌」。${ZONG_GANG}`
      : `吉不足胜凶，从忌不从宜。${ZONG_GANG}`;
  } else if (xiongScore > 0 && Math.abs(jiScore - xiongScore) <= 3) {
    level = "平";
    basis = `吉凶相抵，德喜之事仍忌——遇德（${jiShen.map((x) => x.name).join("、") || "无"})则从宜，不遇则大事仍避。${ZONG_GANG}`;
  } else {
    level = "宜";
    basis = `吉足胜凶（吉${jiScore}分 vs 凶${xiongScore}分），从宜不从忌。${ZONG_GANG}`;
  }

  // ---- 分用事裁定 ----
  const perActivity: XieJiActivity[] = ACTIVITIES.map((activity) => {
    const scoped = xiongSha.filter((x) => {
      const scopes = ACTIVITY_SCOPE[activity] ?? [];
      return x.scope === "*" || scopes.some((s) => x.scope.includes(s));
    });
    const veto = scoped.some((x) => ["月破", "四废", "四离", "四绝"].includes(x.name));
    const scopedXiong = scoped.reduce((s, x) => s + Math.abs(x.weight), 0);
    const globalJi = jiShen.reduce((s, x) => s + x.weight, 0);
    if (veto || scopedXiong > globalJi + 3) {
      return { activity, level: "忌", note: `凶煞当值（${scoped.map((x) => x.name).join("、")}），${activity}从忌` };
    }
    if (scopedXiong > 0 && Math.abs(globalJi - scopedXiong) <= 3) {
      return { activity, level: "平", note: `${activity}吉凶相抵，遇德可从宜，大事仍慎` };
    }
    return { activity, level: "宜", note: `${activity}吉足胜凶，可行` };
  });

  return {
    date: solar.toYmd(),
    dayGZ,
    monthZhi,
    lunarDay,
    jianChu: { name: jianChuName, ...jianChu },
    jiShen,
    xiongSha,
    score: { ji: jiScore, xiong: xiongScore },
    verdict: { level, basis },
    perActivity,
  };
}
