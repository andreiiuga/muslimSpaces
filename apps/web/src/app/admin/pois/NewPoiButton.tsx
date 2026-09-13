"use client";

import { useRouter } from "next/navigation";
import { Button } from "@muslimspaces/ui";

export function NewPoiButton() {
  const router = useRouter();
  return <Button size="sm" onPress={() => router.push("/admin/pois/new")}>New POI</Button>;
}
