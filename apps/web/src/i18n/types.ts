export const SUPPORTED_LOCALES = ["en", "ro", "ar"] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is LocaleCode {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
