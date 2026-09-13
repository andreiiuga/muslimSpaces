"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Input, Text, colors, spacing } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";

const LOCALES: Array<{ value: string; label: string }> = [
  { value: "ro", label: "Română" },
  { value: "en", label: "English" },
];

export function EditProfileForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [preferredLocale, setPreferredLocale] = useState(user.preferredLocale);
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
      setMessage("Couldn't upload that image.");
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
      setMessage("Uploaded, but couldn't save it to your profile.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName || undefined, preferredLocale }),
    });

    setSaving(false);
    setMessage(res.ok ? "Saved." : "Couldn't save your changes.");
    if (res.ok) router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.lg }}>
      <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
        <Avatar uri={avatarUrl} name={displayName || user.email} size={64} />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
          <Button variant="secondary" size="sm" onPress={() => fileInputRef.current?.click()} loading={uploading}>
            Change photo
          </Button>
        </div>
      </div>

      <Input label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="How others see you" />

      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs }}>
        <Text size="sm" weight="medium">Preferred language</Text>
        <select
          value={preferredLocale}
          onChange={(e) => setPreferredLocale(e.target.value)}
          style={{
            padding: `${spacing.sm}px ${spacing.md}px`,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            fontSize: 16,
          }}
        >
          {LOCALES.map((locale) => (
            <option key={locale.value} value={locale.value}>{locale.label}</option>
          ))}
        </select>
      </div>

      {message && <Text size="sm" color={colors.textMuted}>{message}</Text>}

      <div>
        <Button onPress={handleSave} loading={saving} size="sm">Save changes</Button>
      </div>
    </div>
  );
}
