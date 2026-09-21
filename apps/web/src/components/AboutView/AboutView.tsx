"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Text, colors, radii, spacing } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";

export function AboutView() {
  const router = useRouter();
  const { t, tArray } = useLocale();
  const body = tArray("about.body");

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "30px clamp(16px,4vw,28px) 70px", display: "flex", flexDirection: "column", gap: spacing.lg }}>
      <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("about.kicker").toUpperCase()}</Text>
      <Text size="3xl" weight="semibold">{t("about.title")}</Text>

      {body.map((paragraph, i) => (
        <Text key={i} size="lg" color={colors.textBody}>{paragraph}</Text>
      ))}

      <div>
        <Button onPress={() => router.push("/submit")}>{t("submit.entryLabel")}</Button>
      </div>

      <div
        style={{
          borderTop: `1px solid ${colors.divider}`,
          paddingTop: spacing.md,
          display: "flex",
          gap: spacing.lg,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Text size="sm" color={colors.textMuted}>
          {t("about.footer")} · hello@muslimspaces.ro
        </Text>
        <Link href="/blog" style={{ fontSize: 13.5, color: colors.primary, textDecoration: "none" }}>
          {t("common.blog")}
        </Link>
      </div>
    </div>
  );
}
