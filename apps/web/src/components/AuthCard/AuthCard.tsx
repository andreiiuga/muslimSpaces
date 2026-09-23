import type { ReactNode } from "react";
import { Text, colors } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";

/**
 * The centered card shell shared byte-for-byte between login/page.tsx and
 * signup/page.tsx (same boxShadow, same off-token padding, same maxWidth) —
 * only the kicker/title and the form/footer-link content actually differ
 * per page, so those stay as props/children rather than being folded in
 * here too. The "auth.note" footer text uses the same translation key on
 * both pages, so it's folded in rather than repeated at each call site.
 */
export function AuthCard({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="flex justify-center px-[clamp(16px,4vw,28px)] pb-[70px] pt-[52px]">
      <div className="flex w-full max-w-[460px] flex-col gap-lg rounded-lg bg-surface p-[28px] shadow-panel">
        <div>
          <Text size="xs" weight="medium" color={colors.textMuted}>
            {kicker.toUpperCase()}
          </Text>
          <div className="mt-[5px]">
            <Text size="2xl" weight="semibold">
              {title}
            </Text>
          </div>
        </div>
        {children}
        <Text size="xs" color={colors.textMuted} align="center">
          {t("auth.note")}
        </Text>
      </div>
    </div>
  );
}
