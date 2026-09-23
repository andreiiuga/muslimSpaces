import { Pressable, View } from "react-native";
import { nativeShadows, radii, spacing } from "../tokens";
import type { CardProps } from "./Card.types";

export function Card({ children, onPress, padding = spacing.lg, elevated, radius = radii.lg }: CardProps) {
  // padding/radius are per-instance numeric values — same "dynamic value
  // stays inline" reasoning as Avatar's size prop. The shadow is an RN
  // shadow-prop object, not a className — see tokens.ts's nativeShadows.
  const style = {
    padding,
    borderRadius: radius,
    ...(elevated ? nativeShadows.elevated : nativeShadows.card),
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="bg-surface" style={style}>
        {children}
      </Pressable>
    );
  }

  return (
    <View className="bg-surface" style={style}>
      {children}
    </View>
  );
}
