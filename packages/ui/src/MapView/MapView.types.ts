import type { Poi } from "@muslimspaces/shared";

export interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface MapViewProps {
  pois: Poi[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
  onMarkerPress?: (poiId: string) => void;
}
