import { BaziResult } from "./index";
import { formatShenShaSummary } from "./shensha";

type Section = { title: string; content: string };

const ELEMENT_TRAITS: Record<string, { personality: string; career: string; wealth: string; love: string; health: string }> = {
  金: {
    personality:
      "金日主之人多刚毅果决，重义气、讲原则，处事有章法，不喜拖泥带水。外表冷静，内心有坚持，有时显得过于直接。",
    career:
      "适合金融、法律、军警、机械、珠宝、管理类工作。宜在制度清晰的平台发展，凭借专业能力与执行力获得认可。",
    wealth:
      "财运多靠正财与专业技能积累，不宜投机冒进。理财宜稳健，适合长期储蓄与资产配置，中年后财源渐稳。",
    love:
      "感情上较理性，重视对方品行与责任感。表达爱意不够浪漫，但用情专一，婚后多能担当家庭重任。",
    health:
      "需注意呼吸系统、皮肤与大肠。秋季易有燥气，宜润肺养阴，少吸烟，多饮水，避免过劳耗气。",
  },
  木: {
    personality:
      "木日主之人多仁慈宽厚，有上进心，善于学习成长。性情温和而有韧性，遇挫折能屈能伸，富有人情味。",
    career:
      "适合教育、文化、出版、园林、医药、策划、设计等行业。宜在成长型领域深耕，借力人脉逐步拓展。",
    wealth:
      "财运随事业成长而升，早年或有起伏，中年后渐入佳境。宜投资自我提升，以才华换财，合作生财较利。",
    love:
      "感情细腻，重视精神交流。对伴侣包容度高，但忌过度迁就失去自我。桃花运多来自学习、工作场合。",
    health:
      "需注意肝胆、筋骨与眼睛。春季养肝最为要紧，忌熬夜酗酒，宜户外运动，保持心情舒畅。",
  },
  水: {
    personality:
      "水日主之人多聪慧机敏，善于变通，适应力强。思维活跃，点子多，但有时想法多变，需防优柔寡断。",
    career:
      "适合贸易、物流、旅游、传媒、咨询、IT、研究等流动性强的行业。宜发挥信息整合与沟通能力。",
    wealth:
      "财运起伏较大，善于发现机会，但需防贪多务失。偏财机会时有出现，宜见好就收，忌杠杆过重。",
    love:
      "感情丰富，浪漫多情，异性缘较好。需防暧昧不清或情感摇摆，宜找能给自己安全感的伴侣。",
    health:
      "需注意肾脏、泌尿系统、耳朵与腰部。冬季防寒保暖，忌过劳纵欲，宜早睡养肾，少食生冷。",
  },
  火: {
    personality:
      "火日主之人多热情开朗，外向积极，有感染力。做事雷厉风行，爱憎分明，有时急躁冲动，需修耐心。",
    career:
      "适合演艺、销售、餐饮、能源、电子、公关、互联网等需表现力的行业。宜在台前或一线发挥优势。",
    wealth:
      "来财较快，花销亦大，宜强制储蓄。适合短期项目获利，投资忌冲动跟风，需有止损意识。",
    love:
      "爱得热烈，追求浪漫与激情，早期桃花旺盛。婚后宜学会细水长流，避免因脾气急躁伤害感情。",
    health:
      "需注意心脏、血压、眼睛与小肠。夏季防暑降火，忌暴怒熬夜，宜清淡饮食，保持心态平和。",
  },
  土: {
    personality:
      "土日主之人多稳重厚道，诚实守信，包容力强。做事踏实，不喜浮夸，有时显得保守慢热，但可靠耐久。",
    career:
      "适合地产、建筑、农业、仓储、顾问、人力资源、服务业。宜稳扎稳打，以信誉与积累取胜。",
    wealth:
      "财运偏稳，适合守成积累与不动产类投资。不宜频繁换赛道，坚持主业更易聚财，晚年多富足。",
    love:
      "感情务实，重视家庭与稳定。表达含蓄，但忠诚可靠。宜主动沟通心意，避免让对方觉得冷淡。",
    health:
      "需注意脾胃、消化系统与肌肉。长夏祛湿健脾，忌暴饮暴食，宜规律饮食，适当散步助消化。",
  },
};

const STRENGTH_MODIFIER: Record<string, { career: string; wealth: string; love: string; advice: string }> = {
  偏旺: {
    career: "日主偏旺，事业上宜承担重任，但忌独断专行。适合带领团队，多听取下属意见，以柔克刚。",
    wealth: "身强能担财，财运承载力较好，但忌过度自信导致大额亏损。宜分散投资，留有余地。",
    love: "感情中较占主导，宜给对方空间，避免控制欲过强。弱一点的对象或能互补。",
    advice: "宜泄耗制衡：多学习、多付出、多行善，以食伤生财，以财星为目标，忌再增印比。",
  },
  偏弱: {
    career: "日主偏弱，事业上宜借力而行，借助平台与贵人。不宜过早独立创业，先积累资历与人脉。",
    wealth: "身弱不胜大财，宜稳步增收，忌赌博与高杠杆。可先强化自身能力，财运随后提升。",
    love: "感情上较被动，宜主动表达需求。找成熟稳重、能给自己支持的伴侣更为有利。",
    advice: "宜印比扶助：多亲近长辈贵人，与志同道合者合作，穿戴与方位可补益命局所缺。",
  },
  中和: {
    career: "日主中和，事业路径较宽，可根据兴趣选择。逢大运流年吉利时积极争取，平时守成为上。",
    wealth: "财运平稳，正财偏财均可尝试，以量入为出、合理规划为主，不宜极端冒险或过度保守。",
    love: "感情发展较为均衡，与多数类型的人都能相处。重在真诚沟通，共同规划未来。",
    advice: "格局平衡，宜顺势而为。关注大运流年变化，吉年进取，凶年蛰伏，不必刻意偏倚。",
  },
};

const TEN_GOD_MEANINGS: Record<string, string> = {
  比肩: "比肩主自我意识、同辈竞争，命局中显则多独立性强，宜合作亦宜竞争。",
  劫财: "劫财主变动与分夺，财运上宜防合伙纠纷或意外支出，事业上竞争意识强。",
  食神: "食神主才华、口福与温和表达，利于文艺、餐饮、教育，性格多随和。",
  伤官: "伤官主聪慧、叛逆与创造力，才华出众但需修口德，事业上宜发挥专长。",
  偏财: "偏财主意外之财、人缘与父亲缘，善于把握商机，社交能力较强。",
  正财: "正财主稳定收入、勤俭与妻缘（男命），适合踏实工作，财运细水长流。",
  七杀: "七杀主压力、权威与魄力，事业上有冲劲，需防急躁与小人，女命亦主异性缘。",
  正官: "正官主名誉、职位与约束，利于体制内发展，为人多守规矩，女命主夫星。",
  偏印: "偏印主偏门学问、灵感与孤独，适合研究、技艺，需防思虑过多。",
  正印: "正印主学识、慈爱与贵人，利考试进修，多得长辈扶持，为人重情义。",
};

const ELEMENT_BALANCE: Record<string, string> = {
  金: "金气过旺则易刚硬，宜用水泄、用火炼；金弱则宜土生、宜金助。",
  木: "木气过旺则易固执，宜用金克、用火泄；木弱则宜水生、宜木助。",
  水: "水气过旺则易漂泊，宜用土克、用木泄；水弱则宜金生、宜水助。",
  火: "火气过旺则易急躁，宜用水克、用土泄；火弱则宜木生、宜火助。",
  土: "土气过旺则易滞塞，宜用木克、用金泄；土弱则宜火生、宜土助。",
  };

const MISSING_REMEDY: Record<string, string> = {
  金: "缺金：宜西方、白色、金属饰品，可从事与金相关行业补益。",
  木: "缺木：宜东方、绿色，多接触自然，可养花种草以养木气。",
  水: "缺水：宜北方、黑色蓝色，近水而居，多喝水、静养安神。",
  火: "缺火：宜南方、红色，多晒太阳，适当运动振奋阳气。",
  土: "缺土：宜中央、黄色，饮食规律，脚踏实地，稳定作息。",
};

function dominantElement(count: Record<string, number>): string {
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "土";
}

function analyzeTenGods(tenGods: string[]): string {
  const valid = tenGods.filter((g) => g && g !== "未知");
  if (!valid.length) return "时柱未知，十神分析以年月日三柱为主。";

  const counts: Record<string, number> = {};
  for (const g of valid) counts[g] = (counts[g] ?? 0) + 1;

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const main = sorted[0]?.[0];
  const secondary = sorted[1]?.[0];

  let text = `四柱十神以「${valid.join("、")}」分布。`;
  if (main) text += `最显著为${main}，${TEN_GOD_MEANINGS[main] ?? ""}`;
  if (secondary && secondary !== main) {
    text += `次见${secondary}，${TEN_GOD_MEANINGS[secondary] ?? ""}`;
  }
  return text;
}

function wealthByTenGods(tenGods: string[], strength: string): string {
  const hasZhengCai = tenGods.includes("正财");
  const hasPianCai = tenGods.includes("偏财");
  const hasShiShang = tenGods.includes("食神") || tenGods.includes("伤官");
  const hasBiJie = tenGods.includes("比肩") || tenGods.includes("劫财");

  const parts: string[] = [];
  if (hasZhengCai && hasPianCai) {
    parts.push("命局正财偏财并见，正偏财皆有来源，宜主业稳收、副业择机，但需防贪多分散。");
  } else if (hasZhengCai) {
    parts.push("正财透干，适合稳定工作收入，薪资福利、固定资产为主要财源，理财宜保守。");
  } else if (hasPianCai) {
    parts.push("偏财显见，商业嗅觉灵敏，适合贸易、投资、中介等，但财来财去宜设储备金。");
  } else if (hasShiShang) {
    parts.push("食伤生财之格，宜以技艺、创意、口才求财，越专业越易聚财。");
  } else {
    parts.push("财星不显著，宜主动开拓财源，可通过学习技能、拓展人脉提升收入。");
  }

  if (hasBiJie && strength === "偏旺") {
    parts.push("比劫旺而身强，需防合伙破财、借贷纠纷，大额支出宜审慎。");
  }
  return parts.join("");
}

function loveByGender(
  tenGods: string[],
  gender: string | undefined,
  element: string,
  strength: string
): string {
  const isFemale = gender === "女";
  const spouseStar = isFemale ? (tenGods.includes("正官") ? "正官" : tenGods.includes("七杀") ? "七杀" : null) : null;
  const wealthStar = !isFemale ? (tenGods.includes("正财") ? "正财" : tenGods.includes("偏财") ? "偏财" : null) : null;

  const parts: string[] = [];

  if (isFemale) {
    if (spouseStar === "正官") {
      parts.push("女命正官为夫，婚姻多正统稳定，配偶品行端正，宜找成熟稳重、有责任感之人。");
    } else if (spouseStar === "七杀") {
      parts.push("女命七杀为夫，感情多波折但激情浓烈，配偶个性强，宜找能欣赏自己独立性的伴侣。");
    } else {
      parts.push("夫星不显著，姻缘宜主动争取，可通过社交、学习场合拓展异性缘，不必急于求成。");
    }
    if (tenGods.includes("伤官")) {
      parts.push("伤官见官需留意，言语上宜温和，避免过于挑剔伤害感情。");
    }
  } else {
    if (wealthStar === "正财") {
      parts.push("男命正财为妻，婚姻多务实和睦，配偶持家有方，宜重视家庭经济规划。");
    } else if (wealthStar === "偏财") {
      parts.push("男命偏财旺，异性缘佳，婚前桃花较多，婚后宜专一，避免因应酬影响家庭。");
    } else {
      parts.push("妻星不显著，宜先立业后成家，提升自身吸引力，姻缘多在事业稳定后到来。");
    }
    if (tenGods.includes("比肩") && strength === "偏旺") {
      parts.push("比劫旺者感情上宜多包容，避免大男子主义或与朋友应酬过多冷落伴侣。");
    }
  }

  const loveTrait = ELEMENT_TRAITS[element]?.love ?? "";
  parts.push(loveTrait);
  return parts.join("");
}

function socialAnalysis(tenGods: string[], element: string): string {
  const parts: string[] = [];
  if (tenGods.includes("正印") || tenGods.includes("偏印")) {
    parts.push("印星旺，多得长辈、师长提携，遇困难宜求助贵人，学业进修运较佳。");
  }
  if (tenGods.includes("比肩") || tenGods.includes("劫财")) {
    parts.push("比劫多，朋友同事往来频繁，合作机会多，但需明算账，忌金钱借贷纠缠。");
  }
  if (tenGods.includes("正官") || tenGods.includes("七杀")) {
    parts.push("官杀显，易得上级赏识，适合在组织中获得职位，宜遵守规则、积累口碑。");
  }
  if (!parts.length) {
    parts.push(`${element}日主之人，人际上宜主动经营，以诚待人，日久见人心。`);
  }
  return parts.join("");
}

function buildRemedy(missing: string[], element: string, strength: string): string {
  const parts: string[] = [];
  if (missing.length) {
    parts.push(missing.map((m) => MISSING_REMEDY[m]).filter(Boolean).join(" "));
  } else {
    parts.push("五行俱全，无需刻意补缺，宜保持生活平衡即可。");
  }
  parts.push(STRENGTH_MODIFIER[strength]?.advice ?? "");
  parts.push(ELEMENT_BALANCE[element] ?? "");
  parts.push("以上补益仅供参考，心态积极、行善积德，方为改运之本。");
  return parts.join("");
}

export function buildBaziInterpretation(bazi: BaziResult, gender?: string) {
  const el = bazi.dayMasterElement;
  const traits = ELEMENT_TRAITS[el] ?? ELEMENT_TRAITS.土;
  const mod = STRENGTH_MODIFIER[bazi.strength] ?? STRENGTH_MODIFIER.中和;
  const dom = dominantElement(bazi.elementCount);
  const tenGodText = analyzeTenGods(bazi.tenGods);

  const pillarDetail = [
    `年柱 ${bazi.ganZhiYear}（根基祖上、早年环境）`,
    `月柱 ${bazi.ganZhiMonth}（父母宫、事业宫）`,
    `日柱 ${bazi.ganZhiDay}（日主 ${bazi.dayMaster}，代表自身与配偶宫）`,
    `时柱 ${bazi.ganZhiTime}（子女宫、晚年归宿）`,
  ].join("\n");

  const elementBar = `金${bazi.elementCount.金} · 木${bazi.elementCount.木} · 水${bazi.elementCount.水} · 火${bazi.elementCount.火} · 土${bazi.elementCount.土}`;
  const missingText = bazi.missingElements.length ? bazi.missingElements.join("、") : "无";

  const sections: Section[] = [
    {
      title: "四柱命盘",
      content: [
        pillarDetail,
        "",
        `纳音：${bazi.naYin}`,
        `五行：${bazi.wuXing.join(" · ")}`,
        `五行统计：${elementBar}`,
        `最旺五行：${dom}`,
        `日主强弱：${bazi.strength}${bazi.strengthScore != null ? `（评分 ${bazi.strengthScore}）` : ""}`,
        `缺失五行：${missingText}`,
        bazi.yongShen
          ? `喜用神：${bazi.yongShen.usefulGods.join("、")}｜忌神：${bazi.yongShen.avoidGods.join("、") || "无"}`
          : "",
        bazi.trueSolarNote ? `真太阳时：${bazi.trueSolarNote}` : "",
        bazi.yongShen?.detail.notes?.length
          ? `旺衰依据：${bazi.yongShen.detail.notes.slice(0, 5).join("；")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
    ...(bazi.yongShen
      ? [
          {
            title: "喜用神总论",
            content: `${bazi.yongShen.summary}\n\n${bazi.yongShen.usefulTenGodsHint}`,
          },
        ]
      : []),
    {
      title: "十神分布",
      content: [
        `年${bazi.tenGods[0]} · 月${bazi.tenGods[1]} · 日${bazi.tenGods[2]} · 时${bazi.tenGods[3]}`,
        tenGodText,
      ].join("\n"),
    },
    ...(bazi.geJu
      ? [
          {
            title: "月令格局",
            content: [
              bazi.geJu.summary,
              bazi.geJu.successFactors?.length
                ? `成格要点：${bazi.geJu.successFactors.join("；")}`
                : "",
              bazi.geJu.breakFactors?.length
                ? `破格风险：${bazi.geJu.breakFactors.join("；")}`
                : "",
              bazi.geJu.useGodHint ? `用神提示：${bazi.geJu.useGodHint}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ]
      : []),
    ...(bazi.shenSha
      ? [
          {
            title: "神煞摘要",
            content: formatShenShaSummary(bazi.shenSha),
          },
        ]
      : []),
    {
      title: "性格禀赋",
      content: `${traits.personality}\n\n${STRENGTH_MODIFIER[bazi.strength]?.advice ?? ""}`,
    },
    {
      title: "事业运势",
      content: [
        `格局：${bazi.geJu?.name ?? "月令取格"}；喜用${(bazi.yongShen?.usefulGods ?? []).join("、") || "—"}，忌神${(bazi.yongShen?.avoidGods ?? []).join("、") || "—"}。`,
        bazi.tongGen?.summary ? `通根透干：${bazi.tongGen.summary}` : "",
        `${traits.career}`,
        `${mod.career}`,
        socialAnalysis(bazi.tenGods, el),
        bazi.geJu?.useGodHint ? `格局用神：${bazi.geJu.useGodHint}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      title: "财运分析",
      content: [
        `日主${bazi.dayMaster}（${el}）${bazi.strength}；喜用落点看财官是否为用。`,
        `${traits.wealth}`,
        `${mod.wealth}`,
        wealthByTenGods(bazi.tenGods, bazi.strength),
        bazi.geJu?.breakFactors?.length
          ? `破格提醒：${bazi.geJu.breakFactors.slice(0, 2).join("；")}`
          : bazi.geJu?.successFactors?.length
            ? `成格要点：${bazi.geJu.successFactors.slice(0, 2).join("；")}`
            : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
    {
      title: "感情姻缘",
      content: loveByGender(bazi.tenGods, gender, el, bazi.strength),
    },
    {
      title: "健康调养",
      content: `${traits.health}\n\n${bazi.missingElements.length ? `命局缺${missingText}，对应脏腑宜多加关注。` : "五行较全，整体体质基础尚可。"}\n\n作息规律、饮食均衡、情志舒畅，为养生之本。`,
    },
    {
      title: "人际贵人",
      content: socialAnalysis(bazi.tenGods, el),
    },
    {
      title: "开运建议",
      content: buildRemedy(bazi.missingElements, el, bazi.strength),
    },
    {
      title: "改命四法与助运",
      content: [
        "命运如地图：标出弯道与坑洞，不等于必然翻车。修行积德者，急弯处或遇可救之人，坑前或得梯子。",
        "改命四法（了凡思路）：①积德行善 ②包容 ③和善 ④爱惜自己。天作孽犹可违；积善之家必有余庆。",
        "天地人各三分：八字属天时参考，风水属地利，心念言行属人和。只信自己至少握住「人」这一分。",
        `今日可配合「五行人·助运」模块：按日支穿「我生」色，并尽量兼顾喜用${(bazi.yongShen?.usefulGods ?? []).join("、") || "—"}.`,
      ].join("\n\n"),
    },
  ];

  const summary = `${bazi.dayMaster}日主（${el}），${bazi.strength}。${traits.personality.slice(0, 40)}…事业宜${traits.career.slice(0, 20)}…`;

  return { sections, summary };
}
