"use client";

import { cva } from "class-variance-authority";
import { radii, spacing } from "../tokens";
import { cn } from "../cn";
import type { CardProps } from "./Card.types";

const card = cva("block w-full border-0 bg-surface text-left", {
  variants: {
    elevated: {
      true: "shadow-elevated",
      false: "shadow-card",
    },
  },
  defaultVariants: { elevated: false },
});

export function Card({ children, onPress, padding = spacing.lg, elevated, radius = radii.lg }: CardProps) {
  // padding/radius are per-instance numeric values (in practice always a
  // spacing/radii token, but typed as raw numbers so any value works) — same
  // "dynamic value stays inline" reasoning as Avatar's size prop.
  const style = { padding, borderRadius: radius };

  if (onPress) {
    return (
      <button type="button" onClick={onPress} className={cn(card({ elevated }), "cursor-pointer")} style={style}>
        {children}
      </button>
    );
  }

  return (
    <div className={cn(card({ elevated }))} style={style}>
      {children}
    </div>
  );
}
