import type { Poi } from "@muslimspaces/shared";

export interface POICardProps {
  poi: Poi;
  /** Resolved by the caller (has the categories list); keeps this component decoupled from category lookups. */
  categoryLabel?: string;
  onPress?: () => void;
  /** Omit entirely to hide the favorite toggle (e.g. logged-out users). */
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  /**
   * Web only: "row" (default) is the thumbnail-left list row used in the
   * map-mode side list and Favorites. "grid" is the thumbnail-on-top card
   * used by Explore's list-mode grid — the one place in the design that
   * uses a taller, wider tile instead of the row layout. Native has no
   * grid — mobile screens are single-column, so the distinction doesn't
   * apply there.
   */
  layout?: "row" | "grid";
}
