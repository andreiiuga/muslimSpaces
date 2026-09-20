"use client";
import { useRouter } from "next/navigation";
import { Button } from "@muslimspaces/ui";

export function NewCityButton() {
  const router = useRouter();
  return <Button size="sm" onPress={() => router.push("/admin/cities/new")}>New city</Button>;
}
