"use client";

import { colors, fontSizes, radii, spacing } from "../tokens";
import type { TextareaProps } from "./Textarea.types";
import { Text } from "../Text";

export function Textarea({ value, onChangeText, placeholder, label, error, disabled, rows = 4 }: TextareaProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
      {label && <Text size="sm" weight="medium">{label}</Text>}
      <textarea
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          borderRadius: radii.input,
          border: `1px solid ${error ? colors.danger : colors.border}`,
          fontSize: fontSizes.md,
          fontFamily: "inherit",
          backgroundColor: disabled ? colors.background : colors.surface,
          color: colors.text,
          outline: "none",
          resize: "vertical",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      {error && <Text size="sm" color={colors.danger}>{error}</Text>}
    </div>
  );
}
