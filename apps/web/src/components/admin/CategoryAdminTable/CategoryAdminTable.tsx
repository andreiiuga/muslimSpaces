"use client";

import { useRouter } from "next/navigation";
import { Button, colors, Text } from "@muslimspaces/ui";
import type { Category } from "@muslimspaces/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// No delete action here — the backend has no DELETE /categories/:id (a
// category can be load-bearing for existing poi_categories rows), so this
// table only ever offers what the API actually supports: create + edit.
export function CategoryAdminTable({ categories }: { categories: Category[] }) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {["Name (EN)", "Name (RO)", "Slug", ""].map((h) => (
            <TableHead key={h} className="text-xs">{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell>
              <Text size="sm" weight="medium">{category.name.en}</Text>
            </TableCell>
            <TableCell>
              <Text size="sm">{category.name.ro}</Text>
            </TableCell>
            <TableCell>
              <Text size="sm" color={colors.textMuted}>{category.slug}</Text>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="ghost" onPress={() => router.push(`/admin/categories/${category.id}/edit`)}>
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
