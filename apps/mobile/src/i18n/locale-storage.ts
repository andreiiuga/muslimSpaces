import * as SecureStore from "expo-secure-store";
import { isSupportedLocale, type LocaleCode } from "./index";

// Not actually sensitive — reuses SecureStore purely so the app doesn't need
// a second, AsyncStorage-shaped persistence dependency just for one string.
const LOCALE_KEY = "muslimspaces.locale";

export async function loadStoredLocale(): Promise<LocaleCode | null> {
  const stored = await SecureStore.getItemAsync(LOCALE_KEY);
  return stored && isSupportedLocale(stored) ? stored : null;
}

export async function storeLocale(locale: LocaleCode): Promise<void> {
  await SecureStore.setItemAsync(LOCALE_KEY, locale);
}

/**
 * Device locale narrowed to a supported one, defaulting to "ro" (this app's
 * Romania-only default). expo-localization is a native module — like
 * expo-updates, it only exists in a dev client built after it was added as
 * a dependency, so it's imported dynamically and failure just falls back to
 * "ro" instead of crashing app boot (see rtl.ts for the same pattern).
 */
export async function deviceLocale(): Promise<LocaleCode> {
  try {
    const Localization = await import("expo-localization");
    const tag = Localization.getLocales()[0]?.languageCode ?? "ro";
    return isSupportedLocale(tag) ? tag : "ro";
  } catch {
    return "ro";
  }
}
