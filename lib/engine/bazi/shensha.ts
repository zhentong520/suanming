/** 八字常用神煞（日/年干支规则） */

export interface ShenShaItem {
  name: string;
  pillar: string;
  note: string;
}

const TIAN_YI: Record<string, string[]> = {
  甲: ["丑", "未"],
  戊: ["丑", "未"],
  庚: ["丑", "未"],
  乙: ["子", "申"],
  己: ["子", "申"],
  丙: ["亥", "酉"],
  丁: ["亥", "酉"],
  壬: ["卯", "巳"],
  癸: ["卯", "巳"],
  辛: ["寅", "午"],
};

const WEN_CHANG: Record<string, string> = {
  甲: "巳",
  乙: "午",
  丙: "申",
  丁: "酉",
  戊: "申",
  己: "酉",
  庚: "亥",
  辛: "子",
  壬: "寅",
  癸: "卯",
};

const YI_MA: Record<string, string> = {
  申: "寅",
  子: "寅",
  辰: "寅",
  寅: "申",
  午: "申",
  戌: "申",
  亥: "巳",
  卯: "巳",
  未: "巳",
  巳: "亥",
  酉: "亥",
  丑: "亥",
};

const TAO_HUA: Record<string, string> = {
  申: "酉",
  子: "酉",
  辰: "酉",
  寅: "卯",
  午: "卯",
  戌: "卯",
  亥: "子",
  卯: "子",
  未: "子",
  巳: "午",
  酉: "午",
  丑: "午",
};

const YANG_REN: Record<string, string> = {
  甲: "卯",
  乙: "寅",
  丙: "午",
  丁: "巳",
  戊: "午",
  己: "巳",
  庚: "酉",
  辛: "申",
  壬: "子",
  癸: "亥",
};

const KONG_WANG: Record<string, [string, string]> = {
  甲子: ["戌", "亥"],
  甲戌: ["申", "酉"],
  甲申: ["午", "未"],
  甲午: ["辰", "巳"],
  甲辰: ["寅", "卯"],
  甲寅: ["子", "丑"],
};

function xunShou(dayGz: string): string {
  const gan = "甲乙丙丁戊己庚辛壬癸";
  const zhi = "子丑寅卯辰巳午未申酉戌亥";
  const g = gan.indexOf(dayGz[0] ?? "");
  const z = zhi.indexOf(dayGz[1] ?? "");
  if (g < 0 || z < 0) return "甲子";
  const offset = (z - g + 12) % 12;
  const xunZhi = zhi[(offset + 12) % 12];
  return `甲${xunZhi}`;
}

export function computeShenSha(input: {
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  timeGanZhi?: string;
}): ShenShaItem[] {
  const items: ShenShaItem[] = [];
  const dayGan = input.dayGanZhi[0] ?? "";
  const dayZhi = input.dayGanZhi[1] ?? "";
  const yearZhi = input.yearGanZhi[1] ?? "";
  const pillars: Array<{ name: string; gz: string }> = [
    { name: "年", gz: input.yearGanZhi },
    { name: "月", gz: input.monthGanZhi },
    { name: "日", gz: input.dayGanZhi },
  ];
  if (input.timeGanZhi && input.timeGanZhi.length >= 2) {
    pillars.push({ name: "时", gz: input.timeGanZhi });
  }

  const tianYi = TIAN_YI[dayGan] ?? [];
  for (const p of pillars) {
    if (tianYi.includes(p.gz[1] ?? "")) {
      items.push({ name: "天乙贵人", pillar: `${p.name}支${p.gz[1]}`, note: "逢贵人提携，危难易解。" });
    }
  }

  const wen = WEN_CHANG[dayGan];
  for (const p of pillars) {
    if (wen && p.gz[1] === wen) {
      items.push({ name: "文昌", pillar: `${p.name}支${p.gz[1]}`, note: "利学业文书考试，聪慧好学。" });
    }
  }

  const ma = YI_MA[dayZhi] ?? YI_MA[yearZhi];
  for (const p of pillars) {
    if (ma && p.gz[1] === ma) {
      items.push({ name: "驿马", pillar: `${p.name}支${p.gz[1]}`, note: "多动多迁，利外出奔波与变动。" });
    }
  }

  const hua = TAO_HUA[dayZhi] ?? TAO_HUA[yearZhi];
  for (const p of pillars) {
    if (hua && p.gz[1] === hua) {
      items.push({ name: "桃花", pillar: `${p.name}支${p.gz[1]}`, note: "异性缘与人气，宜把握分寸。" });
    }
  }

  const ren = YANG_REN[dayGan];
  for (const p of pillars) {
    if (ren && p.gz[1] === ren) {
      items.push({ name: "羊刃", pillar: `${p.name}支${p.gz[1]}`, note: "锋芒刚烈，宜控脾气，可成可败。" });
    }
  }

  const xun = xunShou(input.dayGanZhi);
  const kw = KONG_WANG[xun];
  if (kw) {
    for (const p of pillars) {
      if (kw.includes(p.gz[1] ?? "")) {
        items.push({ name: "空亡", pillar: `${p.name}支${p.gz[1]}`, note: "该柱力量虚浮，事易落空，宜补实。" });
      }
    }
  }

  // 天德：寅→丁，卯→申，辰→壬，巳→辛，午→亥，未→甲，申→癸，酉→寅，戌→丙，亥→乙，子→巳，丑→庚
  const TIAN_DE: Record<string, string> = {
    寅: "丁",
    卯: "申",
    辰: "壬",
    巳: "辛",
    午: "亥",
    未: "甲",
    申: "癸",
    酉: "寅",
    戌: "丙",
    亥: "乙",
    子: "巳",
    丑: "庚",
  };
  const monthZhi = input.monthGanZhi[1] ?? "";
  const tianDe = TIAN_DE[monthZhi];
  if (tianDe) {
    for (const p of pillars) {
      if (p.gz.includes(tianDe)) {
        items.push({ name: "天德", pillar: `${p.name}柱见${tianDe}`, note: "逢凶化吉，贵人暗助。" });
      }
    }
  }

  // 月德：寅午戌→丙，申子辰→壬，亥卯未→甲，巳酉丑→庚
  const YUE_DE: Record<string, string> = {
    寅: "丙",
    午: "丙",
    戌: "丙",
    申: "壬",
    子: "壬",
    辰: "壬",
    亥: "甲",
    卯: "甲",
    未: "甲",
    巳: "庚",
    酉: "庚",
    丑: "庚",
  };
  const yueDe = YUE_DE[monthZhi];
  if (yueDe) {
    for (const p of pillars) {
      if (p.gz[0] === yueDe) {
        items.push({ name: "月德", pillar: `${p.name}干${yueDe}`, note: "德性福荫，利于名声与和解。" });
      }
    }
  }

  // 华盖：寅午戌→戌，亥卯未→未，申子辰→辰，巳酉丑→丑
  const HUA_GAI: Record<string, string> = {
    寅: "戌",
    午: "戌",
    戌: "戌",
    亥: "未",
    卯: "未",
    未: "未",
    申: "辰",
    子: "辰",
    辰: "辰",
    巳: "丑",
    酉: "丑",
    丑: "丑",
  };
  const huaGai = HUA_GAI[dayZhi] ?? HUA_GAI[yearZhi];
  for (const p of pillars) {
    if (huaGai && p.gz[1] === huaGai) {
      items.push({ name: "华盖", pillar: `${p.name}支${p.gz[1]}`, note: "艺术宗教缘，宜专精一门。" });
    }
  }

  items.push(...computeExtraShenSha(input, pillars, dayGan, dayZhi, yearZhi));

  return items;
}

/* ============================================================
   神煞扩容（对标开源 bazi 库与《三命通会》通行起法）：
   将星/劫煞/灾煞/月煞/亡神（三合局组）、太极贵人/禄神/金舆/
   国印/福星贵人/红艳/流霞（年日干组）、天医（月支）、
   三奇贵人（干序）、魁罡/孤鸾煞/阴阳差错/四废/天赦（日柱组）、
   丧门/吊客/披麻（年支组）
   ============================================================ */

const SAN_HE: Record<string, string> = {
  申: "水", 子: "水", 辰: "水",
  寅: "火", 午: "火", 戌: "火",
  巳: "金", 酉: "金", 丑: "金",
  亥: "木", 卯: "木", 未: "木",
};

const SAN_HE_SEAT: Record<string, { jiang: string; jie: string; zai: string; yue: string; wang: string }> = {
  水: { jiang: "子", jie: "巳", zai: "午", yue: "丑", wang: "亥" },
  火: { jiang: "午", jie: "亥", zai: "子", yue: "戌", wang: "申" },
  金: { jiang: "酉", jie: "寅", zai: "卯", yue: "未", wang: "巳" },
  木: { jiang: "卯", jie: "申", zai: "酉", yue: "辰", wang: "寅" },
};

const TAI_JI: Record<string, string[]> = {
  甲: ["子", "午"], 乙: ["子", "午"], 丙: ["酉", "卯"], 丁: ["酉", "卯"],
  戊: ["辰", "戌", "丑", "未"], 己: ["辰", "戌", "丑", "未"],
  庚: ["寅", "亥"], 辛: ["寅", "亥"], 壬: ["巳", "申"], 癸: ["巳", "申"],
};

const LU_SHEN: Record<string, string> = {
  甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳",
  己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
};

const JIN_YU: Record<string, string> = {
  甲: "辰", 乙: "巳", 丙: "未", 丁: "申", 戊: "未",
  己: "申", 庚: "戌", 辛: "亥", 壬: "丑", 癸: "寅",
};

const GUO_YIN: Record<string, string> = {
  甲: "戌", 乙: "亥", 丙: "丑", 丁: "寅", 戊: "卯",
  己: "辰", 庚: "巳", 辛: "午", 壬: "未", 癸: "申",
};

const FUXING_GUI: Record<string, string> = {
  甲: "寅", 丙: "寅", 乙: "丑", 癸: "丑", 戊: "申", 己: "未",
  丁: "亥", 庚: "午", 辛: "巳", 壬: "辰",
};

const HONG_YAN: Record<string, string> = {
  甲: "午", 乙: "申", 丙: "寅", 丁: "未", 戊: "辰",
  己: "辰", 庚: "戌", 辛: "酉", 壬: "子", 癸: "申",
};

const LIU_XIA: Record<string, string> = {
  甲: "酉", 乙: "戌", 丙: "未", 丁: "申", 戊: "巳",
  己: "午", 庚: "辰", 辛: "卯", 壬: "亥", 癸: "寅",
};

const TIAN_YI_DOCTOR = (monthZhi: string): string => {
  const zhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const i = zhi.indexOf(monthZhi);
  return i >= 0 ? zhi[(i + 1) % 12] : "";
};

const KUI_GANG = ["庚辰", "庚戌", "壬辰", "戊戌"];
const GU_LUAN = ["乙巳", "丁巳", "辛亥", "戊申", "甲寅", "戊午", "壬子", "丙午"];
const YIN_YANG_CHA_CUO = [
  "丙子", "丙午", "丁丑", "丁未", "戊寅", "戊申",
  "辛卯", "辛酉", "壬辰", "壬戌", "癸巳", "癸亥",
];
const TIAN_SHE: Record<string, string[]> = {
  春: ["戊寅"], 夏: ["甲午"], 秋: ["戊申"], 冬: ["甲子"],
};
const SI_FEI: Record<string, string[]> = {
  春: ["庚申", "辛酉"], 夏: ["壬子", "癸亥"], 秋: ["甲寅", "乙卯"], 冬: ["丙午", "丁巳"],
};
const SEASON: Record<string, "春" | "夏" | "秋" | "冬"> = {
  寅: "春", 卯: "春", 辰: "春",
  巳: "夏", 午: "夏", 未: "夏",
  申: "秋", 酉: "秋", 戌: "秋",
  亥: "冬", 子: "冬", 丑: "冬",
};

function computeExtraShenSha(
  input: { yearGanZhi: string; monthGanZhi: string; dayGanZhi: string; timeGanZhi?: string },
  pillars: Array<{ name: string; gz: string }>,
  dayGan: string,
  dayZhi: string,
  yearZhi: string,
): ShenShaItem[] {
  const out: ShenShaItem[] = [];
  const monthZhi = input.monthGanZhi[1] ?? "";
  const dayGz = input.dayGanZhi;
  const yearGan = input.yearGanZhi[0] ?? "";

  // 三合局组（年支或日支定局，四柱地支见者为是）
  const heKey = SAN_HE[dayZhi] ?? SAN_HE[yearZhi];
  const seat = heKey ? SAN_HE_SEAT[heKey] : undefined;
  if (seat) {
    const defs: Array<[string, string, string]> = [
      ["将星", seat.jiang, "掌权柄，坐镇中军，领导统御之星。"],
      ["劫煞", seat.jie, "劫夺之神，防破财被劫，宜稳健行事。"],
      ["灾煞", seat.zai, "灾伤之神，宜注意安全与疾厄。"],
      ["月煞", seat.yue, "主骨肉刑伤、六亲缘薄处，宜多修和气。"],
      ["亡神", seat.wang, "心机深沉、谋算之星，防机关算尽。"],
    ];
    for (const [name, zhi, note] of defs) {
      for (const p of pillars) {
        if (p.gz[1] === zhi) {
          out.push({ name, pillar: `${p.name}支${p.gz[1]}`, note });
        }
      }
    }
  }

  // 年干/日干组
  const tj = TAI_JI[dayGan] ?? TAI_JI[yearGan] ?? [];
  for (const p of pillars) {
    if (tj.includes(p.gz[1] ?? "")) {
      out.push({ name: "太极贵人", pillar: `${p.name}支${p.gz[1]}`, note: "喜玄学宗教、聪明好学，得贵人奇缘。" });
    }
  }

  const ganZhiDefs: Array<[string, Record<string, string>, string]> = [
    ["禄神", LU_SHEN, "临官之禄，主食禄丰足、事业根基。"],
    ["金舆", JIN_YU, "富贵之车，主得荫庇庇护，安居乐业。"],
    ["国印", GUO_YIN, "掌印之星，主诚信守规，利公职文书。"],
    ["福星贵人", FUXING_GUI, "一生福禄悠闲，逢凶有救。"],
    ["红艳", HONG_YAN, "浪漫多情、人缘魅力之星，宜守礼有度。"],
    ["流霞", LIU_XIA, "主产厄血光之象，女命尤宜注意。"],
  ];
  for (const [name, table, note] of ganZhiDefs) {
    const target = table[dayGan] ?? table[yearGan];
    for (const p of pillars) {
      if (target && p.gz[1] === target) {
        out.push({ name, pillar: `${p.name}支${p.gz[1]}`, note });
      }
    }
  }

  // 天医：月支前一位
  const tianYiZhi = TIAN_YI_DOCTOR(monthZhi);
  for (const p of pillars) {
    if (tianYiZhi && p.gz[1] === tianYiZhi) {
      out.push({ name: "天医", pillar: `${p.name}支${p.gz[1]}`, note: "医者之星，利医药养生，健康缘厚。" });
    }
  }

  // 三奇贵人：年月日 或 月日时 干顺排为 甲戊庚 / 乙丙丁 / 壬癸辛
  const allGans = pillars.map((p) => p.gz[0] ?? "");
  const triples = [["甲", "戊", "庚"], ["乙", "丙", "丁"], ["壬", "癸", "辛"]];
  for (let i = 0; i + 2 < allGans.length; i++) {
    const seg = [allGans[i], allGans[i + 1], allGans[i + 2]];
    if (triples.some((t) => t[0] === seg[0] && t[1] === seg[1] && t[2] === seg[2])) {
      out.push({ name: "三奇贵人", pillar: `${pillars[i].name}${pillars[i + 1].name}${pillars[i + 2].name}干`, note: "襟怀卓越博学多能，奇遇非常之人。" });
      break;
    }
  }

  // 日柱组
  if (KUI_GANG.includes(dayGz)) {
    out.push({ name: "魁罡", pillar: "日柱", note: "性情刚烈果断，掌权立威，女貌英气。" });
  }
  if (GU_LUAN.includes(dayGz)) {
    out.push({ name: "孤鸾煞", pillar: "日柱", note: "婚姻多波折之象，宜晚婚修缘。" });
  }
  if (YIN_YANG_CHA_CUO.includes(dayGz)) {
    out.push({ name: "阴阳差错", pillar: "日柱", note: "婚缘易有阴差阳错之事，宜坦诚沟通。" });
  }
  const season = SEASON[monthZhi];
  if (season && TIAN_SHE[season].includes(dayGz)) {
    out.push({ name: "天赦", pillar: "日柱", note: "逢凶化吉之贵日，一生多解难之机。" });
  }
  if (season && SI_FEI[season].includes(dayGz)) {
    out.push({ name: "四废", pillar: "日柱", note: "干支俱废于季节，做事易有始无终，宜持恒。" });
  }

  // 年支组：丧门 / 吊客 / 披麻
  const zhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const yi = zhi.indexOf(yearZhi);
  if (yi >= 0) {
    const sangmen = zhi[(yi + 2) % 12];
    const diaoke = zhi[(yi - 2 + 12) % 12];
    const pima = zhi[(yi - 3 + 12) % 12];
    for (const p of pillars) {
      if (p.gz[1] === sangmen) {
        out.push({ name: "丧门", pillar: `${p.name}支${p.gz[1]}`, note: "孝丧之象，逢丧事宜谨慎，忌探病问丧。" });
      }
      if (p.gz[1] === diaoke) {
        out.push({ name: "吊客", pillar: `${p.name}支${p.gz[1]}`, note: "吊丧之星，主忧戚之事，宜多关怀亲人健康。" });
      }
      if (p.gz[1] === pima) {
        out.push({ name: "披麻", pillar: `${p.name}支${p.gz[1]}`, note: "主孝服之象，宜留意长辈健康。" });
      }
    }
  }

  return out;
}

export function formatShenShaSummary(items: ShenShaItem[]): string {
  if (!items.length) return "未见常见神煞落柱，以五行十神为主断。";
  return items.map((i) => `${i.name}（${i.pillar}）：${i.note}`).join("\n");
}
