"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Chip } from "@muslimspaces/ui";
import type { Category } from "@muslimspaces/shared";
import { cn } from "@/lib/utils";
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
//
// Categories are split into "promoted" (has at least one real listing
// today, per `categoriesWithListings`) and folded behind a "More
// categories" disclosure — with the current dataset that's 1 populated
// category out of 11, so showing all 11 up front was a wall of dead-end
// chips, not a real choice. The taxonomy itself is unchanged and every
// category stays reachable; this only changes what's visible by default.
export function FilterBar({
  categories,
  categoriesWithListings,
  selectedCategoryId,
  onCategoryChange,
  openNow,
  onOpenNowChange,
}: {
  categories: Category[];
  categoriesWithListings: Set<string>;
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  openNow: boolean;
  onOpenNowChange: () => void;
}) {
  const { locale, t } = useLocale();
  const [showMore, setShowMore] = useState(false);

  const promoted = categories.filter((c) => categoriesWithListings.has(c.id));
  const folded = categories.filter((c) => !categoriesWithListings.has(c.id));

  // If a category folded away by default is somehow the active selection,
  // keep it visible instead of hiding the one chip that explains the
  // current filter state.
  useEffect(() => {
    if (selectedCategoryId && !categoriesWithListings.has(selectedCategoryId)) {
      setShowMore(true);
    }
  }, [selectedCategoryId, categoriesWithListings]);

  function categoryChip(category: Category) {
    return (
      <Chip
        key={category.id}
        selected={selectedCategoryId === category.id}
        onPress={() => onCategoryChange(selectedCategoryId === category.id ? null : category.id)}
      >
        {pickLocalized(category.name, locale)}
      </Chip>
    );
  }

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
      {promoted.map(categoryChip)}
      {folded.length > 0 && (
        <button
          type="button"
          aria-expanded={showMore}
          onClick={() => setShowMore((v) => !v)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-xs whitespace-nowrap rounded-pill border border-border bg-surface px-md py-xs text-sm font-medium text-text outline-none",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          )}
        >
          {t("explore.moreCategories")}
          {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
      {showMore && folded.map(categoryChip)}
    </div>
  );
}
