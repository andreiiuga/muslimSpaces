"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star } from "lucide-react";
import { Button, Text, colors } from "@muslimspaces/ui";
import type { Review } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { ReviewComposerModal } from "./ReviewComposerModal";

export function ReviewsList({
  poiId,
  poiName,
  initialReviews,
  currentUserId,
  isLoggedIn,
}: {
  poiId: string;
  poiName: string;
  initialReviews: Review[];
  currentUserId?: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [reviews, setReviews] = useState(initialReviews);
  const [composerOpen, setComposerOpen] = useState(false);
  const myReview = currentUserId ? reviews.find((r) => r.userId === currentUserId) : undefined;
  const published = reviews.filter((r) => r.status === "published");

  function openComposer() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setComposerOpen(true);
  }

  return (
    <div>
      <div className="mb-[14px] flex flex-wrap items-baseline justify-between gap-lg">
        <Text size="2xl" weight="semibold">{t("poi.reviews")}</Text>
        <Button variant="ghost" size="sm" onPress={openComposer}>
          <Pencil size={16} color={colors.primary} />
          {t("poi.writeReview")}
        </Button>
      </div>

      {published.length === 0 ? (
        <Text size="sm" color={colors.textMuted}>{t("poi.noReviewsYet")}</Text>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[14px]">
          {published.map((review) => (
            <div key={review.id} className="flex flex-col gap-[6px] rounded-lg bg-surface p-lg shadow-panel">
              <div className="flex items-baseline justify-between gap-md">
                <Text size="sm" color={colors.textMuted}>{new Date(review.createdAt).toLocaleDateString()}</Text>
              </div>
              <div className="flex gap-px">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} fill={n <= review.rating ? colors.star : "none"} color={n <= review.rating ? colors.star : colors.starEmpty} />
                ))}
              </div>
              {review.comment && <Text size="sm" color={colors.textBody}>{review.comment}</Text>}
            </div>
          ))}
        </div>
      )}

      {composerOpen && (
        <ReviewComposerModal
          poiId={poiId}
          poiName={poiName}
          myReview={myReview}
          onClose={() => setComposerOpen(false)}
          onPosted={(updated) => {
            setReviews((prev) => [updated, ...prev.filter((r) => r.id !== updated.id)]);
            setComposerOpen(false);
          }}
        />
      )}
    </div>
  );
}
