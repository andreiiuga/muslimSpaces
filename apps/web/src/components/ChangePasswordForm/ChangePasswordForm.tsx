"use client";

import { useState } from "react";
import { Button, Input, Text, colors } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";
import { BackLink } from "../BackLink/BackLink";

export function ChangePasswordForm() {
  const { t } = useLocale();
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
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? t("changePassword.error"));
      return;
    }

    setSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="mx-auto max-w-[760px] px-[clamp(16px,4vw,28px)] pb-[60px] pt-[26px]">
      <BackLink href="/account">{t("editProfile.backProfile")}</BackLink>
      <div className="mb-[22px] mt-1">
        <Text size="3xl" weight="semibold">{t("changePassword.title")}</Text>
      </div>

      <div className="flex max-w-[420px] flex-col gap-lg rounded-lg bg-surface p-xl shadow-panel">
        <Input label={t("changePassword.current")} kind="password" value={currentPassword} onChangeText={setCurrentPassword} />
        <Input label={t("changePassword.newPassword")} kind="password" value={newPassword} onChangeText={setNewPassword} />
        <Input label={t("changePassword.confirm")} kind="password" value={confirmPassword} onChangeText={setConfirmPassword} />
        {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}
        {success && <Text size="sm" color={colors.success}>{t("changePassword.success")}</Text>}
        <Button onPress={handleSubmit} loading={submitting}>{t("changePassword.submit")}</Button>
      </div>
    </div>
  );
}
