"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  htmlLang,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary, t as tDict } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries/zh";

function readStoredLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  try {
    const fromLs = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(fromLs)) return fromLs;
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const fromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;
  if (isLocale(fromCookie)) return fromCookie;
  return DEFAULT_LOCALE;
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.documentElement.lang = htmlLang(locale);
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    setLocaleState(stored);
    document.documentElement.lang = htmlLang(stored);
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const dict = useMemo(() => getDictionary(locale), [locale]);
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => tDict(dict, key, vars),
    [dict]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, dict }),
    [locale, setLocale, t, dict]
  );

  // Avoid flash of wrong language for client-only strings after hydration
  if (!ready && initialLocale == null) {
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useOptionalLocale() {
  return useContext(LocaleContext);
}
