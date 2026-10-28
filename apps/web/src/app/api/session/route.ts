import { NextResponse } from "next/server";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken } from "../../../lib/current-user";

// Per-viewer state (who am I, which POIs have I favorited) for pages that
// are ISR-cached and therefore can't read the auth cookie themselves —
// SessionProvider fetches this once after hydration. `no-store` because the
// answer differs per cookie and must never be shared by a CDN/proxy.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  const token = await getCurrentToken();
  if (!token) return NextResponse.json({ user: null, favoriteIds: [] }, { headers });

  const api = getApiClient(token);
  try {
    const [user, favorites] = await Promise.all([
      api.auth.me(),
      api.favorites.mine().catch(() => []),
    ]);
    return NextResponse.json({ user, favoriteIds: favorites.map((f) => f.id) }, { headers });
  } catch {
    // Expired/invalid token — same "treat as logged out" rule as getCurrentUser().
    return NextResponse.json({ user: null, favoriteIds: [] }, { headers });
  }
}
