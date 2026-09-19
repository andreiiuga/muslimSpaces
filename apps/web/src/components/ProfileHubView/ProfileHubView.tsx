"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, KeyRound, MapPinPlus, Newspaper, Pencil, Star, UserCircle, Info } from "lucide-react";
import { Avatar, Button, Text, colors, radii, spacing } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";

const LOCALE_LABEL: Record<string, string> = { en: "English", ro: "Română", ar: "العربية" };

export function ProfileHubView({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const { locale, t } = useLocale();

  if (!user) {
    return (
      <div style={{ maxWidth: 1340, margin: "0 auto", padding: "30px clamp(16px,4vw,28px) 60px" }}>
        <div style={{ maxWidth: 520, padding: "30px 0" }}>
          <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("profile.welcomeKicker").toUpperCase()}</Text>
          <div style={{ margin: "8px 0 12px" }}>
            <Text size="3xl" weight="semibold">{t("profile.welcomeHead")}</Text>
          </div>
          <Text size="lg" color={colors.textMuted}>{t("profile.welcomeBody")}</Text>
          <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
            <Button onPress={() => router.push("/login")}>{t("common.logIn")}</Button>
            <Button variant="ghost" onPress={() => router.push("/signup")}>{t("profile.createAccount")}</Button>
          </div>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const rows = [
    { icon: UserCircle, label: t("profile.editProfile"), note: `${user.displayName ?? user.email} · ${LOCALE_LABEL[locale]}`, href: "/account/edit" },
    { icon: KeyRound, label: t("profile.changePassword"), note: t("profile.changePasswordNote"), href: "/account/password" },
    { icon: Star, label: t("profile.myReviews"), note: "", href: "/account/reviews" },
    { icon: MapPinPlus, label: t("submit.entryLabel"), note: t("submit.entryNote"), href: "/submit" },
    { icon: Newspaper, label: t("common.blog"), note: t("profile.blogNote"), href: "/blog" },
    { icon: Info, label: t("common.about"), note: t("profile.aboutNote"), href: "/about" },
  ];

  return (
    <div style={{ maxWidth: 1340, margin: "0 auto", padding: "30px clamp(16px,4vw,28px) 60px" }}>
      <div style={{ display: "flex", gap: "clamp(20px,3vw,34px)", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 22, display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
            <Avatar uri={user.avatarUrl} name={user.displayName ?? user.email} size={74} />
            <div>
              <Text size="xl" weight="semibold">{user.displayName ?? user.email}</Text>
              <div style={{ marginTop: 3 }}>
                <Text size="sm" color={colors.textMuted}>
                  {user.email}
                  {user.role !== "user" ? ` · ${t("profile.moderator")}` : ""}
                </Text>
              </div>
            </div>
            <Link
              href="/account/edit"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 42, padding: "0 20px", border: `1px solid ${colors.border}`, background: colors.surface, borderRadius: radii.pill, fontSize: 14, fontWeight: 600, textDecoration: "none", color: colors.text }}
            >
              <Pencil size={16} color={colors.primary} /> {t("profile.editProfile")}
            </Link>
          </div>
          <Button variant="danger" onPress={handleLogout} fullWidth>{t("profile.logOut")}</Button>
        </div>

        <div style={{ flex: "1 1 460px", minWidth: 300, display: "flex", flexDirection: "column", gap: spacing.md }}>
          <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("profile.account").toUpperCase()}</Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: spacing.md }}>
            {rows.map((row) => (
              <Link
                key={row.href}
                href={row.href}
                style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", minHeight: 78, display: "flex", alignItems: "center", gap: spacing.md, padding: "0 18px", textDecoration: "none", color: colors.text }}
              >
                <row.icon size={23} color={colors.primary} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="md">{row.label}</Text>
                  {row.note && <Text size="xs" color={colors.textMuted}>{row.note}</Text>}
                </div>
                <ChevronRight size={16} color={colors.textFaint} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
