import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, type Locale } from "./config";

export async function getRequestLocale(): Promise<Locale> {
  try {
    const jar = await cookies();
    return parseLocale(jar.get(LOCALE_COOKIE)?.value);
  } catch {
    return parseLocale(null);
  }
}

export function localeFromRequest(request: Request): Locale {
  const header = request.headers.get("x-locale");
  if (header === "en" || header === "zh") return header;
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|; )locale=([^;]*)/);
  return parseLocale(match?.[1] ? decodeURIComponent(match[1]) : null);
}
