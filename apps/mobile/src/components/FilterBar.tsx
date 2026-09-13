import { ScrollView } from "react-native";
import { Chip, spacing } from "@muslimspaces/ui";
import type { Category } from "@muslimspaces/shared";

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
  onOpenNowChange: (value: boolean) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
    >
      <Chip selected={selectedCategoryId === null} onPress={() => onCategoryChange(null)}>
        All
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          selected={selectedCategoryId === category.id}
          onPress={() => onCategoryChange(selectedCategoryId === category.id ? null : category.id)}
        >
          {category.name.en}
        </Chip>
      ))}
      <Chip selected={openNow} onPress={() => onOpenNowChange(!openNow)}>
        Open now
      </Chip>
    </ScrollView>
  );
}
