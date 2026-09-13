import { createApiClient } from "@muslimspaces/shared";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";
// Public reads only (categories, POI list/bbox, blog) — client components
// call the backend directly for these, same as the mobile app already
// does. Anything needing the auth cookie still goes through a Next.js
// Route Handler, since client JS can never read an httpOnly cookie.
const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export function getApiClient(token?: string | null) {
  return createApiClient({
    baseUrl: API_BASE_URL,
    getToken: () => token,
  });
}

export function getBrowserApiClient() {
  return createApiClient({ baseUrl: PUBLIC_API_BASE_URL });
}
