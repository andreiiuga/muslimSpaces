"use client";

import { Star } from "lucide-react";
import { colors, spacing } from "../tokens";
import { STAR_COUNT, type RatingProps } from "./Rating.types";

export function Rating({ value, onChange, size = 18 }: RatingProps) {
  const rounded = Math.round(value);

  return (
    <div style={{ display: "inline-flex", gap: spacing.xs / 2 }}>
      {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((star) => {
        const filled = star <= rounded;
        const icon = (
          <Star
            size={size}
            color={filled ? colors.star : colors.starEmpty}
            fill={filled ? colors.star : "none"}
          />
        );

        if (!onChange) return <span key={star}>{icon}</span>;

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
            aria-label={`Rate ${star} out of ${STAR_COUNT}`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
