import Link from "next/link";
import { colors, fontSizes, fontWeights, radii, spacing } from "@muslimspaces/ui";
import { getCurrentUser } from "../../lib/current-user";
import { UserMenu } from "../UserMenu/UserMenu";

// App-shell chrome, not a packages/ui primitive — mobile uses a bottom tab
// bar instead of a top navbar (see Phase 4), so there's no shared
// implementation to split across platforms here.
export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header
      className="navbar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${spacing.md}px ${spacing.xl}px`,
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: fontSizes.lg,
          fontWeight: fontWeights.bold,
          color: colors.primary,
          textDecoration: "none",
        }}
      >
        MuslimSpaces
      </Link>

      <nav className="navbar-links" style={{ display: "flex", alignItems: "center", gap: spacing.xl }}>
        <NavLink href="/blog">Blog</NavLink>
        <NavLink href="/about">About</NavLink>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        {user ? (
          <UserMenu user={user} />
        ) : (
          <>
            <Link href="/login" style={{ fontSize: fontSizes.sm, color: colors.text, textDecoration: "none" }}>
              Log in
            </Link>
            <Link
              href="/signup"
              style={{
                fontSize: fontSizes.sm,
                fontWeight: fontWeights.semibold,
                color: colors.textOnPrimary,
                backgroundColor: colors.primary,
                padding: `${spacing.xs}px ${spacing.lg}px`,
                borderRadius: radii.pill,
                textDecoration: "none",
              }}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} style={{ fontSize: fontSizes.sm, color: colors.text, textDecoration: "none" }}>
      {children}
    </Link>
  );
}
