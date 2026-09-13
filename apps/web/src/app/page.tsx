import Link from "next/link";
import { Card, Rating, Text } from "@muslimspaces/ui";
import { getApiClient } from "../lib/api-client";

// SSR for now, not ISR: ISR's initial prerender happens at `next build` time,
// which would require the backend to be reachable during the web service's
// build — a build-time coupling we don't want between separate Railway
// services. Revisit once the deploy topology (build order / backend URL
// availability) is settled. If/when this switches to ISR, note the "Known
// scaling caveat" in the root CLAUDE.md: the cache is per-instance disk.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const api = getApiClient();
  const pois = await api.pois.list({ limit: 20 });

  return (
    <main>
      <h1>MuslimSpaces</h1>
      <p>Mosques, halal restaurants, and Islamic services in Romania.</p>
      <nav>
        <Link href="/login">Log in</Link>
      </nav>
      {pois.length === 0 ? (
        <p>No approved POIs yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
          {pois.map((poi) => (
            <li key={poi.id}>
              {/* @muslimspaces/ui smoke test — this whole page is redesigned in Phase 1 */}
              <Card>
                <Text weight="semibold">
                  {poi.name.en} ({poi.name.ro})
                </Text>
                <Text size="sm" color="#78716C">{poi.address}</Text>
                <Rating value={poi.ratingAvg ?? 0} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
