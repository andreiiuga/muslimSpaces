import { Compass, Heart, Newspaper, User } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export interface TabConfig {
  /** Route name, matches the file under app/(tabs)/ — registers the (now
   * always-hidden) NativeTabs.Trigger that still drives actual navigation. */
  name: string;
  /** Path passed to router.push from CustomTabBar. */
  href: string;
  /** Resolved pathname (no route-group prefix) — used to detect the active tab. */
  matchPath: string;
  /** i18n key under "tabs." — CustomTabBar resolves it via useTranslation. */
  labelKey: string;
  Icon: LucideIcon;
}

export const TABS: TabConfig[] = [
  { name: "index", href: "/(tabs)", matchPath: "/", labelKey: "tabs.explore", Icon: Compass },
  { name: "favorites", href: "/(tabs)/favorites", matchPath: "/favorites", labelKey: "tabs.favorites", Icon: Heart },
  { name: "blog", href: "/(tabs)/blog", matchPath: "/blog", labelKey: "tabs.blog", Icon: Newspaper },
  { name: "profile", href: "/(tabs)/profile", matchPath: "/profile", labelKey: "tabs.profile", Icon: User },
];
