import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /s/ 分享页不在此屏蔽：页面已有 noindex 防搜索引擎收录，
        // 且微信分享卡片需要爬虫能拉到 OG 标签
        disallow: ["/admin", "/admin/", "/api/", "/onboarding", "/profile", "/reports", "/recharge"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
