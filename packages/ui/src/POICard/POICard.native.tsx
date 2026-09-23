import { Image, Pressable, View } from "react-native";
import { Bookmark } from "lucide-react-native";
import { colors, spacing } from "../tokens";
import { Card } from "../Card";
import { Text } from "../Text";
import { Rating } from "../Rating";
import type { POICardProps } from "./POICard.types";

// Horizontal row (thumbnail left, details right, favorite trailing) — the
// design's list-card layout, replacing the earlier vertical photo-on-top
// card. No gradient placeholder (see redesign plan): a flat `primaryLight`
// tint stands in for the photo, same treatment the design's mockup photos
// would show before a real image loads.
export function POICard({ poi, categoryLabel, onPress, isFavorite, onToggleFavorite }: POICardProps) {
  return (
    <Card onPress={onPress} padding={spacing.md}>
      <View className="flex-row items-start gap-md">
        {poi.thumbnailUrl ? (
          <Image source={{ uri: poi.thumbnailUrl }} className="h-[72px] w-[72px] shrink-0 rounded-md" />
        ) : (
          <View className="h-[72px] w-[72px] shrink-0 items-center justify-center rounded-md bg-primaryLight">
            <Text size="xl" color={colors.primaryDark} weight="bold">
              {poi.name.ro.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="min-w-0 flex-1 gap-[3px]">
          {categoryLabel && (
            <Text size="xs" weight="medium" color={colors.primaryDark} letterSpacing={1.3}>
              {categoryLabel.toUpperCase()}
            </Text>
          )}
          <Text weight="semibold" size="lg" numberOfLines={1}>
            {poi.name.ro}
          </Text>
          <Text size="sm" color={colors.textMuted} numberOfLines={1}>
            {poi.address}
          </Text>
          <View className="flex-row items-baseline gap-xs">
            <Rating value={poi.ratingAvg ?? 0} size={13} />
            <Text size="xs" color={colors.textMuted}>
              {poi.ratingCount > 0 ? `(${poi.ratingCount})` : "New"}
            </Text>
          </View>
        </View>

        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={8}
            accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
            className="-mr-sm -mt-sm h-11 w-11 items-center justify-center"
          >
            <Bookmark
              size={20}
              color={isFavorite ? colors.danger : colors.textMuted}
              fill={isFavorite ? colors.danger : "none"}
            />
          </Pressable>
        )}
      </View>
    </Card>
  );
}
