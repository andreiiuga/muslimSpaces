import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { NativeSyntheticEvent } from "react-native";
import { Camera, Map, Marker } from "@maplibre/maplibre-react-native";
import type { CameraRef, ViewStateChangeEvent } from "@maplibre/maplibre-react-native";
import { Beef, Cookie, MapPin, Mosque, Scale, Shirt, Store, Stethoscope, Utensils } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, nativeShadows, radii } from "../tokens";
import { Text } from "../Text";
import { LABEL_MIN_ZOOM, pinIconKeyForSlug, pinLabel } from "./pin-utils";
import type { PinIconKey } from "./pin-utils";
import type { MapViewProps } from "./MapView.types";

// Free, whole-planet vector tiles, no API key, built for production use —
// see CLAUDE.md's "Map tiles" decision. Same style URL as the web variant.
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Romania's rough center — sensible default before any POIs/geolocation exist.
const DEFAULT_CENTER = { lat: 45.9432, lng: 24.9668 };
const DEFAULT_ZOOM = 6;

// Per-category pin glyphs — matches the web app's MapView.tsx (same lucide
// icon set, via lucide-react there) and the Claude Design canvas's Phosphor
// CAT_ICON map (see CLAUDE.md's "Design reference" entry) as closely as lucide's
// icon set allows.
const PIN_ICON_COMPONENTS: Record<PinIconKey, LucideIcon> = {
  mosque: Mosque,
  restaurant: Utensils,
  meat: Beef,
  sweets: Cookie,
  store: Store,
  clothing: Shirt,
  doctors: Stethoscope,
  lawyers: Scale,
  generic: MapPin,
};
const PIN_ICON_SIZE = 22;

export function MapView({
  pois,
  categories,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  onBoundsChange,
  onMarkerPress,
  selectedPoiId,
  padding,
}: MapViewProps) {
  const cameraRef = useRef<CameraRef>(null);
  // Gates name labels below a certain zoom — starts at the initial zoom so
  // labels don't flash visible-then-hidden on a zoomed-out first paint.
  const [zoom, setZoom] = useState(initialZoom);

  // Centers on the selected POI (e.g. a marker tap) without changing zoom —
  // only reacts to selectedPoiId itself changing, not every `pois` refetch.
  useEffect(() => {
    if (!selectedPoiId) return;
    const selected = pois.find((poi) => poi.id === selectedPoiId);
    if (!selected) return;
    cameraRef.current?.easeTo({
      center: [selected.location.lng, selected.location.lat],
      duration: 400,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoiId]);

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      setZoom(event.nativeEvent.zoom);
      if (!onBoundsChange) return;
      const [minLng, minLat, maxLng, maxLat] = event.nativeEvent.bounds;
      onBoundsChange({ minLat, minLng, maxLat, maxLng });
    },
    [onBoundsChange],
  );

  const showLabels = zoom >= LABEL_MIN_ZOOM;

  return (
    <Map style={{ flex: 1 }} mapStyle={OPENFREEMAP_STYLE} onRegionDidChange={handleRegionDidChange}>
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: [initialCenter.lng, initialCenter.lat],
          zoom: initialZoom,
          padding,
        }}
      />
      {pois.map((poi) => {
        const category = categories?.find((c) => c.id === poi.primaryCategoryId);
        const iconKey = pinIconKeyForSlug(category?.slug);
        const Icon = PIN_ICON_COMPONENTS[iconKey];
        const color = poi.id === selectedPoiId ? colors.danger : colors.primary;

        return (
          <Marker
            key={poi.id}
            id={poi.id}
            lngLat={[poi.location.lng, poi.location.lat]}
            anchor="bottom"
            onPress={() => onMarkerPress?.(poi.id)}
          >
            <View style={{ alignItems: "center", gap: 2 }}>
              {showLabels && (
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: color,
                    borderRadius: radii.pill,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    ...nativeShadows.iconSolid,
                  }}
                >
                  <Text size="xs" weight="semibold" color={color} letterSpacing={0}>
                    {pinLabel(poi.name.en)}
                  </Text>
                </View>
              )}
              <Icon size={PIN_ICON_SIZE} color={color} strokeWidth={2.25} />
            </View>
          </Marker>
        );
      })}
    </Map>
  );
}
