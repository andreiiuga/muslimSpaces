import { Text as RNText } from "react-native";
import { colors, fontSizes, fontWeights } from "../tokens";
import type { TextProps } from "./Text.types";

export function Text({
  children,
  size = "md",
  weight = "regular",
  color = colors.text,
  align,
  numberOfLines,
}: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={{
        fontSize: fontSizes[size],
        fontWeight: fontWeights[weight],
        color,
        textAlign: align,
      }}
    >
      {children}
    </RNText>
  );
}
