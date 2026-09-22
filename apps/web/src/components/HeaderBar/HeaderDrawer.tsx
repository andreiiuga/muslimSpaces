"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, MapPinPlus } from "lucide-react";
import { Avatar, colors, radii, spacing } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { SUPPORTED_LOCALES, type LocaleCode } from "../../i18n/types";
import { useLocale } from "../../i18n/LocaleContext";

const LOCALE_LABEL: Record<LocaleCode, string> = {
  en: "English",
  ro: "Română",
  ar: "العربية",
};

// Below the header's 900px breakpoint the language switcher, "submit a
// place" CTA and login/account link all move in here instead of competing
// for space in the header row (see ".header-desktop-controls"/
// ".header-menu-trigger" in globals.css) — above it, HeaderBar renders all
// three inline as before and this trigger stays hidden.
//
// Rendered through a portal into document.body: the header itself sets
// `backdropFilter` for its frosted-glass sticky look, and a `backdrop-filter`
// (like `filter`/`transform`) makes its element the containing block for any
// `position: fixed` descendant — without the portal, this drawer's overlay
// and panel would be clipped to the header's own (short) box instead of
// covering the full viewport.
export function HeaderDrawer({ user }: { user: AuthUser | null }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="header-menu-trigger"
        onClick={() => setOpen(true)}
        aria-label={t("common.menu")}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          flex: "none",
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          borderRadius: radii.pill,
          cursor: "pointer",
        }}
      >
        <Menu size={19} color={colors.text} />
      </button>

      {open &&
        createPortal(
          <div
            role="presentation"
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(28,25,23,.42)",
            }}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t("common.menu")}
              onClick={(e) => e.stopPropagation()}
              className="ms-scroll"
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                insetInlineEnd: 0,
                width: "min(320px,86vw)",
                background: colors.surface,
                boxShadow: "0 24px 64px rgba(28,25,23,.3)",
                padding: spacing.lg,
                display: "flex",
                flexDirection: "column",
                gap: spacing.xl,
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: colors.text }}>{t("common.menu")}</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t("common.cancel")}
                  style={{
                    width: 40,
                    height: 40,
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} color={colors.text} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 1.3,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                  }}
                >
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        height: 44,
                        padding: "0 12px",
                        border: `1px solid ${active ? colors.primary : colors.border}`,
                        borderRadius: radii.md,
                        background: active ? colors.tealTint : colors.surface,
                        color: active ? colors.primaryDark : colors.text,
                        fontSize: 14.5,
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                        textAlign: "start",
                      }}
                    >
                      {LOCALE_LABEL[code]}
                      <span style={{ fontSize: 11, color: active ? colors.primaryDark : colors.textFaint }}>
                        {code.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Link
                href="/submit"
                onClick={close}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 44,
                  padding: "0 16px",
                  background: colors.primary,
                  color: colors.textOnPrimary,
                  borderRadius: radii.pill,
                  fontSize: 14.5,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <MapPinPlus size={17} />
                {t("submit.entryLabel")}
              </Link>

              {user ? (
                <Link
                  href="/account"
                  onClick={close}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 52,
                    padding: "0 4px",
                    textDecoration: "none",
                    color: colors.text,
                  }}
                >
                  <Avatar uri={user.avatarUrl} name={user.displayName ?? user.email} size={38} />
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{t("profile.account")}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={close}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 44,
                    padding: "0 16px",
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    borderRadius: radii.pill,
                    fontSize: 14.5,
                    fontWeight: 600,
                    textDecoration: "none",
                    color: colors.text,
                  }}
                >
                  {t("common.logIn")}
                </Link>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
