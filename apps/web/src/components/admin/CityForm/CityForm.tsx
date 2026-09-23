"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Text, colors } from "@muslimspaces/ui";

// Create-only — the backend has no PATCH /cities/:id yet (see
// apps/backend/src/cities/cities.controller.ts), so there's nothing for an
// edit form to call.
export function CityForm() {
  const router = useRouter();

  const [slug, setSlug] = useState("");
  const [nameRo, setNameRo] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!slug || !nameRo || !nameEn) {
      setError("Slug and both names are required.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name: { ro: nameRo, en: nameEn } }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? "Couldn't save this city.");
      return;
    }

    router.push("/admin/cities");
    router.refresh();
  }

  return (
    <div className="flex max-w-[480px] flex-col gap-md">
      <Input
        label="Slug"
        value={slug}
        onChangeText={setSlug}
        placeholder="cluj-napoca"
      />
      <Text size="xs" color={colors.textMuted}>
        Lowercase, hyphen-separated — used in SEO URLs like /cluj-napoca/mosques.
      </Text>
      <Input label="Name (Romanian)" value={nameRo} onChangeText={setNameRo} />
      <Input label="Name (English)" value={nameEn} onChangeText={setNameEn} />

      {error && <Text size="sm" color={colors.danger}>{error}</Text>}

      <div>
        <Button onPress={handleSubmit} loading={submitting}>
          Create city
        </Button>
      </div>
    </div>
  );
}
