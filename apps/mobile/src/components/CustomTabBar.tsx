import { Pressable, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
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
  const { bottomSheetIndex } = useTabBarVisibility();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const hiddenOffset = TAB_BAR_HEIGHT + insets.bottom + spacing.xl;

  // bottomSheetIndex is 0 at Explore's collapsed peek and 1 at its "55%"
  // half-open snap point — interpolating directly against it (instead of
  // reacting to a discrete open/closed toggle) makes the slide track the
  // sheet 1:1: hidden at the peek, fully shown by the half-open point, and
  // clamped there for anything further open (dragging on to "92%" doesn't
  // hide it again).
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          bottomSheetIndex.value,
          [0, 1],
          [hiddenOffset, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          left: spacing["2xl"],
          right: spacing["2xl"],
          bottom: insets.bottom,
        },
        animatedStyle,
      ]}
    >
      <BlurView
        intensity={80}
        tint="light"
        style={{
          height: TAB_BAR_HEIGHT,
          borderRadius: 999,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.matchPath;
          const Icon = tab.Icon;
          return (
            <Pressable
              key={tab.name}
              onPress={() => router.push(tab.href)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <Icon
                size={22}
                color={active ? colors.primary : colors.textMuted}
              />
              <Text
                size="xs"
                weight={active ? "semibold" : "regular"}
                color={active ? colors.primary : colors.textMuted}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </Animated.View>
  );
}
