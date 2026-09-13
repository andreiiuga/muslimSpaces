"use client";

import { colors, fontSizes, fontWeights, radii, spacing } from "../tokens";
import type { ChipProps } from "./Chip.types";

export function Chip({ children, selected, onPress, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: spacing.xs,
        padding: `${spacing.xs}px ${spacing.md}px`,
        borderRadius: radii.pill,
        border: `1px solid ${selected ? colors.primary : colors.border}`,
        backgroundColor: selected ? colors.primary : colors.surface,
        color: selected ? colors.textOnPrimary : colors.text,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        cursor: onPress ? "pointer" : "default",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {children}
    </button>
  );
}
