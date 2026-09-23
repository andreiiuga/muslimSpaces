import { Text as RNText } from "react-native";
import { cva } from "class-variance-authority";
import { colors } from "../tokens";
import { fontFamily } from "../fonts";
import { cn } from "../cn";
import type { TextProps } from "./Text.types";

// weight is deliberately NOT a variant here — RN has no fontWeight-on-a-
// custom-font mechanism (see fonts.ts), so it's resolved to a fontFamily via
// inline style below instead of a `font-semibold`-style className.
const text = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: { size: "md" },
});

export function Text({ children, size = "md", weight = "regular", color = colors.text, align, numberOfLines, letterSpacing }: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      className={cn(text({ size, align }))}
      style={{
        fontFamily: fontFamily(weight),
        color,
        ...(letterSpacing !== undefined ? { letterSpacing } : null),
      }}
    >
      {children}
    </RNText>
  );
}
