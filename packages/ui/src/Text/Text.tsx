import type { CSSProperties } from "react";
import { cva } from "class-variance-authority";
import { colors } from "../tokens";
import { cn } from "../cn";
import type { TextProps } from "./Text.types";

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

export function Text({ children, size = "md", weight = "regular", color = colors.text, align, numberOfLines, letterSpacing }: TextProps) {
  // color is per-call arbitrary data (any hex a caller passes), not a small
  // closed token set — Tailwind's JIT can't statically scan a dynamically
  // built `text-[${color}]` class, so it stays inline, same as
  // numberOfLines/letterSpacing overrides below (both also per-call values,
  // not variants with a fixed set of options).
  const style: CSSProperties = { color };
  if (letterSpacing !== undefined) style.letterSpacing = `${letterSpacing}px`;
  if (numberOfLines) {
    style.display = "-webkit-box";
    style.WebkitLineClamp = numberOfLines;
    style.WebkitBoxOrient = "vertical";
    style.overflow = "hidden";
  }

  return (
    <span className={cn(text({ size, weight, align }))} style={style}>
      {children}
    </span>
  );
}
