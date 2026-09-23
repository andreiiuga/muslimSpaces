"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Text, colors } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";

export function AboutView() {
  const router = useRouter();
  const { t, tArray } = useLocale();
  const body = tArray("about.body");

  return (
    // pt-[26px], matching BlogPostView's identical "narrow article" shell —
    // was 30px here, unintentional drift between the two, not a deliberate
    // per-page difference.
    <div className="mx-auto flex max-w-[780px] flex-col gap-lg px-[clamp(16px,4vw,28px)] pb-[70px] pt-[26px]">
      <Text size="xs" weight="medium" color={colors.textMuted}>{t("about.kicker").toUpperCase()}</Text>
      <Text size="3xl" weight="semibold">{t("about.title")}</Text>

      {body.map((paragraph, i) => (
        <Text key={i} size="lg" color={colors.textBody}>{paragraph}</Text>
      ))}

      <div>
        <Button onPress={() => router.push("/submit")}>{t("submit.entryLabel")}</Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-lg border-t border-divider pt-md">
        <Text size="sm" color={colors.textMuted}>
          {t("about.footer")} · hello@muslimspaces.ro
        </Text>
        <Link href="/blog" className="text-sm text-primary no-underline">
          {t("common.blog")}
        </Link>
      </div>
    </div>
  );
}
