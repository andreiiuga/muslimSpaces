"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Text, colors } from "@muslimspaces/ui";
import type { Category } from "@muslimspaces/shared";

export function CategoryForm({ initialCategory }: { initialCategory?: Category }) {
  const router = useRouter();
  const isEdit = Boolean(initialCategory);

  const [slug, setSlug] = useState(initialCategory?.slug ?? "");
  const [nameRo, setNameRo] = useState(initialCategory?.name.ro ?? "");
  const [nameEn, setNameEn] = useState(initialCategory?.name.en ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (!slug || !nameRo || !nameEn) {
      setError("Slug and both names are required.");
      return;
    }

    const payload = { slug, name: { ro: nameRo, en: nameEn } };

    setSubmitting(true);
    const res = await fetch(
      isEdit ? `/api/admin/categories/${initialCategory!.id}` : "/api/admin/categories",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? "Couldn't save this category.");
      return;
    }

    router.push("/admin/categories");
    router.refresh();
  }

  return (
    <div className="flex max-w-[480px] flex-col gap-md">
      <Input
        label="Slug"
        value={slug}
        onChangeText={setSlug}
        placeholder="convenience-store"
      />
      <Text size="xs" color={colors.textMuted}>
        Lowercase, hyphen-separated — used as the stable identifier, not shown to users.
      </Text>
      <Input label="Name (Romanian)" value={nameRo} onChangeText={setNameRo} />
      <Input label="Name (English)" value={nameEn} onChangeText={setNameEn} />

      {error && <Text size="sm" color={colors.danger}>{error}</Text>}

      <div>
        <Button onPress={handleSubmit} loading={submitting}>
          {isEdit ? "Save changes" : "Create category"}
        </Button>
      </div>
    </div>
  );
}
