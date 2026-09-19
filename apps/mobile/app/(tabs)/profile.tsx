import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ChevronRight, Info, KeyRound, MapPinPlus, Newspaper, Star, UserCircle } from "lucide-react-native";
import { Avatar, Button, Skeleton, Text, colors, nativeShadows, radii, spacing } from "@muslimspaces/ui";
import { useAuth } from "../../src/auth/AuthContext";
import { TAB_BAR_HEIGHT } from "../../src/components/CustomTabBar";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarClearance = TAB_BAR_HEIGHT + insets.bottom + spacing.xl;

  if (loading) {
    return (
      <View style={{ padding: spacing.xl, paddingTop: insets.top + spacing.xl, gap: spacing.lg, alignItems: "center" }}>
        <Skeleton width={72} height={72} circle />
        <Skeleton width="50%" height={20} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center", gap: spacing.md }}>
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("profile.welcomeKicker").toUpperCase()}</Text>
        <Text size="2xl" weight="semibold">{t("profile.welcomeHead")}</Text>
        <Text color={colors.textMuted}>{t("profile.welcomeBody")}</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Button onPress={() => router.push("/login")} fullWidth>{t("common.logIn")}</Button>
          <Button variant="secondary" onPress={() => router.push("/signup")} fullWidth>{t("profile.createAccount")}</Button>
        </View>
        <FooterLinks />
      </View>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  const rows: Array<{ icon: ReactNode; label: string; note: string; onPress: () => void }> = [
    {
      icon: <UserCircle size={21} color={colors.primary} />,
      label: t("profile.editProfile"),
      note: user.displayName ?? user.email,
      onPress: () => router.push("/profile/edit"),
    },
    {
      icon: <KeyRound size={21} color={colors.primary} />,
      label: t("profile.changePassword"),
      note: t("profile.changePasswordNote"),
      onPress: () => router.push("/profile/password"),
    },
    {
      icon: <Star size={21} color={colors.primary} />,
      label: t("profile.myReviews"),
      note: "",
      onPress: () => router.push("/profile/reviews"),
    },
    {
      icon: <MapPinPlus size={21} color={colors.primary} />,
      label: t("submit.entryLabel"),
      note: t("submit.entryNote"),
      onPress: () => router.push("/pois/submit"),
    },
    {
      icon: <Newspaper size={21} color={colors.primary} />,
      label: t("common.blog"),
      note: t("profile.blogNote"),
      onPress: () => router.push("/(tabs)/blog"),
    },
    {
      icon: <Info size={21} color={colors.primary} />,
      label: t("common.about"),
      note: t("profile.aboutNote"),
      onPress: () => router.push("/about"),
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.lg, paddingBottom: tabBarClearance, gap: spacing.xl }}>
      <View style={{ alignItems: "center", gap: spacing.sm }}>
        <Avatar uri={user.avatarUrl} name={user.displayName ?? user.email} size={72} />
        <Text weight="semibold" size="lg">{user.displayName ?? user.email}</Text>
        <Text size="sm" color={colors.textMuted}>
          {user.email}
          {user.role !== "user" ? ` · ${t("profile.moderator")}` : ""}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("profile.account").toUpperCase()}</Text>
        {rows.map((row) => (
          <Pressable
            key={row.label}
            onPress={row.onPress}
            style={{
              minHeight: 60,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              ...nativeShadows.card,
            }}
          >
            {row.icon}
            <View style={{ flex: 1 }}>
              <Text size="md">{row.label}</Text>
              {row.note ? <Text size="xs" color={colors.textMuted}>{row.note}</Text> : null}
            </View>
            <ChevronRight size={16} color={colors.textFaint} />
          </Pressable>
        ))}
      </View>

      <Button variant="danger" onPress={handleLogout} fullWidth>
        {t("profile.logOut")}
      </Button>
    </ScrollView>
  );
}

function FooterLinks() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.xl }}>
      <Pressable onPress={() => router.push("/(tabs)/blog")}>
        <Text size="sm" color={colors.primary}>{t("common.blog")}</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/about")}>
        <Text size="sm" color={colors.primary}>{t("common.about")}</Text>
      </Pressable>
    </View>
  );
}
