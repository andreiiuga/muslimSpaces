import type { ReactNode } from "react";
import type { fontSizes, fontWeights } from "../tokens";

export type TextSize = keyof typeof fontSizes;
export type TextWeight = keyof typeof fontWeights;

export interface TextProps {
  children?: ReactNode;
  size?: TextSize;
  weight?: TextWeight;
  color?: string;
  align?: "left" | "center" | "right";
  /** Truncates to N lines with an ellipsis on both platforms. */
  numberOfLines?: number;
}
