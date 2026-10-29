"use client";

import { useLocale } from "@/components/site/LocaleProvider";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="disclaimer">
      <p>{t("common.disclaimer")}</p>
      <p className="disclaimer-verse">{t("common.disclaimerVerse")}</p>
    </footer>
  );
}
