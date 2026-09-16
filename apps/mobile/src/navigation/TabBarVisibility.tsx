import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface TabBarVisibilityValue {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

const TabBarVisibilityContext = createContext<TabBarVisibilityValue | null>(null);

// Lets a screen rendered inside NativeTabs (e.g. Explore's bottom sheet)
// tell the tab bar to hide/show itself — NativeTabs' own `hidden` prop
// lives on the layout, one level up from the screen that knows when it
// should change, so this context bridges the two.
export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo(() => ({ hidden, setHidden }), [hidden]);
  return <TabBarVisibilityContext.Provider value={value}>{children}</TabBarVisibilityContext.Provider>;
}

export function useTabBarVisibility(): TabBarVisibilityValue {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) throw new Error("useTabBarVisibility must be used within a TabBarVisibilityProvider");
  return ctx;
}
