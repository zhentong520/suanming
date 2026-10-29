/** 面相/手相特征组合断语 */

export interface FeatureCombo {
  id: string;
  module: "face" | "palm";
  require: string[];
  title: string;
  meaning: string;
}

export const FEATURE_COMBOS: FeatureCombo[] = [
  {
    id: "face-early-bless",
    module: "face",
    require: ["额头饱满", "印堂开阔"],
    title: "上停命宫双美",
    meaning: "早年贵人与思路皆显，适合求学考试与早期规划；中年后仍宜保持学习习惯，以免坐吃山空。",
  },
  {
    id: "face-career-mid",
    module: "face",
    require: ["鼻梁高挺", "法令清晰"],
    title: "中停权柄显现",
    meaning: "中年事业责任加重，适合扛项目与带团队；宜量力，避免硬撑导致身心过劳。",
  },
  {
    id: "face-wealth-stable",
    module: "face",
    require: ["鼻头圆润", "财帛宫丰润"],
    title: "聚财有根",
    meaning: "正财与积蓄意识双显，适合稳健理财与实业；忌因自信而杠杆过高。",
  },
  {
    id: "face-love-clear",
    module: "face",
    require: ["嘴角上扬", "夫妻宫清秀"],
    title: "感情表达顺畅",
    meaning: "亲和与婚恋宫同美，感情推进较自然；仍需边界与坦诚，避免过度讨好。",
  },
  {
    id: "face-late-stable",
    module: "face",
    require: ["地阁丰满", "下巴方圆"],
    title: "下停守成",
    meaning: "晚年与居家运较稳，适合长期置产与家庭经营；中年前宜打好财务基础。",
  },
  {
    id: "face-stress",
    module: "face",
    require: ["印堂有纹", "气色暗沉"],
    title: "心事与气色同滞",
    meaning: "近期压力与思虑偏重，宜先休整睡眠与运动，重大决定可暂缓。",
  },
  {
    id: "face-social",
    module: "face",
    require: ["眉清目秀", "耳大有垂"],
    title: "人缘福气",
    meaning: "形象亲和且善听，利于合作与贵人提携；可主动拓展高质量社交圈。",
  },
  {
    id: "palm-vital-mind",
    module: "palm",
    require: ["生命线较长", "智慧线清晰"],
    title: "身心条线并美",
    meaning: "体能与思维基础皆可，适合长期专业深耕；注意劳逸结合，避免用脑过度。",
  },
  {
    id: "palm-career-fame",
    module: "palm",
    require: ["事业线明显", "太阳线显现"],
    title: "事业名声双线",
    meaning: "上升通道与曝光机会并存，适合目标管理与阶段性展示成果。",
  },
  {
    id: "palm-love-focus",
    module: "palm",
    require: ["感情线深长", "婚姻线清晰"],
    title: "感情专一可期",
    meaning: "重情且婚恋态度认真，适合稳定经营；宜避免因过度付出而失衡。",
  },
  {
    id: "palm-wealth-drive",
    module: "palm",
    require: ["财运线明显", "水星丘活"],
    title: "财商沟通",
    meaning: "理财意识与商务沟通同显，适合销售谈判与稳健开源；忌投机。",
  },
  {
    id: "palm-leader",
    module: "palm",
    require: ["木星丘高", "拇指粗壮"],
    title: "进取执行",
    meaning: "上进心与意志力同强，适合担当与拍板；记得授权，避免事必躬亲。",
  },
  {
    id: "palm-creative",
    module: "palm",
    require: ["月丘丰润", "掌型偏长"],
    title: "想象与策划",
    meaning: "直觉与灵活思维利于创意策划；配套落地清单，防止空想。",
  },
  {
    id: "palm-stress",
    module: "palm",
    require: ["智慧线过长", "掌纹杂乱"],
    title: "思虑过载",
    meaning: "想法多且杂事分心，宜做减法、设决策期限，先完成再完美。",
  },
];

export function matchFeatureCombos(
  module: "face" | "palm",
  features: string[]
): Array<{ id: string; title: string; meaning: string; matched: string[] }> {
  const set = new Set(features);
  return FEATURE_COMBOS.filter((c) => c.module === module)
    .map((c) => {
      const matched = c.require.filter(
        (r) => set.has(r) || [...set].some((f) => f.includes(r) || r.includes(f))
      );
      if (matched.length < c.require.length) return null;
      return { id: c.id, title: c.title, meaning: c.meaning, matched: c.require };
    })
    .filter(Boolean) as Array<{ id: string; title: string; meaning: string; matched: string[] }>;
}
