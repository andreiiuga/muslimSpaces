"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle } from "lucide-react";
import { Avatar, Button, Input, Text, colors } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { cn } from "@/lib/utils";
import { useLocale } from "../../i18n/LocaleContext";
import { SUPPORTED_LOCALES, type LocaleCode } from "../../i18n/types";
import { BackLink } from "../BackLink/BackLink";

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
    <div className="mx-auto max-w-[760px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[26px]">
      <BackLink href="/account">{t("editProfile.backProfile")}</BackLink>
      <div className="mb-[22px] mt-1">
        <Text size="3xl" weight="semibold">{t("editProfile.title")}</Text>
      </div>

      <div className="flex flex-col gap-xl rounded-lg bg-surface p-xl shadow-panel">
        <div className="flex items-center gap-md">
          <Avatar uri={avatarUrl} name={displayName || user.email} size={72} />
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn("border-0 bg-transparent p-0 text-sm text-primary", uploading ? "cursor-not-allowed" : "cursor-pointer")}
            >
              {uploading ? "…" : t("editProfile.changePhoto")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-lg">
          <Input label={t("editProfile.displayName")} value={displayName} onChangeText={setDisplayName} placeholder={t("editProfile.displayNamePlaceholder")} />
          <Input label={t("editProfile.email")} value={user.email} onChangeText={() => {}} disabled />
        </div>

        <div className="flex flex-col gap-[9px]">
          <Text size="xs" weight="medium" color={colors.textMuted}>{t("editProfile.language").toUpperCase()}</Text>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[10px]">
            {SUPPORTED_LOCALES.map((code) => {
              const selected = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={cn(
                    "flex min-h-[56px] cursor-pointer items-center gap-[10px] rounded-input border px-lg text-text",
                    selected ? "border-primary bg-tealTint" : "border-border bg-surface",
                  )}
                >
                  {selected ? <CheckCircle size={20} color={colors.primary} /> : <Circle size={20} color="#D6D3D1" />}
                  <span className="flex-1 text-start text-[15.5px]">{LOCALE_LABEL[code]}</span>
                  {/* fontSize/letterSpacing unified with HeaderBar's locale
                      toggle (12.5px/.06em) — was 12px/.08em here for the
                      identical "locale code abbreviation" role, unintentional
                      drift between the two. */}
                  <span className={cn("text-[12.5px] tracking-[0.06em]", selected ? "text-primary" : "text-textFaint")}>
                    {LOCALE_CODE[code]}
                  </span>
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
