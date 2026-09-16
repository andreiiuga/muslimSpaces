import { View } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { TABS } from "../../src/navigation/tabs";
import { TabBarVisibilityProvider } from "../../src/navigation/TabBarVisibility";
import { CustomTabBar } from "../../src/components/CustomTabBar";

// NativeTabs stays mounted — it's still the real navigator driving tab
// switches and each tab's own navigation stack — but is permanently
// hidden. iOS has no way to trigger its native show/hide transition
// programmatically outside of genuine scroll gestures (see CLAUDE.md), so
// CustomTabBar renders our own translucent, slidable bar on top instead of
// relying on NativeTabs' own chrome for this specific interaction.
export default function TabsLayout() {
  return (
    <TabBarVisibilityProvider>
      <View style={{ flex: 1 }}>
        <NativeTabs hidden>
          {TABS.map((tab) => (
            <NativeTabs.Trigger key={tab.name} name={tab.name} />
          ))}
        </NativeTabs>
        <CustomTabBar />
      </View>
    </TabBarVisibilityProvider>
  );
}
