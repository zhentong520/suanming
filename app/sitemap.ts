import type { MetadataRoute } from "next";
import { MODULE_DEFINITIONS } from "@/lib/hub/module-registry";
import { getSiteUrl } from "@/lib/site-config";
import { KNOWLEDGE_CHUNKS, knowledgeSlug } from "@/lib/seo/knowledge-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/modules`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/knowledge`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/liuyan`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
  ];

  for (const mod of MODULE_DEFINITIONS) {
    if (!mod.implemented) continue;
    urls.push({
      url: `${base}${mod.path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: mod.priority === "P0" ? 0.9 : mod.priority === "P1" ? 0.8 : 0.6,
    });
  }

  for (const chunk of KNOWLEDGE_CHUNKS) {
    urls.push({
      url: `${base}/knowledge/${encodeURIComponent(knowledgeSlug(chunk))}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return urls;
}
