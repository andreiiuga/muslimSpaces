"use client";

import type { CSSProperties } from "react";
import { colors, fontSizes, fontWeights, radii, spacing } from "../tokens";
import type { ButtonProps, ButtonVariant, ButtonSize } from "./Button.types";

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary: { backgroundColor: colors.primary, color: colors.textOnPrimary, boxShadow: "0 4px 14px rgba(15,118,110,.28)" },
  secondary: { backgroundColor: colors.primaryLight, color: colors.primaryDark },
  ghost: { backgroundColor: "transparent", color: colors.text, border: `1px solid ${colors.border}` },
  // Outline treatment, not solid red — matches the design's logout pill
  // (and Button.native.tsx's same variant, restyled for the mobile pass).
  danger: { backgroundColor: colors.dangerBg, color: colors.dangerDark, border: `1px solid ${colors.dangerBorder}` },
};

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: `${spacing.xs}px ${spacing.md}px`, fontSize: fontSizes.sm },
  md: { padding: `${spacing.sm}px ${spacing.lg}px`, fontSize: fontSizes.md },
  lg: { padding: `${spacing.md}px ${spacing.xl}px`, fontSize: fontSizes.lg },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  fullWidth,
  type = "button",
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <button
      type={type}
      onClick={onPress}
      disabled={disabled || loading}
      style={{
        ...variantStyle,
        ...SIZE_STYLES[size],
        borderRadius: radii.pill,
        border: variantStyle.border ?? "none",
        fontWeight: fontWeights.semibold,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? "100%" : undefined,
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}
