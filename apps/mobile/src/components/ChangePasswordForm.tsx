import { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, Input, Text, colors, spacing } from "@muslimspaces/ui";
import { ApiError } from "@muslimspaces/shared";
import { api } from "../lib/api-client";

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError(t("changePassword.mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("changePassword.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Input label={t("changePassword.current")} kind="password" value={currentPassword} onChangeText={setCurrentPassword} />
      <Input label={t("changePassword.newPassword")} kind="password" value={newPassword} onChangeText={setNewPassword} />
      <Input label={t("changePassword.confirm")} kind="password" value={confirmPassword} onChangeText={setConfirmPassword} />
      {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}
      {success && <Text size="sm" color={colors.success}>{t("changePassword.success")}</Text>}
      <Button onPress={handleSubmit} loading={submitting} fullWidth>{t("changePassword.submit")}</Button>
    </View>
  );
}
