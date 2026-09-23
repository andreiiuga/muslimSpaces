"use client";

import { Star } from "lucide-react";
import { colors } from "../tokens";
import { STAR_COUNT, type RatingProps } from "./Rating.types";

export function Rating({ value, onChange, size = 18 }: RatingProps) {
  const rounded = Math.round(value);

  return (
    <div className="inline-flex gap-0.5">
      {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((star) => {
        const filled = star <= rounded;
        // color/fill are SVG props on the icon component, not CSS — they
        // can't become a className regardless of how static the value is.
        const icon = <Star size={size} color={filled ? colors.star : colors.starEmpty} fill={filled ? colors.star : "none"} />;

        if (!onChange) return <span key={star}>{icon}</span>;

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="cursor-pointer border-0 bg-transparent p-0 leading-[0]"
            aria-label={`Rate ${star} out of ${STAR_COUNT}`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
