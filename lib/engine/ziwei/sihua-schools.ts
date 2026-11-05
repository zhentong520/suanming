/**
 * 紫微生年四化流派（口径可配置体系 · 紫微侧）
 *
 * 十天干四化中，甲乙丙丁己辛癸七干各派完全一致；分歧集中在戊、庚、壬三干。
 * 依据来源：
 *  - 中华民国紫微斗数协会部落格《戊、庚和壬干的四化》各派对照表
 *  - shunshi.ai《两派四化分歧：只在戊庚壬的「科」》（2000 张随机盘实测比对）
 *  - 《紫微斗数全集·定禄权科忌四化诀》／《紫微斗数全书·安禄权科忌四星变化诀》
 */

export type SihuaSchool = "tongxing" | "quanshu" | "zhongzhou";

export interface SiHuaLike {
  star: string;
  hua: string;
}

export interface SihuaSchoolMeta {
  key: SihuaSchool;
  name: string;
  source: string;
  /** 与通行本的差异说明（无差异派省略） */
  diffNote: string;
}

export const SIHUA_SCHOOL_ORDER: SihuaSchool[] = ["tongxing", "quanshu", "zhongzhou"];

export const SIHUA_SCHOOL_META: Record<SihuaSchool, SihuaSchoolMeta> = {
  tongxing: {
    key: "tongxing",
    name: "通行本（默认）",
    source: "《紫微斗数全集·定禄权科忌四化诀》，业界主流，iztro 等开源引擎同此",
    diffNote: "",
  },
  quanshu: {
    key: "quanshu",
    name: "《紫微斗数全书》",
    source: "《紫微斗数全书·安禄权科忌四星变化诀》",
    diffNote: "庚干取天同化科、太阴化忌（天同福星不化忌之说）；壬干取天府化科",
  },
  zhongzhou: {
    key: "zhongzhou",
    name: "中州派（王亭之）",
    source: "王亭之整理中州派体系",
    diffNote: "左辅、右弼不入四化：戊干改太阳化科，庚干、壬干改天府化科",
  },
};

export function normalizeSihuaSchool(v?: string | null): SihuaSchool {
  return v === "quanshu" || v === "zhongzhou" ? v : "tongxing";
}

/** 各派相对通行本的覆盖表：仅戊、庚、壬三干（与通行本一致的干不列） */
const SCHOOL_OVERRIDES: Record<Exclude<SihuaSchool, "tongxing">, Record<string, SiHuaLike[]>> = {
  quanshu: {
    戊: [
      { star: "贪狼", hua: "禄" },
      { star: "太阴", hua: "权" },
      { star: "右弼", hua: "科" },
      { star: "天机", hua: "忌" },
    ],
    庚: [
      { star: "太阳", hua: "禄" },
      { star: "武曲", hua: "权" },
      { star: "天同", hua: "科" },
      { star: "太阴", hua: "忌" },
    ],
    壬: [
      { star: "天梁", hua: "禄" },
      { star: "紫微", hua: "权" },
      { star: "天府", hua: "科" },
      { star: "武曲", hua: "忌" },
    ],
  },
  zhongzhou: {
    戊: [
      { star: "贪狼", hua: "禄" },
      { star: "太阴", hua: "权" },
      { star: "太阳", hua: "科" },
      { star: "天机", hua: "忌" },
    ],
    庚: [
      { star: "太阳", hua: "禄" },
      { star: "武曲", hua: "权" },
      { star: "天府", hua: "科" },
      { star: "天同", hua: "忌" },
    ],
    壬: [
      { star: "天梁", hua: "禄" },
      { star: "紫微", hua: "权" },
      { star: "天府", hua: "科" },
      { star: "武曲", hua: "忌" },
    ],
  },
};

/**
 * 按流派取生年四化。
 * school=tongxing 或未指定的干 → 沿用通行本 SI_HUA_TABLE；
 * 覆盖表未列出的天干（七共识干）各派一致，直接走通行本。
 */
export function getSiHuaBySchool(
  yearGan: string,
  school: SihuaSchool,
  fallback: (gan: string) => SiHuaLike[]
): SiHuaLike[] {
  if (school === "tongxing") return fallback(yearGan);
  const override = SCHOOL_OVERRIDES[school][yearGan];
  return override ?? fallback(yearGan);
}

/** 派别生效的星→化映射（供 iztro 全量星曜重标 [生年化] 用） */
export function mutagenMapBySchool(
  yearGan: string,
  school: SihuaSchool,
  fallback: (gan: string) => SiHuaLike[]
): Record<string, string> {
  const list = getSiHuaBySchool(yearGan, school, fallback);
  const map: Record<string, string> = {};
  for (const s of list) map[s.star] = s.hua;
  return map;
}

/** 当前派别是否对该年干有实质影响（用于决定是否重标 iztro 标签/展示提示） */
export function schoolAffectsGan(yearGan: string, school: SihuaSchool): boolean {
  return school !== "tongxing" && ["戊", "庚", "壬"].includes(yearGan);
}
