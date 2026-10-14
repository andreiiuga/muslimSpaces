"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Text } from "@muslimspaces/ui";
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

    let res: Response;
    try {
      res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setSubmitting(false);
      setError(t("auth.signupFailed"));
      return;
    }

    if (!res.ok) {
      setSubmitting(false);
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? t("auth.signupFailed"));
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <AuthCard subtitle={t("auth.signupKicker")} title={t("auth.signupTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-md" aria-busy={submitting}>
        <Input label={t("auth.email")} kind="email" name="email" autoComplete="email" autoFocus disabled={submitting} value={email} onChangeText={setEmail} placeholder="you@example.ro" />
        <Input label={t("auth.password")} kind="password" name="password" autoComplete="new-password" hint={t("auth.passwordHint")} showLabel={t("auth.showPassword")} hideLabel={t("auth.hidePassword")} disabled={submitting} value={password} onChangeText={setPassword} placeholder="••••••••" />
        {error && (
          <div role="alert" className="rounded-input border border-dangerBorder bg-dangerBg px-md py-sm">
            <Text size="sm" color="dangerDark">{error}</Text>
          </div>
        )}
        <Button type="submit" loading={submitting} fullWidth>
          {submitting ? t("auth.signingUp") : t("common.signUp")}
        </Button>
      </form>
      <Link href="/login" className="flex min-h-[44px] items-center justify-center rounded-input text-sm font-medium text-primaryDark underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        {t("auth.haveAccount")}
      </Link>
    </AuthCard>
  );
}
