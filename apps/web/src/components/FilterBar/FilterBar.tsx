"use client";

import { Chip } from "@muslimspaces/ui";
import type { Category } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

// Category chips only — Open Now is its own checkbox-style toggle next to
// the map/list switch (see ExploreView), not a chip among these, matching
// the split already applied on the mobile app's FilterBar.
export function FilterBar({
  categories,
  selectedCategoryId,
  onCategoryChange,
}: {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}) {
  const { locale, t } = useLocale();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <Chip selected={selectedCategoryId === null} onPress={() => onCategoryChange(null)}>
        {t("explore.all")}
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          selected={selectedCategoryId === category.id}
          onPress={() => onCategoryChange(selectedCategoryId === category.id ? null : category.id)}
        >
          {pickLocalized(category.name, locale)}
        </Chip>
      ))}
    </div>
  );
}
