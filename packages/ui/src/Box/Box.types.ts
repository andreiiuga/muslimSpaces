import type { ReactNode } from "react";

export type BoxDirection = "row" | "column";
export type BoxAlign = "flex-start" | "center" | "flex-end" | "stretch";
export type BoxJustify = "flex-start" | "center" | "flex-end" | "space-between" | "space-around";

export interface BoxProps {
  children?: ReactNode;
  direction?: BoxDirection;
  align?: BoxAlign;
  justify?: BoxJustify;
  gap?: number;
  padding?: number;
  paddingHorizontal?: number;
  paddingVertical?: number;
  flex?: number;
  wrap?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
}
