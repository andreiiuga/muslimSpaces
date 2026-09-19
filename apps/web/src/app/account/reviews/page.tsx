import { redirect } from "next/navigation";
import type { Poi } from "@muslimspaces/shared";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";
import { MyReviewsView } from "../../../components/MyReviewsView/MyReviewsView";

export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const token = await getCurrentToken();
  if (!token) redirect("/login");

  const api = getApiClient(token);
  const reviews = await api.reviews.mine();
  const uniquePoiIds = Array.from(new Set(reviews.map((r) => r.poiId)));
  const fetched = await Promise.all(uniquePoiIds.map((id) => api.pois.get(id).catch(() => null)));
  const pois: Record<string, Poi> = {};
  fetched.forEach((poi) => {
    if (poi) pois[poi.id] = poi;
  });

  return <MyReviewsView reviews={reviews} pois={pois} />;
}
