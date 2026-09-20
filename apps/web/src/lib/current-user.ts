import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

// UX-level gate for admin-only pages (category/city taxonomy management) —
// stricter than the admin section's own moderator-or-admin layout gate.
// The backend's RolesGuard is the actual enforcement; this just keeps
// moderators from ever seeing pages they'd get a 403 from anyway.
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/pois");
  }
  return user;
}
