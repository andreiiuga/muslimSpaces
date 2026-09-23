import { ActivityIndicator, Pressable, Text as RNText } from "react-native";
import { cva } from "class-variance-authority";
import { colors, fontSizes, nativeShadows } from "../tokens";
import { fontFamily } from "../fonts";
import { cn } from "../cn";
import type { ButtonProps, ButtonVariant, ButtonSize } from "./Button.types";

// minHeight guarantees the design's pill height regardless of platform font
// metrics — padding alone (the previous approach) produced a ~30px "sm"
// pill and a ~40px "md" one, well under the design's 48-50px CTA buttons.
const button = cva("items-center justify-center rounded-pill", {
  variants: {
    variant: {
      primary: "bg-primary",
      secondary: "bg-primaryLight",
      ghost: "border border-border bg-transparent",
      danger: "border border-dangerBorder bg-dangerBg",
    },
    size: {
      sm: "px-md py-xs min-h-[40px]",
      md: "px-lg py-sm min-h-[48px]",
      lg: "px-xl py-md min-h-[52px]",
    },
    fullWidth: {
      true: "w-full",
      false: "",
    },
    disabled: {
      true: "opacity-50",
      false: "",
    },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

// Text color and ActivityIndicator's `color` prop can't be expressed as a
// className (the latter isn't a style at all — it's a native-only RN prop),
// so this table stays a plain lookup rather than moving into the cva above.
const TEXT_COLOR: Record<ButtonVariant, string> = {
  primary: colors.textOnPrimary,
  secondary: colors.primaryDark,
  ghost: colors.text,
  danger: colors.dangerDark,
};

const TEXT_SIZE: Record<ButtonSize, number> = {
  sm: fontSizes.sm,
  md: fontSizes.md,
  lg: fontSizes.lg,
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
  const isDisabled = disabled || loading;
  const textColor = TEXT_COLOR[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(button({ variant, size, fullWidth, disabled: !!disabled }))}
      // Primary's teal glow is an RN shadow-prop object, not a className —
      // see tokens.ts's nativeShadows comment for why it can't collapse
      // into the same boxShadow utility web's shadow-buttonGlow class uses.
      style={!disabled && variant === "primary" ? nativeShadows.buttonGlow : undefined}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        // fontFamily (not fontWeight) is mandatory here — RN has no
        // fontWeight-on-a-custom-font mechanism, see fonts.ts.
        <RNText style={{ color: textColor, fontSize: TEXT_SIZE[size], fontFamily: fontFamily("semibold") }}>
          {children}
        </RNText>
      )}
    </Pressable>
  );
}
