"use client";

import { useState } from "react";
import { Button, colors, Text } from "@muslimspaces/ui";
import type { Review } from "@muslimspaces/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "../StatusBadge";

export function ReviewAdminTable({
  reviews: initialReviews,
  poiNames,
}: {
  reviews: Review[];
  poiNames: Record<string, string>;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function toggleStatus(review: Review) {
    const nextStatus = review.status === "published" ? "hidden" : "published";
    setPendingAction(review.id);
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setPendingAction(null);
    if (res.ok) {
      const updated: Review = await res.json();
      setReviews((prev) => prev.map((r) => (r.id === review.id ? updated : r)));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setPendingAction(id);
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setPendingAction(null);
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {["POI", "Rating", "Comment", "Status", ""].map((h) => (
            <TableHead key={h} className="text-xs">{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.id}>
            <TableCell>
              <Text size="sm" weight="medium">{poiNames[review.poiId] ?? "[deleted POI]"}</Text>
            </TableCell>
            <TableCell>
              <Text size="sm">{review.rating} / 5</Text>
            </TableCell>
            <TableCell className="max-w-[320px]">
              <Text size="sm" color={colors.textMuted}>{review.comment ?? "—"}</Text>
            </TableCell>
            <TableCell>
              <StatusBadge color={review.status === "published" ? colors.success : colors.danger}>
                {review.status}
              </StatusBadge>
            </TableCell>
            <TableCell className="flex flex-wrap gap-xs">
              <Button size="sm" variant="secondary" disabled={pendingAction === review.id} onPress={() => toggleStatus(review)}>
                {review.status === "published" ? "Hide" : "Unhide"}
              </Button>
              <Button size="sm" variant="danger" disabled={pendingAction === review.id} onPress={() => remove(review.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
