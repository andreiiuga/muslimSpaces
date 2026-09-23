"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Navigation, Phone, Share2 } from "lucide-react";
import { Rating, Skeleton, Text, buttonVariants, colors } from "@muslimspaces/ui";
import type { Poi, PoiHour, PoiImage, Review } from "@muslimspaces/shared";
import { isOpenNow } from "@muslimspaces/shared";
import { cn } from "@/lib/utils";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";
import { FavoriteButton } from "../FavoriteButton/FavoriteButton";
import { ReviewsList } from "../ReviewSection/ReviewsList";
import { BackLink } from "../BackLink/BackLink";

const MapView = dynamic(() => import("@muslimspaces/ui/map").then((m) => m.MapView), {
  ssr: false,
  loading: () => <Skeleton height="100%" borderRadius={0} />,
});

const DAY_NAMES: Record<string, string[]> = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  ro: ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"],
  ar: ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
};

function formatHours(hours: PoiHour[], locale: string, closedLabel: string) {
  const byDay = new Map<number, PoiHour[]>();
  for (const hour of hours) {
    const list = byDay.get(hour.dayOfWeek) ?? [];
    list.push(hour);
    byDay.set(hour.dayOfWeek, list);
  }
  return Array.from({ length: 7 }, (_, i) => i + 1).map((day) => ({
    day: DAY_NAMES[locale]?.[day - 1] ?? DAY_NAMES.en?.[day - 1] ?? "",
    ranges: (byDay.get(day) ?? []).map((h) => `${h.opensAt}–${h.closesAt}`).join(", ") || closedLabel,
  }));
}

// Phone/Share buttons: outlined (border + surface bg, no shadow) — doesn't
// match either of IconButton's variants (ghost is transparent, solid has a
// shadow), so these stay directly Tailwind-styled rather than forced
// through a mismatched IconButton variant.
const outlinedIconButton = "inline-flex min-h-[48px] w-12 flex-none items-center justify-center rounded-pill border border-border bg-surface";

export function PoiDetailView({
  poi,
  images,
  hours,
  categoryLabels,
  reviews,
  currentUserId,
  isFavorite,
  isLoggedIn,
}: {
  poi: Poi;
  images: PoiImage[];
  hours: PoiHour[];
  categoryLabels: string[];
  reviews: Review[];
  currentUserId?: string;
  isFavorite: boolean;
  isLoggedIn: boolean;
}) {
  const { locale, t } = useLocale();

  // Below 900px (same breakpoint ".poi-detail-side" itself unstacks at —
  // see globals.css), the small locator map moves out of the side column
  // and renders once, full-bleed, between the description and the reviews
  // instead — a real breakpoint-driven remount (not a CSS-hidden second
  // copy) since MapView is a real WebGL map instance; mounting two would
  // mean two live tile-fetching contexts for one visible map.
  const [isSmallViewport, setIsSmallViewport] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const update = () => setIsSmallViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const heroImage = images[0];
  const open = hours.length > 0 ? isOpenNow(hours) : null;
  const name = pickLocalized(poi.name, locale);
  const altName = locale === "ro" ? poi.name.en : poi.name.ro;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${poi.location.lat},${poi.location.lng}`;

  // Directions/phone/share + contact + hours — one card, placed in two
  // possible spots (see isSmallViewport below) via a plain JSX variable, not
  // a nested function component — the latter would count as a new component
  // type on every render and force React to remount this (interactive)
  // subtree each time instead of just repositioning the same elements.
  const contactCard = (
    <div className="flex flex-col gap-lg rounded-lg bg-surface p-[18px] shadow-panel">
      <div className="flex gap-[9px]">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "primary" }), "min-h-[48px] min-w-0 flex-1 no-underline")}
        >
          <Navigation size={17} /> {t("poi.directions")}
        </a>
        {poi.phone && (
          <a href={`tel:${poi.phone.replace(/\s+/g, "")}`} aria-label={poi.phone} className={outlinedIconButton}>
            <Phone size={19} color={colors.primary} />
          </a>
        )}
        <button
          type="button"
          onClick={() => navigator.share?.({ title: name, url: window.location.href }).catch(() => {})}
          aria-label="Share"
          className={cn(outlinedIconButton, "cursor-pointer")}
        >
          <Share2 size={19} color={colors.primary} />
        </button>
      </div>

      <div className="flex flex-col gap-[5px]">
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("poi.contact").toUpperCase()}</Text>
        <Text size="sm">{poi.address}</Text>
        {poi.phone && <Text size="sm">{poi.phone}</Text>}
        {poi.website && (
          <a href={poi.website} target="_blank" rel="noreferrer" className="text-sm text-primary">
            {poi.website}
          </a>
        )}
      </div>

      {hours.length > 0 && (
        <div>
          <Text size="xs" weight="medium" color={colors.textMuted}>{t("poi.hours").toUpperCase()}</Text>
          <div className="mt-[6px]">
            {formatHours(hours, locale, t("common.closed")).map(({ day, ranges }) => (
              <div key={day} className="flex justify-between gap-lg border-b border-divider py-[6px]">
                <Text size="sm">{day}</Text>
                <Text size="sm" color={colors.textMuted}>{ranges}</Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1340px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[22px]">
      <BackLink href="/">{t("common.backToMap")}</BackLink>

      <div className="relative mt-[6px] h-[clamp(180px,32vw,340px)] overflow-hidden rounded-xl bg-primaryLight">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP from our own media pipeline
          <img src={heroImage.url} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute bottom-[16px] start-[20px] text-[11px] uppercase tracking-[0.13em] text-textMuted">
            {t("poi.photoCaption")}
          </div>
        )}
        <div className="absolute end-[16px] top-[16px]">
          <FavoriteButton poiId={poi.id} initialIsFavorite={isFavorite} isLoggedIn={isLoggedIn} />
        </div>
      </div>

      <div className="mt-[26px] flex flex-wrap items-start gap-[clamp(20px,3vw,34px)]">
        <div className="flex min-w-[300px] flex-[1_1_480px] flex-col gap-xl">
          <div className="flex flex-col gap-[6px]">
            {categoryLabels.length > 0 && (
              <Text size="xs" weight="medium" color={colors.primaryDark}>
                {categoryLabels.join(" · ").toUpperCase()}
              </Text>
            )}
            <Text size="3xl" weight="semibold">{name}</Text>
            <Text size="md" color={colors.textMuted}>{altName}</Text>
            <div className="mt-1 flex flex-wrap items-baseline gap-md text-sm">
              <Rating value={poi.ratingAvg ?? 0} />
              <Text size="sm" color={colors.textMuted}>
                {poi.ratingCount > 0 ? `${(poi.ratingAvg ?? 0).toFixed(1)} (${poi.ratingCount})` : t("poi.noReviewsYet")}
              </Text>
              {open !== null && (
                <Text size="sm" color={open ? colors.success : colors.textMuted}>
                  {open ? t("explore.openNow") : t("common.closed")}
                </Text>
              )}
            </div>
          </div>

          {poi.description && (
            <Text color={colors.textBody} size="md">{pickLocalized(poi.description, locale)}</Text>
          )}

          {isSmallViewport && (
            <>
              {/* Full-bleed: cancels the page wrapper's own horizontal
                  padding (the same clamp() it's set with below) so the map
                  spans edge to edge instead of sitting in a padded, boxed
                  card like the desktop sidebar version does. */}
              <div className="relative h-[220px] ms-[calc(-1_*_clamp(16px,4vw,28px))] me-[calc(-1_*_clamp(16px,4vw,28px))]">
                <MapView pois={[poi]} initialCenter={poi.location} initialZoom={14} />
              </div>
              {contactCard}
            </>
          )}

          <ReviewsList poiId={poi.id} poiName={name} initialReviews={reviews} currentUserId={currentUserId} isLoggedIn={isLoggedIn} />
        </div>

        {!isSmallViewport && (
          <div className="static flex min-w-[min(280px,100%)] flex-[0_1_340px] flex-col gap-lg header:sticky header:top-[98px]">
            {contactCard}
            <div className="relative h-[180px] overflow-hidden rounded-lg border border-border">
              <MapView pois={[poi]} initialCenter={poi.location} initialZoom={14} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
