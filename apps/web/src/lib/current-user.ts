import { cookies } from "next/headers";
import type { AuthUser } from "@muslimspaces/shared";
import { getApiClient } from "./api-client";

export async function getCurrentToken(): Promise<string | null> {
  return (await cookies()).get("token")?.value ?? null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getCurrentToken();
  if (!token) return null;
  try {
    return await getApiClient(token).auth.me();
  } catch {
    // Expired/invalid token — treat as logged out rather than erroring
    // the whole page (e.g. every Server Component that renders the navbar).
    return null;
  }
}
