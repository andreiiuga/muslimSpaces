import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  presets: [require("@muslimspaces/ui/tailwind-preset")],
  content: [
    "./src/**/*.{ts,tsx}",
    // packages/ui ships raw, unbuilt TSX consumed directly by Next's own
    // bundler (see next.config.mjs's transpilePackages) — without this,
    // Tailwind's JIT scanner never sees its className strings and silently
    // purges them from the generated CSS.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  // Web-only theming layer: every color/shadow slot below is redefined to
  // point at a CSS custom property (see globals.css's :root/.dark blocks)
  // instead of the shared preset's plain hex — Tailwind merges presets in
  // declaration order, so this `theme.extend` (declared after the shared
  // preset above) only overrides these specific keys for apps/web.
  // packages/ui/tailwind-preset.js itself is never touched, so
  // apps/mobile's build is completely unaffected — React Native has no
  // concept of CSS custom properties at all, so this mechanism could never
  // reach it anyway. See the top of globals.css for why this lives there.
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "var(--color-primary)", foreground: "var(--color-textOnPrimary)" },
        primaryDark: "var(--color-primaryDark)",
        primaryLight: "var(--color-primaryLight)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        textBody: "var(--color-textBody)",
        textMuted: "var(--color-textMuted)",
        textSecondary: "var(--color-textSecondary)",
        textFaint: "var(--color-textFaint)",
        textOnPrimary: "var(--color-textOnPrimary)",
        danger: "var(--color-danger)",
        dangerDark: "var(--color-dangerDark)",
        dangerLight: "var(--color-dangerLight)",
        dangerBg: "var(--color-dangerBg)",
        dangerBorder: "var(--color-dangerBorder)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        star: "var(--color-star)",
        starEmpty: "var(--color-starEmpty)",
        divider: "var(--color-divider)",
        tealTint: "var(--color-tealTint)",
        background: "var(--color-background)",
        foreground: "var(--color-text)",
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        card: { DEFAULT: "var(--color-surface)", foreground: "var(--color-text)" },
        popover: { DEFAULT: "var(--color-surface)", foreground: "var(--color-text)" },
        secondary: { DEFAULT: "var(--color-primaryLight)", foreground: "var(--color-primaryDark)" },
        destructive: { DEFAULT: "var(--color-destructive)", foreground: "var(--color-destructive-foreground)" },
        muted: { DEFAULT: "var(--color-background)", foreground: "var(--color-textMuted)" },
        accent: { DEFAULT: "var(--color-primaryLight)", foreground: "var(--color-primaryDark)" },
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        buttonGlow: "var(--shadow-buttonGlow)",
        iconSolid: "var(--shadow-iconSolid)",
        panel: "var(--shadow-panel)",
      },
    },
  },
  // shadcn's own components (Sheet, Dialog, ...) rely on this plugin's
  // data-[state=...] enter/exit keyframe utilities.
  plugins: [require("tailwindcss-animate")],
};

export default config;
