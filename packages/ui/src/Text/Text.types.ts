import type { ReactNode } from "react";
import type { colors, fontSizes, fontWeights } from "../tokens";

export type TextSize = keyof typeof fontSizes;
export type TextWeight = keyof typeof fontWeights;
/** A known semantic token name — on web, resolves to a themeable Tailwind
 * className instead of an inline style. See Text.tsx's TOKEN_CLASS. */
export type TextColorToken = keyof typeof colors;

export interface TextProps {
  children?: ReactNode;
  size?: TextSize;
  weight?: TextWeight;
  /** A token name themes automatically (light/dark); any other string is
   * treated as an arbitrary one-off hex, rendered unthemed via inline style
   * exactly as before. */
  color?: TextColorToken | (string & {});
  align?: "left" | "center" | "right";
  /** Truncates to N lines with an ellipsis on both platforms. */
  numberOfLines?: number;
  /** Overrides the size-based default tracking (see DEFAULT_LETTER_SPACING). */
  letterSpacing?: number;
}
