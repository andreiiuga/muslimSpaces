"use client";

import type { LocalizedText as LocalizedTextValue } from "@muslimspaces/shared";
import { useLocale } from "./LocaleContext";
import { pickLocalized } from "./pick-localized";

/**
 * Drop-in replacement for `{x.ro}` in a Server Component page — a tiny
 * client leaf that reads the current locale without converting the whole
 * page (and its data-fetching) into a Client Component.
 */
export function LocalizedText({ value }: { value: LocalizedTextValue }) {
  const { locale } = useLocale();
  return <>{pickLocalized(value, locale)}</>;
}
