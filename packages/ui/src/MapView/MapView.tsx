"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { colors } from "../tokens";
import type { MapViewProps } from "./MapView.types";

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

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
