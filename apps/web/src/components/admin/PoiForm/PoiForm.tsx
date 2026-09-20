"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Text, Textarea, colors, spacing } from "@muslimspaces/ui";
import type { Category, Poi } from "@muslimspaces/shared";

export function PoiForm({ categories, initialPoi }: { categories: Category[]; initialPoi?: Poi }) {
  const router = useRouter();
  const isEdit = Boolean(initialPoi);

  const [nameRo, setNameRo] = useState(initialPoi?.name.ro ?? "");
  const [nameEn, setNameEn] = useState(initialPoi?.name.en ?? "");
  const [descriptionRo, setDescriptionRo] = useState(initialPoi?.description?.ro ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initialPoi?.description?.en ?? "");
  const [address, setAddress] = useState(initialPoi?.address ?? "");
  const [phone, setPhone] = useState(initialPoi?.phone ?? "");
  const [website, setWebsite] = useState(initialPoi?.website ?? "");
  const [lat, setLat] = useState(initialPoi ? String(initialPoi.location.lat) : "");
  const [lng, setLng] = useState(initialPoi ? String(initialPoi.location.lng) : "");
  const [categoryIds, setCategoryIds] = useState<string[]>(initialPoi?.categoryIds ?? []);
  const [primaryCategoryId, setPrimaryCategoryId] = useState(initialPoi?.primaryCategoryId ?? "");
  const [visibility, setVisibility] = useState(initialPoi?.visibility ?? "visible");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      if (!next.includes(primaryCategoryId)) setPrimaryCategoryId(next[0] ?? "");
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);

    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (categoryIds.length === 0) {
      setError("Pick at least one category.");
      return;
    }
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      setError("Latitude/longitude must be numbers.");
      return;
    }

    const payload = {
      name: { ro: nameRo, en: nameEn },
      description: descriptionRo && descriptionEn ? { ro: descriptionRo, en: descriptionEn } : undefined,
      address,
      phone: phone || undefined,
      website: website || undefined,
      location: { lat: latNum, lng: lngNum },
      categoryIds,
      primaryCategoryId,
    };

    setSubmitting(true);
    const res = await fetch(isEdit ? `/api/admin/pois/${initialPoi!.id}` : "/api/admin/pois", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => undefined);
      setError(body?.message ?? "Couldn't save this POI.");
      return;
    }

    router.push("/admin/pois");
    router.refresh();
  }

  async function toggleVisibility() {
    const nextVisibility = visibility === "visible" ? "hidden" : "visible";
    setActionPending(true);
    const res = await fetch(`/api/admin/pois/${initialPoi!.id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: nextVisibility }),
    });
    setActionPending(false);
    if (res.ok) {
      setVisibility(nextVisibility);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this POI? This cannot be undone.")) return;
    setActionPending(true);
    const res = await fetch(`/api/admin/pois/${initialPoi!.id}`, { method: "DELETE" });
    setActionPending(false);
    if (res.ok) {
      router.push("/admin/pois");
      router.refresh();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: spacing.md, maxWidth: 480 }}>
      <Input label="Name (Romanian)" value={nameRo} onChangeText={setNameRo} />
      <Input label="Name (English)" value={nameEn} onChangeText={setNameEn} />
      <Textarea label="Description (Romanian)" value={descriptionRo} onChangeText={setDescriptionRo} rows={3} />
      <Textarea label="Description (English)" value={descriptionEn} onChangeText={setDescriptionEn} rows={3} />
      <Input label="Address" value={address} onChangeText={setAddress} />
      <div style={{ display: "flex", gap: spacing.sm }}>
        <Input label="Latitude" value={lat} onChangeText={setLat} />
        <Input label="Longitude" value={lng} onChangeText={setLng} />
      </div>
      <Input label="Phone (optional)" value={phone} onChangeText={setPhone} />
      <Input label="Website (optional)" value={website} onChangeText={setWebsite} />

      <div>
        <Text size="sm" weight="medium">Categories</Text>
        <div style={{ display: "flex", flexDirection: "column", gap: spacing.xs, marginTop: spacing.xs }}>
          {categories.map((category) => {
            const checked = categoryIds.includes(category.id);
            return (
              <div key={category.id} style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
                <input type="checkbox" checked={checked} onChange={() => toggleCategory(category.id)} />
                <Text size="sm">{category.name.en}</Text>
                {checked && (
                  <label style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: spacing.sm }}>
                    <input
                      type="radio"
                      name="primaryCategory"
                      checked={primaryCategoryId === category.id}
                      onChange={() => setPrimaryCategoryId(category.id)}
                    />
                    <Text size="xs" color={colors.textMuted}>primary</Text>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <Text size="sm" color={colors.danger}>{error}</Text>}

      <div>
        <Button onPress={handleSubmit} loading={submitting}>
          {isEdit ? "Save changes" : "Create POI"}
        </Button>
      </div>

      {isEdit && (
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.md, marginTop: spacing.sm }}>
          <Text size="sm" weight="medium">Visibility: {visibility}</Text>
          <Text size="xs" color={colors.textMuted}>
            Hidden POIs stay approved but never appear to visitors — only here in the admin panel.
          </Text>
          <div style={{ display: "flex", gap: spacing.sm, marginTop: spacing.sm }}>
            <Button size="sm" variant="secondary" disabled={actionPending} onPress={toggleVisibility}>
              {visibility === "visible" ? "Hide" : "Show"}
            </Button>
            <Button size="sm" variant="danger" disabled={actionPending} onPress={handleDelete}>
              Delete POI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
