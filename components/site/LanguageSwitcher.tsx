"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/site/LocaleProvider";
import type { Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    router.refresh();
  }

  return (
    <div className={`lang-switch${compact ? " lang-switch--compact" : ""}`} role="group" aria-label="Language">
      <button
        type="button"
        className={`lang-switch-btn${locale === "zh" ? " lang-switch-btn--active" : ""}`}
        onClick={() => switchTo("zh")}
      >
        {t("common.lang.zh")}
      </button>
      <button
        type="button"
        className={`lang-switch-btn${locale === "en" ? " lang-switch-btn--active" : ""}`}
        onClick={() => switchTo("en")}
      >
        {t("common.lang.en")}
      </button>
    </div>
  );
}
