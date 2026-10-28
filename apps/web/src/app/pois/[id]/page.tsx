import { notFound } from "next/navigation";
import { ApiError } from "@muslimspaces/shared";
import { getApiClient } from "../../../lib/api-client";
import { PoiDetailView } from "../../../components/PoiDetailView/PoiDetailView";

// ISR: rendered on first request, then served from the Next cache and
// regenerated in the background at most once an hour. Mutations made
// through this app's own Route Handlers call revalidatePath() for instant
// updates (see lib/revalidate.ts); writes from mobile only show up after
// this window.
//
// SINGLE-INSTANCE ASSUMPTION: the ISR cache is on one Railway instance's
// local disk. Fine today; with multiple web replicas each would cache and
// revalidate independently — needs a shared cache handler before scaling out.
export const revalidate = 3600;

// No pages prebuilt (the build shouldn't depend on the backend being up);
// every /pois/<id> is generated on first hit and cached from then on.
export function generateStaticParams() {
  return [];
}

// This page must stay free of cookies()/headers() — either one silently
// turns it back into per-request SSR. Viewer-specific state (favorite,
// "my review") is resolved client-side via SessionProvider.
export default async function PoiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const api = getApiClient();

  let poi;
  try {
    poi = await api.pois.get(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [images, hours, categories, reviews] = await Promise.all([
    api.pois.images.list(id),
    api.pois.hours.list(id),
    api.categories.list(),
    api.pois.reviews.list(id),
  ]);

  const categoryLabels = poi.categoryIds
    .map((categoryId) => categories.find((c) => c.id === categoryId)?.name.en)
    .filter((label): label is string => Boolean(label));

  return (
    <PoiDetailView
      poi={poi}
      images={images}
      hours={hours}
      categoryLabels={categoryLabels}
      reviews={reviews}
    />
  );
}
