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
import type { Category, Poi } from "@muslimspaces/shared";

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
  sweets: "🥐",
  store: "🏪",
  clothing: "👕",
  doctors: "🩺",
  lawyers: "⚖️",
  generic: "📍",
};

// A POI can carry several categories (see poi_categories): the primary one
// is the pin's headline icon, the rest orbit it as smaller "satellites" once
// the zoom is high enough for labels. Satellites are deduped by glyph —
// Jamiah/Musallah/Mosque all share 🕌, so a mosque that's also a Jamiah
// shouldn't orbit a second 🕌 around the first — and capped so a POI with
// many categories doesn't turn into a cloud.
export const MAX_SATELLITE_ICONS = 3;

export interface PoiPinIcons {
  primary: PinIconKey;
  satellites: PinIconKey[];
}

export function resolvePoiPinIcons(poi: Poi, categoriesById: ReadonlyMap<string, Category>): PoiPinIcons {
  const keyFor = (categoryId: string) => pinIconKeyForSlug(categoriesById.get(categoryId)?.slug);
  const primary = keyFor(poi.primaryCategoryId);
  const satellites: PinIconKey[] = [];
  for (const categoryId of poi.categoryIds) {
    const key = keyFor(categoryId);
    // "generic" means an unmapped category (e.g. general-business) — a bare
    // map pin orbiting a real icon adds nothing.
    if (key === primary || key === "generic" || satellites.includes(key)) continue;
    satellites.push(key);
    if (satellites.length === MAX_SATELLITE_ICONS) break;
  }
  return { primary, satellites };
}

// Main pin emoji size in px/dp — matches the "xl" text size the native
// variant renders it with (tokens.ts fontSizes.xl).
export const PIN_EMOJI_SIZE = 22;

// Orbit geometry, in multiples of the primary icon's size so web (px) and
// native (dp) scale it from their own icon size instead of duplicating
// absolute numbers.
export const SATELLITE_SCALE = 0.6;
export const ORBIT_RADIUS_RATIO = 1;
// One full revolution. Slow enough to read as drifting, not spinning.
export const ORBIT_PERIOD_MS = 9000;

// Satellites share one orbit, spaced evenly so they never bunch up.
export function satellitePhaseDeg(index: number, count: number): number {
  return (360 / count) * index;
}

// CSS animation-delay that puts a satellite at its phase angle *as of
// `nowMs`*, not at the start of the cycle. Web markers are torn down and
// rebuilt on every pan/zoom, which restarts their CSS animations; deriving
// the delay from a shared clock makes a rebuilt marker resume where it would
// have been had it never been rebuilt. (Native shares one Animated clock
// instead, so it doesn't need this.)
export function orbitDelayMs(phaseDeg: number, nowMs: number): number {
  const cycleMs = nowMs + (ORBIT_PERIOD_MS * phaseDeg) / 360;
  return -(cycleMs % ORBIT_PERIOD_MS);
}

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
