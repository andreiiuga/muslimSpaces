import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "@muslimspaces/ui";
import { TABS } from "../../src/navigation/tabs";
import { TabBarVisibilityProvider, useTabBarVisibility } from "../../src/navigation/TabBarVisibility";

// Real native tab bar (UITabBarController on iOS, Material bottom nav on
// Android) via expo-router's NativeTabs — not a JS-rendered React Navigation
// bar. This is what gets iOS 26's Liquid Glass automatically, with zero
// custom styling: the OS draws it. Note: expo-router/unstable-native-tabs is
// still a preview API as of Expo SDK 57 (the "unstable-" import path is not
// a mistake) — see CLAUDE.md.
export default function TabsLayout() {
  return (
    <TabBarVisibilityProvider>
      <Tabs />
    </TabBarVisibilityProvider>
  );
}

// Split out so `hidden` only re-renders the tab bar itself, not the whole
// provider tree — Explore's bottom sheet toggles this on every collapse/
// expand.
function Tabs() {
  const { hidden } = useTabBarVisibility();

  return (
    <NativeTabs tintColor={colors.primary} hidden={hidden}>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
