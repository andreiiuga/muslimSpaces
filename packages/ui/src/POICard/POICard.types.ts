import type { Poi } from "@muslimspaces/shared";

export interface POICardProps {
  poi: Poi;
  /** Resolved by the caller (has the categories list); keeps this component decoupled from category lookups. */
  categoryLabel?: string;
  /**
   * Resolved by the caller (has the active locale); keeps this component
   * decoupled from i18n, same reasoning as categoryLabel above. Falls back
   * to `poi.name.ro` when omitted — Romanian was this card's original
   * hardcoded default, kept as the fallback so an existing caller that
   * hasn't been updated yet still renders exactly as before.
   */
  displayName?: string;
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
