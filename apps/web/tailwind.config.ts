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
  // shadcn's own components (Sheet, Dialog, ...) rely on this plugin's
  // data-[state=...] enter/exit keyframe utilities.
  plugins: [require("tailwindcss-animate")],
};

export default config;
