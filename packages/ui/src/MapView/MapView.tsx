"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { colors } from "../tokens";
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

export function MapView({
  pois,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  onBoundsChange,
  onMarkerPress,
  padding,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

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
    markersRef.current = pois.map((poi) => {
      const marker = new maplibregl.Marker({ color: colors.primary })
        .setLngLat([poi.location.lng, poi.location.lat])
        .addTo(map);
      if (onMarkerPress) {
        const el = marker.getElement();
        el.style.cursor = "pointer";
        el.addEventListener("click", () => onMarkerPress(poi.id));
      }
      return marker;
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
    };
  }, [pois, onMarkerPress]);

  // Reacts to padding changes after mount (e.g. a responsive breakpoint
  // toggling the overlay layout on/off). No `center` given — easeTo re-uses
  // the map's current center and shifts it to stay visually centered under
  // the new padding, rather than jumping back to `initialCenter`.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ padding: toPaddingOptions(padding), duration: 250 });
  }, [padding?.top, padding?.right, padding?.bottom, padding?.left]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
