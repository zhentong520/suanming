import { astro } from "iztro";
import { BRANCHES } from "./placement";

/**
 * iztro 桥接层：直接采用开源 iztro（MIT）作为紫微全量星曜排盘引擎，
 * 将星曜覆盖从自研约 45 颗提升到 100+ 颗（含乙级星、截空旬空、
 * 长生十二神、博士十二神、岁前十二星、将前十二星）。
 * 本项目保留自研的四化飞星、大限流年体系与全部解读层。
 */
export interface IztroBridgeResult {
  /** 十二宫全量星曜串（主星带亮度 + 辅星 + 杂耀），按宫名索引 */
  palaceFullStars: Record<string, string[]>;
  /** 主星亮度表（star → brightness），口径统一用 iztro（业界主流） */
  brightness: Record<string, string>;
  /** 主星落宫（star → palace），供亮度核对 */
  starPalace: Record<string, string>;
  /** 命主星（真·命主，来自 iztro） */
  soulStar: string;
  /** 身主星 */
  bodyStar: string;
  /** 五行局名 */
  fiveElementsClass: string;
  /** 长生十二神（按宫） */
  changSheng12: Array<{ branch: string; star: string }>;
  /** 博士十二神（iztro 通行安法，与自算互为交叉验证） */
  boShi12: Array<{ branch: string; star: string }>;
  /** 岁前十二星（流年神煞） */
  suiQian12: Array<{ branch: string; star: string }>;
  /** 将前十二星（流年神煞） */
  jiangQian12: Array<{ branch: string; star: string }>;
  /** 西洋星座（iztro 附带） */
  sign: string;
}

export function computeIztroAstrolabe(params: {
  solarYmd: string;
  hourZhiIdx: number;
  gender: string;
}): IztroBridgeResult {
  const { solarYmd, hourZhiIdx, gender } = params;
  const [y, m, d] = solarYmd.split("-").map((n) => Number(n));
  // iztro timeIndex：0=早子…11=亥，12=晚子时
  const timeIndex = hourZhiIdx === 0 ? 0 : hourZhiIdx;
  const ast = astro.bySolar(
    `${y}-${m}-${d}`,
    timeIndex,
    gender === "女" ? "女" : "男",
    true,
    "zh-CN",
  );

  const palaceFullStars: Record<string, string[]> = {};
  const brightness: Record<string, string> = {};
  const starPalace: Record<string, string> = {};
  for (const p of ast.palaces) {
    for (const s of p.majorStars) {
      brightness[s.name] = s.brightness ?? "";
      starPalace[s.name] = p.name;
    }
    const fmt = (s: { name: string; brightness?: string; mutagen?: string }) =>
      `${s.name}${s.brightness ? `(${s.brightness})` : ""}${s.mutagen ? `[生年化${s.mutagen}]` : ""}`;
    palaceFullStars[p.name] = [
      ...p.majorStars.map(fmt),
      ...p.minorStars.map(fmt),
      ...p.adjectiveStars.map((s) => s.name),
    ];
  }

  const collectGroup = (key: "changsheng12" | "boshi12" | "suiqian12" | "jiangqian12") =>
    ast.palaces.map((p) => {
      const raw = (p as unknown as Record<string, unknown>)[key];
      const star = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0]?.name : undefined;
      return {
        branch: p.earthlyBranch,
        star: star ?? "—",
      };
    });

  return {
    palaceFullStars,
    brightness,
    starPalace,
    soulStar: ast.soul,
    bodyStar: ast.body,
    fiveElementsClass: ast.fiveElementsClass,
    changSheng12: collectGroup("changsheng12"),
    boShi12: collectGroup("boshi12"),
    suiQian12: collectGroup("suiqian12"),
    jiangQian12: collectGroup("jiangqian12"),
    sign: ast.sign,
  };
}

export function formatIztroGroup(items: Array<{ branch: string; star: string }>): string {
  return items.map((x) => `${x.star}在${x.branch}`).join("、");
}

export function branchIndex(branch: string): number {
  return BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
}

export interface LiuYaoXingResult {
  /** 流年干支（如 丙午） */
  liuNianGanZhi: string;
  /** 流年四化四星（禄权科忌序） */
  liuNianMutagen: string[];
  /** 流年流曜落宫（流禄/流羊/流陀/流昌/流曲/流魁/流钺/流鸾/流喜/流马/年解） */
  liuNianStars: Array<{ branch: string; stars: string[] }>;
  /** 大限流曜落宫（运禄/运魁…） */
  daXianStars: Array<{ branch: string; stars: string[] }>;
  /** 当前大限宫名 */
  daXianPalace: string;
  /** 流年落宫 */
  liuNianPalace: string;
  /** 流月干支 + 四化 + 月曜落宫（月禄/月羊/月陀/月昌/月曲/月魁/月钺/月鸾/月喜/月马） */
  liuYueGanZhi: string;
  liuYueMutagen: string[];
  liuYueStars: Array<{ branch: string; stars: string[] }>;
  /** 流日干支 + 四化 + 日曜落宫（日禄/日羊/日陀/日昌/日曲/日魁/日钺/日鸾/日喜/日马） */
  liuRiGanZhi: string;
  liuRiMutagen: string[];
  liuRiStars: Array<{ branch: string; stars: string[] }>;
}

/** 流年/大限流曜（iztro horoscope）：流禄流羊流陀流昌流曲流魁流钺流鸾流喜流马十曜 + 流年四化 */
export function computeLiuYaoXing(params: {
  solarYmd: string;
  hourZhiIdx: number;
  gender: string;
  dateStr?: string;
}): LiuYaoXingResult {
  const { solarYmd, hourZhiIdx, gender } = params;
  const [y, m, d] = solarYmd.split("-").map((n) => Number(n));
  const timeIndex = hourZhiIdx === 0 ? 0 : hourZhiIdx;
  const ast = astro.bySolar(`${y}-${m}-${d}`, timeIndex, gender === "女" ? "女" : "男", true, "zh-CN");
  const now = params.dateStr ? new Date(params.dateStr) : new Date();
  const hz = ast.horoscope(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);

  const mapStars = (arr: unknown) =>
    (Array.isArray(arr) ? arr : []).map((group: unknown, i: number) => ({
      branch: BRANCHES[(i + 2) % 12] ?? "",
      stars: (Array.isArray(group) ? group : [])
        .map((s: { name: string }) => s.name as string),
    }));

  return {
    liuNianGanZhi: `${hz.yearly.heavenlyStem}${hz.yearly.earthlyBranch}`,
    liuNianMutagen: hz.yearly.mutagen ?? [],
    liuNianStars: mapStars(hz.yearly.stars).filter((x) => x.stars.length > 0),
    daXianStars: mapStars(hz.decadal.stars).filter((x) => x.stars.length > 0),
    daXianPalace: hz.decadal.name ?? "",
    liuNianPalace: hz.yearly.name ?? "",
    liuYueGanZhi: `${hz.monthly.heavenlyStem}${hz.monthly.earthlyBranch}`,
    liuYueMutagen: hz.monthly.mutagen ?? [],
    liuYueStars: mapStars(hz.monthly.stars).filter((x) => x.stars.length > 0),
    liuRiGanZhi: `${hz.daily.heavenlyStem}${hz.daily.earthlyBranch}`,
    liuRiMutagen: hz.daily.mutagen ?? [],
    liuRiStars: mapStars(hz.daily.stars).filter((x) => x.stars.length > 0),
  };
}
