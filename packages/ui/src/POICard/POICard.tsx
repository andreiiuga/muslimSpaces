"use client";

import { Bookmark } from "lucide-react";
import { colors, radii, spacing } from "../tokens";
import { Card } from "../Card";
import { Text } from "../Text";
import { Rating } from "../Rating";
import type { POICardProps } from "./POICard.types";

/**
 * "row" (default): thumbnail left, details right, favorite trailing —
 * matches the design and mirrors POICard.native.tsx's structure. "grid":
 * thumbnail on top, details below — the taller tile Explore's list-mode
 * grid uses instead (the one place in the design that isn't the row
 * layout). Purely presentational — no navigation built in. Web needs the
 * whole card to be a real crawlable <a> for SEO, which conflicts with
 * nesting an interactive favorite button inside it (invalid HTML: <button>
 * inside <a>). The caller wraps this in a "stretched link" (an absolutely
 * positioned <Link> as a sibling, lower z-index than the favorite button)
 * instead — see apps/web's usage.
 */
export function POICard({ poi, categoryLabel, isFavorite, onToggleFavorite, layout = "row" }: POICardProps) {
  const favoriteButton = onToggleFavorite && (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite();
      }}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      style={{
        position: "relative",
        zIndex: 2,
        width: 44,
        height: 44,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        background: "transparent",
        borderRadius: radii.pill,
        cursor: "pointer",
      }}
    >
      <Bookmark size={20} color={isFavorite ? colors.danger : colors.textMuted} fill={isFavorite ? colors.danger : "none"} />
    </button>
  );

  const details = (
    <>
      {categoryLabel && (
        <Text size="xs" weight="medium" color={colors.primaryDark} letterSpacing={1.3}>
          {categoryLabel.toUpperCase()}
        </Text>
      )}
      <Text weight="semibold" size={layout === "grid" ? "xl" : "lg"} numberOfLines={1}>
        {poi.name.ro}
      </Text>
      <Text size="sm" color={colors.textMuted} numberOfLines={1}>
        {poi.address}
      </Text>
      <div style={{ display: "flex", alignItems: "baseline", gap: spacing.xs }}>
        <Rating value={poi.ratingAvg ?? 0} size={13} />
        <Text size="xs" color={colors.textMuted}>
          {poi.ratingCount > 0 ? `(${poi.ratingCount})` : "New"}
        </Text>
      </div>
    </>
  );

  const thumbnailSize = { width: layout === "grid" ? "100%" : 92, height: layout === "grid" ? 168 : 92 };
  const thumbnail = poi.thumbnailUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={poi.thumbnailUrl}
      alt=""
      style={{
        ...thumbnailSize,
        flex: layout === "grid" ? undefined : "none",
        borderRadius: radii.md,
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      style={{
        ...thumbnailSize,
        flex: layout === "grid" ? undefined : "none",
        borderRadius: radii.md,
        backgroundColor: colors.primaryLight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text size={layout === "grid" ? "2xl" : "xl"} color={colors.primaryDark} weight="bold">
        {poi.name.ro.charAt(0).toUpperCase()}
      </Text>
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      <Card padding={spacing.md}>
        {layout === "grid" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
            {thumbnail}
            <div style={{ display: "flex", gap: spacing.sm, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>{details}</div>
              {favoriteButton && (
                // flex: "none" here is load-bearing, not just on the button
                // inside it — this wrapper div, not the button, is the
                // actual flex item of the row below. Without it the
                // wrapper defaults to flex: 0 1 auto (shrinkable) and gets
                // squeezed narrower than the button's own fixed 44px under
                // any horizontal pressure, clipping the icon.
                <div style={{ flex: "none", marginTop: -spacing.sm, marginInlineEnd: -spacing.sm }}>{favoriteButton}</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: spacing.md, alignItems: "flex-start" }}>
            {thumbnail}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>{details}</div>
            {favoriteButton && <div style={{ marginTop: -spacing.sm, marginInlineEnd: -spacing.sm }}>{favoriteButton}</div>}
          </div>
        )}
      </Card>
    </div>
  );
}
