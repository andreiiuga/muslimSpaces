"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Text, colors } from "@muslimspaces/ui";
import type { Poi, Review } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";
import { BackLink } from "../BackLink/BackLink";

export function MyReviewsView({ reviews, pois }: { reviews: Review[]; pois: Record<string, Poi> }) {
  const { locale, t } = useLocale();

  return (
    <div className="mx-auto max-w-[760px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[26px]">
      <BackLink href="/account">{t("editProfile.backProfile")}</BackLink>
      <div className="mb-[22px] mt-1">
        <Text size="3xl" weight="semibold">{t("myReviews.title")}</Text>
      </div>

      {reviews.length === 0 ? (
        <Text color={colors.textMuted}>{t("myReviews.empty")}</Text>
      ) : (
        <div className="flex flex-col gap-md">
          {reviews.map((review) => {
            const poi = pois[review.poiId];
            return (
              <Link
                key={review.id}
                href={`/pois/${review.poiId}`}
                className="flex flex-col gap-[6px] rounded-lg bg-surface p-lg text-text no-underline shadow-panel"
              >
                <div className="flex items-baseline justify-between gap-md">
                  <Text weight="semibold" numberOfLines={1}>{poi ? pickLocalized(poi.name, locale) : "…"}</Text>
                  <Text size="xs" color={colors.textMuted}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                </div>
                <div className="flex gap-px">
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
