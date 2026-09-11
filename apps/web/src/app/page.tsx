import Link from "next/link";
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
        <ul>
          {pois.map((poi) => (
            <li key={poi.id}>
              <strong>{poi.name.en}</strong> ({poi.name.ro}) — {poi.address}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
