import { en } from "./strings/en";
import { ro } from "./strings/ro";
import { ar } from "./strings/ar";
import type { LocaleCode } from "./types";

const DICTIONARIES = { en, ro, ar };

type Dict = Record<string, unknown>;

function lookup(dict: Dict, path: string): unknown {
  return path.split(".").reduce<unknown>((node, segment) => {
    if (node && typeof node === "object") return (node as Dict)[segment];
    return undefined;
  }, dict);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

/**
 * Minimal `t()` — no i18next on web (see LocaleContext.tsx's docblock for
 * why), just dot-path lookup + `{{var}}` interpolation + a `count`-driven
 * `_one`/`_other` plural suffix for keys that actually have those variants
 * (only `favorites.countLine`, copied from the mobile app's i18next
 * resources where that suffix convention comes from — a plain key like
 * `explore.dateline` also takes a `count` var but has no `_one`/`_other`
 * split, so the suffixed path must be tried first and only used if it
 * resolves; falling straight to it unconditionally would look up a
 * nonexistent `explore.dateline_other` and silently return the raw key).
 * Falls back to `en` for any key missing from `ro`/`ar`, same as
 * i18next's own `fallbackLng` on mobile.
 */
export function t(locale: LocaleCode, key: string, vars?: Record<string, string | number>): string {
  let value: unknown;
  if (typeof vars?.count === "number") {
    const pluralPath = `${key}_${vars.count === 1 ? "one" : "other"}`;
    value = lookup(DICTIONARIES[locale], pluralPath) ?? lookup(DICTIONARIES.en, pluralPath);
  }
  if (typeof value !== "string") {
    value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES.en, key);
  }
  if (typeof value !== "string") return key;
  return interpolate(value, vars);
}

/** For keys whose value is a string[] (e.g. `about.body`). */
export function tArray(locale: LocaleCode, key: string): string[] {
  const value = lookup(DICTIONARIES[locale], key) ?? lookup(DICTIONARIES.en, key);
  return Array.isArray(value) ? value : [];
}
