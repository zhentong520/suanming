/**
 * 起名精品字库：寓意 + 性别倾向 + 字义五行
 * gender: m 偏男 / f 偏女 / n 中性
 */
export type NameChar = {
  char: string;
  gender: "m" | "f" | "n";
  meaning: string;
  senseWx: "金" | "木" | "水" | "火" | "土";
};

export const NAMING_CHAR_POOL: NameChar[] = [
  // 木
  { char: "林", gender: "n", meaning: "成林茂盛", senseWx: "木" },
  { char: "森", gender: "m", meaning: "繁茂厚德", senseWx: "木" },
  { char: "柏", gender: "m", meaning: "坚贞长青", senseWx: "木" },
  { char: "松", gender: "m", meaning: "坚韧高洁", senseWx: "木" },
  { char: "桐", gender: "n", meaning: "梧桐高洁", senseWx: "木" },
  { char: "梓", gender: "n", meaning: "桑梓故土", senseWx: "木" },
  { char: "楠", gender: "m", meaning: "楠木贵重", senseWx: "木" },
  { char: "竹", gender: "n", meaning: "虚心劲节", senseWx: "木" },
  { char: "萱", gender: "f", meaning: "忘忧宜室", senseWx: "木" },
  { char: "薇", gender: "f", meaning: "清雅芳菲", senseWx: "木" },
  { char: "芮", gender: "f", meaning: "草盛柔美", senseWx: "木" },
  { char: "若", gender: "f", meaning: "宛若天成", senseWx: "木" },
  { char: "菁", gender: "f", meaning: "菁华出众", senseWx: "木" },
  { char: "菲", gender: "f", meaning: "芳菲袭人", senseWx: "木" },
  { char: "茉", gender: "f", meaning: "茉莉清香", senseWx: "木" },
  { char: "茗", gender: "n", meaning: "茶香清远", senseWx: "木" },
  { char: "穆", gender: "m", meaning: "静穆端庄", senseWx: "木" },
  { char: "谦", gender: "n", meaning: "谦谦君子", senseWx: "木" },
  { char: "欣", gender: "f", meaning: "欣欣向荣", senseWx: "木" },
  { char: "启", gender: "m", meaning: "启迪智慧", senseWx: "木" },
  { char: "语", gender: "f", meaning: "莺语花香", senseWx: "木" },
  { char: "梦", gender: "f", meaning: "梦想成真", senseWx: "木" },
  // 火
  { char: "烨", gender: "n", meaning: "光烨昌盛", senseWx: "火" },
  { char: "煜", gender: "m", meaning: "照耀显达", senseWx: "火" },
  { char: "朗", gender: "m", meaning: "开朗明达", senseWx: "火" },
  { char: "昕", gender: "n", meaning: "旭日初升", senseWx: "火" },
  { char: "阳", gender: "m", meaning: "阳刚开明", senseWx: "火" },
  { char: "昊", gender: "m", meaning: "昊天广大", senseWx: "火" },
  { char: "昭", gender: "n", meaning: "昭明德业", senseWx: "火" },
  { char: "晖", gender: "n", meaning: "春晖温暖", senseWx: "火" },
  { char: "彤", gender: "f", meaning: "彤云呈祥", senseWx: "火" },
  { char: "丹", gender: "f", meaning: "丹心赤诚", senseWx: "火" },
  { char: "晴", gender: "f", meaning: "雨过天晴", senseWx: "火" },
  { char: "暖", gender: "f", meaning: "温暖人心", senseWx: "火" },
  { char: "灿", gender: "n", meaning: "灿烂光明", senseWx: "火" },
  { char: "烁", gender: "n", meaning: "闪烁聪慧", senseWx: "火" },
  { char: "煊", gender: "m", meaning: "煊赫有名", senseWx: "火" },
  { char: "曦", gender: "n", meaning: "晨曦希望", senseWx: "火" },
  { char: "德", gender: "m", meaning: "以德服人", senseWx: "火" },
  { char: "智", gender: "n", meaning: "智圆行方", senseWx: "火" },
  { char: "哲", gender: "m", meaning: "明哲保身", senseWx: "火" },
  { char: "飞", gender: "m", meaning: "飞黄腾达", senseWx: "火" },
  { char: "乐", gender: "n", meaning: "乐观开朗", senseWx: "火" },
  { char: "诺", gender: "n", meaning: "一诺千金", senseWx: "火" },
  // 土
  { char: "坤", gender: "m", meaning: "厚德载物", senseWx: "土" },
  { char: "城", gender: "m", meaning: "城府稳健", senseWx: "土" },
  { char: "培", gender: "n", meaning: "培养成才", senseWx: "土" },
  { char: "坦", gender: "m", meaning: "坦荡正直", senseWx: "土" },
  { char: "安", gender: "n", meaning: "安然处世", senseWx: "土" },
  { char: "宇", gender: "n", meaning: "气宇轩昂", senseWx: "土" },
  { char: "宁", gender: "n", meaning: "宁静致远", senseWx: "土" },
  { char: "嘉", gender: "n", meaning: "嘉言懿行", senseWx: "土" },
  { char: "婉", gender: "f", meaning: "婉约贤淑", senseWx: "土" },
  { char: "嫣", gender: "f", meaning: "嫣然一笑", senseWx: "土" },
  { char: "妍", gender: "f", meaning: "妍姿慧质", senseWx: "土" },
  { char: "媛", gender: "f", meaning: "名媛淑德", senseWx: "土" },
  { char: "岩", gender: "m", meaning: "坚如磐石", senseWx: "土" },
  { char: "峰", gender: "m", meaning: "登峰造极", senseWx: "土" },
  { char: "峻", gender: "m", meaning: "峻拔不凡", senseWx: "土" },
  { char: "垣", gender: "n", meaning: "城垣守护", senseWx: "土" },
  { char: "垚", gender: "m", meaning: "土厚成山", senseWx: "土" },
  { char: "墨", gender: "n", meaning: "文墨书香", senseWx: "土" },
  { char: "辰", gender: "n", meaning: "星辰璀璨", senseWx: "土" },
  { char: "雅", gender: "f", meaning: "雅致脱俗", senseWx: "土" },
  { char: "怡", gender: "f", meaning: "心旷神怡", senseWx: "土" },
  { char: "远", gender: "m", meaning: "志存高远", senseWx: "土" },
  { char: "翔", gender: "m", meaning: "翱翔天际", senseWx: "土" },
  { char: "予", gender: "n", meaning: "赐予美好", senseWx: "土" },
  // 金
  { char: "锐", gender: "m", meaning: "锐意进取", senseWx: "金" },
  { char: "锋", gender: "m", meaning: "锋芒初露", senseWx: "金" },
  { char: "铭", gender: "n", meaning: "铭记于心", senseWx: "金" },
  { char: "钧", gender: "m", meaning: "千钧之力", senseWx: "金" },
  { char: "锦", gender: "n", meaning: "前程似锦", senseWx: "金" },
  { char: "铮", gender: "m", meaning: "铮铮铁骨", senseWx: "金" },
  { char: "钰", gender: "f", meaning: "金钰珍重", senseWx: "金" },
  { char: "琳", gender: "f", meaning: "琳琅满目", senseWx: "金" },
  { char: "琦", gender: "n", meaning: "琦玮美玉", senseWx: "金" },
  { char: "琪", gender: "f", meaning: "琪花瑶草", senseWx: "金" },
  { char: "瑶", gender: "f", meaning: "瑶台仙姿", senseWx: "金" },
  { char: "瑾", gender: "f", meaning: "瑾瑜美质", senseWx: "金" },
  { char: "瑜", gender: "n", meaning: "瑕不掩瑜", senseWx: "金" },
  { char: "璟", gender: "n", meaning: "玉光璀璨", senseWx: "金" },
  { char: "琛", gender: "n", meaning: "珍宝满怀", senseWx: "金" },
  { char: "轩", gender: "m", meaning: "气宇轩昂", senseWx: "金" },
  { char: "铠", gender: "m", meaning: "铠甲护身", senseWx: "金" },
  { char: "鉴", gender: "m", meaning: "明鉴万里", senseWx: "金" },
  { char: "睿", gender: "n", meaning: "睿智通达", senseWx: "金" },
  { char: "悦", gender: "f", meaning: "喜悦和畅", senseWx: "金" },
  { char: "然", gender: "n", meaning: "自然洒脱", senseWx: "金" },
  { char: "承", gender: "m", meaning: "承前启后", senseWx: "金" },
  { char: "思", gender: "n", meaning: "思虑周全", senseWx: "金" },
  { char: "诗", gender: "f", meaning: "诗情画意", senseWx: "金" },
  { char: "书", gender: "n", meaning: "书香门第", senseWx: "金" },
  // 水
  { char: "浩", gender: "m", meaning: "浩然正气", senseWx: "水" },
  { char: "瀚", gender: "m", meaning: "浩瀚无垠", senseWx: "水" },
  { char: "泽", gender: "m", meaning: "恩泽广被", senseWx: "水" },
  { char: "润", gender: "n", meaning: "润物无声", senseWx: "水" },
  { char: "涵", gender: "n", meaning: "涵养深厚", senseWx: "水" },
  { char: "清", gender: "n", meaning: "清正廉洁", senseWx: "水" },
  { char: "澄", gender: "n", meaning: "澄澈明净", senseWx: "水" },
  { char: "沐", gender: "n", meaning: "沐光而生", senseWx: "水" },
  { char: "涛", gender: "m", meaning: "波涛壮阔", senseWx: "水" },
  { char: "渊", gender: "m", meaning: "渊渟岳峙", senseWx: "水" },
  { char: "溪", gender: "f", meaning: "溪水潺潺", senseWx: "水" },
  { char: "澜", gender: "f", meaning: "波澜不惊", senseWx: "水" },
  { char: "潇", gender: "n", meaning: "潇洒出尘", senseWx: "水" },
  { char: "沁", gender: "f", meaning: "沁人心脾", senseWx: "水" },
  { char: "沛", gender: "n", meaning: "充沛旺盛", senseWx: "水" },
  { char: "洋", gender: "n", meaning: "海洋胸怀", senseWx: "水" },
  { char: "淳", gender: "n", meaning: "淳厚朴实", senseWx: "水" },
  { char: "澈", gender: "n", meaning: "清澈见底", senseWx: "水" },
  { char: "淇", gender: "f", meaning: "淇水悠悠", senseWx: "水" },
  { char: "慧", gender: "f", meaning: "慧心巧思", senseWx: "水" },
  { char: "博", gender: "m", meaning: "博学多闻", senseWx: "水" },
  { char: "文", gender: "n", meaning: "文质彬彬", senseWx: "水" },
  { char: "子", gender: "n", meaning: "君子之风", senseWx: "水" },
  { char: "航", gender: "m", meaning: "扬帆远航", senseWx: "水" },
  { char: "希", gender: "n", meaning: "希望之光", senseWx: "水" },
  { char: "望", gender: "n", meaning: "厚望所寄", senseWx: "水" },
];

export function uniqueCharPool(): NameChar[] {
  const seen = new Set<string>();
  const out: NameChar[] = [];
  for (const c of NAMING_CHAR_POOL) {
    if (seen.has(c.char)) continue;
    seen.add(c.char);
    out.push(c);
  }
  return out;
}
