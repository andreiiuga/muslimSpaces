"use client";

import { cva } from "class-variance-authority";
import { colors } from "../tokens";
import { cn } from "../cn";
import type { TextareaProps } from "./Textarea.types";
import { Text } from "../Text";

const textarea = cva("w-full resize-y rounded-input border px-md py-sm font-[inherit] text-md text-text outline-none", {
  variants: {
    error: { true: "border-danger", false: "border-border" },
    disabled: { true: "bg-background", false: "bg-surface" },
  },
  defaultVariants: { error: false, disabled: false },
});

export function Textarea({ value, onChangeText, placeholder, label, error, disabled, rows = 4 }: TextareaProps) {
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <Text size="sm" weight="medium">
          {label}
        </Text>
      )}
      <textarea
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(textarea({ error: !!error, disabled }))}
      />
      {error && (
        <Text size="sm" color={colors.danger}>
          {error}
        </Text>
      )}
    </div>
  );
}
