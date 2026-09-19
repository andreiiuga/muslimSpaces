/**
 * Native-only: maps a design-system font weight to the specific font family
 * name @expo-google-fonts/plus-jakarta-sans registers with expo-font. RN has
 * no fontWeight-on-a-custom-font mechanism like web CSS — each weight is a
 * distinct named font file, so callers must pick the family, not the weight.
 *
 * No Arabic-specific family: Plus Jakarta Sans has no Arabic glyphs, and
 * both iOS and Android's text shaping automatically substitutes the system
 * Arabic font for glyphs missing from the requested family — the same
 * per-glyph fallback the web build gets from its CSS font-family list.
 */
import type { TextWeight } from "./Text/Text.types";

const FAMILY: Record<TextWeight, string> = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};

export function fontFamily(weight: TextWeight): string {
  return FAMILY[weight];
}
