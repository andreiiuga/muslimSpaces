"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, colors, spacing, Text } from "@muslimspaces/ui";
import type { BlogPost } from "@muslimspaces/shared";

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
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>
          {["Title", "Slug", "Status", ""].map((h) => (
            <th key={h} style={{ padding: spacing.sm, fontSize: 12, color: colors.textMuted }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
            <td style={{ padding: spacing.sm }}><Text size="sm" weight="medium">{post.title.ro}</Text></td>
            <td style={{ padding: spacing.sm }}><Text size="sm" color={colors.textMuted}>{post.slug}</Text></td>
            <td style={{ padding: spacing.sm }}>
              <Text size="sm" color={post.status === "published" ? colors.success : colors.textMuted} weight="medium">
                {post.status}
              </Text>
            </td>
            <td style={{ padding: spacing.sm, display: "flex", gap: spacing.xs, flexWrap: "wrap" }}>
              <Button size="sm" variant="secondary" disabled={pendingAction === post.id} onPress={() => toggleStatus(post)}>
                {post.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push(`/admin/blog/${post.id}/edit`)}>Edit</Button>
              <Button size="sm" variant="danger" disabled={pendingAction === post.id} onPress={() => remove(post.id)}>Delete</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
