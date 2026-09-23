import { Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../lib/api-client";
import { getCurrentToken, requireAdmin } from "../../../lib/current-user";
import { CategoryAdminTable } from "../../../components/admin/CategoryAdminTable/CategoryAdminTable";
import { NewCategoryButton } from "./NewCategoryButton";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const token = await getCurrentToken();
  const categories = await getApiClient(token).categories.list();

  return (
    <div>
      <div className="flex items-center justify-between">
        <Text size="xl" weight="bold">Categories</Text>
        <NewCategoryButton />
      </div>
      <div className="mt-lg overflow-x-auto">
        {categories.length === 0 ? (
          <Text>No categories yet.</Text>
        ) : (
          <CategoryAdminTable categories={categories} />
        )}
      </div>
    </div>
  );
}
