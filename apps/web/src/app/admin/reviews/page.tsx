import { Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";
import { ReviewAdminTable } from "../../../components/admin/ReviewAdminTable/ReviewAdminTable";

export default async function AdminReviewsPage() {
  const token = await getCurrentToken();
  const api = getApiClient(token);

  const reviews = await api.reviews.list({ limit: 100 });

  const uniquePoiIds = [...new Set(reviews.map((r) => r.poiId))];
  const poiNames: Record<string, string> = {};
  await Promise.all(
    uniquePoiIds.map(async (poiId) => {
      try {
        const poi = await api.pois.getForAdmin(poiId);
        poiNames[poiId] = poi.name.ro;
      } catch {
        // POI was deleted after the review was left — table falls back to "[deleted POI]".
      }
    }),
  );

  return (
    <div>
      <Text size="xl" weight="bold">Reviews</Text>
      <div className="mt-lg overflow-x-auto">
        {reviews.length === 0 ? (
          <Text>No reviews yet.</Text>
        ) : (
          <ReviewAdminTable reviews={reviews} poiNames={poiNames} />
        )}
      </div>
    </div>
  );
}
