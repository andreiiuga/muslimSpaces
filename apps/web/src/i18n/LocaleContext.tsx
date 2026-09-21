"use client";

/**
 * Lightweight, client-only locale switcher — deliberately not a full
 * next-intl-style system. No route-based i18n, no SSR-aware locale: first
 * paint is always "ro" (matching every Server Component page's existing
 * hardcoded `.ro` field access), then this hydrates to whatever was last
 * stored in localStorage. See CLAUDE.md and the redesign plan for why this
 * scope was chosen over the real thing.
 *
 * Reads the stored locale via `useSyncExternalStore`, not `useState` +
 * `useEffect` — that looks equivalent but isn't guaranteed hydration-safe:
 * `useSyncExternalStore`'s `getServerSnapshot` is what React actually uses
 * for the hydration comparison pass, only switching to the real client
 * snapshot after commit. A plain `useState(DEFAULT_LOCALE)` initial value
 * relies on no render happening before the "read localStorage" effect
 * fires, which doesn't hold once a Suspense boundary sits upstream of this
 * provider's consumers — HeaderBar's `useSearchParams()` Suspense wrapper
 * (see Navbar.tsx) is exactly that, and did produce a real, reproducible
 * "Hydration failed" error on every load where a non-"ro" locale was
 * already stored, confirmed via a hard reload with devtools open.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isSupportedLocale, type LocaleCode } from "./types";
import { t as translate, tArray as translateArray } from "./strings";

const STORAGE_KEY = "muslimspaces.locale";
const DEFAULT_LOCALE: LocaleCode = "ro";
// The native `storage` event only fires in *other* tabs/windows, never the
// one that made the write — this is how setLocale below notifies this
// same tab's subscribers that the snapshot changed.
const LOCALE_CHANGE_EVENT = "muslimspaces:locale-change";

function readStoredLocale(): LocaleCode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isSupportedLocale(stored) ? stored : DEFAULT_LOCALE;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
  };
}

function getServerSnapshot(): LocaleCode {
  return DEFAULT_LOCALE;
}

interface LocaleContextValue {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
  tArray: (key: string) => string[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, readStoredLocale, getServerSnapshot);
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  const setLocale = useCallback((next: LocaleCode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      dir,
      t: (key, vars) => translate(locale, key, vars),
      tArray: (key) => translateArray(locale, key),
    }),
    [locale, dir, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
