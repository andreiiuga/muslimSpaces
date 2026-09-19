import { notFound } from "next/navigation";
import { ApiError } from "@muslimspaces/shared";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken, getCurrentUser } from "../../../lib/current-user";
import { PoiDetailView } from "../../../components/PoiDetailView/PoiDetailView";

// SSR, not static — POI data (rating, review count, images) changes often
// enough that a fresh fetch per request is the simpler correct choice for
// now. See the home page's comment for why this isn't ISR yet either.
export const dynamic = "force-dynamic";

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
    <PoiDetailView
      poi={poi}
      images={images}
      hours={hours}
      categoryLabels={categoryLabels}
      reviews={reviews}
      currentUserId={currentUser?.id}
      isFavorite={isFavorite}
      isLoggedIn={Boolean(token)}
    />
  );
}
