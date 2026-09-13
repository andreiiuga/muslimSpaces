"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Text, Textarea, colors, spacing } from "@muslimspaces/ui";
import type { BlogPost } from "@muslimspaces/shared";

export function BlogForm({ initialPost }: { initialPost?: BlogPost }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initialPost);

  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [titleRo, setTitleRo] = useState(initialPost?.title.ro ?? "");
  const [titleEn, setTitleEn] = useState(initialPost?.title.en ?? "");
  const [excerptRo, setExcerptRo] = useState(initialPost?.excerpt.ro ?? "");
  const [excerptEn, setExcerptEn] = useState(initialPost?.excerpt.en ?? "");
  const [contentRo, setContentRo] = useState(initialPost?.content.ro ?? "");
  const [contentEn, setContentEn] = useState(initialPost?.content.en ?? "");
  const [coverImageKey, setCoverImageKey] = useState(initialPost?.coverImageKey);
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.coverImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: form });
    setUploading(false);

    if (!res.ok) {
      setError("Couldn't upload that image.");
      return;
    }
    const { storageKey, url } = await res.json();
    setCoverImageKey(storageKey);
    setCoverImageUrl(url);
  }

  async function handleSubmit() {
    setError(null);
    if (!slug || !titleRo || !titleEn || !excerptRo || !excerptEn || !contentRo || !contentEn) {
      setError("All fields (both languages) are required.");
      return;
    }

    const payload = {
      slug,
      title: { ro: titleRo, en: titleEn },
      excerpt: { ro: excerptRo, en: excerptEn },
      content: { ro: contentRo, en: contentEn },
      coverImageKey,
    };

    setSubmitting(true);
    const res = await fetch(isEdit ? `/api/admin/blog/${initialPost!.id}` : "/api/admin/blog", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? "Couldn't save this post.");
      return;
    }

    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, maxWidth: 640 }}>
      <Input label="Slug" value={slug} onChangeText={setSlug} placeholder="my-post-title" />

      <div>
        <Text size="sm" weight="medium">Cover image</Text>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginTop: spacing.xs }}>
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="" style={{ width: 96, height: 64, objectFit: "cover", borderRadius: 8 }} />
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
          <Button variant="secondary" size="sm" onPress={() => fileInputRef.current?.click()} loading={uploading}>
            {coverImageUrl ? "Change image" : "Upload image"}
          </Button>
        </div>
      </div>

      <Input label="Title (Romanian)" value={titleRo} onChangeText={setTitleRo} />
      <Input label="Title (English)" value={titleEn} onChangeText={setTitleEn} />
      <Textarea label="Excerpt (Romanian)" value={excerptRo} onChangeText={setExcerptRo} rows={2} />
      <Textarea label="Excerpt (English)" value={excerptEn} onChangeText={setExcerptEn} rows={2} />
      <Textarea label="Content (Romanian, Markdown)" value={contentRo} onChangeText={setContentRo} rows={10} />
      <Textarea label="Content (English, Markdown)" value={contentEn} onChangeText={setContentEn} rows={10} />

      {error && <Text size="sm" color={colors.danger}>{error}</Text>}
      <div>
        <Button onPress={handleSubmit} loading={submitting}>{isEdit ? "Save changes" : "Create post"}</Button>
      </div>
    </div>
  );
}
