import { redirect } from "next/navigation";
import Link from "next/link";
import { colors, Text } from "@muslimspaces/ui";
import { getCurrentUser } from "../../lib/current-user";

// Web-only admin surface (never shipped to mobile). UX-level gate here —
// the backend's RolesGuard is the actual security enforcement; this just
// keeps non-moderators from ever seeing the admin UI at all.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "moderator" && user.role !== "admin")) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col admin:flex-row">
      <aside className="flex-shrink-0 border-b border-border p-lg admin:w-[200px] admin:border-b-0 admin:border-r">
        <Text size="sm" weight="semibold" color={colors.textMuted}>ADMIN</Text>
        <nav className="mt-md flex flex-row flex-wrap gap-sm admin:flex-col">
          <AdminLink href="/admin/pois">POIs</AdminLink>
          <AdminLink href="/admin/blog">Blog</AdminLink>
          <AdminLink href="/admin/reviews">Reviews</AdminLink>
          {user.role === "admin" && (
            <>
              <AdminLink href="/admin/categories">Categories</AdminLink>
              <AdminLink href="/admin/cities">Cities</AdminLink>
            </>
          )}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-xl">{children}</div>
    </div>
  );
}

function AdminLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="text-sm text-text no-underline">
      {children}
    </Link>
  );
}
