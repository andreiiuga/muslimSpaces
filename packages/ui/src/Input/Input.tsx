"use client";

import { colors, fontSizes, radii, spacing } from "../tokens";
import type { InputProps } from "./Input.types";
import { Text } from "../Text";

export function Input({ value, onChangeText, placeholder, label, error, disabled, kind = "text" }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
      {label && <Text size="sm" weight="medium">{label}</Text>}
      <input
        type={kind}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          borderRadius: radii.input,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          fontSize: fontSizes.md,
          backgroundColor: disabled ? colors.background : colors.surface,
          color: colors.text,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      {error && <Text size="sm" color={colors.danger}>{error}</Text>}
    </div>
  );
}
