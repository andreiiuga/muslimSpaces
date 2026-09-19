import { TextInput, View } from "react-native";
import { colors, fontSizes, radii, spacing } from "../tokens";
import { fontFamily } from "../fonts";
import type { InputProps } from "./Input.types";
import { Text } from "../Text";

export function Input({ value, onChangeText, placeholder, label, error, disabled, kind = "text" }: InputProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      {label && <Text size="sm" weight="medium">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={!disabled}
        secureTextEntry={kind === "password"}
        keyboardType={kind === "email" ? "email-address" : "default"}
        autoCapitalize="none"
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
        }}
      />
      {error && <Text size="sm" color={colors.danger}>{error}</Text>}
    </View>
  );
}
