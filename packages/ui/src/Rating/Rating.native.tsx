import { Pressable, View } from "react-native";
import { Star } from "lucide-react-native";
import { colors, spacing } from "../tokens";
import { STAR_COUNT, type RatingProps } from "./Rating.types";

export function Rating({ value, onChange, size = 18 }: RatingProps) {
  const rounded = Math.round(value);

  return (
    <View style={{ flexDirection: "row", gap: spacing.xs / 2 }}>
      {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((star) => {
        const filled = star <= rounded;
        const icon = (
          <Star size={size} color={filled ? colors.star : colors.starEmpty} fill={filled ? colors.star : "none"} />
        );

        if (!onChange) return <View key={star}>{icon}</View>;

        return (
          <Pressable key={star} onPress={() => onChange(star)} accessibilityLabel={`Rate ${star} out of ${STAR_COUNT}`}>
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}
