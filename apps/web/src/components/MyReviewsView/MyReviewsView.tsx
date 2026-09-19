"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Text, colors, radii } from "@muslimspaces/ui";
import type { Poi, Review } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

export function MyReviewsView({ reviews, pois }: { reviews: Review[]; pois: Record<string, Poi> }) {
  const { locale, t } = useLocale();
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px clamp(16px,4vw,28px) 60px" }}>
      <Link href="/account" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14, color: colors.primary, textDecoration: "none" }}>
        <BackIcon size={18} /> {t("editProfile.backProfile")}
      </Link>
      <div style={{ margin: "4px 0 22px" }}>
        <Text size="3xl" weight="semibold">{t("myReviews.title")}</Text>
      </div>

      {reviews.length === 0 ? (
        <Text color={colors.textMuted}>{t("myReviews.empty")}</Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map((review) => {
            const poi = pois[review.poiId];
            return (
              <Link
                key={review.id}
                href={`/pois/${review.poiId}`}
                style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 16, display: "flex", flexDirection: "column", gap: 6, textDecoration: "none", color: colors.text }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <Text weight="semibold" numberOfLines={1}>{poi ? pickLocalized(poi.name, locale) : "…"}</Text>
                  <Text size="xs" color={colors.textMuted}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                </div>
                <div style={{ display: "flex", gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} fill={n <= review.rating ? colors.star : "none"} color={n <= review.rating ? colors.star : colors.starEmpty} />
                  ))}
                </div>
                {review.comment && <Text size="sm" color={colors.textBody}>{review.comment}</Text>}
                {review.status === "hidden" && <Text size="xs" color={colors.dangerDark}>{t("myReviews.hidden")}</Text>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
