import type { Category, Poi } from "@muslimspaces/shared";

export interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface MapPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface MapViewProps {
  pois: Poi[];
  /**
   * Used to resolve each POI's primaryCategoryId to a category slug, which
   * picks its pin icon (see pin-utils.ts's CATEGORY_ICON_KEY). Omitted or
   * unmatched categories fall back to a generic pin icon.
   */
  categories?: Category[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
  onMarkerPress?: (poiId: string) => void;
  /**
   * The currently-selected POI (e.g. from a marker tap) — when this changes
   * to a POI present in `pois`, the map centers on it without changing zoom.
   */
  selectedPoiId?: string | null;
  /**
   * Shifts the camera's true center away from the container's geometric
   * center by this many px per side — for full-bleed maps with floating UI
   * overlaid on top, so the map's real focal point lands in the portion of
   * the screen that's actually unobstructed. Both maplibre-gl (web) and
   * @maplibre/maplibre-react-native (mobile) support this natively.
   */
  padding?: MapPadding;
}
