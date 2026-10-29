import type { Locale } from "@/lib/i18n/config";

/** English labels for modules (id → nameEn / descriptionEn) */
export const MODULE_EN: Record<string, { name: string; description: string }> = {
  bazi: { name: "BaZi Chart", description: "Four Pillars, Five Elements & Ten Gods" },
  "bazi-dayun": { name: "Luck Cycles", description: "Decade luck & yearly fortune" },
  "bazi-resolve": { name: "Pillar Reverse Lookup", description: "Infer birth time from pillars" },
  ziwei: { name: "Zi Wei Dou Shu", description: "Purple Star astrology · 12 palaces" },
  chenggu: { name: "Bone Weighting", description: "Yuan Tiangang bone-weight verse" },
  heluo: { name: "He Luo Numerology", description: "River-Luo life hexagram" },
  qizheng: { name: "Seven Luminaries", description: "Classical Chinese planetary astrology" },
  yijing: { name: "I Ching", description: "Zhouyi hexagram reading" },
  liuyao: { name: "Liu Yao", description: "Six-line coin casting" },
  meihua: { name: "Plum Blossom", description: "Meihua Yishu time/number casting" },
  qimen: { name: "Qi Men Dun Jia", description: "Mysterious gates · eight doors" },
  daliuren: { name: "Da Liu Ren", description: "Four lessons & three transmissions" },
  xiaoliuren: { name: "Xiao Liu Ren", description: "Quick six-palace reading" },
  taiyi: { name: "Tai Yi", description: "Taiyi cosmic numerology" },
  lingqian: { name: "Oracle Lots", description: "Temple lot poetry reading" },
  beijiao: { name: "Moon Blocks", description: "Temple yes/no blocks" },
  word: { name: "Character Reading", description: "Chinese character omen reading" },
  face: { name: "Face Reading", description: "AI face physiognomy" },
  palm: { name: "Palmistry", description: "AI palm reading" },
  fengshui: { name: "Feng Shui", description: "Eight mansions & flying stars" },
  almanac: { name: "Almanac", description: "Daily auspicious / inauspicious activities" },
  name: { name: "Name Analysis", description: "Five grids · Kangxi strokes · useful gods" },
  naming: { name: "Baby Naming", description: "BaZi useful gods + five-grid ranked names" },
  match: { name: "Matchmaking", description: "Zodiac & Five-Element compatibility" },
  dream: { name: "Dream Interpretation", description: "Classic dream keyword reading" },
  zodiac: { name: "Chinese Zodiac", description: "Twelve animals fortune" },
  horoscope: { name: "Western Zodiac", description: "Twelve signs fortune" },
  tarot: { name: "Tarot", description: "Tarot spread reading" },
  numerology: { name: "Numerology", description: "Life-path numbers" },
  vedic: { name: "Vedic Astrology", description: "Jyotish · nakshatra focus" },
  mbti: { name: "MBTI Match", description: "Fun MBTI compatibility" },
  "wuxing-ren": {
    name: "Five-Element Type",
    description: "Body-type Wu Xing + daily lucky colors",
  },
  tiaoyun: {
    name: "Healing & Tuning",
    description: "Xiangshu principles · energy cleansing · destiny layers",
  },
};

export function getModuleName(id: string, locale: Locale, fallbackZh: string): string {
  if (locale === "en") return MODULE_EN[id]?.name ?? fallbackZh;
  return fallbackZh;
}

export function getModuleDescription(id: string, locale: Locale, fallbackZh: string): string {
  if (locale === "en") return MODULE_EN[id]?.description ?? fallbackZh;
  return fallbackZh;
}
