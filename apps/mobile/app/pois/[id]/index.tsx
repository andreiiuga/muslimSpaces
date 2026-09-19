import { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Heart } from "lucide-react-native";
import { ApiError } from "@muslimspaces/shared";
import type { Poi, PoiHour, PoiImage, Review } from "@muslimspaces/shared";
import { IconButton, Rating, Skeleton, Text, colors, spacing } from "@muslimspaces/ui";
import { api } from "../../src/lib/api-client";
import { useAuth } from "../../src/auth/AuthContext";
import { ReviewSection } from "../../src/components/ReviewSection";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatHours(hours: PoiHour[]) {
  const byDay = new Map<number, PoiHour[]>();
  for (const hour of hours) {
    const list = byDay.get(hour.dayOfWeek) ?? [];
    list.push(hour);
    byDay.set(hour.dayOfWeek, list);
  }
  return Array.from({ length: 7 }, (_, i) => i + 1).map((day) => ({
    day: DAY_NAMES[day],
    ranges: (byDay.get(day) ?? []).map((h) => `${h.opensAt}–${h.closesAt}`).join(", ") || "Closed",
  }));
}

export default function PoiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [poi, setPoi] = useState<Poi | null>(null);
  const [images, setImages] = useState<PoiImage[]>([]);
  const [hours, setHours] = useState<PoiHour[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setNotFound(false);
    setError(false);

    api.pois
      .get(id)
      .then(async (fetchedPoi) => {
        setPoi(fetchedPoi);
        const [fetchedImages, fetchedHours, categories, fetchedReviews, favorites] = await Promise.all([
          api.pois.images.list(id),
          api.pois.hours.list(id),
          api.categories.list(),
          api.pois.reviews.list(id),
          user ? api.favorites.mine().catch(() => []) : Promise.resolve([]),
        ]);
        setImages(fetchedImages);
        setHours(fetchedHours);
        setCategoryLabels(
          fetchedPoi.categoryIds
            .map((categoryId) => categories.find((c) => c.id === categoryId)?.name.en)
            .filter((label): label is string => Boolean(label)),
        );
        setReviews(fetchedReviews);
        setIsFavorite(favorites.some((f) => f.id === id));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(true);
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  // Also covers the initial mount (a screen is "focused" as soon as it
  // appears) — no separate useEffect needed. Refetching on refocus picks
  // up a favorite toggled elsewhere (e.g. the Explore tab).
  useFocusEffect(load);

  async function toggleFavorite() {
    if (!poi) return;
    if (isFavorite) await api.pois.favorite.remove(poi.id);
    else await api.pois.favorite.add(poi.id);
    setIsFavorite((v) => !v);
  }

  if (notFound) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Text color={colors.textMuted}>This place isn't available.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        <Text color={colors.danger}>Couldn't load this place. Try again later.</Text>
      </View>
    );
  }

  if (loading || !poi) {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <Skeleton height={220} borderRadius={16} />
        <Skeleton height={24} width="70%" />
        <Skeleton height={16} width="40%" />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <Stack.Screen options={{ title: poi.name.ro }} />

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }}>
          {images.map((image) => (
            <Image
              key={image.id}
              source={{ uri: image.url }}
              style={{ width: 280, height: 200, marginLeft: spacing.xl, borderRadius: 16 }}
              contentFit="cover"
            />
          ))}
        </ScrollView>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text size="2xl" weight="bold">{poi.name.ro}</Text>
          <Text size="md" color={colors.textMuted}>{poi.name.en}</Text>
        </View>
        <IconButton
          icon={<Heart size={20} fill={isFavorite ? colors.danger : "none"} color={isFavorite ? colors.danger : colors.text} />}
          onPress={toggleFavorite}
          variant="solid"
          label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Rating value={poi.ratingAvg ?? 0} />
        <Text size="sm" color={colors.textMuted}>
          {poi.ratingCount > 0 ? `${(poi.ratingAvg ?? 0).toFixed(1)} (${poi.ratingCount})` : "No reviews yet"}
        </Text>
      </View>

      {categoryLabels.length > 0 && (
        <Text size="sm" color={colors.primary} weight="medium">
          {categoryLabels.join(" · ")}
        </Text>
      )}

      {poi.description && <Text>{poi.description.ro}</Text>}

      <View style={{ gap: spacing.xs }}>
        <Text size="sm">{poi.address}</Text>
        {poi.phone && <Text size="sm">{poi.phone}</Text>}
        {poi.website && (
          <Pressable onPress={() => Linking.openURL(poi.website!)}>
            <Text size="sm" color={colors.primary}>{poi.website}</Text>
          </Pressable>
        )}
      </View>

      {hours.length > 0 && (
        <View style={{ gap: spacing.xs }}>
          <Text weight="semibold">Hours</Text>
          {formatHours(hours).map(({ day, ranges }) => (
            <View key={day} style={{ flexDirection: "row", justifyContent: "space-between", maxWidth: 320 }}>
              <Text size="sm" color={colors.textMuted}>{day}</Text>
              <Text size="sm">{ranges}</Text>
            </View>
          ))}
        </View>
      )}

      <ReviewSection poiId={poi.id} initialReviews={reviews} currentUserId={user?.id} isLoggedIn={Boolean(user)} />
    </ScrollView>
  );
}
