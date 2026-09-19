import { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Button, POICard, Skeleton, Text, colors, spacing } from "@muslimspaces/ui";
import type { Category, Poi } from "@muslimspaces/shared";
import { api } from "../../src/lib/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { TAB_BAR_HEIGHT } from "../../src/components/CustomTabBar";
import { pickLocalized } from "../../src/i18n/pick-localized";
import type { LocaleCode } from "../../src/i18n";

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const tabBarClearance = TAB_BAR_HEIGHT + insets.bottom + spacing.xl;
  const [favorites, setFavorites] = useState<Poi[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([api.favorites.mine(), api.categories.list()])
      .then(([favs, cats]) => {
        setFavorites(favs);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Refetch every time the tab regains focus — a favorite toggled from the
  // POI detail screen should be reflected here without a manual refresh.
  useFocusEffect(load);

  async function remove(poiId: string) {
    await api.pois.favorite.remove(poiId);
    setFavorites((prev) => prev.filter((poi) => poi.id !== poiId));
  }

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
        <Text color={colors.textMuted} align="center">
          {t("favorites.logInPrompt")}
        </Text>
        <Button onPress={() => router.push("/login")}>{t("common.logIn")}</Button>
      </View>
    );
  }

  if (loading && favorites.length === 0) {
    return (
      <View style={{ padding: spacing.lg, paddingTop: insets.top + spacing.lg, gap: spacing.md }}>
        <Skeleton height={140} borderRadius={16} />
        <Skeleton height={140} borderRadius={16} />
      </View>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.lg, paddingBottom: tabBarClearance, gap: spacing.md, flexGrow: 1 }}
      ListHeaderComponent={
        <View style={{ marginBottom: spacing.md, gap: 2 }}>
          <Text size="xs" weight="medium" color={colors.textMuted}>
            {t("favorites.saved").toUpperCase()}
          </Text>
          <Text size="2xl" weight="semibold">
            {t("favorites.title")}
          </Text>
          {favorites.length > 0 && (
            <Text size="sm" color={colors.textMuted}>
              {t("favorites.countLine", { count: favorites.length })}
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={{ flex: 1, alignItems: "center", gap: spacing.md, paddingTop: spacing.xl }}>
          <Text weight="semibold" size="lg" align="center">
            {t("favorites.emptyTitle")}
          </Text>
          <Text color={colors.textMuted} align="center">
            {t("favorites.emptyBody")}
          </Text>
          <Button onPress={() => router.push("/(tabs)")}>{t("favorites.browseMap")}</Button>
        </View>
      }
      renderItem={({ item }) => (
        <POICard
          poi={item}
          categoryLabel={
            categories.find((c) => c.id === item.primaryCategoryId)
              ? pickLocalized(categories.find((c) => c.id === item.primaryCategoryId)!.name, locale)
              : undefined
          }
          isFavorite
          onToggleFavorite={() => remove(item.id)}
          onPress={() => router.push(`/pois/${item.id}`)}
        />
      )}
    />
  );
}
