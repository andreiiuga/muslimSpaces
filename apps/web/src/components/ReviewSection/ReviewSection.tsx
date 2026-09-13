"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Rating, Text, Textarea, colors, spacing } from "@muslimspaces/ui";
import type { Review } from "@muslimspaces/shared";

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

    const res = await fetch(`/api/reviews/${poiId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || undefined }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? "Couldn't submit your review.");
      return;
    }

    const updated: Review = await res.json();
    setReviews((prev) => {
      const withoutMine = prev.filter((r) => r.id !== updated.id);
      return [updated, ...withoutMine];
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      <Text size="lg" weight="semibold">Reviews</Text>

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
        <Rating value={rating} onChange={setRating} size={24} />
        <Textarea
          value={comment}
          onChangeText={setComment}
          placeholder="Share what you thought (optional)"
          rows={3}
        />
        {error && <Text size="sm" color={colors.danger}>{error}</Text>}
        <div>
          <Button onPress={handleSubmit} disabled={submitting} size="sm">
            {myReview ? "Update review" : "Post review"}
          </Button>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Text size="sm" color={colors.textMuted}>No reviews yet — be the first.</Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          {reviews
            .filter((r) => r.status === "published")
            .map((review) => (
              <div key={review.id} style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: spacing.md }}>
                <Rating value={review.rating} size={14} />
                {review.comment && <Text size="sm">{review.comment}</Text>}
                <Text size="xs" color={colors.textMuted}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </Text>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
