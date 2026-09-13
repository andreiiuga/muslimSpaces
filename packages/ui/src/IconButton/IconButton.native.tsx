import { Pressable } from "react-native";
import { colors, radii } from "../tokens";
import type { IconButtonProps, IconButtonSize } from "./IconButton.types";

const SIZE_PX: Record<IconButtonSize, number> = { sm: 32, md: 40, lg: 48 };

export function IconButton({ icon, onPress, variant = "ghost", size = "md", disabled, label }: IconButtonProps) {
  const px = SIZE_PX[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: px,
        height: px,
        borderRadius: radii.pill,
        backgroundColor: variant === "solid" ? colors.surface : "transparent",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
        ...(variant === "solid"
          ? {
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }
          : null),
      }}
    >
      {icon}
    </Pressable>
  );
}
