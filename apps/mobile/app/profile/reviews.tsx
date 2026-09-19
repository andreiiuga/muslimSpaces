import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { Poi, Review } from "@muslimspaces/shared";
import { Rating, Skeleton, Text, colors, nativeShadows, radii, spacing } from "@muslimspaces/ui";
import { api } from "../../src/lib/api-client";
import { pickLocalized } from "../../src/i18n/pick-localized";
import type { LocaleCode } from "../../src/i18n";

export default function MyReviewsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [pois, setPois] = useState<Map<string, Poi>>(new Map());

  useEffect(() => {
    let cancelled = false;
    api.reviews.mine().then(async (mine) => {
      if (cancelled) return;
      setReviews(mine);
      const uniquePoiIds = Array.from(new Set(mine.map((r) => r.poiId)));
      const fetched = await Promise.all(uniquePoiIds.map((id) => api.pois.get(id).catch(() => null)));
      if (cancelled) return;
      const map = new Map<string, Poi>();
      fetched.forEach((poi) => poi && map.set(poi.id, poi));
      setPois(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (reviews === null) {
    return (
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Skeleton height={90} borderRadius={16} />
        <Skeleton height={90} borderRadius={16} />
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, flexGrow: 1 }}
      ListEmptyComponent={
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text color={colors.textMuted}>{t("myReviews.empty")}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const poi = pois.get(item.poiId);
        return (
          <Pressable
            onPress={() => router.push(`/pois/${item.poiId}`)}
            style={{
              padding: spacing.md,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              gap: spacing.xs,
              ...nativeShadows.card,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text weight="semibold" numberOfLines={1}>{poi ? pickLocalized(poi.name, locale) : "…"}</Text>
              <Text size="xs" color={colors.textMuted}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Rating value={item.rating} size={14} />
            {item.comment && <Text size="sm" color={colors.textBody}>{item.comment}</Text>}
            {item.status === "hidden" && (
              <Text size="xs" color={colors.dangerDark}>{t("myReviews.hidden")}</Text>
            )}
          </Pressable>
        );
      }}
    />
  );
}
