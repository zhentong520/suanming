import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { profiles, reports } from "../db/schema";
import { getModuleDefinition } from "./module-registry";
import { BirthInput } from "../engine/calendar";
import { computeBazi, computeBaziDayun, computeBaziWithReading, resolveBaziFromPillars } from "../engine/bazi";
import { computeChenggu } from "../engine/chenggu";
import { computeZodiac } from "../engine/zodiac";
import { computeNameWuge, suggestNaming } from "../engine/name-wuge";
import { computeWordDivination } from "../engine/word-divination";
import { computeAlmanac } from "../engine/almanac";
import { computeMatchmaking } from "../engine/matchmaking";
import { computeZiwei } from "../engine/ziwei";
import { computeYijing, computeLiuyao, computeMeihua, computeXiaoliuren } from "../engine/yijing";
import { computeLingqian } from "../engine/lingqian";
import { interpretDream } from "../engine/dream";
import { computeHoroscope } from "../engine/horoscope";
import { computeTarot } from "../engine/tarot";
import { computeHeluo, computeQizheng } from "../engine/heluo-qizheng";
import { computeQimen, computeDaliuren, computeTaiyi, computeBeijiao } from "../engine/qimen-daliuren";
import { computeFaceReading, computePalmReading, computeFaceReadingFromImage, computePalmReadingFromImage } from "../engine/face-palm";
import { getReadingImage, readImageAsDataUrl } from "../media/reading-image";
import { computeFengshui } from "../engine/fengshui";
import { computeNumerology } from "../engine/numerology";
import { computeVedic } from "../engine/vedic";
import { computeMbtiMatch } from "../engine/mbti";
import { computeWuxingRen } from "../engine/wuxing-ren";
import { computeTiaoyun } from "../engine/tiaoyun";
import { enrichModuleFacts } from "../engine/enrich-readings";
import { renderTemplateReport } from "../report/template-renderer";
import { maybeEnhanceWithAi } from "../ai/interpret";
import { incrementModuleStats } from "../admin/module-stats";
import type { Locale } from "../i18n/config";
import { parseLocale } from "../i18n/config";
import { getPointsStatus } from "../billing/points";
import type { YaoLine } from "../engine/shared/iching-lines";
import { valueToLineType } from "../engine/shared/iching-lines";
import { buildBaziAdminInsights } from "../engine/bazi/admin-insights";
import { buildFacePalmAdminInsights } from "../engine/face-palm/admin-insights";

function attachAdminInsights(
  moduleId: string,
  facts: Record<string, unknown>,
  birth?: BirthInput
): Record<string, unknown> {
  if (moduleId === "face" || moduleId === "palm") {
    let birthInsights = null;
    if (birth) {
      try {
        const bazi = computeBazi(birth);
        const dy = computeBaziDayun(birth);
        birthInsights = buildBaziAdminInsights({
          dayMasterElement: bazi.dayMasterElement,
          tenGods: bazi.tenGods,
          usefulGods: bazi.yongShen?.usefulGods,
          avoidGods: bazi.yongShen?.avoidGods,
          geJuName: bazi.geJu?.name,
          gender: birth.gender,
          strength: bazi.strength,
          daYunList: dy.daYun,
          liuNianList: dy.liuNian,
        });
      } catch {
        birthInsights = null;
      }
    }

    const insights = buildFacePalmAdminInsights({
      module: moduleId,
      features: Array.isArray(facts.features) ? (facts.features as string[]) : [],
      combos: Array.isArray(facts.combos)
        ? (facts.combos as Array<{ title: string; meaning: string }>)
        : undefined,
      birthInsights,
    });
    return { ...facts, adminInsights: insights };
  }

  if (moduleId !== "bazi" && moduleId !== "bazi-dayun") return facts;

  let daYunList = Array.isArray(facts.daYun)
    ? (facts.daYun as Array<{
        ganZhi: string;
        startYear: number;
        endYear: number;
        startAge?: number;
        endAge?: number;
        yongShenLabel?: string;
        isCurrent?: boolean;
      }>)
    : undefined;
  let liuNianList = Array.isArray(facts.liuNian)
    ? (facts.liuNian as Array<{
        year: number;
        ganZhi: string;
        age?: number;
        yongShenLabel?: string;
      }>)
    : undefined;

  if (moduleId === "bazi" && birth && (!daYunList || !daYunList.length)) {
    try {
      const dy = computeBaziDayun(birth);
      daYunList = dy.daYun;
      liuNianList = dy.liuNian;
    } catch {
      /* ignore */
    }
  }

  const yong = facts.yongShen as
    | { usefulGods?: string[]; avoidGods?: string[] }
    | undefined;
  const geJu = facts.geJu as { name?: string } | undefined;
  const insights = buildBaziAdminInsights({
    dayMasterElement: String(facts.dayMasterElement ?? facts.element ?? "土"),
    tenGods: Array.isArray(facts.tenGods) ? (facts.tenGods as string[]) : undefined,
    usefulGods: yong?.usefulGods,
    avoidGods: yong?.avoidGods,
    geJuName: geJu?.name,
    gender: birth?.gender,
    strength: typeof facts.strength === "string" ? facts.strength : undefined,
    daYunList,
    liuNianList,
  });

  return { ...facts, adminInsights: insights };
}

function parseYaoLinesParam(raw: unknown): YaoLine[] | undefined {
  if (!Array.isArray(raw) || raw.length !== 6) return undefined;
  const lines: YaoLine[] = [];
  for (let i = 0; i < 6; i++) {
    const item = raw[i];
    const value = typeof item === "number" ? item : Number((item as { value?: number })?.value);
    if (![6, 7, 8, 9].includes(value)) return undefined;
    const v = value as 6 | 7 | 8 | 9;
    const type = valueToLineType(v);
    lines.push({
      position: i + 1,
      type,
      value: v,
      changing: v === 6 || v === 9,
      meaning:
        type === "老阴"
          ? "老阴动爻，阴极将变阳，事有转折。"
          : type === "老阳"
            ? "老阳动爻，阳极将变阴，盛极而衰。"
            : type === "少阳"
              ? "少阳静爻，阳气初生，势在未发。"
              : "少阴静爻，阴气内藏，宜静观其变。",
    });
  }
  return lines;
}

export interface ModuleInput {
  profileId?: string;
  userId?: string;
  module: string;
  params?: Record<string, unknown>;
  /** Direct birth data for MCP / scripts when no profileId */
  birth?: BirthInput;
  /** Skip AI enhancement (MCP / batch default) */
  skipAi?: boolean;
  /** UI / AI language */
  locale?: Locale;
}

export interface ModuleOutput {
  module: string;
  reportId?: string;
  facts: Record<string, unknown>;
  scores?: Record<string, number>;
  templateReport: string;
  aiReport?: string;
  caveats: string[];
  pointsSpent?: number;
  pointsBalance?: number | null;
  pointsUnlimited?: boolean;
  /** @deprecated use pointsBalance */
  aiQuota?: {
    used: number;
    limit: number;
    remaining: number | null;
    unlimited: boolean;
  };
}

async function getProfileBirthInput(profileId: string): Promise<BirthInput> {
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  if (!profile) throw new Error("档案不存在");
  return {
    calendarType: profile.calendarType as "solar" | "lunar",
    year: profile.birthYear,
    month: profile.birthMonth,
    day: profile.birthDay,
    hour: profile.birthHour,
    minute: profile.birthMinute ?? 0,
    gender: profile.gender,
    longitude: profile.birthLongitude ?? undefined,
    latitude: profile.birthLatitude ?? undefined,
    location: profile.birthLocation ?? undefined,
  };
}

export async function runModule(input: ModuleInput): Promise<ModuleOutput> {
  const def = getModuleDefinition(input.module);
  if (!def) throw new Error(`未知模块: ${input.module}`);
  if (!def.implemented) throw new Error(`模块「${def.name}」尚未实现，敬请期待。`);

  const params = input.params ?? {};
  const locale = parseLocale(
    (typeof params.locale === "string" ? params.locale : null) ?? input.locale ?? null
  );
  let facts: Record<string, unknown> = {};
  let scores: Record<string, number> | undefined;
  const caveats = [
    locale === "en"
      ? "For cultural study and entertainment only; not professional advice."
      : "本结果仅供文化研习与娱乐参考，不构成专业建议。",
  ];

  const profileInput = input.profileId
    ? await getProfileBirthInput(input.profileId)
    : input.birth;

  switch (input.module) {
    case "bazi": {
      if (!profileInput) throw new Error("八字排盘需要档案");
      facts = computeBaziWithReading(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "bazi-dayun": {
      if (!profileInput) throw new Error("大运流年需要档案");
      facts = computeBaziDayun(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "bazi-resolve": {
      facts = resolveBaziFromPillars(String(params.pillars ?? "")) as unknown as Record<string, unknown>;
      break;
    }
    case "chenggu": {
      if (!profileInput) throw new Error("称骨算命需要档案");
      facts = computeChenggu(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "zodiac": {
      if (!profileInput) throw new Error("生肖运势需要档案");
      facts = computeZodiac(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "name": {
      facts = computeNameWuge(String(params.name ?? ""), {
        surnameLen: Number(params.surnameLen ?? 1),
        birth: profileInput,
      }) as unknown as Record<string, unknown>;
      scores = { total: (facts as { totalScore: number }).totalScore };
      break;
    }
    case "naming": {
      facts = suggestNaming({
        surname: String(params.surname ?? "张"),
        preferredWuxing: params.preferredWuxing ? String(params.preferredWuxing) : undefined,
        gender: params.gender ? String(params.gender) : profileInput?.gender,
        givenLen: params.givenLen != null ? Number(params.givenLen) : 2,
        count: Number(params.count ?? 8),
        birth: profileInput,
      }) as unknown as Record<string, unknown>;
      const best = (facts as { candidates?: Array<{ score: number }> }).candidates?.[0]?.score;
      if (best != null) scores = { total: best };
      break;
    }
    case "word": {
      facts = computeWordDivination(String(params.chars ?? ""), params.question as string | undefined) as unknown as Record<string, unknown>;
      break;
    }
    case "almanac": {
      facts = computeAlmanac(params.date as string | undefined, profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "match": {
      const profileIdB = String(params.profileIdB ?? "").trim();
      if (!profileInput || !profileIdB) throw new Error("合婚配对需要两个档案");
      if (input.profileId && profileIdB === input.profileId) {
        throw new Error("请选择与当前档案不同的对方档案");
      }
      const db = getDb();
      const [profileBRow] = await db.select().from(profiles).where(eq(profiles.id, profileIdB)).limit(1);
      if (!profileBRow) throw new Error("对方档案不存在");
      if (input.userId && profileBRow.userId && profileBRow.userId !== input.userId) {
        throw new Error("只能选择本人名下的档案进行合婚");
      }
      const profileB: BirthInput = {
        calendarType: profileBRow.calendarType as "solar" | "lunar",
        year: profileBRow.birthYear,
        month: profileBRow.birthMonth,
        day: profileBRow.birthDay,
        hour: profileBRow.birthHour,
        minute: profileBRow.birthMinute ?? 0,
        gender: profileBRow.gender,
        location: profileBRow.birthLocation ?? undefined,
        longitude: profileBRow.birthLongitude ?? undefined,
        latitude: profileBRow.birthLatitude ?? undefined,
      };
      const result = computeMatchmaking(profileInput, profileB);
      facts = result as unknown as Record<string, unknown>;
      scores = result.scores;
      break;
    }
    case "ziwei": {
      if (!profileInput) throw new Error("紫微斗数需要档案");
      facts = computeZiwei(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "yijing": {
      facts = computeYijing(
        params.question as string | undefined,
        undefined,
        parseYaoLinesParam(params.yaoLines)
      ) as unknown as Record<string, unknown>;
      break;
    }
    case "liuyao": {
      facts = computeLiuyao(
        params.question as string | undefined,
        undefined,
        parseYaoLinesParam(params.yaoLines)
      ) as unknown as Record<string, unknown>;
      break;
    }
    case "meihua": {
      facts = computeMeihua(
        params.question as string | undefined,
        params.numbers as number[] | undefined
      ) as unknown as Record<string, unknown>;
      break;
    }
    case "xiaoliuren": {
      facts = computeXiaoliuren(params.question as string | undefined) as unknown as Record<string, unknown>;
      break;
    }
    case "lingqian": {
      facts = computeLingqian(
        params.question as string | undefined,
        params.seed != null ? Number(params.seed) : undefined
      ) as unknown as Record<string, unknown>;
      break;
    }
    case "dream": {
      facts = interpretDream(String(params.keyword ?? "")) as unknown as Record<string, unknown>;
      break;
    }
    case "horoscope": {
      if (!profileInput) throw new Error("星座运势需要档案");
      facts = computeHoroscope(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "tarot": {
      facts = computeTarot(
        params.question as string | undefined,
        Number(params.spread ?? 3),
        params.seed != null ? Number(params.seed) : undefined
      ) as unknown as Record<string, unknown>;
      break;
    }
    case "heluo": {
      if (!profileInput) throw new Error("河洛理数需要档案");
      facts = computeHeluo(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "qizheng": {
      if (!profileInput) throw new Error("七政四余需要档案");
      facts = computeQizheng(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "qimen": {
      facts = computeQimen(params.question as string | undefined) as unknown as Record<string, unknown>;
      break;
    }
    case "daliuren": {
      facts = computeDaliuren(params.question as string | undefined) as unknown as Record<string, unknown>;
      break;
    }
    case "taiyi": {
      facts = computeTaiyi(params.question as string | undefined) as unknown as Record<string, unknown>;
      break;
    }
    case "beijiao": {
      facts = computeBeijiao(params.question as string | undefined) as unknown as Record<string, unknown>;
      break;
    }
    case "face": {
      const imageId = params.imageId ? String(params.imageId) : "";
      if (imageId && input.userId) {
        const meta = await getReadingImage(input.userId, imageId);
        if (!meta || meta.module !== "face") throw new Error("面相照片不存在或无权访问");
        const dataUrl = await readImageAsDataUrl(meta);
        facts = (await computeFaceReadingFromImage(dataUrl, imageId, input.userId)) as unknown as Record<string, unknown>;
      } else {
        const featureStr = String(params.features ?? "");
        const featureList = featureStr ? featureStr.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) : [];
        facts = computeFaceReading(featureList) as unknown as Record<string, unknown>;
      }
      break;
    }
    case "palm": {
      const imageId = params.imageId ? String(params.imageId) : "";
      if (imageId && input.userId) {
        const meta = await getReadingImage(input.userId, imageId);
        if (!meta || meta.module !== "palm") throw new Error("手相照片不存在或无权访问");
        const dataUrl = await readImageAsDataUrl(meta);
        facts = (await computePalmReadingFromImage(dataUrl, imageId, input.userId)) as unknown as Record<string, unknown>;
      } else {
        const featureStr = String(params.features ?? "");
        const featureList = featureStr ? featureStr.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) : [];
        facts = computePalmReading(featureList) as unknown as Record<string, unknown>;
      }
      break;
    }
    case "fengshui": {
      if (!profileInput) throw new Error("风水分析需要档案");
      facts = computeFengshui(profileInput, {
        facing: params.facing as string | undefined,
        sitting: params.sitting as string | undefined,
        houseYear: params.houseYear != null ? Number(params.houseYear) : undefined,
      }) as unknown as Record<string, unknown>;
      break;
    }
    case "numerology": {
      if (!profileInput) throw new Error("数字命理需要档案");
      facts = computeNumerology(profileInput, params.fullName as string | undefined) as unknown as Record<string, unknown>;
      break;
    }
    case "vedic": {
      if (!profileInput) throw new Error("吠陀占星需要档案");
      facts = computeVedic(profileInput) as unknown as Record<string, unknown>;
      break;
    }
    case "mbti": {
      const result = computeMbtiMatch(String(params.typeA ?? ""), String(params.typeB ?? ""));
      facts = result as unknown as Record<string, unknown>;
      scores = { total: result.score };
      break;
    }
    case "wuxing-ren": {
      facts = computeWuxingRen({
        bodyType: params.bodyType ? String(params.bodyType) : undefined,
        date: params.date ? String(params.date) : undefined,
        birth: profileInput,
      }) as unknown as Record<string, unknown>;
      break;
    }
    case "tiaoyun": {
      facts = computeTiaoyun({
        concern: params.concern ? String(params.concern) : undefined,
        focus: params.focus ? String(params.focus) : undefined,
        birth: profileInput,
      }) as unknown as Record<string, unknown>;
      break;
    }
    default:
      throw new Error(`模块「${def.name}」尚未实现`);
  }

  facts = enrichModuleFacts(input.module, facts, locale);
  facts = attachAdminInsights(input.module, facts, profileInput ?? input.birth);

  const templateReport = renderTemplateReport(input.module, facts, scores);
  const skipAiEnhance =
    input.skipAi === true ||
    (facts.source === "image" && (input.module === "face" || input.module === "palm"));
  const aiReport = skipAiEnhance
    ? undefined
    : await maybeEnhanceWithAi(input.module, facts, templateReport, input.userId, locale);

  let pointsBalance: number | null = null;
  let pointsUnlimited = false;
  if (input.userId) {
    const p = await getPointsStatus(input.userId);
    pointsBalance = p.unlimited ? null : p.balance;
    pointsUnlimited = p.unlimited;
  }

  await incrementModuleStats(input.module);

  let reportId: string | undefined;
  if (input.profileId || input.userId) {
    const db = getDb();
    reportId = crypto.randomUUID();
    await db.insert(reports).values({
      id: reportId,
      userId: input.userId ?? null,
      profileId: input.profileId ?? null,
      moduleId: input.module,
      factsJson: JSON.stringify(facts),
      templateReport,
      aiReport: aiReport ?? null,
      pointsSpent: 0,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    module: input.module,
    reportId,
    facts,
    scores,
    templateReport,
    aiReport,
    caveats,
    pointsSpent: 0,
    pointsBalance,
    pointsUnlimited,
  };
}
