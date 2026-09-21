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
  /**
   * Bump this (e.g. a counter incremented once per search) to fit/zoom the
   * camera to the bounding box of the current `pois` prop — e.g. "zoom to
   * the results" after a search concludes. Only reacts to the value
   * *changing*; the initial value (including 0/undefined) never triggers a
   * fit on mount. Web only for now — MapView.native.tsx doesn't implement
   * this prop.
   */
  fitBoundsToken?: number;
  onMarkerPress?: (poiId: string) => void;
  /**
   * The currently-selected POI (e.g. from a marker tap) — when this changes
   * to a POI present in `pois`, the map flies into it at an angle and then
   * orbits slowly around it. Going back to `null`/`undefined` levels the
   * camera back out to top-down. See `onDeselect`.
   */
  selectedPoiId?: string | null;
  /**
   * Called when the back button (shown over the map while a POI is
   * selected) is pressed. The caller is expected to clear its own
   * selection state (e.g. `setSelectedPoiId(null)`) — MapView doesn't own
   * that state, only reacts to it via `selectedPoiId`.
   */
  onDeselect?: () => void;
  /**
   * Shifts the camera's true center away from the container's geometric
   * center by this many px per side — for full-bleed maps with floating UI
   * overlaid on top, so the map's real focal point lands in the portion of
   * the screen that's actually unobstructed. Both maplibre-gl (web) and
   * @maplibre/maplibre-react-native (mobile) support this natively.
   */
  padding?: MapPadding;
}
