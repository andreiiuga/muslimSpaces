"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, POICard, Text, colors, spacing } from "@muslimspaces/ui";
import type { Category, Poi } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

export function FavoritesList({ favorites, categories }: { favorites: Poi[]; categories: Category[] }) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [items, setItems] = useState(favorites);

  async function remove(poiId: string) {
    await fetch(`/api/favorites/${poiId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((poi) => poi.id !== poiId));
  }

  return (
    <div style={{ maxWidth: 1340, margin: "0 auto", padding: "30px clamp(16px,4vw,28px) 60px", display: "flex", flexDirection: "column", gap: spacing.xl }}>
      <div>
        <Text size="xs" weight="medium" color={colors.textMuted} letterSpacing={1.4}>{t("favorites.saved").toUpperCase()}</Text>
        <div style={{ margin: "5px 0 6px" }}>
          <Text size="3xl" weight="semibold">{t("favorites.title")}</Text>
        </div>
        {items.length > 0 && (
          <Text size="sm" color={colors.textMuted}>{t("favorites.countLine", { count: items.length })}</Text>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {/* minWidth: 0 on each card below — a grid item defaults to
              min-width:auto (its content's intrinsic width), which lets a
              long POI name push the item wider than its track instead of
              truncating. */}
          {items.map((poi) => (
            <div key={poi.id} style={{ position: "relative", minWidth: 0 }}>
              <Link href={`/pois/${poi.id}`} aria-label={pickLocalized(poi.name, locale)} style={{ position: "absolute", inset: 0, zIndex: 1 }} />
              <POICard
                poi={poi}
                categoryLabel={categories.find((c) => c.id === poi.primaryCategoryId) ? pickLocalized(categories.find((c) => c.id === poi.primaryCategoryId)!.name, locale) : undefined}
                isFavorite
                onToggleFavorite={() => remove(poi.id)}
              />
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div style={{ maxWidth: 420, padding: "14px 0" }}>
          <Text size="xl" weight="semibold">{t("favorites.emptyTitle")}</Text>
          <div style={{ marginTop: 8 }}>
            <Text size="md" color={colors.textMuted}>{t("favorites.emptyBody")}</Text>
          </div>
          <div style={{ marginTop: 18 }}>
            <Button onPress={() => router.push("/")}>{t("favorites.browseMap")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
