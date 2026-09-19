import type { CSSProperties } from "react";
import { colors, fontSizes, fontWeights, letterSpacings } from "../tokens";
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
  const style: CSSProperties = {
    display: "block",
    fontSize: fontSizes[size],
    fontWeight: fontWeights[weight],
    color,
    textAlign: align,
    margin: 0,
    // RN's letterSpacing unit is already absolute px, same as CSS's here —
    // no em/px conversion needed to share the table with Text.native.tsx.
    letterSpacing: `${letterSpacing ?? letterSpacings[size]}px`,
  };

  if (numberOfLines) {
    Object.assign(style, {
      display: "-webkit-box",
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    });
  }

  return <span style={style}>{children}</span>;
}
