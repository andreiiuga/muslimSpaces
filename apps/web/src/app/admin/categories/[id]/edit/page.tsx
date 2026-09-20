import { notFound } from "next/navigation";
import { Text } from "@muslimspaces/ui";
import { getApiClient } from "../../../../../lib/api-client";
import { getCurrentToken, requireAdmin } from "../../../../../lib/current-user";
import { CategoryForm } from "../../../../../components/admin/CategoryForm/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const token = await getCurrentToken();
  const categories = await getApiClient(token).categories.list();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <div>
      <Text size="xl" weight="bold">Edit category</Text>
      <div style={{ marginTop: 24 }}>
        <CategoryForm initialCategory={category} />
      </div>
    </div>
  );
}
