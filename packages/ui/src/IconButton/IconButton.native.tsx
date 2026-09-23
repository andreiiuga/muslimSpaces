import { Pressable } from "react-native";
import { cva } from "class-variance-authority";
import { nativeShadows } from "../tokens";
import { cn } from "../cn";
import type { IconButtonProps } from "./IconButton.types";

const iconButton = cva("items-center justify-center rounded-pill", {
  variants: {
    variant: {
      ghost: "bg-transparent",
      solid: "border border-border bg-surface",
    },
    size: {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    },
    disabled: {
      true: "opacity-50",
      false: "",
    },
  },
  defaultVariants: { variant: "ghost", size: "md" },
});

export function IconButton({ icon, onPress, variant = "ghost", size = "md", disabled, label }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(iconButton({ variant, size, disabled: !!disabled }))}
      style={variant === "solid" ? nativeShadows.iconSolid : undefined}
    >
      {icon}
    </Pressable>
  );
}
