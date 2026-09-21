"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ArrowLeft } from "lucide-react";
import { colors, shadows } from "../tokens";
import { IconButton } from "../IconButton";
import { LABEL_MIN_ZOOM, PIN_EMOJI, buildClusterIndex, getMapPoints, pinIconKeyForSlug, pinLabel } from "./pin-utils";
import type { PinIconKey } from "./pin-utils";
import type { MapPadding, MapViewProps } from "./MapView.types";

// maplibre-gl's PaddingOptions requires all four sides; our shared prop
// type leaves them optional so callers only specify the sides they need.
function toPaddingOptions(padding: MapPadding | undefined): maplibregl.PaddingOptions {
  return { top: padding?.top ?? 0, right: padding?.right ?? 0, bottom: padding?.bottom ?? 0, left: padding?.left ?? 0 };
}

// Free, whole-planet vector tiles, no API key, built for production use —
// see CLAUDE.md's "Map tiles" decision.
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Romania's rough center — sensible default before any POIs/geolocation exist.
const DEFAULT_CENTER = { lat: 45.9432, lng: 24.9668 };
const DEFAULT_ZOOM = 6;

const PIN_EMOJI_SIZE = 22;

// Selecting a POI flies the camera in close and tilted; deselecting levels
// it back out to top-down.
const SELECT_FLY_ZOOM = 17.5;
const SELECT_PITCH = 55;
// The post-fly-in "look around" orbit: chained easeTo legs (linearly
// eased, so the rotation speed is constant, not ease-in/out per leg)
// rather than one fixed-length animation — see startOrbit below for why
// chaining beats either a single short easeTo (fires 'moveend', which
// rebuilds every marker, on every tick) or one very long one (eventually
// just stops). Deliberately NOT a multiple of 360: maplibre-gl computes the
// shortest angular delta between current and target bearing, so
// `current + 360` normalizes to a delta of exactly 0 — a silent no-op, not
// a full turn. 170 keeps every leg's shortest path unambiguous (always
// "forward", never flipping direction) while still being a big, sweeping
// turn per leg.
const ORBIT_DEGREES_PER_LEG = 170;
const ORBIT_LEG_DURATION_MS = 17_000;

// Icon with a name-label pill above it, anchored (via maplibregl.Marker's
// `anchor: "bottom"`) at the icon's own bottom edge — matches the design's
// pins exactly. Markers are fully rebuilt on every render pass (see
// renderMarkersRef below), so the label's visibility is just decided fresh
// each time rather than toggled after the fact. The emoji itself is plain
// by default; selecting it (a marker tap) adds a white circular badge +
// elevation shadow behind it, since an emoji can't be recolored the way an
// icon can to show selection state.
function createMarkerElement(
  iconKey: PinIconKey,
  label: string,
  color: string,
  selected: boolean,
): { el: HTMLDivElement; labelEl: HTMLDivElement } {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.alignItems = "center";
  el.style.gap = "2px";
  el.style.cursor = "pointer";

  const labelEl = document.createElement("div");
  labelEl.textContent = label;
  labelEl.style.display = "none";
  labelEl.style.background = colors.background;
  labelEl.style.border = `1px solid ${color}`;
  labelEl.style.borderRadius = "999px";
  labelEl.style.padding = "3px 10px";
  labelEl.style.fontSize = "11.5px";
  labelEl.style.fontWeight = "600";
  labelEl.style.whiteSpace = "nowrap";
  labelEl.style.color = color;
  labelEl.style.boxShadow = "0 2px 6px rgba(28,25,23,.14)";

  const iconEl = document.createElement("div");
  iconEl.textContent = PIN_EMOJI[iconKey];
  iconEl.style.fontSize = `${PIN_EMOJI_SIZE}px`;
  iconEl.style.lineHeight = "1";
  iconEl.style.display = "flex";
  iconEl.style.alignItems = "center";
  iconEl.style.justifyContent = "center";
  if (selected) {
    iconEl.style.background = colors.surface;
    iconEl.style.borderRadius = "999px";
    iconEl.style.padding = "6px";
    iconEl.style.boxShadow = shadows.elevated;
  }

  el.appendChild(labelEl);
  el.appendChild(iconEl);
  return { el, labelEl };
}

// Bubble size bands with the point count — a 4-place cluster and a
// 400-place one shouldn't read as the same size. `label` is supercluster's
// own abbreviation (e.g. "1.3k"), not re-derived here.
function createClusterElement(count: number, label: string): HTMLDivElement {
  const size = count < 10 ? 36 : count < 100 ? 44 : 52;
  const el = document.createElement("div");
  el.textContent = label;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.borderRadius = "999px";
  el.style.background = colors.primary;
  el.style.color = colors.textOnPrimary;
  el.style.border = `2px solid ${colors.surface}`;
  el.style.fontSize = count < 100 ? "14px" : "13px";
  el.style.fontWeight = "700";
  el.style.cursor = "pointer";
  el.style.boxShadow = shadows.elevated;
  return el;
}

// Chains ORBIT_DEGREES_PER_LEG-sized legs indefinitely, as long as
// `isCurrent()` still says so when each leg finishes — checked both before
// scheduling a leg and inside its 'moveend' callback, since `isCurrent` can
// go stale while a leg is in flight (the selection changed, or the user
// panned/zoomed away).
// `event.originalEvent` is truthy only for user-caused moves (mouse/touch),
// never for our own programmatic easeTo — used here so a manual pan away
// from the orbit doesn't get immediately fought by the next leg starting.
function startOrbit(map: maplibregl.Map, isCurrent: () => boolean): void {
  if (!isCurrent()) return;
  map.easeTo({
    bearing: map.getBearing() + ORBIT_DEGREES_PER_LEG,
    duration: ORBIT_LEG_DURATION_MS,
    easing: (t) => t,
  });
  map.once("moveend", (event) => {
    if (event.originalEvent || !isCurrent()) return;
    startOrbit(map, isCurrent);
  });
}

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
  fitBoundsToken,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  // Bumped on every selection change — guards the orbit's `once('moveend')`
  // callback against starting for a POI that's no longer the current one
  // (the user selected something else, or deselected, before the fly-in
  // finished).
  const selectionTokenRef = useRef(0);
  // Rebuilt (by the effect below) whenever pois/categories/selection change;
  // invoked imperatively from map event listeners registered once at mount,
  // so panning/zooming re-renders markers without recreating the map.
  const renderMarkersRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // setPadding alone only affects future camera operations, not the
    // already-rendered view — jumpTo recalculates the transform so the
    // given center actually lands in the middle of the padded (visible)
    // region on first paint, not the full container's geometric center.
    if (padding) {
      map.jumpTo({
        center: [initialCenter.lng, initialCenter.lat],
        zoom: initialZoom,
        padding: toPaddingOptions(padding),
      });
    }

    // 'moveend' covers pans AND zooms (it fires once any camera change
    // settles) — one listener re-clusters/re-places markers for the new
    // viewport and reports the new bounds upward.
    map.on("moveend", () => {
      renderMarkersRef.current();
      if (!onBoundsChange) return;
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        minLng: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLng: bounds.getEast(),
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Deliberately empty deps — the map is created once; pois/bounds
    // updates are handled by the effect below without recreating it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clusterIndex = buildClusterIndex(pois);
    const poisById = new Map(pois.map((poi) => [poi.id, poi]));

    renderMarkersRef.current = () => {
      markersRef.current.forEach((marker) => marker.remove());

      const bounds = map.getBounds();
      const zoom = map.getZoom();
      const points = getMapPoints(
        clusterIndex,
        poisById,
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom,
      );
      const showLabels = zoom >= LABEL_MIN_ZOOM;

      markersRef.current = points.map((point) => {
        if (point.kind === "cluster") {
          const el = createClusterElement(point.count, point.label);
          const marker = new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat([point.lng, point.lat])
            .addTo(map);
          el.addEventListener("click", () => {
            const targetZoom = clusterIndex.getClusterExpansionZoom(point.clusterId);
            map.easeTo({ center: [point.lng, point.lat], zoom: targetZoom, duration: 400 });
          });
          return marker;
        }

        const poi = point.poi;
        const category = categories?.find((c) => c.id === poi.primaryCategoryId);
        const iconKey = pinIconKeyForSlug(category?.slug);
        const selected = poi.id === selectedPoiId;
        const color = selected ? colors.danger : colors.primary;
        const { el, labelEl } = createMarkerElement(iconKey, pinLabel(poi.name.en), color, selected);
        labelEl.style.display = showLabels ? "block" : "none";

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([poi.location.lng, poi.location.lat])
          .addTo(map);
        if (onMarkerPress) {
          el.addEventListener("click", () => onMarkerPress(poi.id));
        }
        return marker;
      });
    };

    renderMarkersRef.current();

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [pois, categories, selectedPoiId, onMarkerPress]);

  // Reacts to padding changes after mount (e.g. a responsive breakpoint
  // toggling the overlay layout on/off). No `center` given — easeTo re-uses
  // the map's current center and shifts it to stay visually centered under
  // the new padding, rather than jumping back to `initialCenter`.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ padding: toPaddingOptions(padding), duration: 250 });
  }, [padding?.top, padding?.right, padding?.bottom, padding?.left]);

  // "Zoom to results" — reacts only to fitBoundsToken *changing* (the
  // guard below skips the initial 0/undefined value), so this never fires
  // on mount, only when the caller deliberately bumps it (e.g. once per
  // concluded search). Reads `pois` fresh from this render's closure rather
  // than taking it as a dep, since the caller is expected to update `pois`
  // and bump the token together — depending on `pois` too would also
  // re-fit on every unrelated pois change (pan/zoom-driven re-clustering
  // doesn't change `pois` itself, but a category/openNow filter change
  // does, and that should NOT re-fit the camera, only a concluded search).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitBoundsToken) return;
    if (pois.length === 0) return;

    if (pois.length === 1) {
      const only = pois[0]!;
      map.easeTo({
        center: [only.location.lng, only.location.lat],
        zoom: Math.max(map.getZoom(), 13),
        padding: toPaddingOptions(padding),
        duration: 800,
      });
      return;
    }

    let minLat = Infinity;
    let minLng = Infinity;
    let maxLat = -Infinity;
    let maxLng = -Infinity;
    for (const poi of pois) {
      minLat = Math.min(minLat, poi.location.lat);
      maxLat = Math.max(maxLat, poi.location.lat);
      minLng = Math.min(minLng, poi.location.lng);
      maxLng = Math.max(maxLng, poi.location.lng);
    }

    const basePadding = toPaddingOptions(padding);
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: {
          top: basePadding.top + 60,
          right: basePadding.right + 60,
          bottom: basePadding.bottom + 60,
          left: basePadding.left + 60,
        },
        maxZoom: 15,
        duration: 900,
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitBoundsToken]);

  // Selecting a POI (e.g. a marker tap) flies the camera into it at an
  // angle and, once that settles, starts the slow orbit. Deselecting stops
  // whatever camera animation is in flight and levels the view back out.
  // `pois` is a dep too since the selected id's coordinates are looked up
  // from it, and a filter change can swap in a new array containing the
  // same POI at the same id.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!selectedPoiId) {
      // Invalidates any orbit leg's pending `once('moveend', ...)` — without
      // this, map.stop() below fires that pending moveend immediately, and
      // since isCurrent() would still read true, startOrbit restarts right
      // back up instead of actually stopping.
      selectionTokenRef.current += 1;
      map.stop();
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
      return;
    }

    const selected = pois.find((poi) => poi.id === selectedPoiId);
    if (!selected) return;

    const token = ++selectionTokenRef.current;
    map.flyTo({
      center: [selected.location.lng, selected.location.lat],
      zoom: SELECT_FLY_ZOOM,
      pitch: SELECT_PITCH,
      padding: toPaddingOptions(padding),
      duration: 1800,
    });
    map.once("moveend", () => {
      // Bail if the selection moved on (or was cleared) before the fly-in
      // finished — don't start orbiting a POI that's no longer selected.
      startOrbit(map, () => selectionTokenRef.current === token);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoiId]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {selectedPoiId && (
        <div style={{ position: "absolute", top: 14, left: 14 }}>
          <IconButton
            icon={<ArrowLeft size={20} color={colors.text} />}
            onPress={() => onDeselect?.()}
            variant="solid"
            label="Back"
          />
        </div>
      )}
    </div>
  );
}
