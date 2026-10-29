/** 站点公开配置（PWA、微信分享等） */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "易道命理";
export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
  "八字、紫微、易经六爻、黄历合婚等三十一门术数，国风命理融合平台。";
export const SITE_DESCRIPTION_EN =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION_EN ??
  "Thirty-one classical Chinese metaphysics modules — BaZi, Zi Wei, I Ching, almanac, matchmaking and more.";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:9111";
}

export const OG_IMAGE_PATH = "/og-share.svg";
