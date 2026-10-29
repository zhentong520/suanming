"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SealStamp } from "@/components/site/Decorations";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { useOptionalUser } from "@/components/site/UserProvider";
import { useOptionalLocale } from "@/components/site/LocaleProvider";

export function SiteHeader() {
  const pathname = usePathname();
  const ctx = useOptionalUser();
  const i18n = useOptionalLocale();
  const t = i18n?.t ?? ((k: string) => k);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "易道命理";
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <header className="site-header site-header--admin">
        <div className="site-header-inner">
          <Link href="/admin" className="site-logo">
            <SealStamp text="管" />
            <span className="site-logo-text">管理后台</span>
          </Link>
          <Link href="/" className="site-nav-link site-nav-link--muted">
            返回站点
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          <SealStamp text="易" />
          <span className="site-logo-text">{siteName}</span>
        </Link>

        {ctx?.activeProfile && (
          <Link href="/profiles" className="site-header-profile-chip">
            <span className="site-header-profile-dot" aria-hidden />
            {ctx.activeProfile.name ?? "—"}
          </Link>
        )}

        {ctx?.user && ctx.points && (
          <Link
            href="/recharge"
            className="site-header-quota-chip"
            title={
              ctx.points.unlimited
                ? t("profiles.pointsUnlimited")
                : t("profiles.pointsBalance", { balance: ctx.points.balance })
            }
          >
            {ctx.points.unlimited
              ? t("common.pointsUnlimited")
              : t("common.pointsChip", { balance: ctx.points.balance })}
          </Link>
        )}

        <LanguageSwitcher compact />
        <ThemeToggle compact />

        <nav className="site-nav site-nav--desktop">
          {!isAuthPage && ctx?.user && (
            <>
              <Link href="/profiles" className="site-nav-link">
                {t("nav.profiles")}
              </Link>
              <Link href="/reports" className="site-nav-link">
                {t("nav.history")}
              </Link>
              <Link href="/recharge" className="site-nav-link">
                {t("nav.recharge")}
              </Link>
              <Link href="/almanac" className="site-nav-link">
                {t("nav.almanac")}
              </Link>
              <button type="button" className="site-nav-link site-nav-btn" onClick={() => ctx.logout()}>
                {t("nav.logout")}
              </button>
            </>
          )}
          {!isAuthPage && !ctx?.user && !ctx?.loading && (
            <>
              <Link href="/login" className="site-nav-link">
                {t("nav.login")}
              </Link>
              <Link href="/register" className="site-nav-link">
                {t("nav.register")}
              </Link>
            </>
          )}
          {isAuthPage && (
            <>
              <Link href="/login" className="site-nav-link">
                {t("nav.login")}
              </Link>
              <Link href="/register" className="site-nav-link">
                {t("nav.register")}
              </Link>
            </>
          )}
          {ctx?.user?.role === "admin" && (
            <Link href="/admin/login" className="site-nav-link site-nav-link--muted">
              {t("nav.admin")}
            </Link>
          )}
        </nav>
      </div>
      <div className="site-header-line" aria-hidden />
    </header>
  );
}
