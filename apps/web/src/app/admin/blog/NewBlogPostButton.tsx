"use client";
import { useRouter } from "next/navigation";
import { Button } from "@muslimspaces/ui";

export function NewBlogPostButton() {
  const router = useRouter();
  return <Button size="sm" onPress={() => router.push("/admin/blog/new")}>New post</Button>;
}
