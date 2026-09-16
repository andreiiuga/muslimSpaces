import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import type { BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { POICard, Skeleton, Text, colors, spacing } from "@muslimspaces/ui";
import { MapView } from "@muslimspaces/ui/map";
import type { MapBounds } from "@muslimspaces/ui/map";
import type { Category, Poi } from "@muslimspaces/shared";
import { api } from "../../src/lib/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { FilterBar } from "../../src/components/FilterBar";
import { useTabBarVisibility } from "../../src/navigation/TabBarVisibility";

// Collapsed "peek" height: just the handle + title (see SheetHandle) — no
// list content shows at rest, matching the Airbnb reference the sheet
// design is based on. Also used as the map's bottom camera padding so its
// true center lands in the upper (visible) portion of the screen at rest.
const PEEK_HEIGHT = 96;
const SNAP_POINTS = [PEEK_HEIGHT, "55%", "92%"];

// The native tab bar only reappears once the sheet is expanded past the
// collapsed state (see onChange below) — this is how much bottom padding
// the list then needs so its last cards clear the tab bar instead of
// disappearing behind it. Calibrated, not measured: NativeTabs doesn't
// expose its rendered height to JS (see CLAUDE.md).
const TAB_BAR_CLEARANCE = 90;

function SheetHandle() {
  return (
    <View style={{ alignItems: "center", gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
      <Text weight="bold" size="xl">
        Explore
      </Text>
    </View>
  );
}

function SheetBackground({ style }: BottomSheetBackgroundProps) {
  return <BlurView intensity={80} tint="light" style={[style, { overflow: "hidden" }]} />;
}

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { setHidden: setTabBarHidden } = useTabBarVisibility();

  const [pois, setPois] = useState<Poi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Collapsed (0) hides the tab bar and needs no extra list padding;
  // expanded (1/2) shows it, so the list needs bottom clearance for it.
  const [sheetIndex, setSheetIndex] = useState(0);

  useEffect(() => {
    api.categories.list().then(setCategories);
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    api.favorites
      .mine()
      .then((favs) => setFavoriteIds(new Set(favs.map((f) => f.id))))
      .catch(() => {});
  }, [user]);

  // Initial load covers first paint; once the map reports a real viewport,
  // subsequent fetches are viewport-driven — same pattern as the web
  // ExploreView.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const query = bounds
      ? api.pois.bbox({
          ...bounds,
          categoryId: selectedCategoryId ?? undefined,
          openNow: openNow || undefined,
          limit: 100,
        })
      : api.pois.list({
          limit: 40,
          categoryId: selectedCategoryId ?? undefined,
          openNow: openNow || undefined,
        });

    query
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
    if (!user) {
      router.push("/login");
      return;
    }
    const isFavorite = favoriteIds.has(poiId);
    if (isFavorite) await api.pois.favorite.remove(poiId);
    else await api.pois.favorite.add(poiId);
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
    <View style={{ flex: 1 }}>
      <View style={StyleSheet.absoluteFill}>
        <MapView
          pois={pois}
          onBoundsChange={setBounds}
          onMarkerPress={(id) => router.push(`/pois/${id}`)}
          padding={{ bottom: PEEK_HEIGHT + insets.bottom }}
        />
      </View>

      <BlurView
        intensity={80}
        tint="light"
        style={{
          position: "absolute",
          top: insets.top + spacing.sm,
          left: spacing.md,
          right: spacing.md,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <FilterBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          openNow={openNow}
          onOpenNowChange={setOpenNow}
        />
      </BlurView>

      {error && (
        <View style={{ position: "absolute", top: insets.top + 64, left: spacing.md, right: spacing.md }}>
          <Text size="sm" color={colors.danger} align="center">
            {error}
          </Text>
        </View>
      )}

      <BottomSheet
        snapPoints={SNAP_POINTS}
        index={0}
        enableDynamicSizing={false}
        onChange={(index) => {
          setSheetIndex(index);
          // The tab bar slides into view once the sheet leaves its
          // collapsed/lowest state, and slides back out when it returns —
          // matches the Airbnb "Trips" sheet this is modeled on.
          setTabBarHidden(index === 0);
        }}
        handleComponent={SheetHandle}
        backgroundComponent={SheetBackground}
      >
        <BottomSheetFlatList
          data={pois}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.md,
            paddingBottom: sheetIndex > 0 ? TAB_BAR_CLEARANCE + insets.bottom : spacing.lg,
          }}
          ListEmptyComponent={
            loading ? (
              <View style={{ gap: spacing.md }}>
                <Skeleton height={140} borderRadius={16} />
                <Skeleton height={140} borderRadius={16} />
              </View>
            ) : (
              <Text color={colors.textMuted}>No POIs in this area yet.</Text>
            )
          }
          renderItem={({ item }) => (
            <POICard
              poi={item}
              categoryLabel={categoryLabel(item)}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onPress={() => router.push(`/pois/${item.id}`)}
            />
          )}
        />
      </BottomSheet>
    </View>
  );
}
