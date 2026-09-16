import { useEffect } from "react";
import { Pressable, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, colors, spacing } from "@muslimspaces/ui";
import { TABS } from "../navigation/tabs";
import { useTabBarVisibility } from "../navigation/TabBarVisibility";

export const TAB_BAR_HEIGHT = 56;

// A real translateY slide, not iOS's native tab bar transition — iOS 26 has
// no way to trigger that transition programmatically (only in response to
// genuine scroll gestures, confirmed via Apple's own developer forums), so
// NativeTabs stays mounted (it's still what actually drives tab switching
// and each tab's own navigation stack) but permanently `hidden`, and this
// renders our own bar on top instead. Same translucent blur treatment as
// the Explore screen's floating filter bar and bottom sheet — not an
// attempt to fake Liquid Glass specifically.
export function CustomTabBar() {
  const { hidden } = useTabBarVisibility();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const hiddenOffset = TAB_BAR_HEIGHT + insets.bottom + spacing.xl;

  useEffect(() => {
    translateY.value = withTiming(hidden ? hiddenOffset : 0, { duration: 280 });
  }, [hidden, hiddenOffset, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        { position: "absolute", left: spacing.md, right: spacing.md, bottom: insets.bottom + spacing.sm },
        animatedStyle,
      ]}
    >
      <BlurView
        intensity={80}
        tint="light"
        style={{ height: TAB_BAR_HEIGHT, borderRadius: 999, overflow: "hidden", flexDirection: "row" }}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.matchPath;
          const Icon = tab.Icon;
          return (
            <Pressable
              key={tab.name}
              onPress={() => router.push(tab.href)}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 2 }}
            >
              <Icon size={22} color={active ? colors.primary : colors.textMuted} />
              <Text size="xs" weight={active ? "semibold" : "regular"} color={active ? colors.primary : colors.textMuted}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </Animated.View>
  );
}
