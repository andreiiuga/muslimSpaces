"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Text, colors, radii, spacing } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? t("auth.loggingIn"));
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "52px clamp(16px,4vw,28px) 70px" }}>
      <div style={{ width: "100%", maxWidth: 460, background: colors.surface, borderRadius: radii.lg, boxShadow: "0 1px 3px rgba(28,25,23,.08),0 6px 18px rgba(28,25,23,.05)", padding: 28, display: "flex", flexDirection: "column", gap: spacing.lg }}>
        <div>
          <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("auth.loginKicker").toUpperCase()}</Text>
          <div style={{ marginTop: 5 }}>
            <Text size="2xl" weight="semibold">{t("auth.loginTitle")}</Text>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
          <Input label={t("auth.email")} kind="email" value={email} onChangeText={setEmail} placeholder="you@example.ro" />
          <Input label={t("auth.password")} kind="password" value={password} onChangeText={setPassword} placeholder="••••••••" />
          {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}
          <Button type="submit" loading={submitting} fullWidth>
            {submitting ? t("auth.loggingIn") : t("auth.loginTitle")}
          </Button>
        </form>
        <Link href="/signup" style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: colors.primary, textDecoration: "none" }}>
          {t("auth.needAccount")}
        </Link>
        <Text size="xs" color={colors.textMuted} align="center">{t("auth.note")}</Text>
      </div>
    </div>
  );
}
