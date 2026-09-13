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

  // Initial SSR list covers first paint (and SEO); once the map reports a
  // real viewport, subsequent fetches are viewport-driven so the list and
  // pins always agree on what's actually visible.
  useEffect(() => {
    if (!bounds) return;
    let cancelled = false;
    setLoading(true);

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
    <div>
      <FilterBar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        openNow={openNow}
        onOpenNowChange={setOpenNow}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          height: "calc(100vh - 140px)",
        }}
      >
        <div style={{ overflowY: "auto", padding: spacing.xl }}>
          {loading && <Text size="sm" color={colors.textMuted}>Updating…</Text>}
          {pois.length === 0 ? (
            <Text color={colors.textMuted}>No POIs in this area yet.</Text>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg }}>
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
          )}
        </div>

        <div style={{ position: "sticky", top: 0, height: "100%" }}>
          <MapView pois={pois} onBoundsChange={setBounds} onMarkerPress={(id) => router.push(`/pois/${id}`)} />
        </div>
      </div>
    </div>
  );
}
