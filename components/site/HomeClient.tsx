"use client";

import Link from "next/link";
import { ScrollCard, SealBadge, SectionHeading } from "@/components/site/Guofeng";
import { FortuneCategoryTabs } from "@/components/site/FortuneCategoryTabs";
import { BambooDivider } from "@/components/site/Decorations";
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
};

type AlmanacBrief = {
  lunarDate: string;
  shengXiao: string;
  wuXing: string;
  yi: string[];
  ji: string[];
  chong: string;
};

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
  const items = homeModules.map((m) => ({
    ...m,
    name: getModuleName(m.id, locale, m.name),
    description: getModuleDescription(m.id, locale, m.description ?? ""),
  }));

  return (
    <div className="page-container">
      <section className="hero-section">
        <div className="hero-ornament hero-ornament--left" aria-hidden>
          命
        </div>
        <div className="hero-content">
          <p className="hero-eyebrow">{t("home.eyebrow")}</p>
          <h1 className="hero-title">{SITE_NAME}</h1>
          <p className="hero-subtitle">
            {t("home.subtitle", { count: moduleCount })}
            <br />
            {t("home.subtitle2")}
          </p>
          <div className="hero-actions">
            <Link href="/profiles" className="btn-primary btn-primary--lg">
              {t("home.cta.profiles")}
            </Link>
            <Link href="/almanac" className="btn-ghost">
              {t("home.cta.almanac")}
            </Link>
          </div>
        </div>
        <div className="hero-ornament hero-ornament--right" aria-hidden>
          理
        </div>
      </section>

      <BambooDivider />

      <div className="home-grid">
        <ScrollCard title={t("nav.almanac")} variant="hero">
          <div className="almanac-card">
            <div className="almanac-date">
              <SealBadge variant="gold">{almanac.lunarDate}</SealBadge>
              <span className="almanac-ganzhi">
                {almanac.shengXiao}
                {locale === "en" ? " day · Na Yin " : "日 · 纳音 "}
                {almanac.wuXing}
              </span>
            </div>
            <div className="almanac-row almanac-row--yi">
              <span className="almanac-label">{locale === "en" ? "Suitable" : "宜"}</span>
              <span>{almanac.yi.slice(0, 8).join(" · ") || "—"}</span>
            </div>
            <div className="almanac-row almanac-row--ji">
              <span className="almanac-label">{locale === "en" ? "Avoid" : "忌"}</span>
              <span>{almanac.ji.slice(0, 8).join(" · ") || "—"}</span>
            </div>
            <p className="almanac-chong">
              {locale === "en" ? "Clash: " : "冲煞："}
              {almanac.chong}
            </p>
            <Link href="/almanac" className="almanac-link">
              {locale === "en" ? "Full almanac →" : "查看完整黄历 →"}
            </Link>
          </div>
        </ScrollCard>

        <div className="home-features">
          <div className="feature-pill">
            <span className="feature-pill-icon">命</span>
            <div>
              <strong>{t("cat.命")}</strong>
              <p>BaZi · Zi Wei · Chenggu</p>
            </div>
          </div>
          <div className="feature-pill">
            <span className="feature-pill-icon">卜</span>
            <div>
              <strong>{t("cat.卜")}</strong>
              <p>I Ching · Liu Yao · Meihua</p>
            </div>
          </div>
          <div className="feature-pill">
            <span className="feature-pill-icon">术</span>
            <div>
              <strong>{t("cat.术")}</strong>
              <p>Almanac · Match · Name</p>
            </div>
          </div>
        </div>
      </div>

      <section className="home-modules" id="modules">
        <SectionHeading title={t("home.modulesTitle")} subtitle={t("home.modulesSubtitle")} />
        <FortuneCategoryTabs items={items} />
      </section>
    </div>
  );
}
