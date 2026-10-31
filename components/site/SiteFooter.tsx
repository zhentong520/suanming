"use client";

import Link from "next/link";
import { useLocale } from "@/components/site/LocaleProvider";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="disclaimer">
      <nav className="footer-nav" aria-label="站点导航">
        <Link href="/modules">术数大全</Link>
        <span aria-hidden>·</span>
        <Link href="/knowledge">命理知识库</Link>
        <span aria-hidden>·</span>
        <Link href="/almanac">今日黄历</Link>
      </nav>
      <p>{t("common.disclaimer")}</p>
      <p className="disclaimer-verse">{t("common.disclaimerVerse")}</p>
    </footer>
  );
}
