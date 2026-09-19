"use client";

/**
 * Lightweight, client-only locale switcher — deliberately not a full
 * next-intl-style system. No route-based i18n, no SSR-aware locale: first
 * paint is always "ro" (matching every Server Component page's existing
 * hardcoded `.ro` field access), then this hydrates to whatever was last
 * stored in localStorage. See CLAUDE.md and the redesign plan for why this
 * scope was chosen over the real thing.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupportedLocale, type LocaleCode } from "./types";
import { t as translate, tArray as translateArray } from "./strings";

const STORAGE_KEY = "muslimspaces.locale";
const DEFAULT_LOCALE: LocaleCode = "ro";

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
  tArray: (key: string) => string[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) setLocaleState(stored);
  }, []);

  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  function setLocale(next: LocaleCode) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      dir,
      t: (key, vars) => translate(locale, key, vars),
      tArray: (key) => translateArray(locale, key),
    }),
    [locale, dir],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
