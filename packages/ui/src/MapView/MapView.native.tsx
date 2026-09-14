import { useCallback } from "react";
import { View } from "react-native";
import type { NativeSyntheticEvent } from "react-native";
import { Camera, Map, Marker } from "@maplibre/maplibre-react-native";
import type { ViewStateChangeEvent } from "@maplibre/maplibre-react-native";
import { colors } from "../tokens";
import type { MapViewProps } from "./MapView.types";

// Free, whole-planet vector tiles, no API key, built for production use —
// see CLAUDE.md's "Map tiles" decision. Same style URL as the web variant.
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Romania's rough center — sensible default before any POIs/geolocation exist.
const DEFAULT_CENTER = { lat: 45.9432, lng: 24.9668 };
const DEFAULT_ZOOM = 6;

export function MapView({
  pois,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  onBoundsChange,
  onMarkerPress,
}: MapViewProps) {
  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      if (!onBoundsChange) return;
      const [minLng, minLat, maxLng, maxLat] = event.nativeEvent.bounds;
      onBoundsChange({ minLat, minLng, maxLat, maxLng });
    },
    [onBoundsChange],
  );

  return (
    <Map style={{ flex: 1 }} mapStyle={OPENFREEMAP_STYLE} onRegionDidChange={handleRegionDidChange}>
      <Camera
        initialViewState={{
          center: [initialCenter.lng, initialCenter.lat],
          zoom: initialZoom,
        }}
      />
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          id={poi.id}
          lngLat={[poi.location.lng, poi.location.lat]}
          onPress={() => onMarkerPress?.(poi.id)}
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
        </Marker>
      ))}
    </Map>
  );
}
