"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Navigation, Phone, Share2 } from "lucide-react";
import { Rating, Skeleton, Text, colors, radii, spacing } from "@muslimspaces/ui";
import type { Poi, PoiHour, PoiImage, Review } from "@muslimspaces/shared";
import { isOpenNow } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";
import { FavoriteButton } from "../FavoriteButton/FavoriteButton";
import { ReviewsList } from "../ReviewSection/ReviewsList";

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
  const heroImage = images[0];
  const open = hours.length > 0 ? isOpenNow(hours) : null;
  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;
  const name = pickLocalized(poi.name, locale);
  const altName = locale === "ro" ? poi.name.en : poi.name.ro;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${poi.location.lat},${poi.location.lng}`;

  return (
    <div style={{ maxWidth: 1340, margin: "0 auto", padding: "22px clamp(16px,4vw,28px) 60px" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14, color: colors.primary, textDecoration: "none" }}>
        <BackIcon size={18} /> {t("common.backToMap")}
      </Link>

      <div style={{ position: "relative", height: "clamp(180px,32vw,340px)", borderRadius: radii.xl, overflow: "hidden", background: colors.primaryLight, marginTop: 6 }}>
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP from our own media pipeline
          <img src={heroImage.url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", insetInlineStart: 20, bottom: 16, fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: colors.textMuted }}>
            {t("poi.photoCaption")}
          </div>
        )}
        <div style={{ position: "absolute", insetInlineEnd: 16, top: 16 }}>
          <FavoriteButton poiId={poi.id} initialIsFavorite={isFavorite} isLoggedIn={isLoggedIn} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "clamp(20px,3vw,34px)", alignItems: "flex-start", flexWrap: "wrap", marginTop: 26 }}>
        <div style={{ flex: "1 1 480px", minWidth: 300, display: "flex", flexDirection: "column", gap: spacing.xl }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {categoryLabels.length > 0 && (
              <Text size="xs" weight="medium" color={colors.primaryDark} letterSpacing={1.4}>
                {categoryLabels.join(" · ").toUpperCase()}
              </Text>
            )}
            <Text size="3xl" weight="semibold">{name}</Text>
            <Text size="md" color={colors.textMuted}>{altName}</Text>
            <div style={{ display: "flex", gap: 12, alignItems: "baseline", fontSize: 15, marginTop: 4, flexWrap: "wrap" }}>
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

          <ReviewsList poiId={poi.id} poiName={name} initialReviews={reviews} currentUserId={currentUserId} isLoggedIn={isLoggedIn} />
        </div>

        <div className="poi-detail-side" style={{ flex: "0 1 340px", minWidth: "min(280px,100%)", display: "flex", flexDirection: "column", gap: spacing.lg }}>
          <div style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 18, display: "flex", flexDirection: "column", gap: spacing.lg }}>
            <div style={{ display: "flex", gap: 9 }}>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ flex: "1 1 0", minWidth: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48, padding: "0 14px", background: colors.primary, color: colors.textOnPrimary, borderRadius: radii.pill, fontSize: 14.5, fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 14px rgba(15,118,110,.28)" }}
              >
                <Navigation size={17} /> {t("poi.directions")}
              </a>
              {poi.phone && (
                <a href={`tel:${poi.phone.replace(/\s+/g, "")}`} aria-label={poi.phone} style={{ width: 48, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 48, border: `1px solid ${colors.border}`, background: colors.surface, borderRadius: radii.pill }}>
                  <Phone size={19} color={colors.primary} />
                </a>
              )}
              <button
                type="button"
                onClick={() => navigator.share?.({ title: name, url: window.location.href }).catch(() => {})}
                aria-label="Share"
                style={{ width: 48, flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 48, border: `1px solid ${colors.border}`, background: colors.surface, borderRadius: radii.pill, cursor: "pointer" }}
              >
                <Share2 size={19} color={colors.primary} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("poi.contact").toUpperCase()}</Text>
              <Text size="sm">{poi.address}</Text>
              {poi.phone && <Text size="sm">{poi.phone}</Text>}
              {poi.website && (
                <a href={poi.website} target="_blank" rel="noreferrer" style={{ fontSize: 14.5, color: colors.primary }}>
                  {poi.website}
                </a>
              )}
            </div>

            {hours.length > 0 && (
              <div>
                <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("poi.hours").toUpperCase()}</Text>
                <div style={{ marginTop: 6 }}>
                  {formatHours(hours, locale, t("common.closed")).map(({ day, ranges }) => (
                    <div key={day} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "6px 0", borderBottom: `1px solid ${colors.divider}`, fontSize: 14 }}>
                      <Text size="sm">{day}</Text>
                      <Text size="sm" color={colors.textMuted}>{ranges}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: "relative", height: 180, borderRadius: radii.lg, overflow: "hidden", border: `1px solid ${colors.border}` }}>
            <MapView pois={[poi]} initialCenter={poi.location} initialZoom={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
