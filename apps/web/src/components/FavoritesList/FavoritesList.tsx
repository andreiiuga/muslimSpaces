"use client";

import { useState } from "react";
import Link from "next/link";
import { POICard, Text, colors, spacing } from "@muslimspaces/ui";
import type { Category, Poi } from "@muslimspaces/shared";

export function FavoritesList({ favorites, categories }: { favorites: Poi[]; categories: Category[] }) {
  const [items, setItems] = useState(favorites);

  async function remove(poiId: string) {
    await fetch(`/api/favorites/${poiId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((poi) => poi.id !== poiId));
  }

  if (items.length === 0) {
    return <Text color={colors.textMuted}>No favorites yet — save places you like from their page.</Text>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: spacing.lg }}>
      {items.map((poi) => (
        <div key={poi.id} style={{ position: "relative" }}>
          <Link href={`/pois/${poi.id}`} aria-label={poi.name.ro} style={{ position: "absolute", inset: 0, zIndex: 1 }} />
          <POICard
            poi={poi}
            categoryLabel={categories.find((c) => c.id === poi.primaryCategoryId)?.name.en}
            isFavorite
            onToggleFavorite={() => remove(poi.id)}
          />
        </div>
      ))}
    </div>
  );
}
