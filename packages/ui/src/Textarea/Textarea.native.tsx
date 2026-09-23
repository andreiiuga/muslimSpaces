import { TextInput, View } from "react-native";
import { cva } from "class-variance-authority";
import { colors } from "../tokens";
import { fontFamily } from "../fonts";
import { cn } from "../cn";
import type { TextareaProps } from "./Textarea.types";
import { Text } from "../Text";

const textarea = cva("rounded-input border px-md py-sm text-md", {
  variants: {
    error: { true: "border-danger", false: "border-border" },
    disabled: { true: "bg-background", false: "bg-surface" },
  },
  defaultVariants: { error: false, disabled: false },
});

export function Textarea({ value, onChangeText, placeholder, label, error, disabled, rows = 4 }: TextareaProps) {
  return (
    <View className="gap-xs">
      {label && (
        <Text size="sm" weight="medium">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        className={cn(textarea({ error: !!error, disabled }))}
        // rows*20 is a per-instance dynamic minHeight — RN has no auto-sizing
        // textarea-row concept, so this stays inline (same reasoning as
        // Avatar's size prop), same value the previous implementation used.
        style={{ fontFamily: fontFamily("regular"), color: colors.text, minHeight: rows * 20 }}
      />
      {error && (
        <Text size="sm" color={colors.danger}>
          {error}
        </Text>
      )}
    </View>
  );
}
