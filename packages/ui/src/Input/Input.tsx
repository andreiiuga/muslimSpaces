"use client";

import { cva } from "class-variance-authority";
import { colors } from "../tokens";
import { cn } from "../cn";
import type { InputProps } from "./Input.types";
import { Text } from "../Text";

const input = cva("w-full rounded-input border px-md py-sm text-md text-text outline-none", {
  variants: {
    error: { true: "border-danger", false: "border-border" },
    disabled: { true: "bg-background", false: "bg-surface" },
  },
  defaultVariants: { error: false, disabled: false },
});

export function Input({ value, onChangeText, placeholder, label, error, disabled, kind = "text" }: InputProps) {
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <Text size="sm" weight="medium">
          {label}
        </Text>
      )}
      <input
        type={kind}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(input({ error: !!error, disabled }))}
      />
      {error && (
        <Text size="sm" color={colors.danger}>
          {error}
        </Text>
      )}
    </div>
  );
}
