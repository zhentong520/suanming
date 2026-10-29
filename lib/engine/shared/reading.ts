export type ReadingSection = { title: string; content: string };

/** 在解读最前面加「小白导读」，帮助零基础用户理解 */
export function withBeginnerGuide(
  intro: string,
  sections: ReadingSection[]
): ReadingSection[] {
  const hasGuide = sections.some((s) => s.title === "小白导读");
  if (hasGuide) return sections;
  return [{ title: "小白导读", content: intro }, ...sections];
}

export function prependGuideIfMissing(
  facts: Record<string, unknown>,
  intro: string
): Record<string, unknown> {
  const sections = (facts.sections as ReadingSection[] | undefined) ?? [];
  if (sections.some((s) => s.title === "小白导读")) return facts;
  return {
    ...facts,
    sections: withBeginnerGuide(intro, sections),
  };
}

export const MODULE_INTROS: Record<string, string> = {
  bazi:
    "八字=出生年、月、日、时的天干地支组合，共四柱八字。日干代表你自己（日主），其余字与五行、十神反映性格与运势方向。本报告用通俗语言解读，无需任何基础。",
  "bazi-dayun":
    "大运=每十年一段的人生运势周期；流年=每一年的运势。就像「季节大背景 + 当年天气」，两者结合看更准。",
  chenggu:
    "称骨算命=唐代袁天罡根据出生时间算出「骨重」，再对照歌诀判断命运层次。骨重越重未必越好，关键看歌诀吉凶与整体解读。",
  zodiac:
    "生肖=出生年份对应的十二动物。传统用来快速了解性格特点、当年运势及与其他生肖的关系（如六合、相冲）。",
  name:
    "姓名学（五格剖象）=康熙笔画拆成天格、人格、地格、外格、总格，并看天→人→地「三才」五行配置。人格最重要；有档案时再对照八字喜用。",
  naming:
    "取名建议=按八字喜用筛选字义与笔画五行，再以五格三才评分排序。读音谐音、辈分忌讳仍需人工把关。",
  word:
    "测字=用汉字笔画、部首、五行等象意来解读所问之事。传统认为「字载心意」，所测之字与当下心境相关。",
  almanac:
    "黄历=中国传统日历，标注每日宜做/忌做之事、冲煞方位等。选日子、安排重要活动时常作参考。另附日九星简判，便于宅事调整择日。",
  match:
    "合婚配对=综合生肖关系、五行互补、日主关系等，评估两人相处协调度。分数高不代表无矛盾，低分也不等于不能在一起。",
  ziwei:
    "紫微斗数=把人生分为十二宫（命宫、财帛、夫妻等），各宫有主星，反映不同人生领域。命宫最重要，代表整体格局。",
  heluo: "河洛理数=以出生数字推命卦，结合八卦五行论命。命卦反映先天性格与人生大方向。",
  qizheng:
    "七政四余=古代星命学，以日月金木水火土及罗睺、计都等星体论命。不同星曜主不同人生主题。",
  horoscope:
    "星座运势=西方占星，按出生日期划分十二星座，结合元素（火土风水）看性格与当日运势。",
  face: "面相=通过五官形态观察性格与运势倾向。另含九宫面相：额离、鼻中、颏坎等分区。仅为传统文化参考，不能替代医学或科学判断。",
  palm: "手相=通过掌纹、掌形观察性格与人生倾向。男左女右是传统说法，实际可双手对照。",
  fengshui:
    "风水（八宅）=根据出生年命卦，判断适合你的吉方与凶方。常用于卧室、书桌、办公位朝向参考。",
  numerology:
    "生命灵数=将出生日期数字相加得到核心数字（1-9 等），每个数字代表一种人生主题与天赋。",
  vedic:
    "吠陀占星=印度传统占星，以月亮星宿（Nakshatra）为核心。星宿反映性格底色，大运（Dasha）反映当前人生阶段。",
  mbti:
    "MBTI=现代性格分类，四个维度（内外向、感知、思考、判断）组成 16 型。配对看性格互补与相似度。",
  yijing:
    "易经占卜=用卦象（六十四卦）反映当前局面与发展趋势。卦辞、象辞是古人对吉凶的智慧总结。",
  liuyao: "六爻=易经占卜的一种，六个爻位代表事物发展六个阶段，动爻提示变化关键。",
  meihua: "梅花易数=以数字、时间等起卦，体卦代表自己，用卦代表所问之事，两者关系看吉凶。另重外应：起卦时一念所见所闻亦可入断。",
  xiaoliuren: "小六壬=简易占卜，六个宫位（大安、留连等）对应不同吉凶，适合快速问事。",
  lingqian: "灵签=寺庙签文，每签有签诗与典故，按签文等级（上上、中平等）解读所问之事。",
  dream: "解梦=梦境中的意象在传统文化中有象征意义，宜结合现实处境理解，不必过度迷信。",
  tarot: "塔罗=用牌面象征反映潜意识与局势。正位/逆位代表能量顺畅或受阻，供自我反思参考。",
  qimen: "奇门遁甲=古代时空术数，以八门、九星、八神排盘，判断行事方位与时机吉凶。",
  daliuren: "大六壬=以四课三传递推事物因果，适合断具体事情的成败过程。",
  taiyi: "太乙神数=古代三式之一，以局数推演大势，主宏观趋势与战略方向。",
  beijiao: "掷杯筊=庙宇问事习俗，一正一反为圣杯（允），两正为笑杯（未明），两反为阴杯（不准）。",
  "wuxing-ren":
    "五行人=以形神对应木火土金水看性情与身体倾向；助运穿衣=按当日地支取「我生」之色借天时，有档案时可兼顾八字喜用。",
  tiaoyun:
    "医·灵治调运=整理「山医命相卜」中的医与化解思路：象数原理、五行净化、能量引导、改命渠道与天地人调整层面。仅供文化自学，不替代医疗。",
};

export function scoreLabel(score: number): string {
  if (score >= 85) return "较高，整体协调";
  if (score >= 70) return "中等偏上，需互相包容";
  if (score >= 55) return "中等，重在经营";
  return "偏低，需更多沟通磨合";
}

export function levelAdvice(level: string): string {
  if (level.includes("上") || level.includes("吉")) {
    return "整体层次较好，宜积极进取，但忌骄傲懈怠，吉中藏慎。";
  }
  if (level.includes("下") || level.includes("凶")) {
    return "多有挑战，宜守正修德、厚积薄发，凶中有转机。";
  }
  return "平稳为主，宜踏实做事，以勤补拙，等待时机。";
}
