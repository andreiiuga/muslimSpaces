import Link from "next/link";
import { colors, Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";
import { PoiAdminTable } from "../../../components/admin/PoiAdminTable/PoiAdminTable";
import { NewPoiButton } from "./NewPoiButton";

const PAGE_SIZE = 50;

export default async function AdminPoisPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const token = await getCurrentToken();
  const api = getApiClient(token);

  // listAllForAdmin (not the public list()) so hidden/rejected POIs stay
  // findable here — list() filters both out on purpose for the public feed.
  // Fetch one extra row to know whether a next page exists without a
  // separate count endpoint (none of the /pois list variants return one —
  // see packages/shared/src/client.ts).
  const [pending, restPage, categories] = await Promise.all([
    api.pois.pending(),
    api.pois.listAllForAdmin({ limit: PAGE_SIZE + 1, offset }),
    api.categories.list(),
  ]);

  const hasNextPage = restPage.length > PAGE_SIZE;
  const rest = restPage.slice(0, PAGE_SIZE);

  // Pending shown in full on every page — it's a moderation queue that
  // needs to stay fully actionable, not something to page through.
  const pois = [...pending, ...rest];

  return (
    <div>
      <div className="flex items-center justify-between">
        <Text size="xl" weight="bold">POIs</Text>
        <NewPoiButton />
      </div>
      <div className="mt-lg overflow-x-auto">
        {pois.length === 0 ? (
          <Text>No POIs yet.</Text>
        ) : (
          <PoiAdminTable pois={pois} categories={categories} />
        )}
      </div>
      {(page > 1 || hasNextPage) && (
        <div className="mt-lg flex items-center gap-md">
          {page > 1 ? (
            <Link href={`/admin/pois?page=${page - 1}`} className="text-sm text-primary">
              ← Previous
            </Link>
          ) : (
            <Text size="sm" color={colors.textFaint}>← Previous</Text>
          )}
          <Text size="sm" color={colors.textMuted}>Page {page}</Text>
          {hasNextPage ? (
            <Link href={`/admin/pois?page=${page + 1}`} className="text-sm text-primary">
              Next →
            </Link>
          ) : (
            <Text size="sm" color={colors.textFaint}>Next →</Text>
          )}
        </div>
      )}
    </div>
  );
}
