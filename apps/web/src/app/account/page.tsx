import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiClient } from "../../lib/api-client";

// Never statically cached — this reads a per-user auth cookie.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    redirect("/login");
  }

  const api = getApiClient(token);
  const user = await api.auth.me();

  return (
    <main>
      <h1>Account</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <p>Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
    </main>
  );
}
