"use client";

import { createElement, useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Beef, Cookie, MapPin, Mosque, Scale, Shirt, Store, Stethoscope, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors } from "../tokens";
import { LABEL_MIN_ZOOM, pinIconKeyForSlug, pinLabel } from "./pin-utils";
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

// Per-category pin glyphs — matches the mobile app's MapView.native.tsx
// (same lucide-react-native icon set) and the Claude Design canvas's Phosphor
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

// Marker elements are handed to maplibre-gl as plain HTMLElements (its own
// API, not a React tree) — renderToStaticMarkup is the least-effort way to
// reuse the exact same lucide-react glyphs as the rest of the app instead of
// hand-copying SVG path data per icon.
function iconMarkup(key: PinIconKey, color: string): string {
  return renderToStaticMarkup(createElement(PIN_ICON_COMPONENTS[key], { size: PIN_ICON_SIZE, color, strokeWidth: 2.25 }));
}

// Icon with a name-label pill above it, anchored (via maplibregl.Marker's
// `anchor: "bottom"`) at the icon's own bottom edge — matches the design's
// pins exactly. The label starts hidden; a single 'zoom' listener on the map
// (see the effect below) toggles every label's visibility together instead
// of each marker tracking zoom itself.
function createMarkerElement(
  iconKey: PinIconKey,
  label: string,
  color: string,
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
  iconEl.style.lineHeight = "0";
  iconEl.innerHTML = iconMarkup(iconKey, color);

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
      const color = poi.id === selectedPoiId ? colors.danger : colors.primary;
      const { el, labelEl } = createMarkerElement(iconKey, pinLabel(poi.name.en), color);
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
