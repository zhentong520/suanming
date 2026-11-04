"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/site/Guofeng";
import { CompassWheel, type CompassNode } from "@/components/site/CompassWheel";
import { BlurFade, NumberTicker, ShimmerLink } from "@/components/site/MagicUI";
import { useLocale } from "@/components/site/LocaleProvider";
import { getModuleDescription, getModuleName } from "@/lib/hub/module-i18n";
import { SITE_NAME } from "@/lib/site-config";

type HomeModule = {
  id: string;
  name: string;
  path: string;
  category: string;
  description?: string;
  implemented?: boolean;
  sortOrder?: number;
};

type AlmanacBrief = {
  lunarDate: string;
  shengXiao: string;
  wuXing: string;
  yi: string[];
  ji: string[];
  chong: string;
};

const COMPASS_OUTER_IDS = ["bazi", "chenggu", "yijing", "liuyao", "word", "almanac", "name", "match"];
const COMPASS_INNER_IDS = ["ziwei", "meihua", "lingqian", "tarot"];

export function HomeClient({
  moduleCount,
  homeModules,
  almanac,
}: {
  moduleCount: number;
  homeModules: HomeModule[];
  almanac: AlmanacBrief;
}) {
  const { locale, t } = useLocale();
  const en = locale === "en";

  const byId = new Map(homeModules.map((m) => [m.id, m]));
  const nameOf = (m: HomeModule) => getModuleName(m.id, locale, m.name);
  const descOf = (m: HomeModule) => getModuleDescription(m.id, locale, m.description ?? "");
  const pick = (ids: string[]): CompassNode[] =>
    ids
      .map((id) => byId.get(id))
      .filter((m): m is HomeModule => Boolean(m))
      .map((m) => ({ id: m.id, name: nameOf(m), path: m.path }));

  const compassOuter = pick(COMPASS_OUTER_IDS);
  const compassInner = pick(COMPASS_INNER_IDS);
  const bento = homeModules.filter(
    (m) => !COMPASS_OUTER_IDS.includes(m.id) && !COMPASS_INNER_IDS.includes(m.id),
  );

  const catLabel = (c: string) => t(`cat.${c}` as Parameters<typeof t>[0]);

  return (
    <div className="page-container">
      {/* ── 首屏：左文案 + 右罗盘 ── */}
      <section className="hero-split">
        <div className="hero-split__copy">
          <BlurFade>
            <p className="hero-eyebrow">{t("home.eyebrow")}</p>
          </BlurFade>
          <BlurFade delay={120}>
            <h1 className="hero-title hero-title--compact">{SITE_NAME}</h1>
          </BlurFade>
          <BlurFade delay={240}>
            <p className="hero-subtitle">
              {t("home.subtitle", { count: moduleCount })}
              <br />
              {t("home.subtitle2")}
            </p>
          </BlurFade>
          <BlurFade delay={340}>
            <div className="hero-stats">
              <span className="hero-stat">
                <NumberTicker value={moduleCount} className="hero-stat__num" />
                <span className="hero-stat__label">{en ? "Modules" : "大模块"}</span>
              </span>
              <span className="hero-stat-sep" aria-hidden>
                ✦
              </span>
              <span className="hero-stat">
                <span className="hero-stat__num">4</span>
                <span className="hero-stat__label">{en ? "Schools" : "大门类"}</span>
              </span>
            </div>
          </BlurFade>
          <BlurFade delay={440}>
            <div className="hero-actions">
              <ShimmerLink href="/profiles" className="shimmer-btn--lg">
                {t("home.cta.profiles")}
              </ShimmerLink>
              <Link className="btn-ghost" href="/almanac">
                {t("home.cta.almanac")}
              </Link>
            </div>
          </BlurFade>
        </div>

        <BlurFade delay={200} className="hero-split__wheel">
          <CompassWheel outer={compassOuter} inner={compassInner} almanac={almanac} />
        </BlurFade>
      </section>

      {/* ── Bento 看板：黄历大卡 + 模块混排 ── */}
      <section className="home-bento" id="bento">
        <SectionHeading title={t("home.modulesTitle")} subtitle={t("home.modulesSubtitle")} />
        <div className="bento-grid">
          <BlurFade className="bento-item bento-item--wide">
            <Link href="/almanac" className="bento-card bento-card--almanac">
              <span className="bento-badge bento-badge--gold">{t("nav.almanac")}</span>
              <p className="bento-almanac__date">{almanac.lunarDate}</p>
              <p className="bento-almanac__ganzhi">
                {almanac.shengXiao}
                {en ? " day · Na Yin " : "日 · 纳音 "}
                {almanac.wuXing}
              </p>
              <div className="bento-almanac__row bento-almanac__row--yi">
                <span className="almanac-label">{en ? "Suitable" : "宜"}</span>
                <span>{almanac.yi.slice(0, 6).join(" · ") || "—"}</span>
              </div>
              <div className="bento-almanac__row bento-almanac__row--ji">
                <span className="almanac-label">{en ? "Avoid" : "忌"}</span>
                <span>{almanac.ji.slice(0, 6).join(" · ") || "—"}</span>
              </div>
              <p className="bento-almanac__chong">
                {en ? "Clash: " : "冲煞："}
                {almanac.chong}
              </p>
            </Link>
          </BlurFade>

          {bento.map((m, i) => (
            <BlurFade key={m.id} delay={Math.min(i, 8) * 90} className="bento-item">
              <Link href={m.path} className="bento-card">
                <span className="bento-badge">{catLabel(m.category)}</span>
                <strong className="bento-card__name">{nameOf(m)}</strong>
                <p className="bento-card__desc">{descOf(m)}</p>
                <span className="bento-card__arrow" aria-hidden>
                  →
                </span>
              </Link>
            </BlurFade>
          ))}

          <BlurFade delay={720} className="bento-item bento-item--wide">
            <Link href="/modules" className="bento-card bento-card--all">
              <strong className="bento-card__name">
                {en ? `All ${moduleCount} modules` : `全部 ${moduleCount} 术`}
              </strong>
              <p className="bento-card__desc">
                {en ? "Browse the full module catalog" : "进入完整术数长廊，查看所有模块"}
              </p>
              <span className="bento-card__arrow" aria-hidden>
                →
              </span>
            </Link>
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
