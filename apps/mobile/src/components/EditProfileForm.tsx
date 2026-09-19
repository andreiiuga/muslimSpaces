import { useState } from "react";
import { Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { CheckCircle, Circle } from "lucide-react-native";
import { Avatar, Button, Input, Text, colors, radii, spacing } from "@muslimspaces/ui";
import type { AuthUser } from "@muslimspaces/shared";
import { api } from "../lib/api-client";
import { localFileToUpload } from "../lib/local-file";
import { useLocale } from "../i18n/useLocale";
import { SUPPORTED_LOCALES, type LocaleCode } from "../i18n";

const LOCALE_LABEL: Record<LocaleCode, string> = { en: "English", ro: "Română", ar: "العربية" };
const LOCALE_CODE: Record<LocaleCode, string> = { en: "EN", ro: "RO", ar: "AR" };

export function EditProfileForm({ user, onUpdated }: { user: AuthUser; onUpdated: (user: AuthUser) => void }) {
  const { t } = useTranslation();
  const { locale, changeLocale } = useLocale();
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAvatarChange() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMessage(t("editProfile.photoPermission"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);
      setMessage(null);

      const filename = asset.fileName ?? "avatar.jpg";
      const file = await localFileToUpload(asset.uri);
      const { storageKey, url } = await api.media.upload(file, filename);
      const updated = await api.auth.updateProfile({ avatarKey: storageKey });
      setAvatarUrl(url);
      onUpdated(updated);
    } catch (err) {
      // Logged so the failure is visible in the Metro/Xcode console instead
      // of just "nothing happening" — this path previously had an unguarded
      // gap between requestMediaLibraryPermissionsAsync/launchImageLibraryAsync
      // and the try block, so a rejection there (e.g. the iOS picker promise
      // rejecting instead of resolving) surfaced as a silent no-op.
      console.error("Avatar upload failed:", err);
      setMessage(t("editProfile.photoError"));
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
        preferredLocale: locale,
      });
      onUpdated(updated);
      setMessage(t("editProfile.saved"));
    } catch {
      setMessage(t("editProfile.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Avatar uri={avatarUrl} name={displayName || user.email} size={64} />
        <Button variant="secondary" size="sm" onPress={handleAvatarChange} loading={uploading}>
          {t("editProfile.changePhoto")}
        </Button>
      </View>

      <Input
        label={t("editProfile.displayName")}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t("editProfile.displayNamePlaceholder")}
      />

      <View style={{ gap: spacing.xs }}>
        <Text size="sm" weight="medium">{t("editProfile.language")}</Text>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: "hidden" }}>
          {SUPPORTED_LOCALES.map((code, i) => {
            const selected = locale === code;
            return (
              <Pressable
                key={code}
                onPress={() => changeLocale(code)}
                style={{
                  minHeight: 52,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor: selected ? colors.tealTint : colors.surface,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                {selected ? (
                  <CheckCircle size={19} color={colors.primary} />
                ) : (
                  <Circle size={19} color={colors.border} />
                )}
                <View style={{ flex: 1 }}>
                  <Text size="md">{LOCALE_LABEL[code]}</Text>
                </View>
                <Text size="xs" color={selected ? colors.primary : colors.textMuted}>{LOCALE_CODE[code]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text size="xs" color={colors.textMuted}>{t("editProfile.languageNote")}</Text>
      </View>

      {message && <Text size="sm" color={colors.textMuted}>{message}</Text>}

      <Button onPress={handleSave} loading={saving} fullWidth>{t("editProfile.save")}</Button>
    </View>
  );
}
