import { useState } from "react";
import { View } from "react-native";
import { Button, Input, Text, colors, spacing } from "@muslimspaces/ui";
import { ApiError } from "@muslimspaces/shared";
import { api } from "../lib/api-client";

export function ChangePasswordForm() {
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
      setError("New passwords don't match.");
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
      setError(err instanceof ApiError ? err.message : "Couldn't change your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Input label="Current password" kind="password" value={currentPassword} onChangeText={setCurrentPassword} />
      <Input label="New password" kind="password" value={newPassword} onChangeText={setNewPassword} />
      <Input label="Confirm new password" kind="password" value={confirmPassword} onChangeText={setConfirmPassword} />
      {error && <Text size="sm" color={colors.danger}>{error}</Text>}
      {success && <Text size="sm" color={colors.success}>Password updated.</Text>}
      <View>
        <Button onPress={handleSubmit} loading={submitting} size="sm">Update password</Button>
      </View>
    </View>
  );
}
