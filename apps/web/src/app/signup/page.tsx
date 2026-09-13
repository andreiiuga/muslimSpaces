"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Text, colors, spacing } from "@muslimspaces/ui";

export default function SignupPage() {
  const router = useRouter();
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
      setError(body?.message ?? "Signup failed");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: spacing.xl }}>
      <Card>
        <Text size="xl" weight="bold">Sign up</Text>
        <form onSubmit={handleSubmit} style={{ marginTop: spacing.lg }}>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            <Input label="Email" kind="email" value={email} onChangeText={setEmail} />
            <Input label="Password (min. 8 characters)" kind="password" value={password} onChangeText={setPassword} />
            {error && <Text size="sm" color={colors.danger}>{error}</Text>}
            <Button type="submit" loading={submitting} fullWidth>
              {submitting ? "Signing up…" : "Sign up"}
            </Button>
          </div>
        </form>
        <div style={{ marginTop: spacing.lg }}>
          <Text size="sm" color={colors.textMuted}>
            Already have an account? <Link href="/login" style={{ color: colors.primary }}>Log in</Link>
          </Text>
        </div>
      </Card>
    </main>
  );
}
