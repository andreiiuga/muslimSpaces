"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Map as MapIcon, Search, MapPinPlus } from "lucide-react";
import { Avatar, colors, radii, spacing } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import type { LocaleCode } from "../../i18n/types";

const LOCALE_CODES: LocaleCode[] = ["en", "ro", "ar"];

export function HeaderBar({ user }: { user: AuthUser | null }) {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const navItems = [
    { href: "/", key: "nav.explore" },
    { href: "/favorites", key: "nav.favorites" },
    { href: "/blog", key: "nav.blog" },
    { href: "/about", key: "nav.about" },
  ];

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(query ? { q: query } : {});
    router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const navLinks = (
    <>
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontSize: 15,
              fontWeight: active ? 600 : 400,
              color: active ? colors.primaryDark : "#57534E",
              textDecoration: "none",
              padding: "6px 0",
              borderBottom: `2px solid ${active ? colors.primary : "transparent"}`,
              whiteSpace: "nowrap",
            }}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </>
  );

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(255,251,245,.94)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div
        className="header-row"
        style={{
          maxWidth: 1340,
          margin: "0 auto",
          padding: "14px clamp(16px,4vw,28px)",
          display: "flex",
          alignItems: "center",
          gap: "clamp(12px,1.6vw,18px)",
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flex: "none" }}>
          <MapIcon size={22} color={colors.primary} fill={colors.primaryLight} />
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.02em", color: colors.text }}>
            MuslimSpaces
          </span>
        </Link>

        <form
          onSubmit={submitSearch}
          style={{
            flex: "1 1 220px",
            minWidth: 180,
            maxWidth: 420,
            display: "flex",
            alignItems: "center",
            gap: 9,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.input,
            background: colors.surface,
            padding: "0 13px",
            height: 44,
          }}
        >
          <Search size={18} color={colors.primary} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("explore.search")}
            style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 14.5, color: colors.text }}
          />
        </form>

        <nav className="header-nav-links" style={{ display: "flex", alignItems: "center", gap: "clamp(14px,1.8vw,22px)", flex: "none" }}>
          {navLinks}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginInlineStart: "auto", flex: "none" }}>
          <div style={{ display: "flex", border: `1px solid ${colors.border}`, borderRadius: radii.pill, overflow: "hidden", background: colors.surface }}>
            {LOCALE_CODES.map((code) => {
              const active = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  style={{
                    minWidth: 44,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12.5,
                    letterSpacing: ".06em",
                    cursor: "pointer",
                    border: "none",
                    background: active ? colors.primary : "transparent",
                    color: active ? colors.textOnPrimary : "#57534E",
                  }}
                >
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>

          <Link
            href="/submit"
            className="header-submit-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              padding: "0 16px",
              background: colors.primary,
              color: colors.textOnPrimary,
              borderRadius: radii.pill,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(15,118,110,.26)",
            }}
          >
            <MapPinPlus size={17} />
            <span className="header-submit-label">{t("submit.entryLabel")}</span>
          </Link>

          {user ? (
            <Link href="/account" aria-label={t("profile.account")}>
              <Avatar uri={user.avatarUrl} name={user.displayName ?? user.email} size={38} />
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                height: 40,
                padding: "0 16px",
                display: "inline-flex",
                alignItems: "center",
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                borderRadius: radii.pill,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                color: colors.text,
              }}
            >
              {t("common.logIn")}
            </Link>
          )}
        </div>
      </div>

      <div className="header-nav-strip">
        <div style={{ display: "flex", gap: 18, overflowX: "auto", padding: "0 clamp(16px,4vw,28px)" }}>{navLinks}</div>
      </div>
    </div>
  );
}
