import { Image } from "expo-image";

// The app is light-theme only today (colors come from tokens.ts, no dark
// palette), so this always uses the light-theme wordmark. The dark variant
// is already in assets/brand/logo-dark.png for when a dark mode lands.
// Aspect ratio is the logo's own 1464:349.
const ASPECT = 1464 / 349;

export function Logo({ height = 32 }: { height?: number }) {
  return (
    <Image
      source={require("../../assets/brand/logo-light.png")}
      accessibilityLabel="MuslimSpaces"
      contentFit="contain"
      style={{ height, width: height * ASPECT }}
    />
  );
}
