"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cva } from "class-variance-authority";
import { colors } from "../tokens";
import { cn } from "../cn";
import type { InputProps } from "./Input.types";
import { Text } from "../Text";

const input = cva(
  "w-full rounded-input border px-md py-sm text-md text-text outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      error: { true: "border-danger", false: "border-border" },
      disabled: { true: "bg-background", false: "bg-surface" },
    },
    defaultVariants: { error: false, disabled: false },
  },
);

export function Input({ value, onChangeText, placeholder, label, error, disabled, kind = "text", autoComplete, name, autoFocus, onFocus, hint, showLabel = "Show password", hideLabel = "Hide password" }: InputProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = kind === "password";
  return (
    <div className="flex flex-col gap-xs">
      {label && (
        <label htmlFor={id}>
          <Text size="sm" weight="medium">
            {label}
          </Text>
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && revealed ? "text" : kind}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          onFocus={onFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint && !error ? `${id}-hint` : undefined}
          className={cn(input({ error: !!error, disabled }), isPassword && "pr-[44px]")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-pressed={revealed}
            aria-label={revealed ? hideLabel : showLabel}
            className="absolute inset-y-0 right-0 flex w-[44px] cursor-pointer items-center justify-center rounded-input border-0 bg-transparent text-textMuted outline-none hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <span id={`${id}-hint`}>
          <Text size="sm" color="textMuted">
            {hint}
          </Text>
        </span>
      )}
      {error && (
        <Text size="sm" color={colors.danger}>
          {error}
        </Text>
      )}
    </div>
  );
}
