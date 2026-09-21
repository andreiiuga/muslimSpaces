import { getCurrentUser } from "../../lib/current-user";
import { HeaderBar } from "../HeaderBar/HeaderBar";

// Stays a Server Component so it can read the auth cookie via
// getCurrentUser() directly — the actual interactive shell (search,
// locale menu, active nav state) is HeaderBar, a client component. No
// Suspense wrapper needed: HeaderBar used to read useSearchParams(), which
// requires one, but doesn't anymore (see the comment in HeaderBar.tsx) —
// that boundary was the direct cause of a real, reproducible hydration
// mismatch whenever a non-default locale was already stored.
export async function Navbar() {
  const user = await getCurrentUser();
  return <HeaderBar user={user} />;
}
