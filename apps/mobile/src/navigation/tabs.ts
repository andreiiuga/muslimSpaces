import type { SFSymbol } from "sf-symbols-typescript";
import type { AndroidSymbol } from "expo-symbols";

// Route name (matches the file under app/(tabs)/) + label + icon per platform.
// NativeTabs.Trigger needs SF Symbol names (iOS) and Material Symbol names
// (Android) — verified against each catalog's actual name list, since both
// are strict literal-union types, not free-form strings.
export const TABS: Array<{
  name: string;
  label: string;
  sf: SFSymbol;
  md: AndroidSymbol;
}> = [
  { name: "index", label: "Explore", sf: "map", md: "explore" },
  { name: "favorites", label: "Favorites", sf: "heart", md: "favorite_border" },
  { name: "profile", label: "Profile", sf: "person.crop.circle", md: "account_circle" },
];
