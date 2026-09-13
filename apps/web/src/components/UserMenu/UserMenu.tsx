"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, colors, fontSizes, radii, spacing, Text } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";

export function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const isModerator = user.role === "moderator" || user.role === "admin";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        aria-label="Account menu"
      >
        <Avatar uri={user.avatarUrl} name={user.displayName ?? user.email} size={36} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            backgroundColor: colors.surface,
            borderRadius: radii.md,
            boxShadow: "0 4px 16px rgba(28,25,23,0.15)",
            minWidth: 180,
            padding: spacing.xs,
            zIndex: 20,
          }}
        >
          <div style={{ padding: spacing.sm }}>
            <Text size="sm" weight="semibold">{user.displayName ?? user.email}</Text>
            {user.displayName && <Text size="xs" color={colors.textMuted}>{user.email}</Text>}
          </div>
          <MenuLink href="/account" onNavigate={() => setOpen(false)}>
            Profile
          </MenuLink>
          {isModerator && (
            <MenuLink href="/admin" onNavigate={() => setOpen(false)}>
              Admin
            </MenuLink>
          )}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: `${spacing.sm}px`,
              background: "none",
              border: "none",
              borderRadius: radii.sm,
              fontSize: fontSizes.sm,
              color: colors.danger,
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      style={{
        display: "block",
        padding: `${spacing.sm}px`,
        borderRadius: radii.sm,
        fontSize: fontSizes.sm,
        color: colors.text,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
