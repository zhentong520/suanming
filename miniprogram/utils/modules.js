/** 与 Web 模块对齐的常用子集（完整 31 门见 H5 /modules） */
module.exports = [
  { id: "bazi", name: "八字排盘", requiresProfile: true, hint: "使用当前档案" },
  { id: "ziwei", name: "紫微斗数", requiresProfile: true, hint: "使用当前档案" },
  { id: "chenggu", name: "称骨算命", requiresProfile: true, hint: "使用当前档案" },
  { id: "yijing", name: "周易占卜", requiresProfile: false, fields: [{ key: "question", label: "所问之事", placeholder: "可选" }] },
  { id: "liuyao", name: "六爻占卜", requiresProfile: false, fields: [{ key: "question", label: "所问之事", placeholder: "可选" }] },
  { id: "meihua", name: "梅花易数", requiresProfile: false, fields: [{ key: "question", label: "所问之事", placeholder: "可选" }] },
  { id: "lingqian", name: "灵签", requiresProfile: false, fields: [] },
  { id: "almanac", name: "黄历择日", requiresProfile: false, fields: [{ key: "date", label: "日期 YYYY-MM-DD", placeholder: "默认今天" }] },
  { id: "name", name: "姓名测算", requiresProfile: false, fields: [{ key: "name", label: "姓名", placeholder: "如：张三" }, { key: "surnameLen", label: "姓氏字数", placeholder: "1" }] },
  { id: "word", name: "测字", requiresProfile: false, fields: [{ key: "chars", label: "汉字", placeholder: "1-3字" }, { key: "question", label: "所问", placeholder: "可选" }] },
  { id: "dream", name: "周公解梦", requiresProfile: false, fields: [{ key: "keyword", label: "梦境关键词", placeholder: "如：蛇" }] },
  { id: "tarot", name: "塔罗占卜", requiresProfile: false, fields: [{ key: "question", label: "所问之事", placeholder: "可选" }] },
  { id: "zodiac", name: "生肖运势", requiresProfile: true, hint: "使用当前档案" },
  { id: "horoscope", name: "西洋星座", requiresProfile: true, hint: "使用当前档案" },
  { id: "mbti", name: "MBTI配对", requiresProfile: false, fields: [{ key: "typeA", label: "类型A", placeholder: "INFP" }, { key: "typeB", label: "类型B", placeholder: "ENTJ" }] },
];
