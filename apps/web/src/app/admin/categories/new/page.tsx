import { Text } from "@muslimspaces/ui";
import { requireAdmin } from "../../../../lib/current-user";
import { CategoryForm } from "../../../../components/admin/CategoryForm/CategoryForm";

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div>
      <Text size="xl" weight="bold">New category</Text>
      <div className="mt-xl">
        <CategoryForm />
      </div>
    </div>
  );
}
