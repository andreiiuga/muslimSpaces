"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Map as MapIcon, Search, MapPinPlus } from "lucide-react";
import { Avatar, buttonVariants, colors } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { cn } from "@/lib/utils";
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
          className={cn(
            "whitespace-nowrap border-b-2 no-underline",
            active ? "border-primary font-semibold text-primaryDark" : "border-transparent font-normal text-textSecondary",
            variant === "strip" ? "flex-1 py-[11px] text-center text-sm" : "py-[6px] text-sm",
          )}
        >
          {t(item.key)}
        </Link>
      );
    });
  }

  return (
    <div data-site-header className="sticky top-0 z-30 border-b border-border bg-background/[0.94] backdrop-blur-[10px]">
      <div
        // row-gap is 8px on mobile (where flex-wrap actually kicks in) and
        // matches the column-gap clamp() at "header:" width and up — the
        // only two properties here that differ by breakpoint.
        className="mx-auto flex max-w-[1340px] flex-wrap items-center gap-x-[clamp(12px,1.6vw,18px)] gap-y-2 px-[clamp(16px,4vw,28px)] py-[14px] header:gap-y-[clamp(12px,1.6vw,18px)]"
      >
        <Link
          href="/"
          className="flex flex-[0_0_100%] items-center justify-center gap-[9px] no-underline header:flex-none header:justify-start"
        >
          <MapIcon size={22} color={colors.primary} fill={colors.primaryLight} />
          <span className="text-[20px] font-semibold tracking-[-0.02em] text-text">MuslimSpaces</span>
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
            className="flex-1 min-w-0 border-0 bg-transparent text-[16px] text-text outline-none"
          />
        </form>

        <nav className="hidden items-center gap-[clamp(14px,1.8vw,22px)] header:flex header:flex-none">{renderNavLinks("desktop")}</nav>

        <div className="ms-auto hidden flex-none items-center gap-md header:flex">
          <div className="flex overflow-hidden rounded-pill border border-border bg-surface">
            {SUPPORTED_LOCALES.map((code) => {
              const active = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={cn(
                    "flex h-9 min-w-[44px] cursor-pointer items-center justify-center border-0 text-[12.5px] tracking-[0.06em]",
                    active ? "bg-primary text-textOnPrimary" : "bg-transparent text-textSecondary",
                  )}
                >
                  {code.toUpperCase()}
                </button>
              );
            })}
          </div>

          <Link href="/submit" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "no-underline")}>
            <MapPinPlus size={17} />
            <span>{t("submit.entryLabel")}</span>
          </Link>

          {user ? (
            <Link href="/account" aria-label={t("profile.account")}>
              <Avatar uri={user.avatarUrl} name={user.displayName ?? user.email} size={38} />
            </Link>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "no-underline")}>
              {t("common.logIn")}
            </Link>
          )}
        </div>

        <HeaderDrawer user={user} />
      </div>

      <div className="sticky top-[69px] z-[25] block border-b border-border bg-background header:hidden">
        <div className="flex px-[clamp(16px,4vw,28px)]">{renderNavLinks("strip")}</div>
      </div>
    </div>
  );
}
