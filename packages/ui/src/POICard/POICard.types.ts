import type { Poi } from "@muslimspaces/shared";

export interface POICardProps {
  poi: Poi;
  /** Resolved by the caller (has the categories list); keeps this component decoupled from category lookups. */
  categoryLabel?: string;
  onPress?: () => void;
  /** Omit entirely to hide the favorite toggle (e.g. logged-out users). */
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}
