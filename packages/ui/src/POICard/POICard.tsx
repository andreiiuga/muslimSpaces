"use client";

import { Bookmark } from "lucide-react";
import { cva } from "class-variance-authority";
import { colors, spacing } from "../tokens";
import { cn } from "../cn";
import { Card } from "../Card";
import { Text } from "../Text";
import { Rating } from "../Rating";
import type { POICardProps } from "./POICard.types";

const thumbnail = cva("rounded-md object-cover", {
  variants: {
    layout: {
      row: "h-[92px] w-[92px] flex-none",
      grid: "h-[168px] w-full",
    },
  },
});

const thumbnailFallback = cva("flex items-center justify-center rounded-md bg-primaryLight", {
  variants: {
    layout: {
      row: "h-[92px] w-[92px] flex-none",
      grid: "h-[168px] w-full",
    },
  },
});

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
      className="relative z-[2] flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-pill border-0 bg-transparent"
    >
      {/* color/fill are SVG props on the icon, not CSS — can't be a className. */}
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
      <div className="flex items-baseline gap-xs">
        <Rating value={poi.ratingAvg ?? 0} size={13} />
        <Text size="xs" color={colors.textMuted}>
          {poi.ratingCount > 0 ? `(${poi.ratingCount})` : "New"}
        </Text>
      </div>
    </>
  );

  const thumbnailEl = poi.thumbnailUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={poi.thumbnailUrl} alt="" className={cn(thumbnail({ layout }))} />
  ) : (
    <div className={cn(thumbnailFallback({ layout }))}>
      <Text size={layout === "grid" ? "2xl" : "xl"} color={colors.primaryDark} weight="bold">
        {poi.name.ro.charAt(0).toUpperCase()}
      </Text>
    </div>
  );

  return (
    <div className="relative">
      <Card padding={spacing.md}>
        {layout === "grid" ? (
          <div className="flex flex-col gap-sm">
            {thumbnailEl}
            <div className="flex items-start gap-sm">
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">{details}</div>
              {favoriteButton && (
                // flex-none here is load-bearing, not just on the button
                // inside it — this wrapper div, not the button, is the
                // actual flex item of the row below. Without it the
                // wrapper defaults to flex: 0 1 auto (shrinkable) and gets
                // squeezed narrower than the button's own fixed 44px under
                // any horizontal pressure, clipping the icon.
                <div className="-mt-sm -me-sm flex-none">{favoriteButton}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-md">
            {thumbnailEl}
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">{details}</div>
            {favoriteButton && <div className="-mt-sm -me-sm">{favoriteButton}</div>}
          </div>
        )}
      </Card>
    </div>
  );
}
