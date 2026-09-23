"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, MapPinPlus } from "lucide-react";
import { Avatar, colors } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { SUPPORTED_LOCALES, type LocaleCode } from "../../i18n/types";
import { useLocale } from "../../i18n/LocaleContext";

const LOCALE_LABEL: Record<LocaleCode, string> = {
  en: "English",
  ro: "Română",
  ar: "العربية",
};

// Below the header's 900px breakpoint ("header:" in the shared Tailwind
// preset) the language switcher, "submit a place" CTA and login/account
// link all move in here instead of competing for space in the header row
// (see ".header-desktop-controls" in HeaderBar.tsx) — above it, HeaderBar
// renders all three inline as before and this trigger stays hidden.
//
// Sheet (Radix Dialog under the hood) always portals its content into
// document.body by default, which is exactly the fix the previous manual
// createPortal() call existed for: the header's backdropFilter makes it a
// containing block for `position: fixed` descendants, so without a portal
// the panel would be clipped to the header's own (short) box. Radix's
// default portal solves this the same way, and also adds a focus trap and
// enter/exit animation this implementation never had before (the old
// `panelRef` was declared but unused — no focus trap existed).
export function HeaderDrawer({ user }: { user: AuthUser | null }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-pill border border-border bg-surface header:hidden"
          aria-label={t("common.menu")}
        >
          <Menu size={19} color={colors.text} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        // Overrides shadcn's defaults (bg-background, generic border/shadow,
        // p-6, no scroll) with this panel's own look — width/shadow/padding
        // match the previous manual implementation exactly. The scrollbar-
        // hiding utilities are what the confirmed-dead "ms-scroll" class
        // (never defined anywhere in this codebase) was actually meant to
        // be — verified against the original Claude Design canvas, which
        // defines `.ms-scroll{scrollbar-width:none}` +
        // `.ms-scroll::-webkit-scrollbar{width:0;height:0}`.
        className="flex w-[min(320px,86vw)] max-w-none flex-col gap-xl overflow-y-auto border-l-0 bg-surface p-lg shadow-[0_24px_64px_rgba(28,25,23,0.3)] [scrollbar-width:none] [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
      >
        <SheetHeader>
          <SheetTitle className="text-left text-lg font-semibold text-text">{t("common.menu")}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-sm">
          <span className="text-xs font-semibold uppercase tracking-[1.3px] text-textMuted">
            {t("editProfile.language")}
          </span>
          {SUPPORTED_LOCALES.map((code) => {
            const active = locale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLocale(code);
                  close();
                }}
                className={`flex h-11 items-center justify-between gap-[10px] rounded-md border px-md text-start text-[14.5px] ${
                  active ? "border-primary bg-tealTint font-semibold text-primaryDark" : "border-border bg-surface font-medium text-text"
                }`}
              >
                {LOCALE_LABEL[code]}
                <span className={`text-[11px] ${active ? "text-primaryDark" : "text-textFaint"}`}>{code.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        <Link
          href="/submit"
          onClick={close}
          className="flex h-11 items-center justify-center gap-sm rounded-pill bg-primary px-lg text-[14.5px] font-semibold text-textOnPrimary no-underline"
        >
          <MapPinPlus size={17} />
          {t("submit.entryLabel")}
        </Link>

        {user ? (
          <Link href="/account" onClick={close} className="flex h-[52px] items-center gap-[10px] px-1 text-text no-underline">
            <Avatar uri={user.avatarUrl} name={user.displayName ?? user.email} size={38} />
            <span className="text-[14.5px] font-semibold">{t("profile.account")}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            onClick={close}
            className="flex h-11 items-center justify-center rounded-pill border border-border bg-surface px-lg text-[14.5px] font-semibold text-text no-underline"
          >
            {t("common.logIn")}
          </Link>
        )}
      </SheetContent>
    </Sheet>
  );
}
