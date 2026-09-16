import { Compass, Heart, User } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export interface TabConfig {
  /** Route name, matches the file under app/(tabs)/ — registers the (now
   * always-hidden) NativeTabs.Trigger that still drives actual navigation. */
  name: string;
  /** Path passed to router.push from CustomTabBar. */
  href: string;
  /** Resolved pathname (no route-group prefix) — used to detect the active tab. */
  matchPath: string;
  label: string;
  Icon: LucideIcon;
}

export const TABS: TabConfig[] = [
  { name: "index", href: "/(tabs)", matchPath: "/", label: "Explore", Icon: Compass },
  { name: "favorites", href: "/(tabs)/favorites", matchPath: "/favorites", label: "Favorites", Icon: Heart },
  { name: "profile", href: "/(tabs)/profile", matchPath: "/profile", label: "Profile", Icon: User },
];
