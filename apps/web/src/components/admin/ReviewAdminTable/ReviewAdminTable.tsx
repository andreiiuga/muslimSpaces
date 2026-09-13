"use client";

import { useState } from "react";
import { Button, colors, spacing, Text } from "@muslimspaces/ui";
import type { Review } from "@muslimspaces/shared";

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
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
          {["POI", "Rating", "Comment", "Status", ""].map((h) => (
            <th key={h} style={{ padding: spacing.sm, fontSize: 12, color: colors.textMuted }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {reviews.map((review) => (
          <tr key={review.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
            <td style={{ padding: spacing.sm }}>
              <Text size="sm" weight="medium">{poiNames[review.poiId] ?? "[deleted POI]"}</Text>
            </td>
            <td style={{ padding: spacing.sm }}><Text size="sm">{review.rating} / 5</Text></td>
            <td style={{ padding: spacing.sm, maxWidth: 320 }}>
              <Text size="sm" color={colors.textMuted}>{review.comment ?? "—"}</Text>
            </td>
            <td style={{ padding: spacing.sm }}>
              <Text size="sm" color={review.status === "published" ? colors.success : colors.danger} weight="medium">
                {review.status}
              </Text>
            </td>
            <td style={{ padding: spacing.sm, display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
              <Button size="sm" variant="secondary" disabled={pendingAction === review.id} onPress={() => toggleStatus(review)}>
                {review.status === "published" ? "Hide" : "Unhide"}
              </Button>
              <Button size="sm" variant="danger" disabled={pendingAction === review.id} onPress={() => remove(review.id)}>Delete</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
