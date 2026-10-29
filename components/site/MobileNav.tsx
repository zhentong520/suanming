"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptionalUser } from "@/components/site/UserProvider";
import { useOptionalLocale } from "@/components/site/LocaleProvider";

export function MobileNav() {
  const pathname = usePathname();
  const ctx = useOptionalUser();
  const i18n = useOptionalLocale();
  const t = i18n?.t ?? ((k: string) => k);
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname === "/login" || pathname === "/register";

  if (isAdmin) return null;

  const myHref = ctx?.user ? "/profiles" : "/login";
  const tabs = [
    { key: "home", href: "/", label: t("nav.home"), icon: "☰", active: pathname === "/" },
    {
      key: "modules",
      href: "/modules",
      label: t("nav.modules"),
      icon: "卦",
      active:
        pathname === "/modules" ||
        (pathname !== "/" &&
          !["/profiles", "/almanac", "/login", "/register", "/reports"].includes(pathname) &&
          !pathname.startsWith("/admin") &&
          !pathname.startsWith("/profile") &&
          !pathname.startsWith("/reports")),
    },
    {
      key: "profiles",
      href: "/profiles",
      label: t("nav.profiles"),
      icon: "档",
      active: pathname.startsWith("/profile"),
    },
    {
      key: "almanac",
      href: "/almanac",
      label: t("nav.almanac"),
      icon: "历",
      active: pathname === "/almanac",
    },
    {
      key: "mine",
      href: myHref,
      label: ctx?.user ? t("nav.mine") : t("nav.login"),
      icon: "我",
      active: isAuth || (Boolean(ctx?.user) && pathname.startsWith("/profile")),
    },
  ];

  return (
    <nav className="mobile-nav" aria-label={t("nav.home")}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`mobile-nav-item${tab.active ? " mobile-nav-item--active" : ""}`}
        >
          <span className="mobile-nav-icon" aria-hidden>
            {tab.icon}
          </span>
          <span className="mobile-nav-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
