"use client";

import { Heart } from "lucide-react";
import { colors, radii, spacing } from "../tokens";
import { Card } from "../Card";
import { Text } from "../Text";
import { Rating } from "../Rating";
import { IconButton } from "../IconButton";
import type { POICardProps } from "./POICard.types";

/**
 * Purely presentational — no navigation built in. Web needs the whole card
 * to be a real crawlable <a> for SEO, which conflicts with nesting an
 * interactive favorite button inside it (invalid HTML: <button> inside
 * <a>). The caller wraps this in a "stretched link" (an absolutely
 * positioned <Link> as a sibling, lower z-index than the favorite button)
 * instead — see apps/web's usage.
 */
export function POICard({ poi, categoryLabel, isFavorite, onToggleFavorite }: POICardProps) {
  return (
    <div style={{ position: "relative" }}>
      <Card padding={0}>
        <div
          style={{
            height: 140,
            borderRadius: `${radii.lg}px ${radii.lg}px 0 0`,
            backgroundColor: colors.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text size="2xl" color={colors.primaryDark} weight="bold">
            {poi.name.ro.charAt(0).toUpperCase()}
          </Text>
        </div>
        <div style={{ padding: spacing.md, display: "flex", flexDirection: "column", gap: spacing.xs }}>
          {categoryLabel && (
            <Text size="xs" weight="medium" color={colors.primary}>
              {categoryLabel.toUpperCase()}
            </Text>
          )}
          <Text weight="semibold" numberOfLines={1}>{poi.name.ro}</Text>
          <Text size="sm" color={colors.textMuted} numberOfLines={1}>
            {poi.address}
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
            <Rating value={poi.ratingAvg ?? 0} size={14} />
            <Text size="xs" color={colors.textMuted}>
              {poi.ratingCount > 0 ? `(${poi.ratingCount})` : "New"}
            </Text>
          </div>
        </div>
      </Card>
      {onToggleFavorite && (
        <div style={{ position: "absolute", top: spacing.sm, right: spacing.sm, zIndex: 2 }}>
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
        </div>
      )}
    </div>
  );
}
