"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { POICard, Skeleton, Text, colors, spacing } from "@muslimspaces/ui";
import type { MapBounds } from "@muslimspaces/ui/map";
import type { Category, Poi } from "@muslimspaces/shared";
import dynamic from "next/dynamic";
import { getBrowserApiClient } from "../../lib/api-client";
import { FilterBar } from "../FilterBar/FilterBar";

// maplibre-gl touches `window`/WebGL at import time — must never run
// during SSR.
const MapView = dynamic(() => import("@muslimspaces/ui/map").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton height="100%" borderRadius={0} />,
});

// Shared between the floating panel's inline width and the map's camera
// padding, so the two can never drift apart — matches the breakpoint
// already used elsewhere in globals.css.
const PANEL_WIDTH = 420;
const DESKTOP_QUERY = "(min-width: 768px)";

export function ExploreView({
  initialPois,
  categories,
  initialFavoriteIds,
  isLoggedIn,
}: {
  initialPois: Poi[];
  categories: Category[];
  initialFavoriteIds: string[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [pois, setPois] = useState(initialPois);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(initialFavoriteIds));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mobile-first default — SSR can't know the real viewport width; this
  // corrects itself on mount once matchMedia can run client-side. Only
  // affects the map's camera padding (a JS prop); the overlay-vs-stacked
  // *layout* itself is driven purely by the CSS breakpoint in globals.css.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(mql.matches);
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  // Initial SSR list covers first paint (and SEO); once the map reports a
  // real viewport, subsequent fetches are viewport-driven so the list and
  // pins always agree on what's actually visible.
  useEffect(() => {
    if (!bounds) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getBrowserApiClient()
      .pois.bbox({
        ...bounds,
        categoryId: selectedCategoryId ?? undefined,
        openNow: openNow || undefined,
        limit: 100,
      })
      .then((result) => {
        if (!cancelled) setPois(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load places for this area.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bounds, selectedCategoryId, openNow]);

  async function toggleFavorite(poiId: string) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const isFavorite = favoriteIds.has(poiId);
    await fetch(`/api/favorites/${poiId}`, { method: isFavorite ? "DELETE" : "POST" });
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFavorite) next.delete(poiId);
      else next.add(poiId);
      return next;
    });
  }

  function categoryLabel(poi: Poi): string | undefined {
    return categories.find((c) => c.id === poi.primaryCategoryId)?.name.en;
  }

  return (
    <div className="explore-shell">
      <div className="explore-map-fill">
        <MapView
          pois={pois}
          onBoundsChange={setBounds}
          onMarkerPress={(id) => router.push(`/pois/${id}`)}
          padding={isDesktop ? { right: PANEL_WIDTH } : undefined}
        />
      </div>

      <div className="explore-filterbar-float" style={isDesktop ? { right: PANEL_WIDTH + spacing.lg } : undefined}>
        <FilterBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          openNow={openNow}
          onOpenNowChange={setOpenNow}
        />
      </div>

      <div className="explore-panel" style={isDesktop ? { width: PANEL_WIDTH } : undefined}>
        {error && <Text size="sm" color={colors.danger}>{error}</Text>}
        {loading && pois.length === 0 ? (
          <div className="poi-grid" style={{ gap: spacing.lg }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={220} borderRadius={16} />
            ))}
          </div>
        ) : pois.length === 0 ? (
          <Text color={colors.textMuted}>No POIs in this area yet.</Text>
        ) : (
          <>
            {loading && <Text size="sm" color={colors.textMuted}>Updating…</Text>}
            <div className="poi-grid" style={{ gap: spacing.lg }}>
              {pois.map((poi) => (
                <div key={poi.id} style={{ position: "relative" }}>
                  <Link
                    href={`/pois/${poi.id}`}
                    aria-label={poi.name.ro}
                    style={{ position: "absolute", inset: 0, zIndex: 1 }}
                  />
                  <POICard
                    poi={poi}
                    categoryLabel={categoryLabel(poi)}
                    isFavorite={favoriteIds.has(poi.id)}
                    onToggleFavorite={() => toggleFavorite(poi.id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
