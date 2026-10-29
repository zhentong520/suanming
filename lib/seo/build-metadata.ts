import type { Metadata } from "next";
import { MODULE_DEFINITIONS } from "@/lib/hub/module-registry";
import { getModuleName, getModuleDescription } from "@/lib/hub/module-i18n";
import { getSiteUrl, SITE_DESCRIPTION, SITE_DESCRIPTION_EN, SITE_NAME } from "@/lib/site-config";
import type { Locale } from "@/lib/i18n/config";
import { ogLocale } from "@/lib/i18n/config";

const CATEGORY_GLYPH: Record<string, string> = {
  命: "命",
  卜: "卜",
  相: "相",
  术: "术",
};

function staticPages(locale: Locale): Record<string, { title: string; description: string }> {
  const desc = locale === "en" ? SITE_DESCRIPTION_EN : SITE_DESCRIPTION;
  if (locale === "en") {
    return {
      "/": { title: SITE_NAME, description: desc },
      "/modules": {
        title: "All modules",
        description: "Destiny, divination, physiognomy and arts — 31 classical modules",
      },
      "/profiles": {
        title: "My profiles",
        description: "Manage birth profiles for every module",
      },
      "/almanac": {
        title: "Almanac",
        description: "Daily suitable and unsuitable activities",
      },
      "/login": { title: "Log in", description: `Log in to ${SITE_NAME}` },
      "/register": { title: "Sign up", description: `Create a ${SITE_NAME} account` },
      "/reports": {
        title: "Reading history",
        description: "Revisit saved reading reports",
      },
    };
  }
  return {
    "/": { title: SITE_NAME, description: desc },
    "/modules": {
      title: "术数大全",
      description: "命卜相术四门齐备，三十一门术数在线测算",
    },
    "/profiles": {
      title: "我的档案",
      description: "管理出生档案，一次建档贯通全部术数模块",
    },
    "/almanac": {
      title: "黄历择日",
      description: "今日黄历宜忌、冲煞、吉神凶煞",
    },
    "/login": { title: "登录", description: `登录${SITE_NAME}` },
    "/register": { title: "注册", description: `注册${SITE_NAME}账号` },
    "/reports": {
      title: "测算历史",
      description: "复看过往测算报告",
    },
  };
}

function ogImageUrl(params: Record<string, string>): string {
  const qs = new URLSearchParams(params).toString();
  return `/api/og?${qs}`;
}

export function buildMetadataForPath(pathname: string, locale: Locale = "zh"): Metadata {
  const siteUrl = getSiteUrl();
  const path = pathname.split("?")[0] || "/";
  const pages = staticPages(locale);
  const siteDesc = locale === "en" ? SITE_DESCRIPTION_EN : SITE_DESCRIPTION;

  const staticMeta = pages[path];
  if (staticMeta) {
    const isHome = path === "/";
    return {
      title: staticMeta.title,
      description: staticMeta.description,
      openGraph: {
        locale: ogLocale(locale),
        title: staticMeta.title,
        description: staticMeta.description,
        url: `${siteUrl}${path === "/" ? "" : path}`,
        images: [
          {
            url: ogImageUrl(isHome ? { module: "home" } : { title: staticMeta.title, category: "术" }),
            width: 1200,
            height: 630,
            alt: staticMeta.title,
          },
        ],
      },
    };
  }

  const mod = MODULE_DEFINITIONS.find((m) => m.path === path);
  if (mod) {
    const name = getModuleName(mod.id, locale, mod.name);
    const description = getModuleDescription(mod.id, locale, mod.description);
    const title = `${name} · ${SITE_NAME}`;
    return {
      title: name,
      description,
      openGraph: {
        locale: ogLocale(locale),
        title,
        description,
        url: `${siteUrl}${mod.path}`,
        images: [
          {
            url: ogImageUrl({
              module: mod.id,
              title: name,
              category: mod.category,
              desc: description.slice(0, 40),
            }),
            width: 1200,
            height: 630,
            alt: name,
          },
        ],
      },
    };
  }

  return {
    title: SITE_NAME,
    description: siteDesc,
  };
}

export function buildSharePayload(pathname: string, reportSnippet?: string, locale: Locale = "zh") {
  const path = pathname.split("?")[0] || "/";
  const siteUrl = getSiteUrl();
  const mod = MODULE_DEFINITIONS.find((m) => m.path === path);
  const staticMeta = staticPages(locale)[path];
  const siteDesc = locale === "en" ? SITE_DESCRIPTION_EN : SITE_DESCRIPTION;

  const title = mod
    ? getModuleName(mod.id, locale, mod.name)
    : (staticMeta?.title ?? SITE_NAME);
  const desc =
    reportSnippet?.slice(0, 80) ??
    (mod ? getModuleDescription(mod.id, locale, mod.description) : null) ??
    staticMeta?.description ??
    siteDesc;
  const link = `${siteUrl}${path}`;
  const imageUrl = mod
    ? `${siteUrl}${ogImageUrl({ module: mod.id, title, category: mod.category })}`
    : `${siteUrl}/og-share.svg`;

  return {
    title: `${title} · ${SITE_NAME}`,
    desc,
    link,
    imageUrl,
    category: mod?.category ?? "术",
    glyph: mod ? CATEGORY_GLYPH[mod.category] ?? "易" : "易",
  };
}

export function moduleIdFromPath(pathname: string): string | undefined {
  return MODULE_DEFINITIONS.find((m) => m.path === pathname)?.id;
}
