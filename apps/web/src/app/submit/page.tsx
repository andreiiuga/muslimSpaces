import { redirect } from "next/navigation";
import { getApiClient } from "../../lib/api-client";
import { getCurrentToken } from "../../lib/current-user";
import { SubmitPlaceForm } from "../../components/SubmitPlaceForm/SubmitPlaceForm";

// Public flow, but writing needs an account — same redirect-if-logged-out
// pattern as /account. Mirrors apps/mobile/app/pois/submit.tsx's fields
// and flow; the three POST/PUT calls it makes go through this app's own
// api/pois auth-proxy route handlers instead of a direct api-client call
// (mobile has no httpOnly-cookie constraint, web does).
export const dynamic = "force-dynamic";

export default async function SubmitPlacePage() {
  const token = await getCurrentToken();
  if (!token) redirect("/login");

  const categories = await getApiClient(token).categories.list();

  return <SubmitPlaceForm categories={categories} />;
}
