"use client";

import { colors, radii, shadows, spacing } from "../tokens";
import type { CardProps } from "./Card.types";

export function Card({ children, onPress, padding = spacing.lg }: CardProps) {
  const style = {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    boxShadow: shadows.card,
    padding,
    textAlign: "left" as const,
    border: "none",
    width: "100%",
    display: "block",
  };

  if (onPress) {
    return (
      <button type="button" onClick={onPress} style={{ ...style, cursor: "pointer" }}>
        {children}
      </button>
    );
  }

  return <div style={style}>{children}</div>;
}
