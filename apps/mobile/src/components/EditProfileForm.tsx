import { useState } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Avatar, Button, Chip, Input, Text, colors, spacing } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { api } from "../lib/api-client";

const LOCALES: Array<{ value: string; label: string }> = [
  { value: "ro", label: "Română" },
  { value: "en", label: "English" },
];

export function EditProfileForm({ user, onUpdated }: { user: AuthUser; onUpdated: (user: AuthUser) => void }) {
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [preferredLocale, setPreferredLocale] = useState(user.preferredLocale);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAvatarChange() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo library permission is required to change your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    setMessage(null);

    // RN's FormData accepts a { uri, name, type } part in place of a real
    // Blob — cast is safe since packages/shared's uploadFile only forwards
    // it to FormData.append, never inspects it as an actual Blob.
    const filePart = {
      uri: asset.uri,
      name: asset.fileName ?? "avatar.jpg",
      type: asset.mimeType ?? "image/jpeg",
    } as unknown as Blob;

    try {
      const { storageKey, url } = await api.media.upload(filePart, asset.fileName ?? "avatar.jpg");
      const updated = await api.auth.updateProfile({ avatarKey: storageKey });
      setAvatarUrl(url);
      onUpdated(updated);
    } catch {
      setMessage("Couldn't upload that image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.auth.updateProfile({
        displayName: displayName || undefined,
        preferredLocale,
      });
      onUpdated(updated);
      setMessage("Saved.");
    } catch {
      setMessage("Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Avatar uri={avatarUrl} name={displayName || user.email} size={64} />
        <Button variant="secondary" size="sm" onPress={handleAvatarChange} loading={uploading}>
          Change photo
        </Button>
      </View>

      <Input label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="How others see you" />

      <View style={{ gap: spacing.xs }}>
        <Text size="sm" weight="medium">Preferred language</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {LOCALES.map((locale) => (
            <Chip
              key={locale.value}
              selected={preferredLocale === locale.value}
              onPress={() => setPreferredLocale(locale.value)}
            >
              {locale.label}
            </Chip>
          ))}
        </View>
      </View>

      {message && <Text size="sm" color={colors.textMuted}>{message}</Text>}

      <View>
        <Button onPress={handleSave} loading={saving} size="sm">Save changes</Button>
      </View>
    </View>
  );
}
