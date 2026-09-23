"use client";

import { cva } from "class-variance-authority";
import { cn } from "../cn";
import type { ButtonProps } from "./Button.types";

const button = cva(
  "inline-flex items-center justify-center rounded-pill border-0 font-semibold disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-textOnPrimary shadow-buttonGlow",
        secondary: "bg-primaryLight text-primaryDark",
        ghost: "border border-border bg-transparent text-text",
        // Outline treatment, not solid red — matches the design's logout pill.
        danger: "border border-dangerBorder bg-dangerBg text-dangerDark",
      },
      size: {
        sm: "px-md py-xs text-sm",
        md: "px-lg py-sm text-md",
        lg: "px-xl py-md text-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

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
  return (
    <button
      type={type}
      onClick={onPress}
      disabled={disabled || loading}
      className={cn(button({ variant, size, fullWidth }))}
    >
      {loading ? "…" : children}
    </button>
  );
}
