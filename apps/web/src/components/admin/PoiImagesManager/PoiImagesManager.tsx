"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button, Chip, Text } from "@muslimspaces/ui";
import type { PoiImage, PoiImageRole } from "@muslimspaces/shared";

const ROLE_OPTIONS: PoiImageRole[] = ["cover", "logo", "gallery"];

function toggleRole(roles: PoiImageRole[], role: PoiImageRole): PoiImageRole[] {
  return roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
}

export function PoiImagesManager({ poiId, initialImages }: { poiId: string; initialImages: PoiImage[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(() => [...initialImages].sort((a, b) => a.sortOrder - b.sortOrder));
  // An upload can take several roles at once — one file, no second upload.
  const [roles, setRoles] = useState<PoiImageRole[]>(["gallery"]);
  const [uploading, setUploading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch("/api/media", { method: "POST", body: form });
    if (!uploadRes.ok) {
      setUploading(false);
      setError("Couldn't upload that image.");
      return;
    }
    const { storageKey } = await uploadRes.json();

    const attachRes = await fetch(`/api/pois/${poiId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: roles[0], storageKey, sortOrder: images.length }),
    });
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!attachRes.ok) {
      setUploading(false);
      setError("Couldn't attach that image.");
      return;
    }
    let newImage: PoiImage = await attachRes.json();

    if (roles.length > 1) {
      const rolesRes = await fetch(`/api/pois/${poiId}/images/${newImage.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
      if (rolesRes.ok) newImage = await rolesRes.json();
      else setError("Image uploaded, but couldn't apply all the roles.");
    }
    setUploading(false);
    setImages((prev) => [...prev, newImage]);
  }

  async function handleToggleRole(image: PoiImage, role: PoiImageRole) {
    const next = toggleRole(image.roles, role);
    if (next.length === 0) return; // an image must keep at least one role; delete it instead
    setPendingId(image.id);
    setError(null);
    const res = await fetch(`/api/pois/${poiId}/images/${image.id}/roles`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: next }),
    });
    setPendingId(null);
    if (!res.ok) {
      setError("Couldn't update that image's roles.");
      return;
    }
    const updated: PoiImage = await res.json();
    setImages((prev) => prev.map((i) => (i.id === image.id ? updated : i)));
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Delete this image? This cannot be undone.")) return;
    setPendingId(imageId);
    setError(null);
    const res = await fetch(`/api/pois/${poiId}/images/${imageId}`, { method: "DELETE" });
    setPendingId(null);
    if (!res.ok) {
      setError("Couldn't delete that image.");
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== imageId));
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    const moved = next.splice(index, 1)[0];
    if (!moved) return;
    next.splice(target, 0, moved);
    setImages(next);
    setError(null);
    setPendingId("__reorder__");

    const res = await fetch(`/api/pois/${poiId}/images/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageIds: next.map((i) => i.id) }),
    });
    setPendingId(null);
    if (!res.ok) {
      setError("Couldn't save the new order.");
      setImages(images); // revert to the order the server still has
    }
  }

  return (
    <div>
      <Text size="sm" weight="medium">Images</Text>

      {images.length === 0 ? (
        <Text size="sm" color="textMuted">No images yet.</Text>
      ) : (
        <div className="mt-sm flex flex-col gap-sm">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="flex items-center gap-sm rounded-sm border border-border p-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbnailUrl}
                alt=""
                className="h-[54px] w-[72px] flex-shrink-0 rounded-sm object-cover"
              />
              <div className="flex flex-1 flex-wrap items-center gap-xs" role="group" aria-label="Image roles">
                {ROLE_OPTIONS.map((r) => (
                  <Chip
                    key={r}
                    selected={image.roles.includes(r)}
                    onPress={pendingId !== null ? undefined : () => handleToggleRole(image, r)}
                  >
                    {r}
                  </Chip>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={index === 0 || pendingId !== null}
                onPress={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={index === images.length - 1 || pendingId !== null}
                onPress={() => move(index, 1)}
              >
                ↓
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={pendingId !== null}
                onPress={() => handleDelete(image.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-md flex items-center gap-sm">
        <div className="flex items-center gap-xs" role="group" aria-label="Roles for the new image">
          {ROLE_OPTIONS.map((r) => (
            <Chip
              key={r}
              selected={roles.includes(r)}
              onPress={() => setRoles((prev) => (toggleRole(prev, r).length === 0 ? prev : toggleRole(prev, r)))}
            >
              {r}
            </Chip>
          ))}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <Button variant="secondary" size="sm" onPress={() => fileInputRef.current?.click()} loading={uploading}>
          Add image
        </Button>
      </div>

      {error && (
        <div className="mt-xs">
          <Text size="sm" color="danger">{error}</Text>
        </div>
      )}
    </div>
  );
}
