import { View } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { TABS } from "../../src/navigation/tabs";
import { CustomTabBar } from "../../src/components/CustomTabBar";

// NativeTabs stays mounted — it's still the real navigator driving tab
// switches and each tab's own navigation stack — but is permanently
// hidden (its screens render edge-to-edge regardless of container flex, so
// CustomTabBar overlays as an absolutely-positioned sibling rather than a
// normal flex-column child; see CustomTabBar.tsx). It renders our own bar
// instead of relying on NativeTabs' own chrome, which can't reproduce the
// design's exact colors/font/top-rule active indicator.
export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs hidden>
        {TABS.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name} />
        ))}
      </NativeTabs>
      <CustomTabBar />
    </View>
  );
}
