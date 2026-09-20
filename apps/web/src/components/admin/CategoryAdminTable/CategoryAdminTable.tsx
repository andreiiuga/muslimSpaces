"use client";

import { useRouter } from "next/navigation";
import { Button, colors, spacing, Text } from "@muslimspaces/ui";
import type { Category } from "@muslimspaces/shared";

// No delete action here — the backend has no DELETE /categories/:id (a
// category can be load-bearing for existing poi_categories rows), so this
// table only ever offers what the API actually supports: create + edit.
export function CategoryAdminTable({ categories }: { categories: Category[] }) {
  const router = useRouter();

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
          {["Name (EN)", "Name (RO)", "Slug", ""].map((h) => (
            <th key={h} style={{ padding: spacing.sm, fontSize: 12, color: colors.textMuted }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => (
          <tr key={category.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
            <td style={{ padding: spacing.sm }}><Text size="sm" weight="medium">{category.name.en}</Text></td>
            <td style={{ padding: spacing.sm }}><Text size="sm">{category.name.ro}</Text></td>
            <td style={{ padding: spacing.sm }}><Text size="sm" color={colors.textMuted}>{category.slug}</Text></td>
            <td style={{ padding: spacing.sm }}>
              <Button size="sm" variant="ghost" onPress={() => router.push(`/admin/categories/${category.id}/edit`)}>
                Edit
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
