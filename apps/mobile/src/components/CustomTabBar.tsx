import { Pressable, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors, nativeShadows } from "@muslimspaces/ui";
import { TABS } from "../navigation/tabs";

export const TAB_BAR_HEIGHT = 58;

// Fixed, full-width white bar (top hairline + shadow, teal top-rule under
// the active tab) — always visible, no hide/show behavior. NativeTabs
// (rendered `hidden` in (tabs)/_layout.tsx) stays mounted as the real
// navigator driving tab switches and each tab's own navigation stack; this
// is purely the visual chrome on top of it, styled to match the design
// instead of relying on native tab bar chrome (which can't reproduce the
// exact colors/font/top-rule indicator).
export function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingBottom: insets.bottom,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
        },
        nativeShadows.tabBar,
      ]}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.matchPath;
        const Icon = tab.Icon;
        const tint = active ? colors.primary : colors.textFaint;
        return (
          <Pressable
            key={tab.name}
            onPress={() => router.push(tab.href)}
            style={{
              flex: 1,
              minHeight: TAB_BAR_HEIGHT,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              borderTopWidth: 2,
              borderTopColor: active ? colors.primary : "transparent",
            }}
          >
            <Icon size={23} color={tint} />
            <Text size="xs" color={tint} letterSpacing={0.6}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
