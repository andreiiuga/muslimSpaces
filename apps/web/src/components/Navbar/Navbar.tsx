import { Suspense } from "react";
import { getCurrentUser } from "../../lib/current-user";
import { HeaderBar } from "../HeaderBar/HeaderBar";

// Stays a Server Component so it can read the auth cookie via
// getCurrentUser() directly — the actual interactive shell (search,
// locale pill, active nav state) is HeaderBar, a client component.
// Suspense wraps it because HeaderBar reads useSearchParams(), which
// Next.js requires a boundary for.
export async function Navbar() {
  const user = await getCurrentUser();
  return (
    <Suspense fallback={null}>
      <HeaderBar user={user} />
    </Suspense>
  );
}
