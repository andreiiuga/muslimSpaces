"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, Circle } from "lucide-react";
import { Avatar, Button, Input, Text, colors, radii, spacing } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { SUPPORTED_LOCALES, type LocaleCode } from "../../i18n/types";

const LOCALE_LABEL: Record<LocaleCode, string> = { en: "English", ro: "Română", ar: "العربية" };
const LOCALE_CODE: Record<LocaleCode, string> = { en: "EN", ro: "RO", ar: "AR" };

export function EditProfileForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch("/api/media", { method: "POST", body: form });

    if (!uploadRes.ok) {
      setUploading(false);
      setMessage(t("editProfile.photoError"));
      return;
    }

    const { storageKey, url } = await uploadRes.json();
    const saveRes = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarKey: storageKey }),
    });

    setUploading(false);
    if (saveRes.ok) {
      setAvatarUrl(url);
      router.refresh();
    } else {
      setMessage(t("editProfile.saveError"));
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName || undefined, preferredLocale: locale }),
    });

    setSaving(false);
    setMessage(res.ok ? t("editProfile.saved") : t("editProfile.saveError"));
    if (res.ok) router.refresh();
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px clamp(16px,4vw,28px) 60px" }}>
      <Link href="/account" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14, color: colors.primary, textDecoration: "none" }}>
        <BackIcon size={18} /> {t("editProfile.backProfile")}
      </Link>
      <div style={{ margin: "4px 0 22px" }}>
        <Text size="3xl" weight="semibold">{t("editProfile.title")}</Text>
      </div>

      <div style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 24, display: "flex", flexDirection: "column", gap: spacing.xl }}>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
          <Avatar uri={avatarUrl} name={displayName || user.email} size={72} />
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ border: "none", background: "transparent", color: colors.primary, fontSize: 14.5, cursor: uploading ? "not-allowed" : "pointer", padding: 0 }}
            >
              {uploading ? "…" : t("editProfile.changePhoto")}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: spacing.lg }}>
          <Input label={t("editProfile.displayName")} value={displayName} onChangeText={setDisplayName} placeholder={t("editProfile.displayNamePlaceholder")} />
          <Input label={t("editProfile.email")} value={user.email} onChangeText={() => {}} disabled />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("editProfile.language").toUpperCase()}</Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
            {SUPPORTED_LOCALES.map((code) => {
              const selected = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  style={{
                    minHeight: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", cursor: "pointer",
                    border: `1px solid ${selected ? colors.primary : colors.border}`, borderRadius: radii.input,
                    background: selected ? colors.tealTint : colors.surface, color: colors.text,
                  }}
                >
                  {selected ? <CheckCircle size={20} color={colors.primary} /> : <Circle size={20} color="#D6D3D1" />}
                  <span style={{ flex: 1, fontSize: 15.5, textAlign: "start" }}>{LOCALE_LABEL[code]}</span>
                  <span style={{ fontSize: 12, letterSpacing: ".08em", color: selected ? colors.primary : colors.textFaint }}>{LOCALE_CODE[code]}</span>
                </button>
              );
            })}
          </div>
          <Text size="xs" color={colors.textMuted}>{t("editProfile.languageNote")}</Text>
        </div>

        {message && <Text size="sm" color={colors.textMuted}>{message}</Text>}

        <div>
          <Button onPress={handleSave} loading={saving}>{t("editProfile.save")}</Button>
        </div>
      </div>
    </div>
  );
}
