"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Square, SquareCheck, Map as MapIcon, Rows3 } from "lucide-react";
import { POICard, Rating, Skeleton, Text, radii } from "@muslimspaces/ui";
import type { MapBounds } from "@muslimspaces/ui/map";
import type { Category, Poi } from "@muslimspaces/shared";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { getBrowserApiClient } from "../../lib/api-client";
import { FilterBar } from "../FilterBar/FilterBar";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";
import { useExploreState, type ExploreMode } from "./ExploreStateContext";

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
  const searchParams = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const { getState: getSavedExplore, setState: saveExplore } = useExploreState();
  // Captured once (lazy initializer) — this is only ever consulted again on
  // a fresh mount, so re-reading it on later renders would be pointless and
  // could race with saveExplore's own writes below.
  const [savedExplore] = useState(getSavedExplore);

  const [mode, setMode] = useState<ExploreMode>(savedExplore.mode);
  const [pois, setPois] = useState(initialPois);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(initialFavoriteIds));
  // Which categories currently have at least one real listing — drives
  // FilterBar's promoted-vs-folded chip split. Seeded from the SSR sample
  // (good enough for first paint) and refreshed from the fetch effect below
  // whenever it resolves a genuinely unfiltered result, so it reflects the
  // real dataset rather than just a 40-item sample once the client fetch
  // lands, without ever being corrupted by an active filter's narrower set.
  const [categoriesWithListings, setCategoriesWithListings] = useState(
    () => new Set(initialPois.map((poi) => poi.primaryCategoryId)),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(savedExplore.selectedCategoryId);
  const [openNow, setOpenNow] = useState(savedExplore.openNow);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(savedExplore.selectedPoiId);
  const [loading, setLoading] = useState(false);
  // Set true once the real (unsampled) fetch below has resolved at least
  // once for this mount. Guards mapVisiblePois below: a restored viewport
  // (see ExploreStateContext) can report tight, already-correct bounds on
  // the very first render, while `pois` is still the SSR sample — without
  // this, the two would briefly disagree and flash an incorrect "nothing
  // here" empty state until the real fetch lands.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
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
          if (!selectedCategoryId && !openNow && !search) {
            setCategoriesWithListings(new Set(result.map((poi) => poi.primaryCategoryId)));
          }
          if (searchConcluded) setFitBoundsToken((prev) => prev + 1);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t("explore.loadError"));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, openNow, search, t]);

  // Keeps the layout-level store (see ExploreStateContext) in sync so a
  // round trip to a POI detail page and back restores this exact state —
  // `saveExplore` is a stable ref-backed function, safe as a dep.
  useEffect(() => {
    saveExplore({ mode, selectedCategoryId, openNow, selectedPoiId });
  }, [mode, selectedCategoryId, openNow, selectedPoiId, saveExplore]);

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

  function resetFilters() {
    setSelectedCategoryId(null);
    setOpenNow(false);
    if (search) router.push("/");
  }

  // Zero results reads very differently depending on *why* — a search with
  // no matches, a thin category, or (rare, only if the dataset itself is
  // empty) neither. A single generic "nothing here" string with no way out
  // was a real dead end given how concentrated this dataset is outside
  // Dobrogea. Search takes priority in the copy when both a search and a
  // category are active, since it's the more specific, more recently
  // stated intent.
  function emptyResultsNode() {
    const message = search
      ? t("explore.emptySearch", { query: search })
      : selectedCategoryId
        ? t("explore.emptyCategory")
        : t("explore.empty");
    const hasActiveFilters = Boolean(search || selectedCategoryId || openNow);
    return (
      <div className="flex flex-col items-start gap-sm">
        <Text size="sm" color="textMuted">{message}</Text>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-primaryDark"
          >
            {t("explore.clearFilters")}
          </button>
        )}
      </div>
    );
  }

  // No POI is selected until the user taps a marker — undefined here (not a
  // pois[0] fallback) also covers the selected POI dropping out of the list
  // after a refetch.
  const selectedPoi = pois.find((poi) => poi.id === selectedPoiId);

  // Memoized on `locale` alone (not created inline) — MapView's marker
  // effect depends on this function's identity to know when to rebuild
  // every pin, so a fresh closure on every ExploreView render would rebuild
  // all markers on any unrelated state change (favoriting a POI, etc.).
  const getPoiLabel = useCallback((poi: Poi) => pickLocalized(poi.name, locale), [locale]);

  // "Including the clustered ones" — a POI merged into a cluster bubble
  // (not rendered as its own pin at the current zoom) still counts as
  // visible, since this is a pure viewport-bounds check, not "is this its
  // own marker right now". Falls back to the full list before the map's
  // first moveend fires bounds at all, and also until the real fetch has
  // landed at least once (see hasLoadedOnce above) — otherwise a restored
  // viewport can report bounds that are already correct while `pois` is
  // still the small SSR sample, and the two briefly disagree.
  const mapVisiblePois = mapBounds && hasLoadedOnce
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
          displayName={pickLocalized(poi.name, locale)}
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
          <Text size="xs" weight="medium" color="textMuted">
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
              "hidden items-center gap-sm border-0 bg-transparent text-sm cursor-pointer outline-none explore:flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              openNow ? "text-primaryDark" : "text-textSecondary",
            )}
            onClick={() => setOpenNow((v) => !v)}
          >
            {openNow ? <SquareCheck size={20} /> : <Square size={20} />}
            {t("explore.openNow")}
          </button>

          {/* overflow-hidden on this pill clips a normal outset outline, so
              these two buttons get an inset ring instead — still a visible
              teal focus indicator, just drawn inside the pill's own edge
              rather than outside it. */}
          <div className="flex overflow-hidden rounded-pill border border-border bg-surface">
            <button
              type="button"
              onClick={() => setMode("map")}
              className={cn(
                "flex h-[34px] cursor-pointer items-center gap-[7px] border-0 px-[12px] text-[13px] outline-none explore:h-10 explore:px-lg explore:text-sm focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                mode === "map" ? "bg-primary text-textOnPrimary" : "bg-transparent text-text",
              )}
            >
              <MapIcon size={17} /> {t("explore.map")}
            </button>
            <button
              type="button"
              onClick={() => setMode("list")}
              className={cn(
                "flex h-[34px] cursor-pointer items-center gap-[7px] border-0 border-s border-s-border px-[12px] text-[13px] outline-none explore:h-10 explore:px-lg explore:text-sm focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
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
        categoriesWithListings={categoriesWithListings}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        openNow={openNow}
        onOpenNowChange={() => setOpenNow((v) => !v)}
      />

      {error && <Text size="sm" color="dangerDark">{error}</Text>}

      {mode === "map" ? (
        <div className="explore-columns">
          <div className="explore-list-col">
            {loading && pois.length === 0 ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} height={120} borderRadius={radii.lg} />)
            ) : pois.length === 0 ? (
              emptyResultsNode()
            ) : mapVisiblePois.length === 0 ? (
              // Results exist, just none inside the current map viewport —
              // a different situation from "no results at all" (above), so
              // it gets its own, action-free copy: panning/zooming is the
              // obvious next step here, not a filter to clear.
              <Text size="sm" color="textMuted">{t("explore.emptyViewport")}</Text>
            ) : (
              mapVisiblePois.map((poi) => poiCard(poi))
            )}
          </div>

          <div className="explore-map-col">
            <MapView
              pois={pois}
              categories={categories}
              getPoiLabel={getPoiLabel}
              theme={resolvedTheme === "dark" ? "dark" : "light"}
              initialCenter={savedExplore.viewport?.center}
              initialZoom={savedExplore.viewport?.zoom}
              onViewportChange={(viewport) => saveExplore({ viewport })}
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
                    <Text size="xs" weight="medium" color="primaryDark">
                      {categoryLabel(selectedPoi)!.toUpperCase()}
                    </Text>
                  )}
                  <Text weight="semibold" numberOfLines={1}>{pickLocalized(selectedPoi.name, locale)}</Text>
                  <Text size="xs" color="textMuted" numberOfLines={1}>{selectedPoi.address}</Text>
                  <div className="flex items-baseline gap-xs">
                    <Rating value={selectedPoi.ratingAvg ?? 0} size={13} />
                    <Text size="xs" color="textMuted">
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
            emptyResultsNode()
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">{pois.map((poi) => poiCard(poi, "grid"))}</div>
          )}
        </div>
      )}
    </div>
  );
}
