import { useEffect, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, Square, SquareCheck, Map as MapIcon, Rows3 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  POICard,
  Skeleton,
  Text,
  colors,
  fontSizes,
  nativeShadows,
  radii,
  spacing,
} from "@muslimspaces/ui";
import { MapView } from "@muslimspaces/ui/map";
import type { MapBounds } from "@muslimspaces/ui/map";
import type { Category, Poi } from "@muslimspaces/shared";
import { api } from "../../src/lib/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { FilterBar } from "../../src/components/FilterBar";
import { TAB_BAR_HEIGHT } from "../../src/components/CustomTabBar";
import { pickLocalized } from "../../src/i18n/pick-localized";
import type { LocaleCode } from "../../src/i18n";

type ExploreView = "map" | "list";

// Top panel (title, dateline, search, category chips, open-now + map/list
// toggle) sits in normal flow above a mutually-exclusive map/list surface —
// matching the v2 design exactly, not the floating-overlay-on-a-full-bleed-
// map + always-present draggable sheet this screen used to have.
export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const tabBarClearance = TAB_BAR_HEIGHT + insets.bottom + spacing.lg;

  const [view, setView] = useState<ExploreView>("map");
  const [pois, setPois] = useState<Poi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced so every keystroke doesn't fire a request — 300ms is short
  // enough to feel live without hammering the search endpoint.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

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
          search: search || undefined,
          limit: 100,
        })
      : api.pois.list({
          limit: 40,
          categoryId: selectedCategoryId ?? undefined,
          openNow: openNow || undefined,
          search: search || undefined,
        });

    query
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
  }, [bounds, selectedCategoryId, openNow, search, t]);

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
    const category = categories.find((c) => c.id === poi.primaryCategoryId);
    return category ? pickLocalized(category.name, locale) : undefined;
  }

  const featured = pois[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <Text size="2xl" weight="semibold">{t("explore.title")}</Text>
        <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.3}>
          {t("explore.dateline", { count: pois.length }).toUpperCase()}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            height: 46,
            paddingHorizontal: spacing.md,
            borderRadius: radii.input,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Search size={19} color={colors.primary} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t("explore.search")}
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, fontSize: fontSizes.sm, color: colors.text }}
          />
        </View>

        <View style={{ marginHorizontal: -spacing.lg }}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <FilterBar
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={setSelectedCategoryId}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, paddingBottom: spacing.sm }}>
          <Pressable
            onPress={() => setOpenNow((v) => !v)}
            hitSlop={8}
            style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, minHeight: 32 }}
          >
            {openNow ? (
              <SquareCheck size={19} color={colors.primaryDark} />
            ) : (
              <Square size={19} color={colors.textMuted} />
            )}
            <Text size="sm" color={openNow ? colors.primaryDark : colors.textMuted}>
              {t("explore.openNow")}
            </Text>
          </Pressable>

          <View style={{ flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, overflow: "hidden", backgroundColor: colors.surface }}>
            <Pressable
              onPress={() => setView("map")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 32,
                paddingHorizontal: spacing.md,
                backgroundColor: view === "map" ? colors.primary : "transparent",
              }}
            >
              <MapIcon size={16} color={view === "map" ? colors.textOnPrimary : colors.text} />
              <Text size="xs" color={view === "map" ? colors.textOnPrimary : colors.text}>{t("explore.map")}</Text>
            </Pressable>
            <Pressable
              onPress={() => setView("list")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 32,
                paddingHorizontal: spacing.md,
                borderLeftWidth: 1,
                borderLeftColor: colors.border,
                backgroundColor: view === "list" ? colors.primary : "transparent",
              }}
            >
              <Rows3 size={16} color={view === "list" ? colors.textOnPrimary : colors.text} />
              <Text size="xs" color={view === "list" ? colors.textOnPrimary : colors.text}>{t("explore.list")}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {error && (
        <Text size="sm" color={colors.dangerDark} align="center" letterSpacing={0}>
          {error}
        </Text>
      )}

      {view === "map" && (
        <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: colors.border }}>
          <MapView
            pois={pois}
            onBoundsChange={setBounds}
            onMarkerPress={(id) => router.push(`/pois/${id}`)}
            padding={{ bottom: tabBarClearance }}
          />

          {featured && (
            <Pressable
              onPress={() => router.push(`/pois/${featured.id}`)}
              style={{
                position: "absolute",
                left: spacing.md,
                right: spacing.md,
                bottom: tabBarClearance,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.cardLg,
                padding: spacing.md,
                flexDirection: "row",
                gap: spacing.md,
                alignItems: "flex-start",
                ...nativeShadows.elevated,
              }}
            >
              <View style={{ width: 56, height: 56, flexShrink: 0, borderRadius: radii.md, backgroundColor: colors.primaryLight }} />
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                {categoryLabel(featured) && (
                  <Text size="xs" weight="medium" color={colors.primaryDark} letterSpacing={1.3}>
                    {categoryLabel(featured)!.toUpperCase()}
                  </Text>
                )}
                <Text weight="semibold" numberOfLines={1}>{pickLocalized(featured.name, locale)}</Text>
                <Text size="xs" color={colors.textMuted} numberOfLines={1}>{featured.address}</Text>
              </View>
            </Pressable>
          )}
        </View>
      )}

      {view === "list" && (
        <FlatList
          data={pois}
          keyExtractor={(item) => item.id}
          style={{ borderTopWidth: 1, borderTopColor: colors.border }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: tabBarClearance }}
          ListEmptyComponent={
            loading ? (
              <View style={{ gap: spacing.md }}>
                <Skeleton height={100} borderRadius={radii.lg} />
                <Skeleton height={100} borderRadius={radii.lg} />
              </View>
            ) : (
              <Text color={colors.textMuted}>{t("explore.empty")}</Text>
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
      )}
    </View>
  );
}
