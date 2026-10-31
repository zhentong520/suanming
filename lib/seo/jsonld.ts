/** JSON-LD 结构化数据构建器（schema.org） */
import { getModuleDefinition } from "@/lib/hub/module-registry";
import { getModuleName, getModuleDescription } from "@/lib/hub/module-i18n";
import { getSiteUrl, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site-config";
import type { Locale } from "@/lib/i18n/config";

function siteUrl(): string {
  return getSiteUrl();
}

export function buildWebsiteJsonLd(locale: Locale = "zh"): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Yi Dao Metaphysics",
    description: SITE_DESCRIPTION,
    url: base,
    inLanguage: locale === "en" ? "en" : "zh-CN",
  };
}

export function buildModuleJsonLd(moduleId: string, locale: Locale = "zh"): Record<string, unknown> | null {
  const mod = getModuleDefinition(moduleId);
  if (!mod) return null;
  const base = siteUrl();
  const name = getModuleName(mod.id, locale, mod.name);
  const description = getModuleDescription(mod.id, locale, mod.description);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `${name} · ${SITE_NAME}`,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        description,
        url: `${base}${mod.path}`,
        inLanguage: locale === "en" ? "en" : "zh-CN",
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: base },
          { "@type": "ListItem", position: 2, name: "术数大全", item: `${base}/modules` },
          { "@type": "ListItem", position: 3, name, item: `${base}${mod.path}` },
        ],
      },
    ],
  };
}

export function buildKnowledgeArticleJsonLd(params: {
  slug: string;
  module: string;
  title: string;
  body: string;
}): Record<string, unknown> {
  const base = siteUrl();
  const mod = getModuleDefinition(params.module);
  const modName = mod?.name ?? params.module;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${params.title} · ${modName}`,
    description: params.body.slice(0, 120),
    inLanguage: "zh-CN",
    url: `${base}/knowledge/${encodeURIComponent(params.slug)}`,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    about: { "@type": "Thing", name: modName },
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: base },
  };
}

export function buildKnowledgeBreadcrumbJsonLd(moduleName: string, slug: string): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: base },
      { "@type": "ListItem", position: 2, name: "命理知识库", item: `${base}/knowledge` },
      { "@type": "ListItem", position: 3, name: moduleName, item: `${base}/knowledge/${encodeURIComponent(slug)}` },
    ],
  };
}
