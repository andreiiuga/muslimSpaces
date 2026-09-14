import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "@muslimspaces/ui";
import { TABS } from "../../src/navigation/tabs";

// Real native tab bar (UITabBarController on iOS, Material bottom nav on
// Android) via expo-router's NativeTabs — not a JS-rendered React Navigation
// bar. This is what gets iOS 26's Liquid Glass automatically, with zero
// custom styling: the OS draws it. Note: expo-router/unstable-native-tabs is
// still a preview API as of Expo SDK 57 (the "unstable-" import path is not
// a mistake) — see CLAUDE.md.
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.primary}>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
