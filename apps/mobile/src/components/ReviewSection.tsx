import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { Review } from "@muslimspaces/shared";
import { Rating, Text, colors, nativeShadows, radii, spacing } from "@muslimspaces/ui";

export function ReviewSection({
  poiId,
  initialReviews,
  currentUserId,
  isLoggedIn,
}: {
  poiId: string;
  initialReviews: Review[];
  currentUserId?: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const myReview = currentUserId ? initialReviews.find((r) => r.userId === currentUserId) : undefined;
  const published = initialReviews.filter((r) => r.status === "published");

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text size="xl" weight="semibold">{t("poi.reviews")}</Text>
        <Pressable
          onPress={() => (isLoggedIn ? router.push(`/pois/${poiId}/review`) : router.push("/login"))}
          hitSlop={8}
        >
          <Text size="sm" color={colors.primary}>{myReview ? t("review.update") : t("poi.writeOne")}</Text>
        </Pressable>
      </View>

      {published.length === 0 ? (
        <Text size="sm" color={colors.textMuted}>{t("poi.noReviewsYet")}</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {published.map((review) => (
            <View
              key={review.id}
              style={{
                padding: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                gap: spacing.xs,
                ...nativeShadows.card,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Rating value={review.rating} size={14} />
                <Text size="xs" color={colors.textMuted}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {review.comment && <Text size="sm" color={colors.textBody}>{review.comment}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
