import { TextInput, View } from "react-native";
import { colors, fontSizes, radii, spacing } from "../tokens";
import { fontFamily } from "../fonts";
import type { TextareaProps } from "./Textarea.types";
import { Text } from "../Text";

export function Textarea({ value, onChangeText, placeholder, label, error, disabled, rows = 4 }: TextareaProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      {label && <Text size="sm" weight="medium">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        style={{
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          borderRadius: radii.input,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          fontSize: fontSizes.md,
          fontFamily: fontFamily("regular"),
          backgroundColor: disabled ? colors.background : colors.surface,
          color: colors.text,
          minHeight: rows * 20,
        }}
      />
      {error && <Text size="sm" color={colors.danger}>{error}</Text>}
    </View>
  );
}
