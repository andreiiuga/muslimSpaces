import { useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import type { BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import {
  POICard,
  Skeleton,
  Text,
  colors,
  radii,
  spacing,
} from "@muslimspaces/ui";
import { MapView } from "@muslimspaces/ui/map";
import type { MapBounds } from "@muslimspaces/ui/map";
import type { Category, Poi } from "@muslimspaces/shared";
import { api } from "../../src/lib/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { FilterBar } from "../../src/components/FilterBar";
import { useTabBarVisibility } from "../../src/navigation/TabBarVisibility";

// Fallback collapsed "peek" height, used only until SheetHandle's real
// height is measured (see handleHeight state below) — a static guess here
// would either clip the title (too small) or leave a sliver of the first
// list card visible below it (too large, since the library only hides
// content beyond the handle's *measured* height, not this constant).
const FALLBACK_PEEK_HEIGHT = 64;

// CustomTabBar is fully shown by the time the sheet passes its "55%" snap
// point (index 1) — this is how much bottom padding the list then needs so
// its last cards clear the tab bar instead of disappearing behind it.
// Calibrated, not measured: the bar's own height plus clearance, kept as a
// constant here since the list's padding only needs a coarse on/off toggle,
// unlike the tab bar's own continuous slide (see CustomTabBar.tsx).
const TAB_BAR_CLEARANCE = 90;

// Rounded top corners + a shadow need to live on separate layers: the
// BlurView needs `overflow: "hidden"` to clip its blur to the rounded
// shape, but a clipped layer can't cast its own shadow (iOS/Android both
// suppress shadows on views that clip their bounds). So the outer View
// here owns the shadow (unclipped, offset upward so it reads as the sheet
// lifting off the map behind it) and the inner BlurView owns the rounded,
// clipped blur fill.
function SheetBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <View
      style={[
        style,
        {
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },
      ]}
    >
      <BlurView
        intensity={80}
        tint="extraLight"
        style={{
          flex: 1,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          overflow: "hidden",
        }}
      />
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { bottomSheetIndex } = useTabBarVisibility();

  const [pois, setPois] = useState<Poi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [openNow, setOpenNow] = useState(false);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Discrete snap index (for the list's own bottom padding, see below) —
  // separate from `bottomSheetIndex`, which is the continuous animated
  // value the tab bar tracks directly, not this JS-thread copy.
  const [snapIndex, setSnapIndex] = useState(0);
  // Measured from SheetHandle's real onLayout height so the collapsed snap
  // point matches it exactly — a hardcoded guess left a sliver of the first
  // list card peeking below the title, since the library only clips content
  // past the handle's *measured* height, not any peek-height constant.
  const [handleHeight, setHandleHeight] = useState(FALLBACK_PEEK_HEIGHT);
  const snapPoints = useMemo(
    () => [handleHeight, "55%", "92%"],
    [handleHeight],
  );

  // Memoized so its identity is stable across renders — handleComponent is
  // compared by reference, and a new one each render would remount the
  // handle (and its pan gesture) every time handleHeight itself changes.
  const SheetHandle = useMemo(
    () =>
      function SheetHandle() {
        return (
          <View
            onLayout={(event: LayoutChangeEvent) =>
              setHandleHeight(Math.ceil(event.nativeEvent.layout.height))
            }
            style={{
              alignItems: "center",
              gap: spacing.sm,
              paddingTop: spacing.sm,
              paddingBottom: spacing.md,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
              }}
            />
            <Text weight="bold" size="xl">
              Explore
            </Text>
          </View>
        );
      },
    [],
  );

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
          padding={{ bottom: handleHeight + insets.bottom }}
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
        <View
          style={{
            position: "absolute",
            top: insets.top + 64,
            left: spacing.md,
            right: spacing.md,
          }}
        >
          <Text size="sm" color={colors.danger} align="center">
            {error}
          </Text>
        </View>
      )}

      <BottomSheet
        snapPoints={snapPoints}
        index={0}
        enableDynamicSizing={false}
        animatedIndex={bottomSheetIndex}
        onChange={setSnapIndex}
        handleComponent={SheetHandle}
        backgroundComponent={SheetBackground}
      >
        <BottomSheetFlatList
          data={pois}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.md,
            paddingBottom:
              snapIndex > 0 ? TAB_BAR_CLEARANCE + insets.bottom : spacing.lg,
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
