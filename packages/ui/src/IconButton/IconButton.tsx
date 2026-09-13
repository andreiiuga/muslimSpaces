"use client";

import { colors, radii } from "../tokens";
import type { IconButtonProps, IconButtonSize } from "./IconButton.types";

const SIZE_PX: Record<IconButtonSize, number> = { sm: 32, md: 40, lg: 48 };

export function IconButton({ icon, onPress, variant = "ghost", size = "md", disabled, label }: IconButtonProps) {
  const px = SIZE_PX[size];

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={label}
      style={{
        width: px,
        height: px,
        borderRadius: radii.pill,
        border: "none",
        backgroundColor: variant === "solid" ? colors.surface : "transparent",
        boxShadow: variant === "solid" ? "0 1px 4px rgba(28,25,23,0.15)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
    </button>
  );
}
