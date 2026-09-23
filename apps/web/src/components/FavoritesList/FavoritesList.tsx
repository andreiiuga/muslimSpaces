"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, POICard, Text, colors } from "@muslimspaces/ui";
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
    <div className="mx-auto flex max-w-[1340px] flex-col gap-xl px-[clamp(16px,4vw,28px)] pb-[60px] pt-[30px]">
      <div>
        <Text size="xs" weight="medium" color={colors.textMuted}>{t("favorites.saved").toUpperCase()}</Text>
        <div className="mb-[6px] mt-[5px]">
          <Text size="3xl" weight="semibold">{t("favorites.title")}</Text>
        </div>
        {items.length > 0 && (
          <Text size="sm" color={colors.textMuted}>{t("favorites.countLine", { count: items.length })}</Text>
        )}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-lg">
          {/* min-w-0 on each card below — a grid item defaults to
              min-width:auto (its content's intrinsic width), which lets a
              long POI name push the item wider than its track instead of
              truncating. */}
          {items.map((poi) => (
            <div key={poi.id} className="relative min-w-0">
              <Link href={`/pois/${poi.id}`} aria-label={pickLocalized(poi.name, locale)} className="absolute inset-0 z-[1]" />
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
        <div className="max-w-[420px] py-[14px]">
          <Text size="xl" weight="semibold">{t("favorites.emptyTitle")}</Text>
          <div className="mt-sm">
            <Text size="md" color={colors.textMuted}>{t("favorites.emptyBody")}</Text>
          </div>
          <div className="mt-[18px]">
            <Button onPress={() => router.push("/")}>{t("favorites.browseMap")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
