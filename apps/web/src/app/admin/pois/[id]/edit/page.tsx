import { notFound } from "next/navigation";
import { ApiError } from "@muslimspaces/shared";
import { Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../../../lib/api-client";
import { getCurrentToken } from "../../../../../lib/current-user";
import { PoiForm } from "../../../../../components/admin/PoiForm/PoiForm";

export default async function EditPoiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getCurrentToken();
  const api = getApiClient(token);

  let poi;
  try {
    poi = await api.pois.getForAdmin(id);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) notFound();
    throw error;
  }

  const [categories, images] = await Promise.all([
    api.categories.list(),
    api.pois.images.list(id),
  ]);

  return (
    <div>
      <Text size="xl" weight="bold">Edit POI</Text>
      <div className="mt-xl">
        <PoiForm categories={categories} initialPoi={poi} images={images} />
      </div>
    </div>
  );
}
