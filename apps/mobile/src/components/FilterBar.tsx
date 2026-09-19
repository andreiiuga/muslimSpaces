import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Chip, spacing } from "@muslimspaces/ui";
import type { Category } from "@muslimspaces/shared";
import { pickLocalized } from "../i18n/pick-localized";
import type { LocaleCode } from "../i18n";

// Category chips only — Open Now is its own checkbox-style toggle next to
// the map/list switch (see Explore screen), not a chip among these, per the
// v2 design.
export function FilterBar({
  categories,
  selectedCategoryId,
  onCategoryChange,
}: {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as LocaleCode;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm }}
    >
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
    </ScrollView>
  );
}
