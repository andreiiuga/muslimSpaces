/**
 * Platform-agnostic pin logic shared by MapView.tsx (web) and
 * MapView.native.tsx — which emoji a category maps to, the label-visibility
 * zoom threshold, and the label text derivation are identical between them.
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
