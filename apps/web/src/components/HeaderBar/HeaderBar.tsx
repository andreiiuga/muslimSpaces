"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map as MapIcon, Search, MapPinPlus } from "lucide-react";
import { Avatar, colors, radii, spacing } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { SUPPORTED_LOCALES } from "../../i18n/types";
import { HeaderDrawer } from "./HeaderDrawer";

export function HeaderBar({ user }: { user: AuthUser | null }) {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  // Deliberately not next/navigation's useSearchParams() — that hook forces
  // this component into a Suspense boundary (see the plain "use client"
  // Navbar.tsx wrapper this used to need), and a Suspense boundary hydrates
  // independently of its surroundings ("selective hydration"): by the time
  // this boundary actually hydrates, LocaleContext's client-only locale
  // correction (reading localStorage) may have already landed, so what
  // should be a simple hydration of the "ro" HTML actually ships mismatches
  // against a since-updated context value — a real, reproducible
  // "Hydration failed" error whenever a non-"ro" locale was stored. Reading
  // the query param directly from the URL after mount sidesteps the
  // Suspense requirement (and the race) entirely; this is only ever used to
  // seed the search box's initial value, never re-read afterward.
  const [query, setQuery] = useState("");
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") ?? "");
  }, []);

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

  // "desktop" is the inline nav in the header row (>=900px); "strip" is the
  // second sticky row below it, shown instead on narrow viewports — the two
  // need different link styling (spread evenly & centered vs. left-anchored
  // with a fixed gap), previously done via a CSS descendant selector
  // (`.header-nav-strip > div > a`) with `!important` to beat these same
  // links' own inline styles. Rendering two variants directly sidesteps the
  // specificity fight entirely.
  function renderNavLinks(variant: "desktop" | "strip") {
    return navItems.map((item) => {
      const active = pathname === item.href;
      return (
        <Link
          key={item.href}
          href={item.href}
          style={{
            fontSize: variant === "strip" ? 14.5 : 15,
            flex: variant === "strip" ? 1 : undefined,
            textAlign: variant === "strip" ? "center" : undefined,
            fontWeight: active ? 600 : 400,
            color: active ? colors.primaryDark : "#57534E",
            textDecoration: "none",
            padding: variant === "strip" ? "11px 0" : "6px 0",
            borderBottom: `2px solid ${active ? colors.primary : "transparent"}`,
            whiteSpace: "nowrap",
          }}
        >
          {t(item.key)}
        </Link>
      );
    });
  }

  return (
    <div
      data-site-header
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
        // row-gap is 8px on mobile (where flex-wrap actually kicks in) and
        // matches the column-gap clamp() at "header:" width and up — the
        // only two properties here that differ by breakpoint, everything
        // else in this row stays a flat inline style.
        className="flex flex-wrap items-center gap-x-[clamp(12px,1.6vw,18px)] gap-y-2 header:gap-y-[clamp(12px,1.6vw,18px)]"
        style={{
          maxWidth: 1340,
          margin: "0 auto",
          padding: "14px clamp(16px,4vw,28px)",
        }}
      >
        <Link
          href="/"
          className="flex flex-[0_0_100%] items-center justify-center gap-[9px] no-underline header:flex-none header:justify-start"
        >
          <MapIcon size={22} color={colors.primary} fill={colors.primaryLight} />
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.02em", color: colors.text }}>
            MuslimSpaces
          </span>
        </Link>

        <form
          onSubmit={submitSearch}
          className="flex h-11 flex-[1_1_100px] min-w-[100px] max-w-[420px] items-center gap-[9px] rounded-input border border-border bg-surface px-[13px] header:flex-[1_1_220px] header:min-w-[180px]"
        >
          <button type="submit" aria-label={t("explore.search")} className="flex flex-none items-center justify-center border-0 bg-transparent p-0 cursor-pointer">
            <Search size={18} color={colors.primary} />
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("explore.search")}
            // 16px, not the design's 14.5px — anything smaller makes iOS
            // Safari auto-zoom the viewport on focus, which visibly (and
            // permanently, until the user pinch-zooms back out) shifts the
            // whole page.
            style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent", fontSize: 16, color: colors.text }}
          />
        </form>

        <nav className="hidden items-center gap-[clamp(14px,1.8vw,22px)] header:flex header:flex-none">{renderNavLinks("desktop")}</nav>

        <div className="hidden flex-none items-center gap-md ms-auto header:flex">
          <div style={{ display: "flex", border: `1px solid ${colors.border}`, borderRadius: radii.pill, overflow: "hidden", background: colors.surface }}>
            {SUPPORTED_LOCALES.map((code) => {
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
            <span>{t("submit.entryLabel")}</span>
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

        <HeaderDrawer user={user} />
      </div>

      <div className="block border-b border-border bg-background header:hidden sticky top-[69px] z-[25]">
        <div style={{ display: "flex", padding: "0 clamp(16px,4vw,28px)" }}>{renderNavLinks("strip")}</div>
      </div>
    </div>
  );
}
