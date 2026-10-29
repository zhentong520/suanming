export type Locale = "zh" | "en";

export const LOCALES: Locale[] = ["zh", "en"];
export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_COOKIE = "locale";
export const LOCALE_STORAGE_KEY = "yidao-locale";

export function isLocale(v: unknown): v is Locale {
  return v === "zh" || v === "en";
}

export function parseLocale(v: string | null | undefined): Locale {
  if (v === "en" || v === "zh") return v;
  return DEFAULT_LOCALE;
}

export function htmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "zh-CN";
}

export function ogLocale(locale: Locale): string {
  return locale === "en" ? "en_US" : "zh_CN";
}
