"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { IconButton, colors } from "@muslimspaces/ui";

// Circular icon-only button, floated over the hero image — matches the
// design's `poi.favIcon`/`favInk` treatment (a plain white circle with a
// bookmark glyph), not a labeled pill. Composes IconButton's "solid"
// variant (same role as MapView's back button: an icon floating over photo/
// map imagery) rather than hand-rolling — previously a one-off 46px circle
// with its own shadow value, normalized onto IconButton's existing lg
// (48px) size and iconSolid shadow rather than preserving what was likely
// unintentional drift between two visually-identical use cases.
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
    <IconButton
      variant="solid"
      size="lg"
      onPress={toggle}
      disabled={pending}
      label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      icon={<Bookmark size={21} fill={isFavorite ? colors.danger : "none"} color={isFavorite ? colors.danger : colors.textMuted} />}
    />
  );
}
