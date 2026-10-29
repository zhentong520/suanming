const DREAM_DICT: Record<
  string,
  { meaning: string; category: string; detail: string; advice: string }
> = {
  蛇: {
    meaning: "梦见蛇，主有财喜或变动之机，亦需防口舌。",
    category: "动物",
    detail:
      "蛇在梦中常象征智慧、诱惑或潜藏的能量。若蛇温顺，多主财运或机遇将至；若蛇凶猛，宜防小人暗算或口舌是非。",
    advice: "近期可关注投资理财机会，但需审慎核实，不宜轻信他人承诺。",
  },
  龙: {
    meaning: "梦见龙，主贵气临身，事业有望提升。",
    category: "动物",
    detail: "龙为祥瑞之兆，象征权力、成功与远大志向。梦见龙腾云起，主事业将有突破；梦见龙入水，主财源广进。",
    advice: "宜把握事业机遇，主动争取表现，但需戒骄戒躁。",
  },
  水: {
    meaning: "梦见水，主财运或情感流动，宜顺势而为。",
    category: "自然",
    detail: "清水主吉，浊水主忧。水势平缓则生活安稳，水势汹涌则变动较大。大水滔滔，主财运亨通；细流涓涓，主感情细腻。",
    advice: "顺应形势变化，不宜逆势硬扛，以柔克刚为佳。",
  },
  火: {
    meaning: "梦见火，主热情与变动，需防冲动行事。",
    category: "自然",
    detail: "火光熊熊可主名声远扬，亦需防火患之虞。梦见被火围，多主压力较大；梦见生火做饭，主生活将有改善。",
    advice: "控制情绪，重大决定宜冷静三思，避免冲动消费或言语冲突。",
  },
  飞: {
    meaning: "梦见飞翔，主志向高远，有突破现状之兆。",
    category: "行为",
    detail: "飞翔象征自由与超越。飞得高则志向远大，飞得低则进展缓慢。若飞不起来，或主现实阻力较大，需夯实基础。",
    advice: "可尝试拓展新领域或学习新技能，但需脚踏实地，循序渐进。",
  },
  掉牙: {
    meaning: "梦见掉牙，传统多解为家中有变或需关注长辈。",
    category: "身体",
    detail: "掉牙在心理层面常关联焦虑与失控感。传统解梦亦与家族、健康相关，宜多关心家人身体状况。",
    advice: "宜安排体检或与家人沟通，缓解内心压力，不必过度恐慌。",
  },
  考试: {
    meaning: "梦见考试，主近期有考核压力，宜充分准备。",
    category: "生活",
    detail: "考试梦常反映对评价的焦虑。梦见答不出题，多主信心不足；梦见考得好，主实力渐长、结果可期。",
    advice: "制定复习计划，充分准备，以实力化解焦虑。",
  },
  结婚: {
    meaning: "梦见结婚，主情感或合作事宜将有进展。",
    category: "生活",
    detail: "结婚象征结合与承诺。单身者梦见结婚，主姻缘将至；已婚者梦见，或主关系进入新阶段，亦需经营维护。",
    advice: "感情事宜可积极推进，合作签约亦较有利，但需真诚相待。",
  },
  死亡: {
    meaning: "梦见死亡，多象征结束与新生，不必过度担忧。",
    category: "象征",
    detail: "死亡在梦中极少预示真实灾祸，更多象征旧事物的终结与新阶段的开始。梦见他人死亡，或主与该人关系将转变。",
    advice: "宜放下执念，接受变化，以开放心态迎接新生活。",
  },
  钱: {
    meaning: "梦见钱财，主对现实财务的关切，宜理性规划。",
    category: "生活",
    detail: "捡钱主意外之喜，丢钱主担忧损耗，数钱主精打细算。大量金钱或主欲望膨胀，需防贪心。",
    advice: "审视财务规划，量入为出，不宜投机冒险。",
  },
};

export function interpretDream(keyword: string) {
  const key = keyword.trim();
  const direct = DREAM_DICT[key];
  if (direct) {
    return buildResult(key, direct, true);
  }

  for (const [k, v] of Object.entries(DREAM_DICT)) {
    if (key.includes(k) || k.includes(key)) {
      return buildResult(key, v, true);
    }
  }

  return {
    keyword: key,
    category: "未分类",
    meaning: "未找到精确词条，建议结合梦境细节与当下心境理解。",
    detail: "可将梦境拆分为多个关键词分别查询，如梦中人物、场景、情绪等，综合理解象征意义。",
    advice: "记录梦境细节，对照近期生活事件，往往能找到梦境与现实的心理关联。",
    summary: "梦境解读具有象征性，仅供文化参考。",
    matched: false,
    sections: [
      { title: "签意", content: "未找到精确词条，建议结合梦境细节与当下心境理解。" },
      {
        title: "详解",
        content: "可将梦境拆分为多个关键词分别查询，如梦中人物、场景、情绪等，综合理解象征意义。",
      },
      { title: "建议", content: "记录梦境细节，对照近期生活事件，往往能找到梦境与现实的心理关联。" },
    ],
  };
}

function buildResult(
  keyword: string,
  data: { meaning: string; category: string; detail: string; advice: string },
  matched: boolean
) {
  return {
    keyword,
    category: data.category,
    meaning: data.meaning,
    detail: data.detail,
    advice: data.advice,
    matched,
    sections: [
      { title: "签意", content: data.meaning },
      { title: "详解", content: data.detail },
      { title: "建议", content: data.advice },
    ],
    summary: `${data.meaning} ${data.advice}`,
  };
}
