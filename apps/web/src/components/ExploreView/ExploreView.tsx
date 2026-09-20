"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Square, SquareCheck, Map as MapIcon, Rows3 } from "lucide-react";
import { POICard, Rating, Skeleton, Text, colors, radii, spacing } from "@muslimspaces/ui";
import type { Category, Poi } from "@muslimspaces/shared";
import dynamic from "next/dynamic";
import { getBrowserApiClient } from "../../lib/api-client";
import { FilterBar } from "../FilterBar/FilterBar";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

// maplibre-gl touches `window`/WebGL at import time — must never run
// during SSR.
const MapView = dynamic(() => import("@muslimspaces/ui/map").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton height="100%" borderRadius={0} />,
});

type ExploreMode = "map" | "list";

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
  const searchParams = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const { locale, t } = useLocale();

  const [mode, setMode] = useState<ExploreMode>("map");
  const [pois, setPois] = useState(initialPois);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(initialFavoriteIds));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial SSR list covers first paint (and SEO); this refetches on mount
  // and on any filter change. Not viewport-bounded — the map now loads
  // every matching POI at once and clusters them client-side (see
  // packages/ui/src/MapView/pin-utils.ts), so panning/zooming never needs a
  // new fetch, and List mode always shows the same full set as Map mode.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getBrowserApiClient()
      .pois.list({
        categoryId: selectedCategoryId ?? undefined,
        openNow: openNow || undefined,
        search: search || undefined,
        limit: 2000,
      })
      .then((result) => {
        if (!cancelled) setPois(result);
      })
      .catch(() => {
        if (!cancelled) setError(t("explore.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, openNow, search, t]);

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
    const category = categories.find((c) => c.id === poi.primaryCategoryId);
    return category ? pickLocalized(category.name, locale) : undefined;
  }

  // No POI is selected until the user taps a marker — undefined here (not a
  // pois[0] fallback) also covers the selected POI dropping out of the list
  // after a refetch.
  const selectedPoi = pois.find((poi) => poi.id === selectedPoiId);

  function poiCard(poi: Poi, layout: "row" | "grid" = "row") {
    return (
      // minWidth: 0 is load-bearing — a flex item's default min-width is
      // "auto" (its content's intrinsic width), so without this the card
      // refuses to shrink to fit .explore-list-col's flex column, and the
      // column ends up horizontally scrollable instead of the card's text
      // actually truncating.
      <div key={poi.id} style={{ position: "relative", minWidth: 0 }}>
        <Link href={`/pois/${poi.id}`} aria-label={pickLocalized(poi.name, locale)} style={{ position: "absolute", inset: 0, zIndex: 1 }} />
        <POICard
          poi={poi}
          categoryLabel={categoryLabel(poi)}
          isFavorite={favoriteIds.has(poi.id)}
          onToggleFavorite={() => toggleFavorite(poi.id)}
          layout={layout}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1340, margin: "0 auto", padding: "26px clamp(16px,4vw,28px) 60px", display: "flex", flexDirection: "column", gap: spacing.lg }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.xl, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>
            {t("explore.dateline", { count: pois.length }).toUpperCase()}
          </Text>
          <div style={{ marginTop: 5 }}>
            <Text size="3xl" weight="semibold">{t("explore.heading")}</Text>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: spacing.lg, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setOpenNow((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              cursor: "pointer",
              fontSize: 14,
              border: "none",
              background: "transparent",
              color: openNow ? colors.primaryDark : "#57534E",
            }}
          >
            {openNow ? <SquareCheck size={20} /> : <Square size={20} />}
            {t("explore.openNow")}
          </button>

          <div style={{ display: "flex", border: `1px solid ${colors.border}`, borderRadius: radii.pill, overflow: "hidden", background: colors.surface }}>
            <button
              type="button"
              onClick={() => setMode("map")}
              style={{
                display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", fontSize: 14, cursor: "pointer",
                border: "none", background: mode === "map" ? colors.primary : "transparent", color: mode === "map" ? colors.textOnPrimary : colors.text,
              }}
            >
              <MapIcon size={17} /> {t("explore.map")}
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              style={{
                display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", fontSize: 14, cursor: "pointer",
                border: "none", borderInlineStart: `1px solid ${colors.border}`,
                background: mode === "list" ? colors.primary : "transparent", color: mode === "list" ? colors.textOnPrimary : colors.text,
              }}
            >
              <Rows3 size={17} /> {t("explore.list")}
            </button>
          </div>
        </div>
      </div>

      <FilterBar categories={categories} selectedCategoryId={selectedCategoryId} onCategoryChange={setSelectedCategoryId} />

      {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}

      {mode === "map" ? (
        <div className="explore-columns">
          <div className="explore-list-col">
            {loading && pois.length === 0 ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} height={120} borderRadius={radii.lg} />)
            ) : (
              pois.map((poi) => poiCard(poi))
            )}
            <Text size="sm" color={colors.textMuted}>{t("explore.empty")}</Text>
          </div>

          <div className="explore-map-col">
            <MapView
              pois={pois}
              categories={categories}
              onMarkerPress={setSelectedPoiId}
              selectedPoiId={selectedPoi?.id ?? null}
            />

            {selectedPoi && (
              <Link
                href={`/pois/${selectedPoi.id}`}
                style={{
                  position: "absolute",
                  insetInlineStart: 14,
                  insetInlineEnd: 14,
                  bottom: 14,
                  maxWidth: 400,
                  background: colors.surface,
                  borderRadius: radii.cardLg,
                  boxShadow: "0 10px 28px rgba(28,25,23,.18)",
                  padding: 14,
                  display: "flex",
                  gap: 13,
                  alignItems: "flex-start",
                  textDecoration: "none",
                }}
              >
                <div style={{ width: 62, height: 62, flex: "none", borderRadius: 13, backgroundColor: colors.primaryLight }} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  {categoryLabel(selectedPoi) && (
                    <Text size="xs" weight="medium" color={colors.primaryDark} letterSpacing={1.4}>
                      {categoryLabel(selectedPoi)!.toUpperCase()}
                    </Text>
                  )}
                  <Text weight="semibold" numberOfLines={1}>{pickLocalized(selectedPoi.name, locale)}</Text>
                  <Text size="xs" color={colors.textMuted} numberOfLines={1}>{selectedPoi.address}</Text>
                  <div style={{ display: "flex", alignItems: "baseline", gap: spacing.xs }}>
                    <Rating value={selectedPoi.ratingAvg ?? 0} size={13} />
                    <Text size="xs" color={colors.textMuted}>
                      {selectedPoi.ratingCount > 0 ? `(${selectedPoi.ratingCount})` : "New"}
                    </Text>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div>
          {loading && pois.length === 0 ? (
            <div className="poi-grid">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={220} borderRadius={16} />
              ))}
            </div>
          ) : pois.length === 0 ? (
            <Text color={colors.textMuted}>{t("explore.empty")}</Text>
          ) : (
            <div className="poi-grid">{pois.map((poi) => poiCard(poi, "grid"))}</div>
          )}
        </div>
      )}
    </div>
  );
}
