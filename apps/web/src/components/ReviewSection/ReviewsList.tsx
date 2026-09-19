"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star } from "lucide-react";
import { Text, colors, radii } from "@muslimspaces/ui";
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
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <Text size="2xl" weight="semibold">{t("poi.reviews")}</Text>
        <button
          type="button"
          onClick={openComposer}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            minHeight: 42, padding: "0 20px", border: `1px solid ${colors.border}`, background: colors.surface,
            borderRadius: radii.pill, fontSize: 14, fontWeight: 600, cursor: "pointer", color: colors.text,
          }}
        >
          <Pencil size={16} color={colors.primary} />
          {t("poi.writeReview")}
        </button>
      </div>

      {published.length === 0 ? (
        <Text size="sm" color={colors.textMuted}>{t("poi.noReviewsYet")}</Text>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {published.map((review) => (
            <div key={review.id} style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <Text size="sm" color={colors.textMuted}>{new Date(review.createdAt).toLocaleDateString()}</Text>
              </div>
              <div style={{ display: "flex", gap: 1 }}>
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
