import { notFound } from "next/navigation";
import { ApiError } from "@muslimspaces/shared";
import type { PoiHour } from "@muslimspaces/shared";
import { colors, Rating, spacing, Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken, getCurrentUser } from "../../../lib/current-user";
import { FavoriteButton } from "../../../components/FavoriteButton/FavoriteButton";
import { ReviewSection } from "../../../components/ReviewSection/ReviewSection";

// SSR, not static — POI data (rating, review count, images) changes often
// enough that a fresh fetch per request is the simpler correct choice for
// now. See the home page's comment for why this isn't ISR yet either.
export const dynamic = "force-dynamic";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatHours(hours: PoiHour[]) {
  const byDay = new Map<number, PoiHour[]>();
  for (const hour of hours) {
    const list = byDay.get(hour.dayOfWeek) ?? [];
    list.push(hour);
    byDay.set(hour.dayOfWeek, list);
  }
  return Array.from({ length: 7 }, (_, i) => i + 1).map((day) => ({
    day: DAY_NAMES[day],
    ranges: (byDay.get(day) ?? []).map((h) => `${h.opensAt}–${h.closesAt}`).join(", ") || "Closed",
  }));
}

export default async function PoiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  const api = getApiClient(token);

  let poi;
  try {
    poi = await api.pois.get(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [images, hours, categories, reviews, currentUser, favorites] = await Promise.all([
    api.pois.images.list(id),
    api.pois.hours.list(id),
    api.categories.list(),
    api.pois.reviews.list(id),
    token ? getCurrentUser() : Promise.resolve(null),
    token ? api.favorites.mine().catch(() => []) : Promise.resolve([]),
  ]);

  const categoryLabels = poi.categoryIds
    .map((categoryId) => categories.find((c) => c.id === categoryId)?.name.en)
    .filter((label): label is string => Boolean(label));
  const isFavorite = favorites.some((f) => f.id === id);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: spacing.xl }}>
      {images.length > 0 && (
        <div
          className="poi-gallery"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(images.length, 3)}, 1fr)`,
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          {images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- already
            // pre-optimized WebP from our own media pipeline, no need for
            // next/image's extra remote-pattern config for this.
            <img
              key={image.id}
              src={image.url}
              alt={poi.name.en}
              style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 16 }}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md }}>
        <div>
          <Text size="2xl" weight="bold">{poi.name.ro}</Text>
          <Text size="md" color={colors.textMuted}>{poi.name.en}</Text>
        </div>
        <FavoriteButton poiId={poi.id} initialIsFavorite={isFavorite} isLoggedIn={Boolean(token)} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm }}>
        <Rating value={poi.ratingAvg ?? 0} />
        <Text size="sm" color={colors.textMuted}>
          {poi.ratingCount > 0 ? `${(poi.ratingAvg ?? 0).toFixed(1)} (${poi.ratingCount})` : "No reviews yet"}
        </Text>
      </div>

      {categoryLabels.length > 0 && (
        <Text size="sm" color={colors.primary} weight="medium">
          {categoryLabels.join(" · ")}
        </Text>
      )}

      {poi.description && (
        <div style={{ marginTop: spacing.lg }}>
          <Text>{poi.description.ro}</Text>
        </div>
      )}

      <div style={{ marginTop: spacing.lg, display: "flex", flexDirection: "column", gap: spacing.xs }}>
        <Text size="sm">{poi.address}</Text>
        {poi.phone && <Text size="sm">{poi.phone}</Text>}
        {poi.website && (
          <a href={poi.website} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: colors.primary }}>
            {poi.website}
          </a>
        )}
      </div>

      {hours.length > 0 && (
        <div style={{ marginTop: spacing.lg }}>
          <Text weight="semibold">Hours</Text>
          {formatHours(hours).map(({ day, ranges }) => (
            <div key={day} style={{ display: "flex", justifyContent: "space-between", maxWidth: 320 }}>
              <Text size="sm" color={colors.textMuted}>{day}</Text>
              <Text size="sm">{ranges}</Text>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: spacing["2xl"] }}>
        <ReviewSection
          poiId={poi.id}
          initialReviews={reviews}
          currentUserId={currentUser?.id}
          isLoggedIn={Boolean(token)}
        />
      </div>
    </main>
  );
}
