"use client";
import { useRouter } from "next/navigation";
import { Button } from "@muslimspaces/ui";

export function NewCategoryButton() {
  const router = useRouter();
  return <Button size="sm" onPress={() => router.push("/admin/categories/new")}>New category</Button>;
}
