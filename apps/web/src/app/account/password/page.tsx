import { redirect } from "next/navigation";
import { getCurrentToken } from "../../../lib/current-user";
import { ChangePasswordForm } from "../../../components/ChangePasswordForm/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const token = await getCurrentToken();
  if (!token) redirect("/login");

  return <ChangePasswordForm />;
}
