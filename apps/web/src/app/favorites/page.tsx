import { redirect } from "next/navigation";
import { getApiClient } from "../../lib/api-client";
import { getCurrentToken } from "../../lib/current-user";
import { FavoritesList } from "../../components/FavoritesList/FavoritesList";

// Own page now (design shows it separately from /account) — same
// redirect-if-logged-out pattern as /account and /submit.
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const token = await getCurrentToken();
  if (!token) redirect("/login");

  const api = getApiClient(token);
  const [favorites, categories] = await Promise.all([api.favorites.mine(), api.categories.list()]);

  return <FavoritesList favorites={favorites} categories={categories} />;
}
