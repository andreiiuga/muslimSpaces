import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

interface TabBarVisibilityValue {
  // Mirrors Explore's BottomSheet `animatedIndex` — a continuous float that
  // moves linearly between adjacent snap point indices as the sheet is
  // dragged or animated (0 at the collapsed peek, 1 at the "55%" half-open
  // point, 2 at "92%"), not just a value that jumps at rest. CustomTabBar
  // reads it directly on the UI thread to derive its own slide position,
  // so the bar tracks the sheet 1:1 instead of snapping in response to a
  // discrete open/closed toggle.
  bottomSheetIndex: SharedValue<number>;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityValue | null>(null);

// Lets a screen rendered inside NativeTabs (e.g. Explore's bottom sheet)
// share its live animated position with the tab bar, which lives one level
// up on the layout. Other tabs (Favorites, Profile) have no sheet of their
// own — the value just holds whatever it was last set to on Explore, which
// is always "fully open" by construction: the tab bar (and therefore the
// ability to navigate away) is only visible/tappable once the sheet has
// passed the half-open point.
export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const bottomSheetIndex = useSharedValue(0);
  const value = useMemo(() => ({ bottomSheetIndex }), [bottomSheetIndex]);
  return <TabBarVisibilityContext.Provider value={value}>{children}</TabBarVisibilityContext.Provider>;
}

export function useTabBarVisibility(): TabBarVisibilityValue {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) throw new Error("useTabBarVisibility must be used within a TabBarVisibilityProvider");
  return ctx;
}
