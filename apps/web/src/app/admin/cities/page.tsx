import { colors, Text } from "@muslimspaces/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <div className="flex items-center justify-between">
        <Text size="xl" weight="bold">Cities</Text>
        <NewCityButton />
      </div>
      <div className="mt-lg overflow-x-auto">
        {cities.length === 0 ? (
          <Text>No cities yet.</Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {["Name (EN)", "Name (RO)", "Slug"].map((h) => (
                  <TableHead key={h} className="text-xs">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell>
                    <Text size="sm" weight="medium">{city.name.en}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size="sm">{city.name.ro}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size="sm" color={colors.textMuted}>{city.slug}</Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
