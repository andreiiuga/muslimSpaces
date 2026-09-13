import type { CSSProperties } from "react";
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
  const style: CSSProperties = {
    display: "flex",
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    gap,
    padding,
    paddingLeft: paddingHorizontal,
    paddingRight: paddingHorizontal,
    paddingTop: paddingVertical,
    paddingBottom: paddingVertical,
    flex,
    flexWrap: wrap ? "wrap" : undefined,
    backgroundColor,
    borderRadius,
  };
  return <div style={style}>{children}</div>;
}
