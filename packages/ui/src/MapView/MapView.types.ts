import type { Poi } from "@muslimspaces/shared";

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
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
  onMarkerPress?: (poiId: string) => void;
  /**
   * Shifts the camera's true center away from the container's geometric
   * center by this many px per side — for full-bleed maps with floating UI
   * overlaid on top, so the map's real focal point lands in the portion of
   * the screen that's actually unobstructed. Both maplibre-gl (web) and
   * @maplibre/maplibre-react-native (mobile) support this natively.
   */
  padding?: MapPadding;
}
