import type { Locale } from "./config";
import { DEFAULT_LOCALE, parseLocale } from "./config";
import { zh, type Dictionary } from "./dictionaries/zh";
import { en } from "./dictionaries/en";

const TABLES: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale | string | null | undefined): Dictionary {
  const loc = parseLocale(typeof locale === "string" ? locale : null);
  return TABLES[loc] ?? TABLES[DEFAULT_LOCALE];
}

export function t(
  dict: Dictionary,
  key: string,
  vars?: Record<string, string | number>
): string {
  let text = dict[key] ?? zh[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

export function translateKey(
  locale: Locale | string | null | undefined,
  key: string,
  vars?: Record<string, string | number>
): string {
  return t(getDictionary(locale), key, vars);
}

/** Localize reading section titles; body stays Chinese in phase 1 */
export function localizeSectionTitle(locale: Locale, title: string): string {
  if (locale === "zh") return title;
  return translateKey("en", `section.${title}`);
}
