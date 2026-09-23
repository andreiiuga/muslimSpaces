import { Text } from "@muslimspaces/ui";
import { requireAdmin } from "../../../../lib/current-user";
import { CityForm } from "../../../../components/admin/CityForm/CityForm";

export default async function NewCityPage() {
  await requireAdmin();

  return (
    <div>
      <Text size="xl" weight="bold">New city</Text>
      <div className="mt-xl">
        <CityForm />
      </div>
    </div>
  );
}
