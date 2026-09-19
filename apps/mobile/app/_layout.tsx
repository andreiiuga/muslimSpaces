import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nextProvider, useTranslation } from "react-i18next";
import { colors, fontFamily } from "@muslimspaces/ui";
import { AuthProvider } from "../src/auth/AuthContext";
import { i18n } from "../src/i18n";
import { deviceLocale, loadStoredLocale } from "../src/i18n/locale-storage";
import { applyLocaleDirection } from "../src/i18n/rtl";

function AppShell() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fontFamily("semibold"), fontSize: 17, color: colors.text },
        headerShadowVisible: true,
        // Bare chevron, no previous-route label (native-stack otherwise
        // shows the prior screen's title — here the raw "(tabs)" segment,
        // since that group has no title of its own) — matches the design,
        // which never shows a text label next to the back icon.
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="pois/[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="pois/[id]/review" options={{ title: t("review.title"), presentation: "modal" }} />
      <Stack.Screen name="pois/submit" options={{ title: t("submit.entryLabel") }} />
      <Stack.Screen name="profile/edit" options={{ title: t("editProfile.title") }} />
      <Stack.Screen name="profile/password" options={{ title: t("changePassword.title") }} />
      <Stack.Screen name="profile/reviews" options={{ title: t("myReviews.title") }} />
      <Stack.Screen name="blog/[slug]" options={{ title: "" }} />
      <Stack.Screen name="about" options={{ title: t("common.about") }} />
      <Stack.Screen name="login" options={{ title: t("auth.loginTitle"), presentation: "modal" }} />
      <Stack.Screen name="signup" options={{ title: t("auth.signupTitle"), presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Gates first paint until the persisted (or device-default) locale is
  // applied to i18next and reconciled against I18nManager.isRTL — see
  // src/i18n/rtl.ts for why that reconciliation itself is best-effort on
  // iOS. Keeping this check on the critical path (rather than defaulting to
  // "ro" and switching after mount) avoids a visible LTR-then-RTL flash on
  // an Arabic-preferring device's very first launch.
  const [localeReady, setLocaleReady] = useState(false);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    (async () => {
      try {
        const locale = (await loadStoredLocale()) ?? (await deviceLocale());
        await i18n.changeLanguage(locale);
        await applyLocaleDirection(
          locale,
          i18n.t("editProfile.restartTitle"),
          i18n.t("editProfile.restartBody"),
          i18n.t("editProfile.restartConfirm"),
        );
      } catch {
        // Falls back to i18next's own default ("ro", set in src/i18n/index.ts)
        // rather than leaving the app stuck on a blank boot screen.
      } finally {
        setLocaleReady(true);
      }
    })();
  }, []);

  if (!localeReady || !fontsLoaded) return null;

  return (
    // react-native-gesture-handler is a transitive peer dependency of
    // expo-router (see CLAUDE.md) — wrapping the root is its own standard
    // setup step, independent of anything this app itself builds on it.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppShell />
        </AuthProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}
