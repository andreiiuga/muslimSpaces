"use client";

import { useState } from "react";
import { Button, Input, Text, colors, spacing } from "@muslimspaces/ui";

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
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? "Couldn't change your password.");
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, maxWidth: 360 }}>
      <Input label="Current password" kind="password" value={currentPassword} onChangeText={setCurrentPassword} />
      <Input label="New password" kind="password" value={newPassword} onChangeText={setNewPassword} />
      <Input label="Confirm new password" kind="password" value={confirmPassword} onChangeText={setConfirmPassword} />
      {error && <Text size="sm" color={colors.danger}>{error}</Text>}
      {success && <Text size="sm" color={colors.success}>Password updated.</Text>}
      <div>
        <Button onPress={handleSubmit} loading={submitting} size="sm">Update password</Button>
      </div>
    </div>
  );
}
