/**
 * Platform-agnostic pin logic shared by MapView.tsx (web) and
 * MapView.native.tsx — which emoji a category maps to, the label-visibility
 * zoom threshold, the label text derivation, and the clustering math are
 * identical between them.
 *
 * Emoji instead of an icon library: tried lucide's own "mosque" icon (drawn
 * as disconnected line-art — filling it solid left a visible gap) and a
 * hand-drawn solid silhouette after that (still didn't read as a mosque at
 * pin size) before landing here. Emoji render as recognizable full-color
 * pictograms with zero drawing effort, at the cost of not being tintable —
 * selection state is now shown via a white circle badge behind the emoji
 * instead of a color change (see createMarkerElement in MapView.tsx /
 * the Marker render in MapView.native.tsx).
 */

import Supercluster from "supercluster";
import type { Poi } from "@muslimspaces/shared";

export type PinIconKey =
  | "mosque"
  | "restaurant"
  | "meat"
  | "sweets"
  | "store"
  | "clothing"
  | "doctors"
  | "lawyers"
  | "generic";

// Keyed by category slug (see ReseedCategories migration in apps/backend).
// Jamiah/Musallah share the mosque glyph — same as the design's CAT_ICON,
// which also maps all three to `ph-fill ph-mosque`.
const CATEGORY_ICON_KEY: Record<string, PinIconKey> = {
  mosque: "mosque",
  jamiah: "mosque",
  musallah: "mosque",
  restaurant: "restaurant",
  "meat-shop": "meat",
  sweets: "sweets",
  "convenience-store": "store",
  clothing: "clothing",
  doctors: "doctors",
  lawyers: "lawyers",
};

// general-business (and anything else not in the map above) falls back to
// the generic pin — same as the design, which falls back to
// `ph-fill ph-map-pin` for any slug missing from CAT_ICON.
export function pinIconKeyForSlug(slug: string | undefined): PinIconKey {
  return (slug && CATEGORY_ICON_KEY[slug]) || "generic";
}

export const PIN_EMOJI: Record<PinIconKey, string> = {
  mosque: "🕌",
  restaurant: "🍽️",
  meat: "🥩",
  sweets: "🍬",
  store: "🏪",
  clothing: "👕",
  doctors: "🩺",
  lawyers: "⚖️",
  generic: "📍",
};

// Below this zoom, pins show icon-only — the name label only earns its
// screen space once individual buildings are distinguishable (roughly
// street level). Matches neither web nor mobile design directly (both
// mockups are static and always show the label) — this threshold is the
// zoom-gating behavior layered on top of the design.
export const LABEL_MIN_ZOOM = 13;

// Matches the design's shortName derivation exactly: first clause before an
// em-dash or comma, hard-capped so the pill never dominates the pin.
export function pinLabel(name: string): string {
  const short = (name.split(" — ")[0] ?? name).split(",")[0] ?? name;
  return short.length > 22 ? `${short.slice(0, 22)}…` : short;
}

// Clustering: the map now always loads every POI matching the current
// filters (no viewport-bbox fetch — see ExploreView.tsx/index.tsx), so a
// zoomed-out view can have hundreds of pins to place. Supercluster groups
// nearby ones into a single "N places" bubble, client-side, per viewport —
// same library MapLibre's own `cluster: true` GeoJSON sources use
// internally, used directly here instead so clusters/pins can still be our
// existing custom Markers (emoji + label pill + selection badge) rather
// than switching to GL symbol layers.
interface ClusterPointProps {
  poiId: string;
}

// Radius in pixels within which points merge into one cluster. Started at
// 56 (roughly a pin's footprint plus its label pill) with maxZoom 14, but
// that stayed clustered for too many zoom levels before individual pins
// appeared — lower on both counts so points separate out sooner.
const CLUSTER_RADIUS = 30;
// Above this zoom, always show individual pins.
const CLUSTER_MAX_ZOOM = 10;

export function buildClusterIndex(pois: Poi[]): Supercluster<ClusterPointProps> {
  const index = new Supercluster<ClusterPointProps>({ radius: CLUSTER_RADIUS, maxZoom: CLUSTER_MAX_ZOOM });
  index.load(
    pois.map((poi) => ({
      type: "Feature",
      properties: { poiId: poi.id },
      geometry: { type: "Point", coordinates: [poi.location.lng, poi.location.lat] },
    })),
  );
  return index;
}

export type MapPoint =
  // `count` sizes the bubble (banded); `label` is supercluster's own
  // abbreviation (e.g. "1.3k" past 1000) so the bubble text and the sizing
  // stay in sync without duplicating that formatting.
  | { kind: "cluster"; clusterId: number; lng: number; lat: number; count: number; label: string }
  | { kind: "poi"; poi: Poi };

// bbox is [westLng, southLat, eastLng, northLat] — matches both
// maplibregl.LngLatBounds.toArray()'s flat form and MapBounds once reordered
// by the caller (see MapView.tsx/MapView.native.tsx).
export function getMapPoints(
  index: Supercluster<ClusterPointProps>,
  poisById: Map<string, Poi>,
  bbox: [number, number, number, number],
  zoom: number,
): MapPoint[] {
  const points: MapPoint[] = [];
  for (const feature of index.getClusters(bbox, Math.round(zoom))) {
    // Point geometry's coordinates are always [lng, lat] — typed as a plain
    // number[] (GeoJSON's Position) upstream, hence the cast.
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    if ("cluster" in feature.properties && feature.properties.cluster) {
      points.push({
        kind: "cluster",
        clusterId: feature.properties.cluster_id,
        lng,
        lat,
        count: feature.properties.point_count,
        label: String(feature.properties.point_count_abbreviated),
      });
    } else {
      // properties are the original ClusterPointProps for a non-cluster feature.
      const poi = poisById.get((feature.properties as ClusterPointProps).poiId);
      // Always found in practice (the index and poisById are built from the
      // same `pois` array in the same render pass) — guarded so a stale
      // pairing degrades to "skip the point" rather than crashing.
      if (poi) points.push({ kind: "poi", poi });
    }
  }
  return points;
}
