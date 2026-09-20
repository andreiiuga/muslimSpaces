"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, colors, spacing, Text } from "@muslimspaces/ui";
import type { Category, Poi } from "@muslimspaces/shared";

const STATUS_COLORS: Record<Poi["status"], string> = {
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.danger,
};

export function PoiAdminTable({ pois: initialPois, categories }: { pois: Poi[]; categories: Category[] }) {
  const router = useRouter();
  const [pois, setPois] = useState(initialPois);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function moderate(id: string, status: "approved" | "rejected") {
    setPendingAction(id);
    const res = await fetch(`/api/admin/pois/${id}/moderate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPendingAction(null);
    if (res.ok) {
      const updated: Poi = await res.json();
      setPois((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
  }

  async function toggleVisibility(poi: Poi) {
    const nextVisibility = poi.visibility === "visible" ? "hidden" : "visible";
    setPendingAction(poi.id);
    const res = await fetch(`/api/admin/pois/${poi.id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: nextVisibility }),
    });
    setPendingAction(null);
    if (res.ok) {
      const updated: Poi = await res.json();
      setPois((prev) => prev.map((p) => (p.id === poi.id ? updated : p)));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this POI? This cannot be undone.")) return;
    setPendingAction(id);
    const res = await fetch(`/api/admin/pois/${id}`, { method: "DELETE" });
    setPendingAction(null);
    if (res.ok) {
      setPois((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  function categoryLabel(poi: Poi) {
    return categories.find((c) => c.id === poi.primaryCategoryId)?.name.en ?? "—";
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
          {["Name", "Category", "Status", "Visibility", "Address", ""].map((h) => (
            <th key={h} style={{ padding: spacing.sm, fontSize: 12, color: colors.textMuted }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pois.map((poi) => (
          <tr key={poi.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
            <td style={{ padding: spacing.sm }}>
              <Text size="sm" weight="medium">{poi.name.ro}</Text>
            </td>
            <td style={{ padding: spacing.sm }}>
              <Text size="sm">{categoryLabel(poi)}</Text>
            </td>
            <td style={{ padding: spacing.sm }}>
              <Text size="sm" color={STATUS_COLORS[poi.status]} weight="medium">{poi.status}</Text>
            </td>
            <td style={{ padding: spacing.sm }}>
              <Text size="sm" color={poi.visibility === "hidden" ? colors.danger : colors.success} weight="medium">
                {poi.visibility}
              </Text>
            </td>
            <td style={{ padding: spacing.sm }}>
              <Text size="sm" color={colors.textMuted}>{poi.address}</Text>
            </td>
            <td style={{ padding: spacing.sm, display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
              <Button
                size="sm"
                variant="secondary"
                disabled={pendingAction === poi.id}
                onPress={() => toggleVisibility(poi)}
              >
                {poi.visibility === "visible" ? "Hide" : "Show"}
              </Button>
              {poi.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pendingAction === poi.id}
                    onPress={() => moderate(poi.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pendingAction === poi.id}
                    onPress={() => moderate(poi.id, "rejected")}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onPress={() => router.push(`/admin/pois/${poi.id}/edit`)}>
                Edit
              </Button>
              <Button size="sm" variant="danger" disabled={pendingAction === poi.id} onPress={() => remove(poi.id)}>
                Delete
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
