"use client";

import { cva } from "class-variance-authority";
import { cn } from "../cn";
import type { IconButtonProps } from "./IconButton.types";

const iconButton = cva(
  "flex items-center justify-center rounded-pill border-0 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        ghost: "bg-transparent",
        solid: "bg-surface shadow-iconSolid",
      },
      size: {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export function IconButton({ icon, onPress, variant = "ghost", size = "md", disabled, label }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={label}
      className={cn(iconButton({ variant, size }))}
    >
      {icon}
    </button>
  );
}
