import { View } from "react-native";
import type { BoxProps } from "./Box.types";

export function Box({
  children,
  direction = "column",
  align,
  justify,
  gap,
  padding,
  paddingHorizontal,
  paddingVertical,
  flex,
  wrap,
  backgroundColor,
  borderRadius,
}: BoxProps) {
  return (
    <View
      style={{
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
        padding,
        paddingHorizontal,
        paddingVertical,
        flex,
        flexWrap: wrap ? "wrap" : "nowrap",
        backgroundColor,
        borderRadius,
      }}
    >
      {children}
    </View>
  );
}
