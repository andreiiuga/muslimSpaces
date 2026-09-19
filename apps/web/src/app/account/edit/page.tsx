import { redirect } from "next/navigation";
import { getCurrentToken, getCurrentUser } from "../../../lib/current-user";
import { EditProfileForm } from "../../../components/EditProfileForm/EditProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const token = await getCurrentToken();
  if (!token) redirect("/login");
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <EditProfileForm user={user} />;
}
