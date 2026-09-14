import { Button, spacing, Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";
import { PoiAdminTable } from "../../../components/admin/PoiAdminTable/PoiAdminTable";
import { NewPoiButton } from "./NewPoiButton";

export default async function AdminPoisPage() {
  const token = await getCurrentToken();
  const api = getApiClient(token);

  const [pending, approved, categories] = await Promise.all([
    api.pois.pending(),
    api.pois.list({ limit: 100 }),
    api.categories.list(),
  ]);

  // Pending first — that's the queue that actually needs action.
  const pois = [...pending, ...approved];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text size="xl" weight="bold">POIs</Text>
        <NewPoiButton />
      </div>
      <div style={{ marginTop: spacing.lg, overflowX: "auto" }}>
        {pois.length === 0 ? (
          <Text>No POIs yet.</Text>
        ) : (
          <PoiAdminTable pois={pois} categories={categories} />
        )}
      </div>
    </div>
  );
}
