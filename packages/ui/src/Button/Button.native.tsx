import { ActivityIndicator, Pressable, Text as RNText } from "react-native";
import { colors, fontSizes, nativeShadows, radii, spacing } from "../tokens";
import { fontFamily } from "../fonts";
import type { ButtonProps, ButtonVariant, ButtonSize } from "./Button.types";

const VARIANT_STYLES: Record<
  ButtonVariant,
  { backgroundColor: string; color: string; borderColor?: string; shadow?: object }
> = {
  primary: { backgroundColor: colors.primary, color: colors.textOnPrimary, shadow: nativeShadows.buttonGlow },
  secondary: { backgroundColor: colors.primaryLight, color: colors.primaryDark },
  ghost: { backgroundColor: "transparent", color: colors.text, borderColor: colors.border },
  // Outline treatment, not solid red — matches the design's logout pill.
  danger: { backgroundColor: colors.dangerBg, color: colors.dangerDark, borderColor: colors.dangerBorder },
};

// minHeight guarantees the design's pill height regardless of platform font
// metrics — padding alone (the previous approach) produced a ~30px "sm"
// pill and a ~40px "md" one, well under the design's 48-50px CTA buttons.
const SIZE_PADDING: Record<ButtonSize, { vertical: number; horizontal: number; fontSize: number; minHeight: number }> = {
  sm: { vertical: spacing.xs, horizontal: spacing.md, fontSize: fontSizes.sm, minHeight: 40 },
  md: { vertical: spacing.sm, horizontal: spacing.lg, fontSize: fontSizes.md, minHeight: 48 },
  lg: { vertical: spacing.md, horizontal: spacing.xl, fontSize: fontSizes.lg, minHeight: 52 },
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
        minHeight: sizePadding.minHeight,
        opacity: disabled ? 0.5 : 1,
        alignItems: "center",
        justifyContent: "center",
        width: fullWidth ? "100%" : undefined,
        ...(disabled ? undefined : variantStyle.shadow),
      }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.color} />
      ) : (
        <RNText
          style={{ color: variantStyle.color, fontSize: sizePadding.fontSize, fontFamily: fontFamily("semibold") }}
        >
          {children}
        </RNText>
      )}
    </Pressable>
  );
}
