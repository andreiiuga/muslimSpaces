import { useCallback } from "react";
import { View } from "react-native";
import { Camera, MapView as MLRNMapView, PointAnnotation } from "@maplibre/maplibre-react-native";
import { colors } from "../tokens";
import type { MapViewProps } from "./MapView.types";

// Free, whole-planet vector tiles, no API key, built for production use —
// see CLAUDE.md's "Map tiles" decision. Same style URL as the web variant.
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Romania's rough center — sensible default before any POIs/geolocation exist.
const DEFAULT_CENTER = { lat: 45.9432, lng: 24.9668 };
const DEFAULT_ZOOM = 6;

// visibleBounds from onRegionDidChange is [northEast, southWest] as
// [lng, lat] GeoJSON positions.
interface RegionDidChangeEvent {
  properties: {
    // GeoJSON.Position is `number[]` (variable length in principle), even
    // though this library always supplies [lng, lat] pairs here.
    visibleBounds: [number[], number[]];
  };
}

export function MapView({
  pois,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  onBoundsChange,
  onMarkerPress,
}: MapViewProps) {
  const handleRegionDidChange = useCallback(
    (feature: RegionDidChangeEvent) => {
      if (!onBoundsChange) return;
      const [northEast, southWest] = feature.properties.visibleBounds;
      onBoundsChange({
        minLat: southWest[1],
        minLng: southWest[0],
        maxLat: northEast[1],
        maxLng: northEast[0],
      });
    },
    [onBoundsChange],
  );

  return (
    <MLRNMapView style={{ flex: 1 }} mapStyle={OPENFREEMAP_STYLE} onRegionDidChange={handleRegionDidChange}>
      <Camera
        defaultSettings={{
          centerCoordinate: [initialCenter.lng, initialCenter.lat],
          zoomLevel: initialZoom,
        }}
      />
      {pois.map((poi) => (
        <PointAnnotation
          key={poi.id}
          id={poi.id}
          coordinate={[poi.location.lng, poi.location.lat]}
          onSelected={() => onMarkerPress?.(poi.id)}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.primary,
              borderWidth: 2,
              borderColor: "#fff",
            }}
          />
        </PointAnnotation>
      ))}
    </MLRNMapView>
  );
}
