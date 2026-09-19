import { Pressable, Text } from "react-native";
import { colors, fontSizes, radii, spacing } from "../tokens";
import { fontFamily } from "../fonts";
import type { ChipProps } from "./Chip.types";

export function Chip({ children, selected, onPress, icon }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.surface,
        alignSelf: "flex-start",
      }}
    >
      {icon}
      <Text
        style={{
          color: selected ? colors.textOnPrimary : colors.text,
          fontSize: fontSizes.sm,
          fontFamily: fontFamily("medium"),
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
