import { TextInput, View } from "react-native";
import { cva } from "class-variance-authority";
import { colors } from "../tokens";
import { fontFamily } from "../fonts";
import { cn } from "../cn";
import type { InputProps } from "./Input.types";
import { Text } from "../Text";

const input = cva("rounded-input border px-md py-sm text-md", {
  variants: {
    error: { true: "border-danger", false: "border-border" },
    disabled: { true: "bg-background", false: "bg-surface" },
  },
  defaultVariants: { error: false, disabled: false },
});

export function Input({ value, onChangeText, placeholder, label, error, disabled, kind = "text" }: InputProps) {
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
        secureTextEntry={kind === "password"}
        keyboardType={kind === "email" ? "email-address" : "default"}
        autoCapitalize="none"
        className={cn(input({ error: !!error, disabled }))}
        style={{ fontFamily: fontFamily("regular"), color: colors.text }}
      />
      {error && (
        <Text size="sm" color={colors.danger}>
          {error}
        </Text>
      )}
    </View>
  );
}
