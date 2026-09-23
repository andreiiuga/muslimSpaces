"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, colors, Text } from "@muslimspaces/ui";
import type { BlogPost } from "@muslimspaces/shared";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "../StatusBadge";

export function BlogAdminTable({ posts: initialPosts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function toggleStatus(post: BlogPost) {
    const nextStatus = post.status === "published" ? "draft" : "published";
    setPendingAction(post.id);
    const res = await fetch(`/api/admin/blog/${post.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setPendingAction(null);
    if (res.ok) {
      const updated: BlogPost = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setPendingAction(id);
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setPendingAction(null);
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {["Title", "Slug", "Status", ""].map((h) => (
            <TableHead key={h} className="text-xs">{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id}>
            <TableCell>
              <Text size="sm" weight="medium">{post.title.ro}</Text>
            </TableCell>
            <TableCell>
              <Text size="sm" color={colors.textMuted}>{post.slug}</Text>
            </TableCell>
            <TableCell>
              <StatusBadge color={post.status === "published" ? colors.success : colors.textMuted}>
                {post.status}
              </StatusBadge>
            </TableCell>
            <TableCell className="flex flex-wrap gap-xs">
              <Button size="sm" variant="secondary" disabled={pendingAction === post.id} onPress={() => toggleStatus(post)}>
                {post.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push(`/admin/blog/${post.id}/edit`)}>Edit</Button>
              <Button size="sm" variant="danger" disabled={pendingAction === post.id} onPress={() => remove(post.id)}>Delete</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
