import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { POICard, Skeleton, Text, colors, spacing } from "@muslimspaces/ui";
import { MapView } from "@muslimspaces/ui/map";
import type { MapBounds } from "@muslimspaces/ui/map";
import type { Category, Poi } from "@muslimspaces/shared";
import { api } from "../../src/lib/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { FilterBar } from "../../src/components/FilterBar";

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [pois, setPois] = useState<Poi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  // ExploreView, just stacked vertically instead of side-by-side.
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
    <FlatList
      data={pois}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.md }}>
          <FilterBar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            openNow={openNow}
            onOpenNowChange={setOpenNow}
          />
          <View style={{ height: 260, borderRadius: 16, overflow: "hidden", marginTop: spacing.sm }}>
            <MapView pois={pois} onBoundsChange={setBounds} onMarkerPress={(id) => router.push(`/pois/${id}`)} />
          </View>
          {error && (
            <Text size="sm" color={colors.danger} align="center">
              {error}
            </Text>
          )}
          {loading && !error && (
            <Text size="sm" color={colors.textMuted} align="center">
              Updating…
            </Text>
          )}
        </View>
      }
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
  );
}
