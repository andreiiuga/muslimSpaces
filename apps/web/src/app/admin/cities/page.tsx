import { colors, spacing, Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken, requireAdmin } from "../../../lib/current-user";
import { NewCityButton } from "./NewCityButton";

// Read-only list — no edit/delete actions since the backend has no
// PATCH/DELETE /cities/:id yet (see apps/backend/src/cities/cities.controller.ts).
export default async function AdminCitiesPage() {
  await requireAdmin();
  const token = await getCurrentToken();
  const cities = await getApiClient(token).cities.list();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text size="xl" weight="bold">Cities</Text>
        <NewCityButton />
      </div>
      <div style={{ marginTop: spacing.lg, overflowX: "auto" }}>
        {cities.length === 0 ? (
          <Text>No cities yet.</Text>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
                {["Name (EN)", "Name (RO)", "Slug"].map((h) => (
                  <th key={h} style={{ padding: spacing.sm, fontSize: 12, color: colors.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: spacing.sm }}><Text size="sm" weight="medium">{city.name.en}</Text></td>
                  <td style={{ padding: spacing.sm }}><Text size="sm">{city.name.ro}</Text></td>
                  <td style={{ padding: spacing.sm }}><Text size="sm" color={colors.textMuted}>{city.slug}</Text></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
