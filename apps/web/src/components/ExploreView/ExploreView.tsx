"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Square, SquareCheck, Map as MapIcon, Rows3 } from "lucide-react";
import { POICard, Rating, Skeleton, Text, colors, radii } from "@muslimspaces/ui";
import type { MapBounds } from "@muslimspaces/ui/map";
import type { Category, Poi } from "@muslimspaces/shared";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
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
  // Drives the map-mode left list only (see mapVisiblePois below) — the map
  // itself still gets the full `pois` set and clusters client-side; this is
  // just "what's currently inside the viewport", updated from MapView's own
  // moveend listener, no extra fetch involved.
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Bumped once per *concluded search* (see the fetch effect below) — tells
  // MapView to zoom/fit to whatever `pois` just came back. A ref, not
  // state, since it only needs to survive across renders to detect "did
  // `search` change since the last fetch", not to trigger one itself.
  const prevSearchRef = useRef(search);
  const [fitBoundsToken, setFitBoundsToken] = useState(0);

  // Measures the sticky site header (see "data-site-header" in HeaderBar) so
  // Map mode's small-viewport shell can size itself to exactly "the rest of
  // the viewport" via the --header-h custom property below — see
  // ".explore-shell--map" in globals.css. The 120 fallback only matters for
  // the very first paint before this effect runs.
  const [headerHeight, setHeaderHeight] = useState(120);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!header) return;
    const update = () => setHeaderHeight(header.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  // Initial SSR list covers first paint (and SEO); this refetches on mount
  // and on any filter change. Not viewport-bounded — the map now loads
  // every matching POI at once and clusters them client-side (see
  // packages/ui/src/MapView/pin-utils.ts), so panning/zooming never needs a
  // new fetch, and List mode always shows the same full set as Map mode.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Computed before the ref is updated below, so it reflects "did the
    // search query specifically change for *this* fetch" — a category/
    // openNow-only change (search unchanged) correctly reads false here,
    // so it doesn't yank the camera around on every filter click, only on
    // an actual search submission.
    const searchConcluded = search !== prevSearchRef.current;
    prevSearchRef.current = search;

    getBrowserApiClient()
      .pois.list({
        categoryId: selectedCategoryId ?? undefined,
        openNow: openNow || undefined,
        search: search || undefined,
        limit: 2000,
      })
      .then((result) => {
        if (!cancelled) {
          setPois(result);
          if (searchConcluded) setFitBoundsToken((prev) => prev + 1);
        }
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

  // "Including the clustered ones" — a POI merged into a cluster bubble
  // (not rendered as its own pin at the current zoom) still counts as
  // visible, since this is a pure viewport-bounds check, not "is this its
  // own marker right now". Falls back to the full list before the map's
  // first moveend fires bounds at all.
  const mapVisiblePois = mapBounds
    ? pois.filter(
        (poi) =>
          poi.location.lat >= mapBounds.minLat &&
          poi.location.lat <= mapBounds.maxLat &&
          poi.location.lng >= mapBounds.minLng &&
          poi.location.lng <= mapBounds.maxLng,
      )
    : pois;

  function poiCard(poi: Poi, layout: "row" | "grid" = "row") {
    return (
      // min-w-0 is load-bearing — a flex item's default min-width is
      // "auto" (its content's intrinsic width), so without this the card
      // refuses to shrink to fit .explore-list-col's flex column, and the
      // column ends up horizontally scrollable instead of the card's text
      // actually truncating.
      <div key={poi.id} className="relative min-w-0">
        <Link href={`/pois/${poi.id}`} aria-label={pickLocalized(poi.name, locale)} className="absolute inset-0 z-[1]" />
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
    <div
      className={`explore-shell${mode === "map" ? " explore-shell--map" : ""}`}
      style={{ "--header-h": `${headerHeight}px` } as CSSProperties}
    >
      <div className="flex flex-wrap items-end justify-between gap-xl">
        <div className="explore-heading-block min-w-0">
          <Text size="xs" weight="medium" color={colors.textMuted}>
            {t("explore.dateline", { count: pois.length }).toUpperCase()}
          </Text>
          <div className="mt-[5px]">
            <Text size="3xl" weight="semibold">{t("explore.heading")}</Text>
          </div>
        </div>

        <div className="explore-controls flex flex-wrap items-center gap-lg">
          <span className="explore-count-compact">{t("explore.dateline", { count: pois.length })}</span>

          <button
            type="button"
            className={cn(
              "hidden items-center gap-sm border-0 bg-transparent text-sm cursor-pointer explore:flex",
              openNow ? "text-primaryDark" : "text-textSecondary",
            )}
            onClick={() => setOpenNow((v) => !v)}
          >
            {openNow ? <SquareCheck size={20} /> : <Square size={20} />}
            {t("explore.openNow")}
          </button>

          <div className="flex overflow-hidden rounded-pill border border-border bg-surface">
            <button
              type="button"
              onClick={() => setMode("map")}
              className={cn(
                "flex h-[34px] cursor-pointer items-center gap-[7px] border-0 px-[12px] text-[13px] explore:h-10 explore:px-lg explore:text-sm",
                mode === "map" ? "bg-primary text-textOnPrimary" : "bg-transparent text-text",
              )}
            >
              <MapIcon size={17} /> {t("explore.map")}
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              className={cn(
                "flex h-[34px] cursor-pointer items-center gap-[7px] border-0 border-s border-s-border px-[12px] text-[13px] explore:h-10 explore:px-lg explore:text-sm",
                mode === "list" ? "bg-primary text-textOnPrimary" : "bg-transparent text-text",
              )}
            >
              <Rows3 size={17} /> {t("explore.list")}
            </button>
          </div>
        </div>
      </div>

      <FilterBar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        openNow={openNow}
        onOpenNowChange={() => setOpenNow((v) => !v)}
      />

      {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}

      {mode === "map" ? (
        <div className="explore-columns">
          <div className="explore-list-col">
            {loading && pois.length === 0 ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} height={120} borderRadius={radii.lg} />)
            ) : (
              mapVisiblePois.map((poi) => poiCard(poi))
            )}
            <Text size="sm" color={colors.textMuted}>{t("explore.empty")}</Text>
          </div>

          <div className="explore-map-col">
            <MapView
              pois={pois}
              categories={categories}
              onMarkerPress={setSelectedPoiId}
              onDeselect={() => setSelectedPoiId(null)}
              onBoundsChange={setMapBounds}
              fitBoundsToken={fitBoundsToken}
              selectedPoiId={selectedPoi?.id ?? null}
            />

            {selectedPoi && (
              <Link
                href={`/pois/${selectedPoi.id}`}
                className="absolute bottom-[14px] start-[14px] end-[14px] flex max-w-[400px] items-start gap-[13px] rounded-cardLg bg-surface p-[14px] no-underline shadow-elevated"
              >
                {selectedPoi.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPoi.thumbnailUrl}
                    alt=""
                    className="h-[62px] w-[62px] flex-none rounded-md object-cover"
                  />
                ) : (
                  <div className="h-[62px] w-[62px] flex-none rounded-md bg-primaryLight" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {categoryLabel(selectedPoi) && (
                    <Text size="xs" weight="medium" color={colors.primaryDark}>
                      {categoryLabel(selectedPoi)!.toUpperCase()}
                    </Text>
                  )}
                  <Text weight="semibold" numberOfLines={1}>{pickLocalized(selectedPoi.name, locale)}</Text>
                  <Text size="xs" color={colors.textMuted} numberOfLines={1}>{selectedPoi.address}</Text>
                  <div className="flex items-baseline gap-xs">
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={220} borderRadius={16} />
              ))}
            </div>
          ) : pois.length === 0 ? (
            <Text color={colors.textMuted}>{t("explore.empty")}</Text>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">{pois.map((poi) => poiCard(poi, "grid"))}</div>
          )}
        </div>
      )}
    </div>
  );
}
