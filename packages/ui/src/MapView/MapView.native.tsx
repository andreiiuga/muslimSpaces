import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import type { NativeSyntheticEvent } from "react-native";
import { Camera, Map, Marker } from "@maplibre/maplibre-react-native";
import type { CameraRef, ViewStateChangeEvent } from "@maplibre/maplibre-react-native";
import { colors, nativeShadows, radii, spacing } from "../tokens";
import { Text } from "../Text";
import { LABEL_MIN_ZOOM, PIN_EMOJI, buildClusterIndex, getMapPoints, pinIconKeyForSlug, pinLabel } from "./pin-utils";
import type { MapViewProps } from "./MapView.types";

// Free, whole-planet vector tiles, no API key, built for production use —
// see CLAUDE.md's "Map tiles" decision. Same style URL as the web variant.
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Romania's rough center — sensible default before any POIs/geolocation exist.
const DEFAULT_CENTER = { lat: 45.9432, lng: 24.9668 };
const DEFAULT_ZOOM = 6;

// [westLng, southLat, eastLng, northLat] — wide enough to include every real
// bound this Romania-only app will ever see, so clustering has something
// sensible to compute against before the map's first onRegionDidChange
// fires (rather than rendering nothing until then).
const WORLD_BOUNDS: [number, number, number, number] = [-180, -85, 180, 85];

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
  // Drives clustering — starts as WORLD_BOUNDS so there's something to
  // cluster against before the map's first onRegionDidChange fires.
  const [bounds, setBounds] = useState<[number, number, number, number]>(WORLD_BOUNDS);

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
      // Already [minLng, minLat, maxLng, maxLat] — same order supercluster
      // and MapBounds both want, just named differently per caller.
      setBounds(event.nativeEvent.bounds);
      if (!onBoundsChange) return;
      const [minLng, minLat, maxLng, maxLat] = event.nativeEvent.bounds;
      onBoundsChange({ minLat, minLng, maxLat, maxLng });
    },
    [onBoundsChange],
  );

  const showLabels = zoom >= LABEL_MIN_ZOOM;

  const clusterIndex = useMemo(() => buildClusterIndex(pois), [pois]);
  // globalThis.Map, not the `Map` component imported above — same name,
  // different thing.
  const poisById = useMemo(() => new globalThis.Map(pois.map((poi) => [poi.id, poi])), [pois]);
  const points = useMemo(
    () => getMapPoints(clusterIndex, poisById, bounds, zoom),
    [clusterIndex, poisById, bounds, zoom],
  );

  return (
    <Map
      style={{ flex: 1 }}
      mapStyle={OPENFREEMAP_STYLE}
      onRegionDidChange={handleRegionDidChange}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: [initialCenter.lng, initialCenter.lat],
          zoom: initialZoom,
          padding,
        }}
      />
      {points.map((point) => {
        if (point.kind === "cluster") {
          // Bubble size bands with the point count — a 4-place cluster and
          // a 400-place one shouldn't read as the same size.
          const size = point.count < 10 ? 36 : point.count < 100 ? 44 : 52;
          return (
            <Marker
              key={`cluster-${point.clusterId}`}
              id={`cluster-${point.clusterId}`}
              lngLat={[point.lng, point.lat]}
              anchor="center"
              onPress={() => {
                const targetZoom = clusterIndex.getClusterExpansionZoom(point.clusterId);
                cameraRef.current?.easeTo({ center: [point.lng, point.lat], zoom: targetZoom, duration: 400 });
              }}
            >
              <View
                style={{
                  width: size,
                  height: size,
                  borderRadius: radii.pill,
                  backgroundColor: colors.primary,
                  borderWidth: 2,
                  borderColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  ...nativeShadows.elevated,
                }}
              >
                <Text size={point.count < 100 ? "sm" : "xs"} weight="bold" color={colors.textOnPrimary} letterSpacing={0}>
                  {point.label}
                </Text>
              </View>
            </Marker>
          );
        }

        const poi = point.poi;
        const category = categories?.find((c) => c.id === poi.primaryCategoryId);
        const iconKey = pinIconKeyForSlug(category?.slug);
        const selected = poi.id === selectedPoiId;
        const color = selected ? colors.danger : colors.primary;

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
              {/* The emoji is plain by default; selecting it (a marker tap)
                  adds a white circular badge + elevation shadow, since an
                  emoji can't be recolored the way an icon can to show
                  selection state. */}
              <View
                style={
                  selected
                    ? {
                        backgroundColor: colors.surface,
                        borderRadius: radii.pill,
                        padding: spacing.xs + 2,
                        ...nativeShadows.elevated,
                      }
                    : undefined
                }
              >
                <Text size="xl">{PIN_EMOJI[iconKey]}</Text>
              </View>
            </View>
          </Marker>
        );
      })}
    </Map>
  );
}
