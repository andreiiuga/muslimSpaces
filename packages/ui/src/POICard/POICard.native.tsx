import { View } from "react-native";
import { Heart } from "lucide-react-native";
import { colors, radii, spacing } from "../tokens";
import { Card } from "../Card";
import { Text } from "../Text";
import { Rating } from "../Rating";
import { IconButton } from "../IconButton";
import type { POICardProps } from "./POICard.types";

// No crawlability constraint on native — onPress can drive navigation
// directly, no stretched-link workaround needed like the web variant.
export function POICard({ poi, categoryLabel, onPress, isFavorite, onToggleFavorite }: POICardProps) {
  return (
    <View>
      <Card onPress={onPress} padding={0}>
        <View
          style={{
            height: 140,
            borderTopLeftRadius: radii.lg,
            borderTopRightRadius: radii.lg,
            backgroundColor: colors.primaryLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text size="2xl" color={colors.primaryDark} weight="bold">
            {poi.name.ro.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ padding: spacing.md, gap: spacing.xs }}>
          {categoryLabel && (
            <Text size="xs" weight="medium" color={colors.primary}>
              {categoryLabel.toUpperCase()}
            </Text>
          )}
          <Text weight="semibold" numberOfLines={1}>{poi.name.ro}</Text>
          <Text size="sm" color={colors.textMuted} numberOfLines={1}>
            {poi.address}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Rating value={poi.ratingAvg ?? 0} size={14} />
            <Text size="xs" color={colors.textMuted}>
              {poi.ratingCount > 0 ? `(${poi.ratingCount})` : "New"}
            </Text>
          </View>
        </View>
      </Card>
      {onToggleFavorite && (
        <View style={{ position: "absolute", top: spacing.sm, right: spacing.sm }}>
          <IconButton
            icon={
              <Heart
                size={18}
                fill={isFavorite ? colors.danger : "none"}
                color={isFavorite ? colors.danger : colors.text}
              />
            }
            onPress={onToggleFavorite}
            variant="solid"
            size="sm"
            label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          />
        </View>
      )}
    </View>
  );
}
