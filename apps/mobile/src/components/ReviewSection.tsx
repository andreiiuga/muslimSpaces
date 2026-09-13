import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { ApiError } from "@muslimspaces/shared";
import type { Review } from "@muslimspaces/shared";
import { Button, Rating, Text, Textarea, colors, spacing } from "@muslimspaces/ui";
import { api } from "../lib/api-client";

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
  const myReview = currentUserId ? initialReviews.find((r) => r.userId === currentUserId) : undefined;

  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const updated = await api.pois.reviews.submit(poiId, { rating, comment: comment || undefined });
      setReviews((prev) => [updated, ...prev.filter((r) => r.id !== updated.id)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <Text size="lg" weight="semibold">Reviews</Text>

      <View style={{ gap: spacing.sm }}>
        <Rating value={rating} onChange={setRating} size={24} />
        <Textarea value={comment} onChangeText={setComment} placeholder="Share what you thought (optional)" rows={3} />
        {error && <Text size="sm" color={colors.danger}>{error}</Text>}
        <View>
          <Button onPress={handleSubmit} disabled={submitting} size="sm">
            {myReview ? "Update review" : "Post review"}
          </Button>
        </View>
      </View>

      {reviews.length === 0 ? (
        <Text size="sm" color={colors.textMuted}>No reviews yet — be the first.</Text>
      ) : (
        <View style={{ gap: spacing.md }}>
          {reviews
            .filter((r) => r.status === "published")
            .map((review) => (
              <View key={review.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.md, gap: spacing.xs }}>
                <Rating value={review.rating} size={14} />
                {review.comment && <Text size="sm">{review.comment}</Text>}
                <Text size="xs" color={colors.textMuted}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}
