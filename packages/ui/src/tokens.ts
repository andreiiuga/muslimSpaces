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
  // Long-form copy (descriptions, review/blog body text) — a shade darker
  // than `text` reads as "ink on paper" for paragraphs, while `text` stays
  // reserved for headings/labels. Distinct from `textMuted` (meta/captions).
  textBody: "#292524",
  textMuted: "#78716C",
  // Chevrons, counts, disabled-ish icons — one step lighter than textMuted.
  textFaint: "#A8A29E",
  textOnPrimary: "#FFFFFF",

  danger: "#DC2626",
  // Text-on-white destructive/error copy (auth errors, logout label) reads
  // better a shade darker than the icon/pin red above.
  dangerDark: "#B91C1C",
  dangerLight: "#FEE2E2",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  success: "#15803D",
  warning: "#D97706",

  star: "#F59E0B",
  starEmpty: "#E7E2D8",

  // Finer hairline than `border` — hours-list rows, blog paragraph rules.
  divider: "#EDE7DC",
  // Selected-row tint (language picker) — lighter than `primaryLight`.
  tealTint: "#F0FDF9",
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
  // Inputs / edit-profile rows.
  input: 14,
  lg: 16,
  xl: 24,
  // Blog list cards.
  cardLg: 20,
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

// Default tracking per text size, in RN/CSS's absolute-px letterSpacing unit
// (not em) — approximates the design's em-based tracking at each size's
// actual pixel value. `xs` is tracked wide since it's used almost
// exclusively for uppercase kickers; headings tighten as they get larger.
export const letterSpacings: Record<keyof typeof fontSizes, number> = {
  xs: 1.3,
  sm: 0,
  md: 0,
  lg: -0.1,
  xl: -0.3,
  "2xl": -0.5,
  "3xl": -0.7,
} as const;

export const shadows = {
  // CSS box-shadow string for web; RN's shadow* props are applied directly
  // via nativeShadows below instead, since RN has no single "shadow" string.
  card: "0 1px 3px rgba(28, 25, 23, 0.08), 0 1px 2px rgba(28, 25, 23, 0.06)",
  elevated: "0 8px 24px rgba(28, 25, 23, 0.16)",
} as const;

// RN shadow* prop groups mirroring the CSS strings above (iOS reads
// shadowColor/Opacity/Radius/Offset; Android only reads elevation — the
// elevation values here are chosen to look proportionate, not derived from
// the CSS blur radii, since the two platforms don't share a shadow model).
export const nativeShadows = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  elevated: {
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  // Primary CTA's teal glow.
  buttonGlow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // Solid white circular icon buttons (back/favorite over a hero image).
  iconSolid: {
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  // Tab bar's top-edge lift.
  tabBar: {
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
} as const;
