import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react-native";
import { ApiError } from "@muslimspaces/shared";
import { Button, Skeleton, Text, Textarea, colors, spacing } from "@muslimspaces/ui";
import { api } from "../../../src/lib/api-client";
import { useAuth } from "../../../src/auth/AuthContext";
import { pickLocalized } from "../../../src/i18n/pick-localized";
import type { LocaleCode } from "../../../src/i18n";

export default function ReviewComposerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;

  const [poiName, setPoiName] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.pois.get(id), user ? api.pois.reviews.list(id) : Promise.resolve([])])
      .then(([poi, reviews]) => {
        if (cancelled) return;
        setPoiName(pickLocalized(poi.name, locale));
        const mine = reviews.find((r) => r.userId === user?.id);
        if (mine) {
          setRating(mine.rating);
          setComment(mine.comment ?? "");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Only meant to run once per screen instance (composing one review) —
    // re-running on every locale change would stomp in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function handleSubmit() {
    if (rating === 0) {
      setError(t("review.pickStarFirst"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.pois.reviews.submit(id, { rating, comment: comment || undefined });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("review.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  const ratingWords = [
    t("review.tapAStar"),
    t("review.poor"),
    t("review.fair"),
    t("review.good"),
    t("review.veryGood"),
    t("review.excellent"),
  ];

  if (loading) {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <Skeleton height={28} width="60%" />
        <Skeleton height={140} borderRadius={16} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
      <View style={{ gap: 2 }}>
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("review.reviewing").toUpperCase()}</Text>
        <Text size="2xl" weight="semibold">{poiName}</Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("review.yourRating").toUpperCase()}</Text>
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setRating(n)}
              hitSlop={8}
              accessibilityLabel={`${n}`}
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
            >
              <Star size={30} color={n <= rating ? colors.star : colors.starEmpty} fill={n <= rating ? colors.star : "none"} />
            </Pressable>
          ))}
        </View>
        <Text size="sm" color={colors.textMuted}>{ratingWords[rating]}</Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("review.yourWords").toUpperCase()}</Text>
        <Textarea value={comment} onChangeText={setComment} placeholder={t("review.placeholder")} rows={4} />
        <Text size="xs" color={colors.textMuted}>{t("review.note")}</Text>
      </View>

      {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}

      <Button onPress={handleSubmit} loading={submitting} fullWidth>
        {t("review.post")}
      </Button>
    </ScrollView>
  );
}
