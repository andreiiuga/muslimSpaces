import { useCallback, useState } from "react";
import { Linking, Modal, Platform, Pressable, ScrollView, Share, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Car, Heart, MapPin, Navigation, Phone, Share2 } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { ApiError, isOpenNow } from "@muslimspaces/shared";
import type { Poi, PoiHour, PoiImage, Review } from "@muslimspaces/shared";
import { IconButton, Rating, Skeleton, Text, colors, nativeShadows, radii, spacing } from "@muslimspaces/ui";
import { api } from "../../../src/lib/api-client";
import { useAuth } from "../../../src/auth/AuthContext";
import { ReviewSection } from "../../../src/components/ReviewSection";
import { pickLocalized } from "../../../src/i18n/pick-localized";
import type { LocaleCode } from "../../../src/i18n";

const DAY_NAMES: Record<LocaleCode, string[]> = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  ro: ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],
  ar: ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
};

function formatHours(hours: PoiHour[], locale: LocaleCode, closedLabel: string) {
  const byDay = new Map<number, PoiHour[]>();
  for (const hour of hours) {
    const list = byDay.get(hour.dayOfWeek) ?? [];
    list.push(hour);
    byDay.set(hour.dayOfWeek, list);
  }
  return Array.from({ length: 7 }, (_, i) => i + 1).map((day) => ({
    day: DAY_NAMES[locale][day - 1],
    ranges: (byDay.get(day) ?? []).map((h) => `${h.opensAt}–${h.closesAt}`).join(", ") || closedLabel,
  }));
}

function altName(poi: Poi, locale: LocaleCode): string {
  return locale === "ro" ? poi.name.en : poi.name.ro;
}

type MapApp = "google" | "apple" | "waze";

// Icon + brand tint give each row a distinct app-icon-like badge — lucide
// has no actual app logos, so these are the closest thematic stand-ins
// (Google Maps' own glyph is a pin; Apple Maps' is a road sign; Waze is
// fundamentally a driving app). Apple Maps is iOS-only, filtered below.
const MAP_APP_OPTIONS: { key: MapApp; label: string; icon: LucideIcon; tint: string; iosOnly?: boolean }[] = [
  { key: "google", label: "Google Maps", icon: MapPin, tint: "#4285F4" },
  { key: "apple", label: "Apple Maps", icon: Navigation, tint: "#0A84FF", iosOnly: true },
  { key: "waze", label: "Waze", icon: Car, tint: "#05C3DE" },
];

// Plain https URLs (not custom schemes like `comgooglemaps://`/`waze://`) on
// purpose: each of these opens the native app via universal/app link when
// installed, and falls back to the web (or an install prompt) otherwise —
// no Linking.canOpenURL/LSApplicationQueriesSchemes plumbing needed either way.
function directionsUrl(app: MapApp, lat: number, lng: number): string {
  switch (app) {
    case "google":
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    case "apple":
      return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    case "waze":
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  }
}

export default function PoiDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;

  const [poi, setPoi] = useState<Poi | null>(null);
  const [images, setImages] = useState<PoiImage[]>([]);
  const [hours, setHours] = useState<PoiHour[]>([]);
  const [categoryLabels, setCategoryLabels] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [directionsMenuOpen, setDirectionsMenuOpen] = useState(false);

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
            .map((categoryId) => categories.find((c) => c.id === categoryId))
            .filter((c): c is NonNullable<typeof c> => Boolean(c))
            .map((c) => pickLocalized(c.name, locale)),
        );
        setReviews(fetchedReviews);
        setIsFavorite(favorites.some((f) => f.id === id));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else setError(true);
      })
      .finally(() => setLoading(false));
  }, [id, user, locale]);

  // Also covers the initial mount (a screen is "focused" as soon as it
  // appears) — no separate useEffect needed. Refetching on refocus picks
  // up a favorite toggled elsewhere (e.g. the Explore tab).
  useFocusEffect(load);

  async function toggleFavorite() {
    if (!poi) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (isFavorite) await api.pois.favorite.remove(poi.id);
    else await api.pois.favorite.add(poi.id);
    setIsFavorite((v) => !v);
  }

  function openMapApp(app: MapApp) {
    if (!poi) return;
    setDirectionsMenuOpen(false);
    Linking.openURL(directionsUrl(app, poi.location.lat, poi.location.lng));
  }

  function callPhone() {
    if (poi?.phone) Linking.openURL(`tel:${poi.phone.replace(/\s+/g, "")}`);
  }

  function sharePoi() {
    if (!poi) return;
    Share.share({ message: `${pickLocalized(poi.name, locale)} — ${poi.address}` });
  }

  const backButton = (
    <View style={{ position: "absolute", left: spacing.md, top: insets.top + spacing.sm }}>
      <IconButton
        icon={<ArrowLeft size={20} color={colors.text} />}
        onPress={() => router.back()}
        variant="solid"
        label={t("common.back")}
      />
    </View>
  );

  if (notFound) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        {backButton}
        <Text color={colors.textMuted}>{t("poi.notFound")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
        {backButton}
        <Text color={colors.dangerDark}>{t("poi.loadError")}</Text>
      </View>
    );
  }

  if (loading || !poi) {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        {backButton}
        <Skeleton height={220} borderRadius={16} />
        <Skeleton height={24} width="70%" />
        <Skeleton height={16} width="40%" />
      </ScrollView>
    );
  }

  const heroImage = images[0];
  const open = hours.length > 0 ? isOpenNow(hours) : null;

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing["2xl"], gap: spacing.lg }}>
        <View style={{ height: 238, backgroundColor: colors.primaryLight, position: "relative", overflow: "hidden" }}>
          {heroImage && (
            <Image source={{ uri: heroImage.url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          )}
          {!heroImage && (
            <View style={{ position: "absolute", left: spacing.md, bottom: spacing.sm }}>
              <Text size="xs" color={colors.textMuted}>
                {t("poi.photoCaption")}
              </Text>
            </View>
          )}
          <View style={{ position: "absolute", left: spacing.md, top: insets.top + spacing.sm }}>
            <IconButton
              icon={<ArrowLeft size={20} color={colors.text} />}
              onPress={() => router.back()}
              variant="solid"
              label={t("common.back")}
            />
          </View>
          <View style={{ position: "absolute", right: spacing.md, top: insets.top + spacing.sm }}>
            <IconButton
              icon={<Heart size={20} fill={isFavorite ? colors.danger : "none"} color={isFavorite ? colors.danger : colors.text} />}
              onPress={toggleFavorite}
              variant="solid"
              label={isFavorite ? t("poi.removeFavorite") : t("poi.addFavorite")}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
          <View style={{ gap: spacing.xs / 2 }}>
            {categoryLabels.length > 0 && (
              <Text size="xs" weight="medium" color={colors.primaryDark}>
                {categoryLabels.join(" · ").toUpperCase()}
              </Text>
            )}
            <Text size="3xl" weight="semibold">{pickLocalized(poi.name, locale)}</Text>
            <Text size="md" color={colors.textMuted}>{altName(poi, locale)}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 }}>
              <Rating value={poi.ratingAvg ?? 0} />
              <Text size="sm" color={colors.textMuted}>
                {poi.ratingCount > 0 ? `${(poi.ratingAvg ?? 0).toFixed(1)} (${poi.ratingCount})` : t("poi.noReviewsYet")}
              </Text>
            </View>
            {open !== null && (
              <Text size="sm" color={open ? colors.success : colors.textMuted}>
                {open ? t("explore.openNow") : t("common.closed")}
              </Text>
            )}
          </View>

          {poi.description && <Text color={colors.textBody}>{pickLocalized(poi.description, locale)}</Text>}

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable
              onPress={() => setDirectionsMenuOpen(true)}
              style={{
                flex: 1,
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
                backgroundColor: colors.primary,
                borderRadius: radii.pill,
                ...nativeShadows.buttonGlow,
              }}
            >
              <MapPin size={18} color={colors.textOnPrimary} />
              <Text weight="semibold" color={colors.textOnPrimary}>{t("poi.directions")}</Text>
            </Pressable>
            <Pressable
              onPress={callPhone}
              disabled={!poi.phone}
              style={{
                width: 48,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: poi.phone ? 1 : 0.4,
              }}
            >
              <Phone size={19} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={sharePoi}
              style={{
                width: 48,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Share2 size={19} color={colors.primary} />
            </Pressable>
          </View>

          <View style={{ gap: spacing.xs }}>
            <Text size="xs" weight="medium" color={colors.textMuted}>{t("poi.contact").toUpperCase()}</Text>
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
              <Text size="xs" weight="medium" color={colors.textMuted}>{t("poi.hours").toUpperCase()}</Text>
              {formatHours(hours, locale, t("common.closed")).map(({ day, ranges }) => (
                <View
                  key={day}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: spacing.xs,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                  }}
                >
                  <Text size="sm" color={colors.textMuted}>{day}</Text>
                  <Text size="sm" color={colors.textMuted}>{ranges}</Text>
                </View>
              ))}
            </View>
          )}

          <ReviewSection poiId={poi.id} initialReviews={reviews} currentUserId={user?.id} isLoggedIn={Boolean(user)} />
        </View>
      </ScrollView>

      <Modal visible={directionsMenuOpen} transparent animationType="fade" onRequestClose={() => setDirectionsMenuOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(28,25,23,.46)", justifyContent: "flex-end" }}
          onPress={() => setDirectionsMenuOpen(false)}
        >
          <View style={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + spacing.sm, gap: spacing.md }}>
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.xl,
                overflow: "hidden",
                ...nativeShadows.elevated,
              }}
            >
              <View style={{ paddingTop: spacing.lg, paddingBottom: spacing.sm, paddingHorizontal: spacing.lg }}>
                <Text
                  size="xs"
                  weight="medium"
                  color={colors.textMuted}
                  letterSpacing={1.3}
                  align="center"
                >
                  {t("poi.chooseDirectionsApp").toUpperCase()}
                </Text>
              </View>
              {MAP_APP_OPTIONS.filter((option) => !option.iosOnly || Platform.OS === "ios").map((option, index) => (
                <View key={option.key}>
                  {index > 0 && <View style={{ height: 1, backgroundColor: colors.divider, marginLeft: 64 }} />}
                  <Pressable
                    onPress={() => openMapApp(option.key)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      minHeight: 60,
                      paddingHorizontal: spacing.lg,
                      backgroundColor: pressed ? colors.background : "transparent",
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radii.md,
                        backgroundColor: option.tint,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <option.icon size={19} color="#fff" />
                    </View>
                    <Text weight="medium">{option.label}</Text>
                  </Pressable>
                </View>
              ))}
            </Pressable>
            <Pressable
              onPress={() => setDirectionsMenuOpen(false)}
              style={({ pressed }) => ({
                minHeight: 52,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radii.xl,
                backgroundColor: pressed ? colors.tealTint : colors.surface,
                ...nativeShadows.elevated,
              })}
            >
              <Text weight="semibold" color={colors.primary}>{t("common.cancel")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
