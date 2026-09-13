/**
 * Single source of truth for the design system's visual language — plain
 * data, no platform split needed. Change the palette/scale here and every
 * primitive on both web and mobile picks it up.
 */

export const colors = {
  // Calm teal/emerald as the primary accent — deliberately not an
  // Airbnb-coral copy, distinct identity for a Muslim-community app.
  primary: "#0F766E",
  primaryDark: "#0B564F",
  primaryLight: "#CCFBF1",

  background: "#FFFBF5",
  surface: "#FFFFFF",
  border: "#E7E2D8",

  text: "#1C1917",
  textMuted: "#78716C",
  textOnPrimary: "#FFFFFF",

  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  success: "#16A34A",
  warning: "#D97706",

  star: "#F59E0B",
  starEmpty: "#E7E2D8",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  "2xl": 28,
  "3xl": 34,
} as const;

export const fontWeights = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const shadows = {
  // CSS box-shadow string for web; RN's shadow* props are applied directly
  // in Card.native.tsx instead, since RN has no single "shadow" string.
  card: "0 1px 3px rgba(28, 25, 23, 0.08), 0 1px 2px rgba(28, 25, 23, 0.06)",
} as const;
