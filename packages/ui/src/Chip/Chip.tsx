"use client";

import { cva } from "class-variance-authority";
import { cn } from "../cn";
import type { ChipProps } from "./Chip.types";

const chip = cva(
  "inline-flex items-center gap-xs whitespace-nowrap rounded-pill border px-md py-xs text-sm font-medium",
  {
    variants: {
      selected: {
        true: "border-primary bg-primary text-textOnPrimary",
        false: "border-border bg-surface text-text",
      },
    },
    defaultVariants: { selected: false },
  },
);

export function Chip({ children, selected, onPress, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(chip({ selected }), onPress ? "cursor-pointer" : "cursor-default")}
    >
      {icon}
      {children}
    </button>
  );
}
