"use client";

import { Chip } from "@muslimspaces/ui";
import type { Category } from "@muslimspaces/shared";
import { useLocale } from "../../i18n/LocaleContext";
import { pickLocalized } from "../../i18n/pick-localized";

// Category chips, plus Open Now folded in as a leading chip specifically at
// small viewports (the `explore:hidden` wrapper below) — at that width it
// rides the same horizontally-scrollable carousel as the category chips
// instead of taking its own row next to the map/list switch (see
// ExploreView's desktop-only Open Now button, `hidden ... explore:flex`),
// so every filter lives in one compact strip when vertical space is scarce.
// Above that breakpoint (explore: = 860px) the two stay split, matching the
// mobile app's FilterBar.
export function FilterBar({
  categories,
  selectedCategoryId,
  onCategoryChange,
  openNow,
  onOpenNowChange,
}: {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  openNow: boolean;
  onOpenNowChange: () => void;
}) {
  const { locale, t } = useLocale();

  return (
    <div className="flex flex-nowrap gap-sm overflow-x-auto pb-[2px] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] explore:flex-wrap explore:overflow-x-visible [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex explore:hidden">
        <Chip selected={openNow} onPress={onOpenNowChange}>
          {t("explore.openNow")}
        </Chip>
      </div>
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
