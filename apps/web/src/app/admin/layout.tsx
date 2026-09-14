import { redirect } from "next/navigation";
import Link from "next/link";
import { colors, spacing, Text } from "@muslimspaces/ui";
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
    <div className="admin-shell" style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
      <aside
        className="admin-sidebar"
        style={{
          width: 200,
          borderRight: `1px solid ${colors.border}`,
          padding: spacing.lg,
          flexShrink: 0,
        }}
      >
        <Text size="sm" weight="semibold" color={colors.textMuted}>ADMIN</Text>
        <nav className="admin-sidebar-nav" style={{ marginTop: spacing.md, display: "flex", flexDirection: "column", gap: spacing.sm }}>
          <AdminLink href="/admin/pois">POIs</AdminLink>
          <AdminLink href="/admin/blog">Blog</AdminLink>
          <AdminLink href="/admin/reviews">Reviews</AdminLink>
        </nav>
      </aside>
      <div style={{ flex: 1, padding: spacing.xl, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function AdminLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} style={{ fontSize: 14, color: colors.text, textDecoration: "none" }}>
      {children}
    </Link>
  );
}
