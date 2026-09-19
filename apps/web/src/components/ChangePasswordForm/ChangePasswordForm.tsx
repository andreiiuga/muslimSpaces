"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button, Input, Text, colors, radii, spacing } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";

export function ChangePasswordForm() {
  const { locale, t } = useLocale();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

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
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px clamp(16px,4vw,28px) 60px" }}>
      <Link href="/account" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 14, color: colors.primary, textDecoration: "none" }}>
        <BackIcon size={18} /> {t("editProfile.backProfile")}
      </Link>
      <div style={{ margin: "4px 0 22px" }}>
        <Text size="3xl" weight="semibold">{t("changePassword.title")}</Text>
      </div>

      <div style={{ background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 24, display: "flex", flexDirection: "column", gap: spacing.lg, maxWidth: 420 }}>
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
