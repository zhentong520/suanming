import type { ReadingSection } from "./reading";

/** 按五行生成四域运势补充文案 */
export function lifeDomainsByElement(element: string): {
  personality: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
} {
  const map: Record<string, ReturnType<typeof lifeDomainsByElement>> = {
    金: {
      personality: "金性主刚毅果决，重原则与信义，外表冷静内心有坚持，有时显得直接甚至尖锐，宜修柔和之气。",
      career: "适合金融、法律、管理、技术精密类工作。宜在制度清晰的平台发展，以专业与执行力取胜，忌刚愎自用。",
      wealth: "正财为主，靠技能与信誉积累。理财宜稳健，忌高杠杆投机，中年后财源渐稳。",
      love: "感情上较理性，重品行与责任感，表达不够浪漫但用情专一，宜主动沟通心意。",
      health: "注意呼吸系统、皮肤、大肠，秋季防燥，忌过劳与吸烟。",
    },
    木: {
      personality: "木性主仁厚进取，善学习成长，性情温和有韧性，富有人情味，有时理想过多需落地。",
      career: "适合教育、文化、设计、医药、策划等成长型行业，宜深耕专长，借力人脉拓展。",
      wealth: "财运随能力与事业成长而升，宜投资自我，合作生财，忌分散精力。",
      love: "感情细腻重精神交流，包容度高，宜保持自我边界，桃花多来自学习工作场合。",
      health: "注意肝胆、筋骨、眼睛，春季养肝，忌熬夜与情绪郁结。",
    },
    水: {
      personality: "水性主聪慧变通，适应力强，思维活跃点子多，有时想法多变需防优柔寡断。",
      career: "适合贸易、传媒、咨询、IT、研究等流动性强的行业，宜发挥整合与沟通能力。",
      wealth: "财来财去较快，善于发现机会但宜见好就收，忌贪多务失与过重杠杆。",
      love: "浪漫多情异性缘佳，需防暧昧或情感摇摆，宜找能给予安全感的伴侣。",
      health: "注意肾系、泌尿、耳朵与腰，冬季防寒，忌过劳纵欲。",
    },
    火: {
      personality: "火性主热情外向，有感染力，做事雷厉风行，爱憎分明，需修耐心与分寸。",
      career: "适合销售、演艺、餐饮、互联网、公关等需表现力的行业，宜在一线或台前发挥。",
      wealth: "来财快花销亦大，宜强制储蓄，短期项目可获利，忌冲动跟风。",
      love: "爱得热烈追求浪漫，早期桃花旺，婚后宜细水长流，防脾气伤害感情。",
      health: "注意心脏、血压、眼睛，夏季防暑，忌暴怒熬夜。",
    },
    土: {
      personality: "土性主稳重厚道，诚实守信，做事踏实不喜浮夸，有时保守慢热但可靠耐久。",
      career: "适合地产、建筑、农业、顾问、人力、服务业，宜稳扎稳打以信誉取胜。",
      wealth: "偏守成积累，适合不动产与长期规划，不宜频繁换赛道，晚年多富足。",
      love: "感情务实重家庭稳定，表达含蓄但忠诚，宜主动表达避免对方觉冷淡。",
      health: "注意脾胃消化，忌暴饮暴食，宜规律饮食与适度运动。",
    },
  };
  return map[element] ?? map.土;
}

export function lifeDomainsBySignLevel(level: string): {
  career: string;
  wealth: string;
  love: string;
  health: string;
} {
  const good = level.includes("上") || level.includes("吉");
  const bad = level.includes("下") || level.includes("凶");
  if (good) {
    return {
      career: "大势向好，宜把握窗口期主动争取，可拓展人脉与技能，但忌骄傲懈怠。",
      wealth: "财源有增，宜量入为出并留储备，正财为主，偏财见好就收。",
      love: "感情和顺，宜真诚表达与共同规划，单身者可多社交。",
      health: "精力较足，仍宜规律作息，勿因应酬或兴奋过度耗损。",
    };
  }
  if (bad) {
    return {
      career: "多有阻滞，宜守成蛰伏，夯实基础，待时运转好再图进取。",
      wealth: "财运平平或有小耗，忌投机与高杠杆，保守理财为上。",
      love: "感情易有误会或冷淡，宜多沟通包容，不宜重大感情决定。",
      health: "身心宜调养，防旧疾反复，减少熬夜与情绪压力。",
    };
  }
  return {
    career: "平稳发展期，宜专注本职积累口碑，小步快跑，不宜孤注一掷。",
    wealth: "收支平衡，宜记账规划，小额尝试即可，忌冲动消费。",
    love: "感情需经营，平淡中见真章，宜制造小惊喜与深度交流。",
    health: "维持现有习惯，适度运动，定期体检。",
  };
}

export function questionContextBlock(question: string | undefined, moduleHint: string): ReadingSection | null {
  if (!question?.trim()) return null;
  return {
    title: "所问之事",
    content: `您的问题：${question}\n\n${moduleHint}`,
  };
}

export function synthesizeActionGuide(advice: string, caution?: string, extra?: string): ReadingSection {
  const parts = [advice, caution ? `⚠ 注意：${caution}` : "", extra ?? ""].filter(Boolean);
  return { title: "行动指南", content: parts.join("\n\n") };
}

export function palaceDeepReading(
  stars: Array<{ palace: string; star: string; brightness: string }>
): ReadingSection {
  const PALACE: Record<string, string> = {
    命宫: "人生总格局、性格基调、整体运势方向，为十二宫之首。",
    兄弟: "手足、同事、平辈关系，亦主合作竞争。",
    夫妻: "婚姻、恋爱、配偶特质与感情模式。",
    子女: "子女、下属、创造力与晚年福分。",
    财帛: "正财、理财能力、求财方式与金钱观。",
    疾厄: "体质、疾病倾向、心理承压能力。",
    迁移: "外出、旅行、环境变动与外地发展。",
    仆役: "朋友、合作伙伴、人际助力。",
    官禄: "事业、职位、社会成就与工作压力。",
    田宅: "家庭、房产、积蓄与居住质量。",
    福德: "精神享受、福报、兴趣与内心满足。",
    父母: "父母、长辈、上司与早年荫庇。",
  };
  const STAR: Record<string, string> = {
    紫微: "帝星，主尊贵、领导力，宜掌权或核心岗位。",
    天机: "智星，主谋略、变动，宜策划、教育、技术。",
    太阳: "贵星，主光明、名声，宜公职、传播、管理。",
    武曲: "财星，主刚毅、财富，宜金融、军警、实业。",
    天同: "福星，主温和、享受，宜服务、餐饮、协调。",
    廉贞: "囚星，主桃花、诉讼，宜艺术、外交，需修口德。",
    天府: "库星，主积蓄、稳定，宜财务、仓储、管理。",
    太阴: "富星，主柔静、田宅，宜夜间工作、女性相关产业。",
    贪狼: "桃花星，主欲望、才艺，宜娱乐、销售，需防沉迷。",
    巨门: "暗星，主口舌、研究，宜法律、学术，宜慎言。",
    天相: "印星，主辅佐、文书，宜幕僚、行政、中介。",
    天梁: "荫星，主清高、医药，宜顾问、医疗、宗教。",
    七杀: "将星，主魄力、竞争，宜军警、创业，需防冲动。",
    破军: "耗星，主破坏、开创，宜改革、艺术，先破后立。",
  };

  const lines = stars.map((s) => {
    const p = PALACE[s.palace] ?? "";
    const st = STAR[s.star] ?? `${s.star}主事，宜结合宫位体会。`;
    return `▎${s.palace} · ${s.star}（${s.brightness}）\n${p}\n${st}`;
  });

  return {
    title: "十二宫深度",
    content: lines.join("\n\n"),
  };
}

export function heluoGuaReading(gua: string, wuxing: string): {
  personality: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
} {
  const base = lifeDomainsByElement(wuxing);
  const guaHint: Record<string, string> = {
    乾: "乾卦主刚健进取，宜领导开创。",
    坤: "坤卦主柔顺承载，宜合作守成。",
    震: "震卦主行动启动，宜突破旧局。",
    巽: "巽卦主渗透沟通，宜柔性推进。",
    坎: "坎卦主险中求进，宜谨慎智慧。",
    离: "离卦主文明显达，宜展示传播。",
    艮: "艮卦主止静积累，宜沉淀学习。",
    兑: "兑卦主喜悦交流，宜社交口才。",
  };
  const hint = guaHint[gua] ?? "";
  return {
    personality: `${hint}${base.personality}`,
    career: base.career,
    wealth: base.wealth,
    love: base.love,
    health: base.health,
  };
}

export function qizhengStarReading(mainStar: string, house: string): {
  personality: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
} {
  const starMap: Record<string, Partial<ReturnType<typeof lifeDomainsByElement>>> = {
    日: {
      personality: "太阳主权威、光明、父亲缘，性格外向有主见，喜被认可。",
      career: "宜公职、管理、传播、能源等需光明显达的行业。",
      wealth: "财运与名声挂钩，宜正大光明求财，忌阴暗手段。",
    },
    月: {
      personality: "月亮主情感、直觉、母亲缘，内心细腻敏感，重安全感。",
      career: "宜餐饮、旅游、护理、心理、夜间相关产业。",
      love: "感情丰富，重陪伴与情绪价值，宜找稳定包容的伴侣。",
    },
    金: { wealth: "金主决断与财星，理财意识强，宜金融、珠宝、机械。", career: "适合需要精准判断的工作。" },
    木: { career: "木主生长，宜教育、出版、农林、拓展类事业。", personality: "性格仁厚，有上进心。" },
    水: { personality: "水主智慧流动，思维灵活。", career: "宜贸易、运输、信息、研究。" },
    火: { personality: "火主名声热情，表现欲强。", career: "宜演艺、销售、电子、餐饮。" },
    土: { personality: "土主稳重守信。", career: "宜地产、建筑、顾问、仓储。", wealth: "宜长期积累型理财。" },
  };
  const base = lifeDomainsByElement("土");
  const star = starMap[mainStar] ?? {};
  const houseHint =
    house === "财帛"
      ? "命宫落在财帛相关主题，一生与金钱资源关系密切。"
      : house === "官禄"
        ? "官禄主事业，宜在组织中获得职位与认可。"
        : house === "夫妻"
          ? "夫妻宫主感情，婚姻与伴侣对运势影响较大。"
          : `以${house}为论命重点，该领域为人生主要课题。`;

  return {
    personality: `${houseHint}\n${star.personality ?? base.personality}`,
    career: star.career ?? base.career,
    wealth: star.wealth ?? base.wealth,
    love: star.love ?? base.love,
    health: star.health ?? base.health,
  };
}

export function vedicLifeReading(nakshatra: string, dasha: string): {
  personality: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
} {
  const dashaHint: Record<string, string> = {
    Sun: "当前太阳大运，宜提升领导力与公众形象，注意父亲与上级关系。",
    Moon: "当前月亮大运，情感与家庭主题突出，宜关注内心与母亲长辈。",
    Mars: "当前火星大运，行动力强但易冲突，宜运动泄火，事业宜竞争型岗位。",
    Mercury: "当前水星大运，利学习、沟通、商业，宜考试进修与写作。",
    Jupiter: "当前木星大运，贵人、宗教、高等教育运佳，宜扩张与行善。",
    Venus: "当前金星大运，利艺术、享受、感情与财富，宜美化生活。",
    Saturn: "当前土星大运，责任与限制并存，宜耐心积累，防抑郁压力。",
    Rahu: "当前罗睺大运，变动与欲望强，宜防迷惑与非常规风险。",
    Ketu: "当前计都大运，宜修行、研究、断舍离，物质欲宜减。",
  };
  return {
    personality: `本命星宿${nakshatra}，${dashaHint[dasha] ?? "宜顺应大运主题修身。"}`,
    career: "事业宜结合星宿天赋：开创型宜创业，技艺型宜专精，合作型宜团队。",
    wealth: "财运随大运周期起伏，木星金星运较利财，土星运宜守成。",
    love: "感情看月亮与金星互动，当前大运决定婚恋主题强弱。",
    health: "注意对应星宿脏腑：火主心，水主肾，风主神经与呼吸。",
  };
}
