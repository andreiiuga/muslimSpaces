import { Pressable, View } from "react-native";
import { colors, radii, spacing } from "../tokens";
import type { CardProps } from "./Card.types";

const shadowStyle = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
};

export function Card({ children, onPress, padding = spacing.lg }: CardProps) {
  const style = {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding,
    ...shadowStyle,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style}>
        {children}
      </Pressable>
    );
  }

  return <View style={style}>{children}</View>;
}
