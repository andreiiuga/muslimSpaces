import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import type { NativeSyntheticEvent } from "react-native";
import { Camera, Map, Marker } from "@maplibre/maplibre-react-native";
import type { CameraRef, ViewStateChangeEvent } from "@maplibre/maplibre-react-native";
import { ArrowLeft } from "lucide-react-native";
import { colors, nativeShadows } from "../tokens";
import { IconButton } from "../IconButton";
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

// Selecting a POI flies the camera in close and tilted; deselecting levels
// it back out to top-down.
const SELECT_FLY_ZOOM = 17.5;
const SELECT_PITCH = 55;
// The post-fly-in "look around" orbit: chained easeTo legs. Each leg's
// bearing target is tracked in a ref (orbitBearingRef) rather than read
// back from the camera — CameraRef has no bearing getter, so this
// component is the only thing that ever sets bearing, kept in sync by
// always resetting it (both the real camera's and the ref's) to 0 whenever
// a new selection's fly-in starts. Deliberately NOT a multiple of 360:
// MapLibre computes the shortest angular delta between current and target
// bearing, so a +360 step normalizes to a delta of exactly 0 — a silent
// no-op, not a full turn. 170 keeps every leg's shortest path unambiguous
// (always "forward", never flipping direction) while still being a big,
// sweeping turn per leg.
const ORBIT_DEGREES_PER_LEG = 170;
const ORBIT_LEG_DURATION_MS = 17_000;

export function MapView({
  pois,
  categories,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  onBoundsChange,
  onMarkerPress,
  selectedPoiId,
  onDeselect,
  padding,
}: MapViewProps) {
  const cameraRef = useRef<CameraRef>(null);
  // Gates name labels below a certain zoom — starts at the initial zoom so
  // labels don't flash visible-then-hidden on a zoomed-out first paint.
  const [zoom, setZoom] = useState(initialZoom);
  // Drives clustering — starts as WORLD_BOUNDS so there's something to
  // cluster against before the map's first onRegionDidChange fires.
  const [bounds, setBounds] = useState<[number, number, number, number]>(WORLD_BOUNDS);
  // Bumped on every selection change — an orbit leg only reschedules the
  // next one if it's still the current selection by the time it settles.
  const selectionTokenRef = useRef(0);
  // Non-null while "the next settle should continue the orbit" — armed
  // right after the fly-in starts, re-armed after each leg. Cleared (without
  // forcing a deselect) if that settle turns out to be user-driven, so a
  // manual pan/zoom away isn't immediately fought by the next leg.
  const orbitArmedTokenRef = useRef<number | null>(null);
  const orbitBearingRef = useRef(0);
  // easeTo requires a `center` on native (unlike web's maplibre-gl, where
  // it's optional) — tracked here since CameraRef has no center getter to
  // read it back from, for the deselect reset and each orbit leg, both of
  // which just change pitch/bearing around the same point.
  const lastCenterRef = useRef<[number, number] | null>(null);

  // Selecting a POI (e.g. a marker tap) flies the camera into it at an
  // angle; handleRegionDidChange below starts and continues the orbit once
  // that settles. Deselecting levels the view back out to top-down.
  // `pois` is a dep too since the selected id's coordinates are looked up
  // from it, and a filter change can swap in a new array containing the
  // same POI at the same id.
  useEffect(() => {
    if (!selectedPoiId) {
      selectionTokenRef.current += 1;
      orbitArmedTokenRef.current = null;
      if (lastCenterRef.current) {
        cameraRef.current?.easeTo({ center: lastCenterRef.current, pitch: 0, bearing: 0, duration: 600 });
      }
      return;
    }
    const selected = pois.find((poi) => poi.id === selectedPoiId);
    if (!selected) return;

    const token = ++selectionTokenRef.current;
    orbitArmedTokenRef.current = token;
    orbitBearingRef.current = 0;
    lastCenterRef.current = [selected.location.lng, selected.location.lat];
    cameraRef.current?.flyTo({
      center: [selected.location.lng, selected.location.lat],
      zoom: SELECT_FLY_ZOOM,
      pitch: SELECT_PITCH,
      bearing: 0,
      duration: 1800,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoiId]);

  const handleRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      setZoom(event.nativeEvent.zoom);
      // Already [minLng, minLat, maxLng, maxLat] — same order supercluster
      // and MapBounds both want, just named differently per caller.
      setBounds(event.nativeEvent.bounds);
      if (onBoundsChange) {
        const [minLng, minLat, maxLng, maxLat] = event.nativeEvent.bounds;
        onBoundsChange({ minLat, minLng, maxLat, maxLng });
      }

      // Continues the post-selection orbit (see the effect above): any
      // settle while armed — the fly-in finishing, or a previous leg
      // finishing — issues the next leg, unless the user is the one
      // driving the camera right now.
      if (
        orbitArmedTokenRef.current === selectionTokenRef.current &&
        !event.nativeEvent.userInteraction &&
        lastCenterRef.current
      ) {
        orbitBearingRef.current += ORBIT_DEGREES_PER_LEG;
        cameraRef.current?.easeTo({
          center: lastCenterRef.current,
          bearing: orbitBearingRef.current,
          duration: ORBIT_LEG_DURATION_MS,
          easing: "linear",
        });
      } else {
        orbitArmedTokenRef.current = null;
      }
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
    <View className="flex-1">
      {/* <Map>'s own style prop is left untouched — it's @maplibre/maplibre-
          react-native's third-party root view, not a plain RN core
          component, so it's not a safe target for a NativeWind className
          (no cssInterop registration for this library) — same "don't touch
          the maplibre integration" scope as everything else in this file
          that isn't chrome. */}
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
                  className="items-center justify-center rounded-pill border-2 border-surface bg-primary"
                  // width/height are the per-instance "size band" decision
                  // (same as web's createClusterElement) — stays inline.
                  style={{ width: size, height: size, ...nativeShadows.elevated }}
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
              <View className="items-center gap-0.5">
                {showLabels && (
                  <View
                    className="rounded-pill border bg-background px-[10px] py-[3px]"
                    // borderColor is per-instance (selected vs not) — stays inline.
                    style={{ borderColor: color, ...nativeShadows.iconSolid }}
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
                  className={selected ? "rounded-pill bg-surface p-[6px]" : undefined}
                  style={selected ? nativeShadows.elevated : undefined}
                >
                  <Text size="xl">{PIN_EMOJI[iconKey]}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </Map>
      {selectedPoiId && (
        <View className="absolute left-[14px] top-[14px]">
          <IconButton
            icon={<ArrowLeft size={20} color={colors.text} />}
            onPress={() => onDeselect?.()}
            variant="solid"
            label="Back"
          />
        </View>
      )}
    </View>
  );
}
