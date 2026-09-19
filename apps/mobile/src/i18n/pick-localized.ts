import type { LocalizedText } from "@muslimspaces/shared";
import type { LocaleCode } from "./index";

/**
 * POI/category/blog content only ever carries ro+en (LocalizedText's schema
 * allows more via .catchall, but nothing in the app writes an "ar" key yet)
 * — Arabic UI mode reads English content rather than showing untranslated
 * placeholder text.
 */
export function pickLocalized(text: LocalizedText, locale: LocaleCode): string {
  return text[locale] ?? text.en;
}
