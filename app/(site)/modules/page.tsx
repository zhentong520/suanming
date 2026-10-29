"use client";

import { SectionHeading } from "@/components/site/Guofeng";
import { FortuneCategoryTabs } from "@/components/site/FortuneCategoryTabs";
import { useLocale } from "@/components/site/LocaleProvider";
import { getModuleDescription, getModuleName } from "@/lib/hub/module-i18n";
import { MODULE_DEFINITIONS } from "@/lib/hub/module-registry";

export default function ModulesPage() {
  const { locale, t } = useLocale();
  const modules = MODULE_DEFINITIONS.filter((m) => m.implemented).map((m) => ({
    id: m.id,
    name: getModuleName(m.id, locale, m.name),
    path: m.path,
    category: m.category,
    description: getModuleDescription(m.id, locale, m.description),
    implemented: m.implemented,
  }));

  return (
    <div className="page-container page-container--modules">
      <header className="page-header">
        <p className="page-eyebrow">{t("nav.modules")}</p>
        <h1>{t("home.modulesTitle")}</h1>
        <p className="page-desc">{t("home.modulesSubtitle")}</p>
        <div className="page-header-line" aria-hidden />
      </header>
      <SectionHeading title={t("nav.modules")} subtitle={`${modules.length}`} />
      <FortuneCategoryTabs items={modules} />
    </div>
  );
}
