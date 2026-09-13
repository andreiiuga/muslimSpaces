import { getApiClient } from "../lib/api-client";
import { getCurrentToken } from "../lib/current-user";
import { ExploreView } from "../components/ExploreView/ExploreView";

// SSR for now, not ISR: ISR's initial prerender happens at `next build` time,
// which would require the backend to be reachable during the web service's
// build — a build-time coupling we don't want between separate Railway
// services. Revisit once the deploy topology (build order / backend URL
// availability) is settled. If/when this switches to ISR, note the "Known
// scaling caveat" in the root CLAUDE.md: the cache is per-instance disk.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const token = await getCurrentToken();
  const api = getApiClient(token);

  const [pois, categories, favorites] = await Promise.all([
    api.pois.list({ limit: 40 }),
    api.categories.list(),
    token ? api.favorites.mine().catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <ExploreView
      initialPois={pois}
      categories={categories}
      initialFavoriteIds={favorites.map((poi) => poi.id)}
      isLoggedIn={Boolean(token)}
    />
  );
}
