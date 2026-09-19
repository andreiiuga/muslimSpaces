import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./resources/en";
import { ro } from "./resources/ro";
import { ar } from "./resources/ar";

export const SUPPORTED_LOCALES = ["en", "ro", "ar"] as const;
export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is LocaleCode {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ro: { translation: ro },
    ar: { translation: ar },
  },
  lng: "ro",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export { i18n };
