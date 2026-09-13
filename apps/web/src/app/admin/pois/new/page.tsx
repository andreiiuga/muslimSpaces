import { Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../../lib/api-client";
import { PoiForm } from "../../../../components/admin/PoiForm/PoiForm";

export default async function NewPoiPage() {
  const categories = await getApiClient().categories.list();

  return (
    <div>
      <Text size="xl" weight="bold">New POI</Text>
      <div style={{ marginTop: 24 }}>
        <PoiForm categories={categories} />
      </div>
    </div>
  );
}
