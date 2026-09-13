import { ActivityIndicator, Pressable, Text as RNText } from "react-native";
import { colors, fontSizes, fontWeights, radii, spacing } from "../tokens";
import type { ButtonProps, ButtonVariant, ButtonSize } from "./Button.types";

const VARIANT_STYLES: Record<ButtonVariant, { backgroundColor: string; color: string; borderColor?: string }> = {
  primary: { backgroundColor: colors.primary, color: colors.textOnPrimary },
  secondary: { backgroundColor: colors.primaryLight, color: colors.primaryDark },
  ghost: { backgroundColor: "transparent", color: colors.text, borderColor: colors.border },
  danger: { backgroundColor: colors.danger, color: colors.textOnPrimary },
};

const SIZE_PADDING: Record<ButtonSize, { vertical: number; horizontal: number; fontSize: number }> = {
  sm: { vertical: spacing.xs, horizontal: spacing.md, fontSize: fontSizes.sm },
  md: { vertical: spacing.sm, horizontal: spacing.lg, fontSize: fontSizes.md },
  lg: { vertical: spacing.md, horizontal: spacing.xl, fontSize: fontSizes.lg },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  fullWidth,
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizePadding = SIZE_PADDING[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        backgroundColor: variantStyle.backgroundColor,
        borderColor: variantStyle.borderColor,
        borderWidth: variantStyle.borderColor ? 1 : 0,
        borderRadius: radii.pill,
        paddingVertical: sizePadding.vertical,
        paddingHorizontal: sizePadding.horizontal,
        opacity: disabled ? 0.5 : 1,
        alignItems: "center",
        justifyContent: "center",
        width: fullWidth ? "100%" : undefined,
      }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.color} />
      ) : (
        <RNText
          style={{ color: variantStyle.color, fontSize: sizePadding.fontSize, fontWeight: fontWeights.semibold }}
        >
          {children}
        </RNText>
      )}
    </Pressable>
  );
}
