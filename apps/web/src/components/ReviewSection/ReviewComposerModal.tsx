"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button, Text, Textarea, colors } from "@muslimspaces/ui";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(28,25,23,0.42)] p-[clamp(10px,3vw,28px)]"
      onClick={onClose}
    >
      <div
        // Previously referenced a "ms-scroll" class that was never defined
        // anywhere in this codebase (a pre-existing dead reference) — this is
        // what it was actually meant to be, verified against the original
        // Claude Design canvas: `.ms-scroll{scrollbar-width:none}` +
        // `.ms-scroll::-webkit-scrollbar{width:0;height:0}` (hides the
        // scrollbar entirely, doesn't just thin it).
        className="flex max-h-[88vh] w-full max-w-[540px] flex-col gap-lg overflow-y-auto rounded-xl bg-surface p-[26px] shadow-[0_24px_64px_rgba(28,25,23,0.3)] [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-md">
          <div>
            <Text size="xs" weight="medium" color={colors.textMuted}>
              {t("review.reviewing").toUpperCase()}
            </Text>
            <div className="mt-1">
              <Text size="xl" weight="semibold">{poiName}</Text>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.cancel")}
            className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center border-0 bg-transparent"
          >
            <X size={20} color={colors.text} />
          </button>
        </div>

        <div>
          <Text size="xs" weight="medium" color={colors.textMuted}>
            {t("review.yourRating").toUpperCase()}
          </Text>
          <div className="mt-[6px] flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n}`}
                className="flex h-12 w-12 flex-none cursor-pointer items-center justify-center border-0 bg-transparent"
              >
                <Star size={31} fill={n <= rating ? colors.star : "none"} color={n <= rating ? colors.star : colors.starEmpty} />
              </button>
            ))}
          </div>
          <Text size="sm" color={colors.textMuted}>{t(`review.${RATING_WORD_KEYS[rating]}`)}</Text>
        </div>

        <div>
          <Text size="xs" weight="medium" color={colors.textMuted}>
            {t("review.yourWords").toUpperCase()}
          </Text>
          <div className="mt-[6px]">
            <Textarea value={comment} onChangeText={setComment} placeholder={t("review.placeholder")} rows={5} />
          </div>
          <Text size="xs" color={colors.textMuted}>{t("review.note")}</Text>
        </div>

        {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}

        <div className="flex flex-wrap justify-end gap-[10px]">
          <Button variant="ghost" onPress={onClose}>{t("common.cancel")}</Button>
          <Button onPress={handleSubmit} loading={submitting}>
            {myReview ? t("review.update") : t("review.post")}
          </Button>
        </div>
      </div>
    </div>
  );
}
