import { HeaderBar } from "../HeaderBar/HeaderBar";

// Deliberately NOT reading the auth cookie here: this renders in the root
// layout, and any cookies() read in a layout makes every route under it
// dynamic, which would defeat ISR on the public pages (POI detail, blog).
// HeaderBar gets the signed-in user from SessionProvider (client-side
// fetch of /api/session) instead.
export function Navbar() {
  return <HeaderBar />;
}
