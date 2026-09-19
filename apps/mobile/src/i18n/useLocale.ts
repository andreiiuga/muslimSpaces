import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { LocaleCode } from "./index";
import { applyLocaleDirection } from "./rtl";
import { storeLocale } from "./locale-storage";

/**
 * Switches the app's own UI language immediately (and, for Arabic, restarts
 * the app to flip layout direction — see rtl.ts). Persisting the choice to
 * the user's account (`preferredLocale`) is a separate, explicit step done
 * by whichever screen calls this — see the Edit profile screen's Save
 * button — so a guest can preview a language without an account.
 */
export function useLocale() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;

  const changeLocale = useCallback(
    async (next: LocaleCode) => {
      if (next === locale) return;
      await storeLocale(next);
      await i18n.changeLanguage(next);
      await applyLocaleDirection(
        next,
        t("editProfile.restartTitle"),
        t("editProfile.restartBody"),
        t("editProfile.restartConfirm"),
      );
    },
    [i18n, locale, t],
  );

  return { locale, t, changeLocale };
}
