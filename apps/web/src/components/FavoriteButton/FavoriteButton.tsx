"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { colors } from "@muslimspaces/ui";

// Circular icon-only button, floated over the hero image — matches the
// design's `poi.favIcon`/`favInk` treatment (a plain white circle with a
// bookmark glyph), not a labeled pill.
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
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      style={{
        width: 46,
        height: 46,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: 999,
        backgroundColor: colors.surface,
        boxShadow: "0 2px 10px rgba(28,25,23,.18)",
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      <Bookmark size={21} fill={isFavorite ? colors.danger : "none"} color={isFavorite ? colors.danger : colors.textMuted} />
    </button>
  );
}
