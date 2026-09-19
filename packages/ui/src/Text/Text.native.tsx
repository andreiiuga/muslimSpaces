import { Text as RNText } from "react-native";
import { colors, fontSizes, letterSpacings } from "../tokens";
import { fontFamily } from "../fonts";
import type { TextProps } from "./Text.types";

export function Text({
  children,
  size = "md",
  weight = "regular",
  color = colors.text,
  align,
  numberOfLines,
  letterSpacing,
}: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={{
        fontSize: fontSizes[size],
        fontFamily: fontFamily(weight),
        letterSpacing: letterSpacing ?? letterSpacings[size],
        color,
        textAlign: align,
      }}
    >
      {children}
    </RNText>
  );
}
