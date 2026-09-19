"use client";

import Link from "next/link";
import { colors, spacing, Text } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer style={{ borderTop: `1px solid ${colors.border}`, marginTop: spacing.md }}>
      <div
        style={{
          maxWidth: 1340,
          margin: "0 auto",
          padding: `${spacing.xl}px clamp(16px,4vw,28px) ${spacing["2xl"]}px`,
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
        <div style={{ display: "flex", gap: spacing.xl, fontSize: 13.5 }}>
          <Link href="/blog" style={{ color: colors.primary, textDecoration: "none" }}>
            {t("common.blog")}
          </Link>
          <Link href="/about" style={{ color: colors.primary, textDecoration: "none" }}>
            {t("common.about")}
          </Link>
          <Link href="/submit" style={{ color: colors.primary, textDecoration: "none" }}>
            {t("submit.entryLabel")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
