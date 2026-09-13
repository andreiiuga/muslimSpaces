import { redirect } from "next/navigation";
import { colors, spacing, Text } from "@muslimspaces/ui";
import { getApiClient } from "../../lib/api-client";
import { getCurrentToken } from "../../lib/current-user";
import { EditProfileForm } from "../../components/EditProfileForm/EditProfileForm";
import { ChangePasswordForm } from "../../components/ChangePasswordForm/ChangePasswordForm";
import { FavoritesList } from "../../components/FavoritesList/FavoritesList";

// Never statically cached — this reads a per-user auth cookie.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const token = await getCurrentToken();
  if (!token) redirect("/login");

  const api = getApiClient(token);
  const [user, favorites, categories] = await Promise.all([
    api.auth.me(),
    api.favorites.mine(),
    api.categories.list(),
  ]);

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: spacing.xl }}>
      <Text size="2xl" weight="bold">Your account</Text>

      <Section title="Profile">
        <EditProfileForm user={user} />
      </Section>

      <Section title="Password">
        <ChangePasswordForm />
      </Section>

      <Section title="Favorites">
        <FavoritesList favorites={favorites} categories={categories} />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: spacing["2xl"], borderTop: `1px solid ${colors.border}`, paddingTop: spacing.xl }}>
      <Text size="lg" weight="semibold">{title}</Text>
      <div style={{ marginTop: spacing.lg }}>{children}</div>
    </section>
  );
}
