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

  return items;
}

export function formatShenShaSummary(items: ShenShaItem[]): string {
  if (!items.length) return "未见常见神煞落柱，以五行十神为主断。";
  return items.map((i) => `${i.name}（${i.pillar}）：${i.note}`).join("\n");
}
