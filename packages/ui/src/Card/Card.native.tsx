import { Pressable, View } from "react-native";
import { colors, nativeShadows, radii, spacing } from "../tokens";
import type { CardProps } from "./Card.types";

export function Card({ children, onPress, padding = spacing.lg, elevated, radius = radii.lg }: CardProps) {
  const style = {
    backgroundColor: colors.surface,
    borderRadius: radius,
    padding,
    ...(elevated ? nativeShadows.elevated : nativeShadows.card),
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
