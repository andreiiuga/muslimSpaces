"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, KeyRound, MapPinPlus, Newspaper, Pencil, Star, UserCircle, Info } from "lucide-react";
import { Avatar, Button, Text, buttonVariants, colors } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { cn } from "@/lib/utils";
import { useLocale } from "../../i18n/LocaleContext";

const LOCALE_LABEL: Record<string, string> = { en: "English", ro: "Română", ar: "العربية" };

export function ProfileHubView({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const { locale, t } = useLocale();

  if (!user) {
    return (
      <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[30px]">
        <div className="max-w-[520px] py-[30px]">
          <Text size="xs" weight="medium" color={colors.textMuted}>{t("profile.welcomeKicker").toUpperCase()}</Text>
          <div className="mb-[12px] mt-sm">
            <Text size="3xl" weight="semibold">{t("profile.welcomeHead")}</Text>
          </div>
          <Text size="lg" color={colors.textMuted}>{t("profile.welcomeBody")}</Text>
          <div className="mt-[22px] flex flex-wrap gap-[10px]">
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
    <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[30px]">
      <div className="flex flex-wrap items-start gap-[clamp(20px,3vw,34px)]">
        <div className="flex min-w-[280px] flex-[0_1_320px] flex-col gap-[14px]">
          <div className="flex flex-col items-start gap-[14px] rounded-lg bg-surface p-[22px] shadow-panel">
            {/* size unified to 72 — was 74 here vs 72 in EditProfileForm for
                the identical "large profile avatar" role, unintentional drift. */}
            <Avatar uri={user.avatarUrl} name={user.displayName ?? user.email} size={72} />
            <div>
              <Text size="xl" weight="semibold">{user.displayName ?? user.email}</Text>
              <div className="mt-[3px]">
                <Text size="sm" color={colors.textMuted}>
                  {user.email}
                  {user.role === "admin" && ` · ${t("profile.admin")}`}
                  {user.role === "moderator" && ` · ${t("profile.moderator")}`}
                </Text>
              </div>
            </div>
            <Link href="/account/edit" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "no-underline")}>
              <Pencil size={16} color={colors.primary} /> {t("profile.editProfile")}
            </Link>
          </div>
          <Button variant="danger" onPress={handleLogout} fullWidth>{t("profile.logOut")}</Button>
        </div>

        <div className="flex min-w-[300px] flex-[1_1_460px] flex-col gap-md">
          <Text size="xs" weight="medium" color={colors.textMuted}>{t("profile.account").toUpperCase()}</Text>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-md">
            {rows.map((row) => (
              <Link
                key={row.href}
                href={row.href}
                className="flex min-h-[78px] items-center gap-md rounded-lg bg-surface px-[18px] text-text no-underline shadow-panel"
              >
                <row.icon size={23} color={colors.primary} />
                <div className="min-w-0 flex-1">
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
