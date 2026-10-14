"use client";

import { cva } from "class-variance-authority";
import { cn } from "../cn";
import type { ChipProps } from "./Chip.types";

const chip = cva(
  "inline-flex items-center gap-xs whitespace-nowrap rounded-pill border px-md py-xs text-sm font-medium outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      selected: {
        true: "border-primary bg-primary text-textOnPrimary",
        // Amber, the warm complement to the brand green: unmistakably "the
        // headline one" next to ordinary selected (green) chips.
        primary: "border-star bg-star text-[#1C1917] ring-2 ring-star/30",
        false: "border-border bg-surface text-text",
      },
    },
    defaultVariants: { selected: false },
  },
);

export function Chip({ children, selected, primary, onPress, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(chip({ selected: primary && selected ? "primary" : selected }), onPress ? "cursor-pointer" : "cursor-default")}
    >
      {icon}
      {children}
    </button>
  );
}
