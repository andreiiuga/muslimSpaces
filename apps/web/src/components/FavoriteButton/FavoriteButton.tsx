"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { IconButton } from "@muslimspaces/ui";
import { useSession } from "../SessionProvider/SessionProvider";

// Circular icon-only button, floated over the hero image — matches the
// design's `poi.favIcon`/`favInk` treatment (a plain white circle with a
// bookmark glyph), not a labeled pill. Composes IconButton's "solid"
// variant (same role as MapView's back button: an icon floating over photo/
// map imagery) rather than hand-rolling — previously a one-off 46px circle
// with its own shadow value, normalized onto IconButton's existing lg
// (48px) size and iconSolid shadow rather than preserving what was likely
// unintentional drift between two visually-identical use cases.
export function FavoriteButton({ poiId }: { poiId: string }) {
  const router = useRouter();
  // The POI page is ISR-cached, so it can't know whether the viewer saved
  // this POI — the state comes from the client-side session instead, with a
  // local override so a toggle reflects instantly without waiting on a
  // session refetch.
  const { user, favoriteIds, status } = useSession();
  const [override, setOverride] = useState<boolean | null>(null);
  const isFavorite = override ?? favoriteIds.has(poiId);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (status === "loading") return;
    if (!user) {
      router.push("/login");
      return;
    }
    setPending(true);
    await fetch(`/api/favorites/${poiId}`, { method: isFavorite ? "DELETE" : "POST" });
    setOverride(!isFavorite);
    setPending(false);
  }

  return (
    <IconButton
      variant="solid"
      size="lg"
      onPress={toggle}
      disabled={pending}
      label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      icon={<Bookmark size={21} className={isFavorite ? "fill-danger text-danger" : "fill-none text-textMuted"} />}
    />
  );
}
