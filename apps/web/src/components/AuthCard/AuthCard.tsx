import type { ReactNode } from "react";
import Image from "next/image";
import { Text } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";
import { Logo } from "../Logo/Logo";

/**
 * The split card shell (photo panel + form, photo becomes a top banner below lg) shared byte-for-byte between login/page.tsx and
 * signup/page.tsx (same boxShadow, same off-token padding, same maxWidth) —
 * only the subtitle/title and the form/footer-link content actually differ
 * per page, so those stay as props/children rather than being folded in
 * here too. The "auth.note" footer text uses the same translation key on
 * both pages, so it's folded in rather than repeated at each call site.
 */
export function AuthCard({ subtitle, title, children }: { subtitle: string; title: string; children: ReactNode }) {
  const { t } = useLocale();

  // Centers in what's left under the header: 116px stacked (<900px), 73px
  // single-row (`header:` breakpoint). Keep in sync with HeaderBar.
  return (
    <div className="flex min-h-[calc(100dvh-116px)] items-center justify-center px-[clamp(16px,4vw,28px)] py-[24px] header:min-h-[calc(100dvh-73px)]">
      <div className="ms-auth-card grid w-full max-w-[1040px] overflow-hidden rounded-xl bg-surface p-[10px] shadow-elevated lg:grid-cols-2">
        <div className="relative h-[210px] overflow-hidden rounded-lg sm:h-[260px] lg:h-auto lg:min-h-[640px]">
          <Image
            src="/brand/auth-side.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 520px, 100vw"
            className="object-cover object-[58%_30%] lg:object-[58%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#04372A]/90 via-[#04372A]/25 to-transparent" />
          <p className="absolute inset-x-5 bottom-4 m-0 text-balance text-[20px] sm:text-[24px] lg:inset-x-8 lg:bottom-8 lg:text-[28px] font-semibold leading-[1.2] tracking-[-0.5px] text-white">
            {t("explore.heading")}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-lg px-[clamp(8px,4vw,48px)] py-[24px] lg:py-[28px]">
          {/* Wrapper, not a className on Logo: Logo renders two imgs toggled by
              dark:, and a responsive `lg:block` on both would show both. */}
          <div className="hidden self-start lg:block">
            <Logo className="h-8" />
          </div>
          <div className="flex flex-col gap-xs">
            <h1 className="m-0 text-balance">
              <Text size="2xl" weight="semibold">
                {title}
              </Text>
            </h1>
            <Text size="md" color="textSecondary">
              {subtitle}
            </Text>
          </div>
          {children}
          <Text size="xs" color="textMuted" align="center">
            {t("auth.note")}
          </Text>
        </div>
      </div>
    </div>
  );
}
