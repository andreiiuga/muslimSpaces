"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { colors, shadows } from "../tokens";
import { LABEL_MIN_ZOOM, PIN_EMOJI, pinIconKeyForSlug, pinLabel } from "./pin-utils";
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

// Icon with a name-label pill above it, anchored (via maplibregl.Marker's
// `anchor: "bottom"`) at the icon's own bottom edge — matches the design's
// pins exactly. The label starts hidden; a single 'zoom' listener on the map
// (see the effect below) toggles every label's visibility together instead
// of each marker tracking zoom itself. The emoji itself is plain by default;
// selecting it (a marker tap) adds a white circular badge + elevation
// shadow behind it, since an emoji can't be recolored the way an icon can
// to show selection state.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const labelElsRef = useRef<HTMLDivElement[]>([]);

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

    if (onBoundsChange) {
      map.on("moveend", () => {
        const bounds = map.getBounds();
        onBoundsChange({
          minLat: bounds.getSouth(),
          minLng: bounds.getWest(),
          maxLat: bounds.getNorth(),
          maxLng: bounds.getEast(),
        });
      });
    }

    // One shared listener drives every marker's label visibility, instead
    // of each marker wiring its own — a lot cheaper on every zoom tick.
    map.on("zoom", () => {
      const visible = map.getZoom() >= LABEL_MIN_ZOOM;
      labelElsRef.current.forEach((labelEl) => {
        labelEl.style.display = visible ? "block" : "none";
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

    markersRef.current.forEach((marker) => marker.remove());
    labelElsRef.current = [];

    markersRef.current = pois.map((poi) => {
      const category = categories?.find((c) => c.id === poi.primaryCategoryId);
      const iconKey = pinIconKeyForSlug(category?.slug);
      const selected = poi.id === selectedPoiId;
      const color = selected ? colors.danger : colors.primary;
      const { el, labelEl } = createMarkerElement(iconKey, pinLabel(poi.name.en), color, selected);
      labelElsRef.current.push(labelEl);

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([poi.location.lng, poi.location.lat])
        .addTo(map);
      if (onMarkerPress) {
        el.addEventListener("click", () => onMarkerPress(poi.id));
      }
      return marker;
    });

    // Labels were just rebuilt hidden — sync them to the current zoom right
    // away rather than waiting for the next 'zoom' event.
    const visible = map.getZoom() >= LABEL_MIN_ZOOM;
    labelElsRef.current.forEach((labelEl) => {
      labelEl.style.display = visible ? "block" : "none";
    });

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

  // Centers on the selected POI (e.g. a marker tap) without changing zoom —
  // `pois` is a dep too since the selected id's coordinates are looked up
  // from it, and a bbox refetch can swap in a new array containing the same
  // POI at the same id.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPoiId) return;
    const selected = pois.find((poi) => poi.id === selectedPoiId);
    if (!selected) return;
    map.easeTo({
      center: [selected.location.lng, selected.location.lat],
      padding: toPaddingOptions(padding),
      duration: 400,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoiId]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
