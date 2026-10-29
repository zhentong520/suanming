export type ModuleCategory = "命" | "卜" | "相" | "术";
export type ModulePriority = "P0" | "P1" | "P2" | "P3";

export interface ModuleDefinition {
  id: string;
  name: string;
  category: ModuleCategory;
  description: string;
  priority: ModulePriority;
  path: string;
  requiresProfile: boolean;
  implemented: boolean;
  defaultEnabled: boolean;
  showOnHome: boolean;
  sortOrder: number;
  aiPromptKey: string;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  { id: "bazi", name: "八字排盘", category: "命", description: "四柱八字、五行、十神分析", priority: "P0", path: "/bazi", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 1, aiPromptKey: "bazi" },
  { id: "bazi-dayun", name: "大运流年", category: "命", description: "十年大运与流年运势", priority: "P0", path: "/bazi-dayun", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 2, aiPromptKey: "bazi-dayun" },
  { id: "bazi-resolve", name: "四柱反查", category: "命", description: "由四柱反推出生时间", priority: "P1", path: "/bazi-resolve", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 3, aiPromptKey: "bazi-resolve" },
  { id: "ziwei", name: "紫微斗数", category: "命", description: "紫微命盘十二宫分析", priority: "P1", path: "/ziwei", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 4, aiPromptKey: "ziwei" },
  { id: "chenggu", name: "袁天罡称骨", category: "命", description: "称骨歌诀与命格等级", priority: "P0", path: "/chenggu", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 5, aiPromptKey: "chenggu" },
  { id: "heluo", name: "河洛理数", category: "命", description: "河洛理数命卦", priority: "P2", path: "/heluo", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 6, aiPromptKey: "heluo" },
  { id: "qizheng", name: "七政四余", category: "命", description: "七政四余星命", priority: "P2", path: "/qizheng", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 7, aiPromptKey: "qizheng" },
  { id: "yijing", name: "周易占卜", category: "卜", description: "易经起卦与卦辞解读", priority: "P1", path: "/yijing", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 8, aiPromptKey: "yijing" },
  { id: "liuyao", name: "六爻占卜", category: "卜", description: "铜钱起卦六爻断事", priority: "P1", path: "/liuyao", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 9, aiPromptKey: "liuyao" },
  { id: "meihua", name: "梅花易数", category: "卜", description: "梅花易数时间数字起卦", priority: "P1", path: "/meihua", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 10, aiPromptKey: "meihua" },
  { id: "qimen", name: "奇门遁甲", category: "卜", description: "奇门八门九星排盘", priority: "P2", path: "/qimen", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 11, aiPromptKey: "qimen" },
  { id: "daliuren", name: "大六壬", category: "卜", description: "大六壬四课三传", priority: "P2", path: "/daliuren", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 12, aiPromptKey: "daliuren" },
  { id: "xiaoliuren", name: "小六壬", category: "卜", description: "小六壬速断", priority: "P1", path: "/xiaoliuren", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 13, aiPromptKey: "xiaoliuren" },
  { id: "taiyi", name: "太乙神数", category: "卜", description: "太乙神数推演", priority: "P3", path: "/taiyi", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 14, aiPromptKey: "taiyi" },
  { id: "lingqian", name: "灵签", category: "卜", description: "观音灵签求签", priority: "P1", path: "/lingqian", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 15, aiPromptKey: "lingqian" },
  { id: "beijiao", name: "杯筊", category: "卜", description: "掷杯问事", priority: "P2", path: "/beijiao", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 16, aiPromptKey: "beijiao" },
  { id: "word", name: "测字", category: "相", description: "汉字测字断事", priority: "P0", path: "/word", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 17, aiPromptKey: "word" },
  { id: "face", name: "面相", category: "相", description: "上传正脸照片 AI 识图解读", priority: "P2", path: "/face", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 18, aiPromptKey: "face" },
  { id: "palm", name: "手相", category: "相", description: "上传手掌照片 AI 识图解读", priority: "P2", path: "/palm", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 19, aiPromptKey: "palm" },
  { id: "fengshui", name: "风水", category: "相", description: "八宅风水分析", priority: "P2", path: "/fengshui", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 20, aiPromptKey: "fengshui" },
  { id: "almanac", name: "黄历择日", category: "术", description: "今日黄历宜忌", priority: "P0", path: "/almanac", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 21, aiPromptKey: "almanac" },
  { id: "name", name: "姓名测算", category: "术", description: "三才五格+康熙笔画+喜用对照", priority: "P0", path: "/name", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 22, aiPromptKey: "name" },
  { id: "naming", name: "起名取名", category: "术", description: "八字喜用与五格三才智能取名", priority: "P1", path: "/naming", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 23, aiPromptKey: "naming" },
  { id: "match", name: "合婚配对", category: "术", description: "生肖五行合盘", priority: "P0", path: "/match", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 24, aiPromptKey: "match" },
  { id: "dream", name: "周公解梦", category: "术", description: "梦境关键词解读", priority: "P1", path: "/dream", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 25, aiPromptKey: "dream" },
  { id: "zodiac", name: "生肖运势", category: "术", description: "十二生肖运势", priority: "P0", path: "/zodiac", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 26, aiPromptKey: "zodiac" },
  { id: "horoscope", name: "西洋星座", category: "术", description: "十二星座运势", priority: "P1", path: "/horoscope", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 27, aiPromptKey: "horoscope" },
  { id: "tarot", name: "塔罗占卜", category: "术", description: "塔罗牌阵解读", priority: "P1", path: "/tarot", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 28, aiPromptKey: "tarot" },
  { id: "numerology", name: "数字命理", category: "术", description: "生命灵数分析", priority: "P2", path: "/numerology", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 29, aiPromptKey: "numerology" },
  { id: "vedic", name: "吠陀占星", category: "术", description: "印度占星术", priority: "P3", path: "/vedic", requiresProfile: true, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 30, aiPromptKey: "vedic" },
  { id: "mbti", name: "MBTI配对", category: "术", description: "MBTI趣味配对", priority: "P3", path: "/mbti", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: false, sortOrder: 31, aiPromptKey: "mbti" },
  { id: "wuxing-ren", name: "五行人·助运", category: "术", description: "五行形神+天时穿衣助运", priority: "P1", path: "/wuxing-ren", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 32, aiPromptKey: "wuxing-ren" },
  { id: "tiaoyun", name: "医·灵治调运", category: "术", description: "象数原理·五行净化·改命层面", priority: "P1", path: "/tiaoyun", requiresProfile: false, implemented: true, defaultEnabled: true, showOnHome: true, sortOrder: 33, aiPromptKey: "tiaoyun" },
];

export function getModuleDefinition(id: string): ModuleDefinition | undefined {
  return MODULE_DEFINITIONS.find((m) => m.id === id);
}

export function getImplementedModules(): ModuleDefinition[] {
  return MODULE_DEFINITIONS.filter((m) => m.implemented);
}

export { getModuleName, getModuleDescription } from "./module-i18n";

