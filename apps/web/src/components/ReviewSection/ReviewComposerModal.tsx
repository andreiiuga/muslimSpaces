"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button, Text, Textarea, colors, radii, spacing } from "@muslimspaces/ui";
import type { Review } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";

const RATING_WORD_KEYS = ["tapAStar", "poor", "fair", "good", "veryGood", "excellent"];

export function ReviewComposerModal({
  poiId,
  poiName,
  myReview,
  onClose,
  onPosted,
}: {
  poiId: string;
  poiName: string;
  myReview?: Review;
  onClose: () => void;
  onPosted: (review: Review) => void;
}) {
  const { t } = useLocale();
  const [rating, setRating] = useState(myReview?.rating ?? 0);
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating === 0) {
      setError(t("review.pickStarFirst"));
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
      setError(body?.message ?? t("review.submitError"));
      return;
    }

    onPosted(await res.json());
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(28,25,23,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(10px,3vw,28px)",
      }}
      onClick={onClose}
    >
      <div
        className="ms-scroll"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 540,
          background: colors.surface,
          borderRadius: radii.xl,
          boxShadow: "0 24px 64px rgba(28,25,23,.3)",
          padding: 26,
          display: "flex",
          flexDirection: "column",
          gap: spacing.lg,
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md }}>
          <div>
            <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>
              {t("review.reviewing").toUpperCase()}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text size="xl" weight="semibold">{poiName}</Text>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.cancel")}
            style={{ width: 44, height: 44, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer" }}
          >
            <X size={20} color={colors.text} />
          </button>
        </div>

        <div>
          <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>
            {t("review.yourRating").toUpperCase()}
          </Text>
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n}`}
                style={{ width: 48, height: 48, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer" }}
              >
                <Star size={31} fill={n <= rating ? colors.star : "none"} color={n <= rating ? colors.star : colors.starEmpty} />
              </button>
            ))}
          </div>
          <Text size="sm" color={colors.textMuted}>{t(`review.${RATING_WORD_KEYS[rating]}`)}</Text>
        </div>

        <div>
          <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>
            {t("review.yourWords").toUpperCase()}
          </Text>
          <div style={{ marginTop: 6 }}>
            <Textarea value={comment} onChangeText={setComment} placeholder={t("review.placeholder")} rows={5} />
          </div>
          <Text size="xs" color={colors.textMuted}>{t("review.note")}</Text>
        </div>

        {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button variant="ghost" onPress={onClose}>{t("common.cancel")}</Button>
          <Button onPress={handleSubmit} loading={submitting}>
            {myReview ? t("review.update") : t("review.post")}
          </Button>
        </div>
      </div>
    </div>
  );
}
