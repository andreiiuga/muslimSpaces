"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { colors, fontSizes, fontWeights, radii, spacing } from "@muslimspaces/ui";

export function FavoriteButton({
  poiId,
  initialIsFavorite,
  isLoggedIn,
}: {
  poiId: string;
  initialIsFavorite: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setPending(true);
    await fetch(`/api/favorites/${poiId}`, { method: isFavorite ? "DELETE" : "POST" });
    setIsFavorite((v) => !v);
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: spacing.xs,
        padding: `${spacing.sm}px ${spacing.lg}px`,
        borderRadius: radii.pill,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        color: isFavorite ? colors.danger : colors.text,
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      <Heart size={16} fill={isFavorite ? colors.danger : "none"} color={isFavorite ? colors.danger : colors.text} />
      {isFavorite ? "Saved" : "Save"}
    </button>
  );
}
