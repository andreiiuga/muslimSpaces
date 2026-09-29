import type { CSSProperties } from "react";
import { cva } from "class-variance-authority";
import { colors } from "../tokens";
import { cn } from "../cn";
import type { TextProps } from "./Text.types";

// Every value here must appear as a literal string in this file — Tailwind's
// JIT scanner is regex-over-source-text, not runtime-aware, so a computed
// `text-${color}` template literal would never match anything and every
// themed Text would silently render with no color at all. A static lookup
// is the only way a dynamic prop value can drive a Tailwind className.
const TOKEN_CLASS: Record<keyof typeof colors, string> = {
  primary: "text-primary",
  primaryDark: "text-primaryDark",
  primaryLight: "text-primaryLight",
  background: "text-background",
  surface: "text-surface",
  border: "text-border",
  text: "text-text",
  textBody: "text-textBody",
  textMuted: "text-textMuted",
  textFaint: "text-textFaint",
  textOnPrimary: "text-textOnPrimary",
  danger: "text-danger",
  dangerDark: "text-dangerDark",
  dangerLight: "text-dangerLight",
  dangerBg: "text-dangerBg",
  dangerBorder: "text-dangerBorder",
  success: "text-success",
  warning: "text-warning",
  star: "text-star",
  starEmpty: "text-starEmpty",
  divider: "text-divider",
  tealTint: "text-tealTint",
};

const text = cva("m-0", {
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
    weight: {
      regular: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
  defaultVariants: { size: "md", weight: "regular" },
});

export function Text({ children, size = "md", weight = "regular", color = "text", align, numberOfLines, letterSpacing }: TextProps) {
  // A known token name resolves to a themeable Tailwind className (see
  // TOKEN_CLASS above); anything else is treated as an arbitrary one-off
  // hex a caller passed directly and stays inline, unthemed, same as
  // numberOfLines/letterSpacing overrides below (both also per-call values,
  // not variants with a fixed set of options).
  const tokenClass = (TOKEN_CLASS as Record<string, string>)[color];
  const style: CSSProperties = {};
  if (!tokenClass) style.color = color;
  if (letterSpacing !== undefined) style.letterSpacing = `${letterSpacing}px`;
  if (numberOfLines) {
    style.display = "-webkit-box";
    style.WebkitLineClamp = numberOfLines;
    style.WebkitBoxOrient = "vertical";
    style.overflow = "hidden";
  }

  return (
    <span className={cn(text({ size, weight, align }), tokenClass)} style={style}>
      {children}
    </span>
  );
}
