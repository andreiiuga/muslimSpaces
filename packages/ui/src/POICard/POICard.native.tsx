import { Image, Pressable, View } from "react-native";
import { Bookmark } from "lucide-react-native";
import { colors, radii, spacing } from "../tokens";
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
      <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "flex-start" }}>
        {poi.thumbnailUrl ? (
          <Image
            source={{ uri: poi.thumbnailUrl }}
            style={{ width: 72, height: 72, flexShrink: 0, borderRadius: radii.md }}
          />
        ) : (
          <View
            style={{
              width: 72,
              height: 72,
              flexShrink: 0,
              borderRadius: radii.md,
              backgroundColor: colors.primaryLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text size="xl" color={colors.primaryDark} weight="bold">
              {poi.name.ro.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
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
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.xs }}>
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
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginTop: -spacing.sm, marginRight: -spacing.sm }}
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
