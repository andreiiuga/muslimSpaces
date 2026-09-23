"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Text, colors } from "@muslimspaces/ui";
import { useLocale } from "../../i18n/LocaleContext";
import { AuthCard } from "../../components/AuthCard/AuthCard";

export default function SignupPage() {
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

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? t("auth.signingUp"));
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <AuthCard kicker={t("auth.signupKicker")} title={t("auth.signupTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <Input label={t("auth.email")} kind="email" value={email} onChangeText={setEmail} placeholder="you@example.ro" />
        <Input label={t("auth.password")} kind="password" value={password} onChangeText={setPassword} placeholder="••••••••" />
        {error && <Text size="sm" color={colors.dangerDark}>{error}</Text>}
        <Button type="submit" loading={submitting} fullWidth>
          {submitting ? t("auth.signingUp") : t("common.signUp")}
        </Button>
      </form>
      <Link href="/login" className="flex min-h-[44px] items-center justify-center text-sm text-primary no-underline">
        {t("auth.haveAccount")}
      </Link>
    </AuthCard>
  );
}
