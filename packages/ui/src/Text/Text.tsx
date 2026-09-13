import type { CSSProperties } from "react";
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
  const style: CSSProperties = {
    display: "block",
    fontSize: fontSizes[size],
    fontWeight: fontWeights[weight],
    color,
    textAlign: align,
    margin: 0,
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
