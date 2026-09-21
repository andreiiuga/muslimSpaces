"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { colors, radii } from "@muslimspaces/ui";
import { SUPPORTED_LOCALES, type LocaleCode } from "../../i18n/types";

const LOCALE_LABEL: Record<LocaleCode, string> = {
  en: "English",
  ro: "Română",
  ar: "العربية",
};

// Small-viewport stand-in for the desktop EN/RO/AR pill row (see
// ".locale-pills-desktop"/".locale-menu-mobile" in globals.css) — one
// compact button, sized like the header's other small-viewport controls,
// opening a dropdown instead of showing all three languages inline.
export function LocaleMenu({
  locale,
  onSelect,
}: {
  locale: LocaleCode;
  onSelect: (code: LocaleCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 40,
          padding: "0 12px",
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          borderRadius: radii.pill,
          fontSize: 13,
          fontWeight: 600,
          color: colors.text,
          cursor: "pointer",
        }}
      >
        <Globe size={16} color={colors.primary} />
        {locale.toUpperCase()}
        <ChevronDown size={14} color={colors.textMuted} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            insetInlineEnd: 0,
            minWidth: 150,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.lg,
            boxShadow: "0 8px 24px rgba(28,25,23,.16)",
            padding: 6,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 40,
          }}
        >
          {SUPPORTED_LOCALES.map((code) => {
            const active = locale === code;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onSelect(code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  height: 38,
                  padding: "0 10px",
                  border: "none",
                  borderRadius: radii.md,
                  background: active ? colors.primaryLight : "transparent",
                  color: active ? colors.primaryDark : colors.text,
                  fontSize: 14,
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
      )}
    </div>
  );
}
