import { getCurrentToken, getCurrentUser } from "../../lib/current-user";
import { ProfileHubView } from "../../components/ProfileHubView/ProfileHubView";

// Never statically cached — this reads a per-user auth cookie.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const token = await getCurrentToken();
  const user = token ? await getCurrentUser() : null;
  return <ProfileHubView user={user} />;
}
