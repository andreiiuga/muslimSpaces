/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    // Provides NativeWind's RN-specific theme extensions (platform variants
    // etc.) — must come before our own preset so our token values are what
    // actually gets used if the two ever define the same key.
    require("nativewind/preset"),
    require("@muslimspaces/ui/tailwind-preset"),
  ],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    // packages/ui ships raw, unbuilt TSX consumed directly by Metro — without
    // this, NativeWind's JIT scanner never sees its className strings and
    // silently purges them from the generated styles.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
