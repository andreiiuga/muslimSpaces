"use client";

import dynamic from "next/dynamic";
import { MapPin as MapPinIcon } from "lucide-react";
import { Skeleton } from "@muslimspaces/ui";
import type { Coordinates } from "@muslimspaces/shared";
import type { MapBounds } from "@muslimspaces/ui/map";
import { useLocale } from "../../i18n/LocaleContext";

const MapView = dynamic(() => import("@muslimspaces/ui/map").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton height="100%" borderRadius={0} />,
});

// Bucharest — this app is Romania-only (see CLAUDE.md), and a new place
// starts here rather than MapView's own whole-country default zoom, which
// is too wide to place a pin usefully. Mirrors apps/mobile's
// DEFAULT_LOCATION in pois/submit.tsx.
export const DEFAULT_LOCATION: Coordinates = { lat: 44.4268, lng: 26.1025 };

/**
 * "Drag the map under a fixed pin" coordinate picker, shared by the public
 * submit form and the admin POI form. `value` only seeds the camera on mount
 * (MapView has no controlled-center API); bump `recenterKey` to remount the
 * map at the current `value` — e.g. after the admin types coordinates by hand.
 */
export function LocationPicker({
  value,
  onChange,
  zoom = 13,
  recenterKey,
}: {
  value: Coordinates;
  onChange: (v: Coordinates) => void;
  zoom?: number;
  recenterKey?: number;
}) {
  const { t } = useLocale();

  function handleBoundsChange(bounds: MapBounds) {
    onChange({ lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2 });
  }

  return (
    <div className="relative mt-1 h-[250px] overflow-hidden rounded-lg border border-border">
      <MapView
        key={recenterKey}
        pois={[]}
        initialCenter={value}
        initialZoom={zoom}
        cooperativeGestures
        cooperativeGestureHints={{ mac: t("submit.mapHintMac"), windows: t("submit.mapHintWindows"), mobile: t("submit.mapHintMobile") }}
        onBoundsChange={handleBoundsChange}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
        <MapPinIcon size={34} className="fill-danger text-danger" />
      </div>
    </div>
  );
}
