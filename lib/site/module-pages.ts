import { Suspense } from "react";
import { GenericModulePage } from "@/components/site/GenericModulePage";

const pages = [
  { path: "bazi-dayun", moduleId: "bazi-dayun", title: "大运流年", desc: "十年大运与流年", profile: true },
  { path: "bazi-resolve", moduleId: "bazi-resolve", title: "四柱反查", desc: "由四柱反推出生时间", fields: [{ name: "pillars", label: "四柱", required: true, placeholder: "甲子-乙丑-丙寅-丁卯" }] },
  { path: "ziwei", moduleId: "ziwei", title: "紫微斗数", desc: "紫微命盘十二宫", profile: true },
  { path: "yijing", moduleId: "yijing", title: "周易占卜", desc: "易经起卦", fields: [{ name: "question", label: "所问事项" }] },
  { path: "liuyao", moduleId: "liuyao", title: "六爻占卜", desc: "铜钱起卦", fields: [{ name: "question", label: "所问事项" }] },
  { path: "meihua", moduleId: "meihua", title: "梅花易数", desc: "时间数字起卦", fields: [{ name: "question", label: "所问事项" }] },
  { path: "xiaoliuren", moduleId: "xiaoliuren", title: "小六壬", desc: "小六壬速断", fields: [{ name: "question", label: "所问事项" }] },
  { path: "lingqian", moduleId: "lingqian", title: "灵签", desc: "观音灵签求签" },
  { path: "dream", moduleId: "dream", title: "周公解梦", desc: "梦境关键词解读", fields: [{ name: "keyword", label: "梦境关键词", required: true }] },
  { path: "horoscope", moduleId: "horoscope", title: "西洋星座", desc: "十二星座运势", profile: true },
  { path: "tarot", moduleId: "tarot", title: "塔罗占卜", desc: "塔罗牌阵", fields: [{ name: "question", label: "所问事项" }] },
  { path: "naming", moduleId: "naming", title: "起名取名", desc: "八字喜用+五格三才取名", fields: [{ name: "surname", label: "姓氏", defaultValue: "张" }, { name: "preferredWuxing", label: "偏好五行" }] },
];

export default pages;
